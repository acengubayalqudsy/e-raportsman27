<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClassMemberRequest;
use App\Http\Requests\TransferClassMemberRequest;
use App\Models\AuditLog;
use App\Models\ClassMember;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RombelMemberController extends Controller
{
    private function checkAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Admin access required.'], 403);
        }
        return null;
    }

    /**
     * Get paginated members of a class in a semester.
     */
    public function indexMembers(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'status' => ['nullable', 'in:Aktif,Pindah Rombel,Keluar'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort_by' => ['nullable', 'in:id,name,nis'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = ClassMember::with(['student', 'schoolClass', 'semester.academicYear'])
            ->filter($request->all());

        $sortBy = $request->input('sort_by', 'id');
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        
        if ($sortBy === 'name') {
            $query->join('students', 'class_members.student_id', '=', 'students.id')
                  ->orderBy('students.name', $sortDir)
                  ->select('class_members.*');
        } elseif ($sortBy === 'nis') {
            $query->join('students', 'class_members.student_id', '=', 'students.id')
                  ->orderBy('students.nis', $sortDir)
                  ->select('class_members.*');
        } else {
            $query->orderBy('class_members.id', $sortDir);
        }

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $class = null;
        if ($request->filled('class_id')) {
            $class = SchoolClass::find($request->input('class_id'));
        }

        $items = collect($paginator->items())->map(function (ClassMember $m) {
            $s = $m->student;
            return [
                'id' => $m->id,
                'membershipId' => "RMB-" . str_pad((string)$m->id, 4, '0', STR_PAD_LEFT),
                'studentId' => $m->student_id,
                'student_id' => $m->student_id,
                'nis' => $s?->nis ?: '-',
                'nisn' => $s?->nisn ?: '-',
                'name' => $s?->name ?: '-',
                'gender' => $s?->gender_label ?: '-',
                'genderCode' => $s?->gender === 'Perempuan' ? 'P' : 'L',
                'className' => $m->schoolClass?->name ?: '-',
                'academicYear' => $m->semester?->academicYear?->name ?: '-',
                'semester' => $m->semester?->name ?: '-',
                'status' => $m->status,
                'joinDate' => $m->join_date?->format('Y-m-d'),
                'leaveDate' => $m->leave_date?->format('Y-m-d'),
                'notes' => $m->notes,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
                'class_capacity' => $class?->capacity ?? 36,
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
        ]);

        $query = ClassMember::query()
            ->when($validated['academic_year_id'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
            ->when($validated['semester_id'] ?? null, fn ($q, $id) => $q->where('semester_id', $id))
            ->when($validated['class_id'] ?? null, fn ($q, $id) => $q->where('class_id', $id));

        return response()->json([
            'success' => true,
            'data' => [
                'total_members' => (clone $query)->count(),
                'active_members' => (clone $query)->where('status', 'Aktif')->count(),
                'transferred_members' => (clone $query)->where('status', 'Pindah Rombel')->count(),
                'exited_members' => (clone $query)->where('status', 'Keluar')->count(),
                'active_classes' => (clone $query)->where('status', 'Aktif')->distinct()->count('class_id'),
            ],
        ]);
    }

    /**
     * Get active students not yet enrolled in any class for this semester.
     */
    public function availableStudents(Request $request): JsonResponse
    {
        $request->validate([
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);
        $semesterId = $request->input('semester_id');
        if (!$semesterId) {
            $activeSem = Semester::where('status', 'Aktif')->first() ?? Semester::latest('id')->first();
            $semesterId = $activeSem?->id;
        }

        $query = Student::where('status', 'Aktif');

        if ($semesterId) {
            $enrolledStudentIds = ClassMember::where('semester_id', $semesterId)
                ->where('status', 'Aktif')
                ->pluck('student_id');

            $query->whereNotIn('id', $enrolledStudentIds);
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        $students = $query->orderBy('name', 'asc')->limit(100)->get();

        $data = $students->map(function ($s) {
            return [
                'id' => $s->id,
                'nis' => $s->nis,
                'nisn' => $s->nisn,
                'name' => $s->name,
                'gender' => $s->gender_label,
                'genderCode' => $s->gender === 'Perempuan' ? 'P' : 'L',
                'currentClassName' => $s->current_class_name,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Enroll one or more students into a class for a semester.
     */
    public function storeMembers(StoreClassMemberRequest $request): JsonResponse
    {
        $class = SchoolClass::findOrFail($request->class_id);
        $semester = Semester::with('academicYear')->findOrFail($request->semester_id);
        $studentIds = $request->student_ids;

        $created = [];

        DB::transaction(function () use ($class, $semester, $studentIds, $request, &$created) {
            foreach ($studentIds as $sId) {
                $created[] = ClassMember::create([
                    'academic_year_id' => $class->academic_year_id,
                    'semester_id' => $semester->id,
                    'class_id' => $class->id,
                    'student_id' => $sId,
                    'status' => 'Aktif',
                    'join_date' => $request->join_date ?? now(),
                    'notes' => $request->notes,
                ]);
            }

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'ENROLL_CLASS_MEMBERS',
                'description' => "Menambahkan " . count($studentIds) . " siswa ke rombel {$class->name} ({$semester->name} {$semester->academicYear?->name})",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => count($studentIds) . " siswa berhasil ditambahkan ke rombel {$class->name}.",
            'count' => count($created),
        ], 201);
    }

    /**
     * Transfer an active member to another class during semester.
     */
    public function transferMember(TransferClassMemberRequest $request, int $id): JsonResponse
    {
        $member = ClassMember::with(['student', 'schoolClass', 'semester'])->findOrFail($id);
        $targetClass = SchoolClass::findOrFail($request->target_class_id);

        $newMember = null;

        DB::transaction(function () use ($member, $targetClass, $request, &$newMember) {
            // 1. Mark old record as Pindah Rombel
            $member->update([
                'status' => 'Pindah Rombel',
                'leave_date' => $request->transfer_date,
                'notes' => $request->reason ? "Mutasi: " . $request->reason : 'Mutasi rombel',
            ]);

            // 2. Create new active membership in target class
            $newMember = ClassMember::create([
                'academic_year_id' => $targetClass->academic_year_id,
                'semester_id' => $member->semester_id,
                'class_id' => $targetClass->id,
                'student_id' => $member->student_id,
                'status' => 'Aktif',
                'join_date' => $request->transfer_date,
                'notes' => "Pindahan dari {$member->schoolClass?->name}",
            ]);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'TRANSFER_CLASS_MEMBER',
                'description' => "Memindahkan siswa {$member->student?->name} dari {$member->schoolClass?->name} ke {$targetClass->name}",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Siswa {$member->student?->name} berhasil dipindahkan ke rombel {$targetClass->name}.",
            'data' => $newMember,
        ]);
    }

    /**
     * Soft delete a membership record (remove student from rombel).
     */
    public function destroyMember(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $member = ClassMember::with(['student', 'schoolClass'])->findOrFail($id);
        $studentName = $member->student?->name ?: 'Siswa';
        $className = $member->schoolClass?->name ?: 'Rombel';

        $member->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'REMOVE_CLASS_MEMBER',
            'description' => "Mengeluarkan {$studentName} dari rombel {$className}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$studentName} berhasil dikeluarkan dari rombel {$className}.",
        ]);
    }

    /** Preview updates needed to mirror authoritative rombel membership to the legacy class-name field. */
    public function previewSyncInitialClasses(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $validated = $request->validate([
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
        ]);
        $semesterId = $validated['semester_id'];
        $semester = Semester::with('academicYear')->find($semesterId);
        if (!$semester) {
            return response()->json(['success' => false, 'message' => 'Semester tidak ditemukan.'], 404);
        }

        $members = ClassMember::with(['student', 'schoolClass'])
            ->where('semester_id', $semester->id)
            ->where('status', 'Aktif')
            ->get();
        $changes = $members->filter(fn (ClassMember $member) =>
            $member->student && $member->schoolClass
            && $member->student->current_class_name !== $member->schoolClass->name
        )->map(fn (ClassMember $member) => [
            'student_id' => $member->student_id,
            'nis' => $member->student->nis,
            'name' => $member->student->name,
            'current_class_name' => $member->student->current_class_name,
            'target_class_name' => $member->schoolClass->name,
        ])->values();

        return response()->json([
            'success' => true,
            'data' => [
                'total_members' => $members->count(),
                'in_sync' => $members->count() - $changes->count(),
                'out_of_sync' => $changes->count(),
                'changes' => $changes,
            ],
        ]);
    }

    /**
     * Explicitly commit verified initial student enrollments.
     */
    public function commitSyncInitialClasses(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $validated = $request->validate([
            'semester_id' => 'required|integer|exists:semesters,id',
        ]);

        $semester = Semester::with('academicYear')->findOrFail($validated['semester_id']);
        $updated = 0;

        DB::transaction(function () use ($semester, $request, &$updated) {
            $members = ClassMember::with(['student', 'schoolClass'])
                ->where('semester_id', $semester->id)
                ->where('status', 'Aktif')
                ->get();

            foreach ($members as $member) {
                if ($member->student && $member->schoolClass
                    && $member->student->current_class_name !== $member->schoolClass->name) {
                    $member->student->update(['current_class_name' => $member->schoolClass->name]);
                    $updated++;
                }
            }

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'SYNC_INITIAL_CLASS_MEMBERS',
                'description' => "Sinkronisasi kelas aktif {$updated} siswa dari rombel semester {$semester->name} ({$semester->academicYear?->name})",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Berhasil memperbarui kelas aktif {$updated} siswa dari rombel semester {$semester->name}.",
            'data' => ['updated_count' => $updated],
        ]);
    }
}
