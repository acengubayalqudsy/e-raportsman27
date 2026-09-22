<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseAssignmentRequest;
use App\Http\Requests\UpdateCourseAssignmentRequest;
use App\Models\AuditLog;
use App\Models\CourseAssignment;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseAssignmentController extends Controller
{
    private function checkAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Admin access required.'], 403);
        }
        return null;
    }

    /**
     * Get paginated course teaching assignments.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasAnyRole(['admin', 'guru'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
            'status' => ['nullable', 'in:Aktif,Nonaktif,Selesai'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort_by' => ['nullable', 'in:id,weekly_hours,role,status'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = CourseAssignment::with(['teacher', 'subject', 'schoolClass', 'semester.academicYear'])
            ->filter($request->all());

        if (!$user->hasRole('admin')) {
            $teacher = $user->teacher;
            if (!$teacher) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'from' => null,
                        'last_page' => 1,
                        'per_page' => (int)$request->input('per_page', 8),
                        'to' => null,
                        'total' => 0,
                    ],
                ]);
            }
            $query->where('teacher_id', $teacher->id);
        }

        $sortBy = $request->input('sort_by', 'id');
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function (CourseAssignment $ca) {
            return [
                'id' => $ca->id,
                'teacher_id' => $ca->teacher_id,
                'teacher' => $ca->teacher?->name ?: '-',
                'nip' => $ca->teacher?->nip ?: '-',
                'subject_id' => $ca->subject_id,
                'subject' => $ca->subject?->name ?: '-',
                'subjectCode' => $ca->subject?->code ?: '-',
                'class_id' => $ca->class_id,
                'className' => $ca->schoolClass?->name ?: '-',
                'grade' => $ca->schoolClass?->grade ?: '-',
                'academic_year_id' => $ca->academic_year_id,
                'academicYear' => $ca->semester?->academicYear?->name ?: '-',
                'semester_id' => $ca->semester_id,
                'semester' => $ca->semester?->name ?: '-',
                'weeklyHours' => $ca->weekly_hours,
                'hoursLabel' => "{$ca->weekly_hours} JP",
                'role' => $ca->role,
                'status' => $ca->status,
                'notes' => $ca->notes,
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

    /**
     * Get aggregate statistics of course assignments.
     */
    public function stats(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
        ]);
        $query = CourseAssignment::query();

        if ($request->filled('semester_id')) {
            $query->where('semester_id', $request->input('semester_id'));
        }
        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->input('academic_year_id'));
        }

        $totalAssignments = (clone $query)->count();
        $assignedTeachers = (clone $query)->where('status', 'Aktif')->distinct('teacher_id')->count('teacher_id');
        $activeClasses = (clone $query)->where('status', 'Aktif')->distinct('class_id')->count('class_id');
        $totalWeeklyHours = (clone $query)->where('status', 'Aktif')->sum('weekly_hours');

        return response()->json([
            'success' => true,
            'data' => [
                'total_assignments' => $totalAssignments,
                'assigned_teachers' => $assignedTeachers,
                'assigned_subjects' => (clone $query)->where('status', 'Aktif')->distinct()->count('subject_id'),
                'active_classes' => $activeClasses,
                'total_weekly_hours' => (int)$totalWeeklyHours,
            ],
        ]);
    }

    /**
     * Show single course assignment detail.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $ca = CourseAssignment::with(['teacher', 'subject', 'schoolClass', 'semester.academicYear'])->find($id);
        if (!$ca) {
            return response()->json(['success' => false, 'message' => 'Penugasan mengajar tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ca->id,
                'teacher_id' => $ca->teacher_id,
                'teacher' => $ca->teacher?->name,
                'nip' => $ca->teacher?->nip,
                'subject_id' => $ca->subject_id,
                'subject' => $ca->subject?->name,
                'class_id' => $ca->class_id,
                'className' => $ca->schoolClass?->name,
                'semester_id' => $ca->semester_id,
                'semester' => $ca->semester?->name,
                'academicYear' => $ca->semester?->academicYear?->name,
                'weeklyHours' => $ca->weekly_hours,
                'role' => $ca->role,
                'status' => $ca->status,
                'notes' => $ca->notes,
            ],
        ]);
    }

    /**
     * Store new course assignment.
     */
    public function store(StoreCourseAssignmentRequest $request): JsonResponse
    {
        $class = SchoolClass::findOrFail($request->class_id);
        $semester = Semester::findOrFail($request->semester_id);
        $subject = Subject::findOrFail($request->subject_id);
        $teacher = Teacher::findOrFail($request->teacher_id);

        try {
            $assignment = DB::transaction(function () use ($class, $semester, $subject, $teacher, $request) {
                return CourseAssignment::create([
                    'academic_year_id' => $class->academic_year_id,
                    'semester_id' => $semester->id,
                    'class_id' => $class->id,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teacher->id,
                    'weekly_hours' => $request->weekly_hours,
                    'role' => $request->role ?? 'Utama',
                    'status' => $request->status ?? 'Aktif',
                    'notes' => $request->notes,
                ]);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'uk_single_active_utama_course_assignment')) {
                return response()->json([
                    'success' => false,
                    'message' => "Mata pelajaran {$subject->name} di rombel {$class->name} sudah memiliki guru utama aktif.",
                    'errors' => [
                        'teacher_id' => ["Mata pelajaran {$subject->name} di rombel {$class->name} sudah memiliki guru utama aktif."],
                    ],
                ], 422);
            }
            throw $e;
        }

        $assignment->load(['teacher', 'subject', 'schoolClass', 'semester.academicYear']);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'ASSIGN_COURSE',
            'description' => "Menugaskan {$teacher->name} mengampu {$subject->name} di {$class->name} ({$assignment->weekly_hours} JP)",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Penugasan {$teacher->name} untuk {$subject->name} di {$class->name} berhasil ditambahkan.",
            'data' => $assignment,
        ], 201);
    }

    /**
     * Update course assignment.
     */
    public function update(UpdateCourseAssignmentRequest $request, int $id): JsonResponse
    {
        $assignment = CourseAssignment::findOrFail($id);
        $validated = array_filter($request->validated(), fn($val) => !is_null($val));

        try {
            DB::transaction(function () use ($assignment, $validated) {
                $assignment->update($validated);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'uk_single_active_utama_course_assignment')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sudah terdapat guru utama aktif untuk mata pelajaran dan rombel ini.',
                    'errors' => [
                        'role' => ['Sudah terdapat guru utama aktif untuk mata pelajaran dan rombel ini.'],
                    ],
                ], 422);
            }
            throw $e;
        }

        $assignment->load(['teacher', 'subject', 'schoolClass', 'semester.academicYear']);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_COURSE_ASSIGNMENT',
            'description' => "Memperbarui penugasan mengajar ID {$id}: {$assignment->teacher?->name} - {$assignment->subject?->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Penugasan {$assignment->teacher?->name} berhasil diperbarui.",
            'data' => $assignment,
        ]);
    }

    /**
     * Soft delete course assignment.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $assignment = CourseAssignment::with(['teacher', 'subject', 'schoolClass'])->findOrFail($id);
        $desc = "{$assignment->teacher?->name} ({$assignment->subject?->name} di {$assignment->schoolClass?->name})";

        $assignment->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'DELETE_COURSE_ASSIGNMENT',
            'description' => "Menghapus penugasan mengajar: {$desc}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Penugasan mengajar berhasil dihapus.",
        ]);
    }
}
