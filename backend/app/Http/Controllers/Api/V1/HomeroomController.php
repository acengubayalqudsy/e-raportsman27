<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHomeroomRequest;
use App\Http\Requests\UpdateHomeroomRequest;
use App\Models\AuditLog;
use App\Models\HomeroomAssignment;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeroomController extends Controller
{
    private function checkAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Admin access required.'], 403);
        }
        return null;
    }

    /**
     * Get paginated homeroom assignments per semester with student counts.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'grade' => ['nullable', 'in:X,XI,XII'],
            'status' => ['nullable', 'in:Aktif,Nonaktif,Digantikan'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort_by' => ['nullable', 'in:id,assignment_date,status'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = HomeroomAssignment::with([
            'teacher',
            'schoolClass.members' => function ($q) use ($request) {
                if ($request->filled('semester_id')) {
                    $q->where('semester_id', $request->input('semester_id'))->where('status', 'Aktif');
                } else {
                    $q->where('status', 'Aktif');
                }
            },
            'semester.academicYear',
        ])->filter($request->all());

        $sortBy = $request->input('sort_by', 'id');
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function (HomeroomAssignment $h) {
            $t = $h->teacher;
            $c = $h->schoolClass;
            $studentCount = $c ? $c->members->count() : 0;

            return [
                'id' => $h->id,
                'class_id' => $h->class_id,
                'className' => $c?->name ?: '-',
                'grade' => $c?->grade ?: '-',
                'teacher_id' => $h->teacher_id,
                'teacher' => $t?->name ?: '-',
                'nip' => $t?->nip ?: '-',
                'nuptk' => $t?->nuptk ?: '-',
                'studentCount' => $studentCount,
                'studentCountLabel' => "{$studentCount} siswa",
                'academic_year_id' => $h->academic_year_id,
                'academicYear' => $h->semester?->academicYear?->name ?: '-',
                'semester_id' => $h->semester_id,
                'semester' => $h->semester?->name ?: '-',
                'assignmentDate' => $h->assignment_date?->format('Y-m-d'),
                'endDate' => $h->end_date?->format('Y-m-d'),
                'status' => $h->status,
                'skNumber' => $h->sk_number,
                'notes' => $h->notes,
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
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
        ]);

        $query = HomeroomAssignment::query()
            ->when($validated['academic_year_id'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
            ->when($validated['semester_id'] ?? null, fn ($q, $id) => $q->where('semester_id', $id));

        $totalClasses = SchoolClass::query()
            ->when($validated['academic_year_id'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
            ->count();
        $assignedClasses = (clone $query)->where('status', 'Aktif')->distinct()->count('class_id');

        return response()->json([
            'success' => true,
            'data' => [
                'total_assignments' => (clone $query)->count(),
                'active_assignments' => (clone $query)->where('status', 'Aktif')->count(),
                'assigned_teachers' => (clone $query)->where('status', 'Aktif')->distinct()->count('teacher_id'),
                'assigned_classes' => $assignedClasses,
                'unassigned_classes' => max(0, $totalClasses - $assignedClasses),
            ],
        ]);
    }

    /**
     * Show detail of a single homeroom assignment.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $h = HomeroomAssignment::with(['teacher', 'schoolClass', 'semester.academicYear'])->find($id);
        if (!$h) {
            return response()->json(['success' => false, 'message' => 'Penugasan wali kelas tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $h->id,
                'class_id' => $h->class_id,
                'className' => $h->schoolClass?->name,
                'teacher_id' => $h->teacher_id,
                'teacher' => $h->teacher?->name,
                'nip' => $h->teacher?->nip,
                'semester_id' => $h->semester_id,
                'semester' => $h->semester?->name,
                'academicYear' => $h->semester?->academicYear?->name,
                'assignmentDate' => $h->assignment_date?->format('Y-m-d'),
                'status' => $h->status,
                'skNumber' => $h->sk_number,
                'notes' => $h->notes,
            ],
        ]);
    }

    /**
     * Store new homeroom assignment.
     */
    public function store(StoreHomeroomRequest $request): JsonResponse
    {
        $class = SchoolClass::findOrFail($request->class_id);
        $semester = Semester::findOrFail($request->semester_id);
        $teacher = Teacher::findOrFail($request->teacher_id);

        $assignment = HomeroomAssignment::create([
            'academic_year_id' => $class->academic_year_id,
            'semester_id' => $semester->id,
            'class_id' => $class->id,
            'teacher_id' => $teacher->id,
            'assignment_date' => $request->assignment_date,
            'status' => $request->status ?? 'Aktif',
            'sk_number' => $request->sk_number,
            'notes' => $request->notes,
        ]);

        $assignment->load(['teacher', 'schoolClass', 'semester.academicYear']);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'ASSIGN_HOMEROOM',
            'description' => "Menetapkan {$teacher->name} sebagai wali kelas {$class->name} ({$semester->name})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Guru {$teacher->name} berhasil ditetapkan sebagai wali kelas {$class->name}.",
            'data' => $assignment,
        ], 201);
    }

    /**
     * Update homeroom assignment (e.g. replace teacher or change status).
     */
    public function update(UpdateHomeroomRequest $request, int $id): JsonResponse
    {
        $assignment = HomeroomAssignment::findOrFail($id);
        $validated = array_filter($request->validated(), fn($val) => !is_null($val));

        $assignment->update($validated);
        $assignment->load(['teacher', 'schoolClass', 'semester.academicYear']);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_HOMEROOM',
            'description' => "Memperbarui penugasan wali kelas ID {$id}: {$assignment->schoolClass?->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Penugasan wali kelas {$assignment->schoolClass?->name} berhasil diperbarui.",
            'data' => $assignment,
        ]);
    }

    /**
     * Soft delete homeroom assignment.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $assignment = HomeroomAssignment::with(['teacher', 'schoolClass'])->findOrFail($id);
        $teacherName = $assignment->teacher?->name ?: 'Guru';
        $className = $assignment->schoolClass?->name ?: 'Kelas';

        $assignment->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CANCEL_HOMEROOM',
            'description' => "Membatalkan penugasan wali kelas {$teacherName} di rombel {$className}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Penugasan wali kelas {$className} berhasil dibatalkan.",
        ]);
    }
}
