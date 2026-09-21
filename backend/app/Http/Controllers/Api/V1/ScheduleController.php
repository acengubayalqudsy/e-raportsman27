<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleRequest;
use App\Http\Requests\UpdateScheduleRequest;
use App\Http\Resources\ScheduleResource;
use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\CourseAssignment;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\ScheduleConflictService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    private function checkAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Admin access required.'], 403);
        }
        return null;
    }

    /**
     * Get paginated schedules with filtering and search.
     */
    public function index(Request $request): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $request->validate([
            'academic_year_id' => ['nullable'],
            'semester_id' => ['nullable'],
            'class_id' => ['nullable'],
            'teacher_id' => ['nullable'],
            'subject_id' => ['nullable'],
            'room_id' => ['nullable'],
            'day_of_week' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:Aktif,Tidak Aktif,Semua Status'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort_by' => ['nullable', 'in:id,day_of_week,start_time,end_time,status,created_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Schedule::with([
            'academicYear',
            'semester',
            'schoolClass',
            'subject',
            'teacher',
            'room',
            'courseAssignment',
        ])->filter($request->all());

        // Default sorting: Day of week order then start_time
        $sortBy = $request->input('sort_by');
        if ($sortBy) {
            $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
            $query->orderBy($sortBy, $sortDir);
        } else {
            // Sort by day order and start time
            $query->orderByRaw("FIELD(day_of_week, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')")
                  ->orderBy('start_time', 'asc');
        }

        $perPage = min(max((int)$request->input('per_page', 10), 1), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ScheduleResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'total_pages' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Store new schedule after conflict validation.
     */
    public function store(StoreScheduleRequest $request, ScheduleConflictService $conflictService): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $validated = $request->validated();

        // Detect and prevent overlaps (teacher, class, room)
        $conflictService->validateSchedule($validated);

        $schedule = Schedule::create($validated);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'create_schedule',
            'details' => json_encode([
                'id' => $schedule->id,
                'class_id' => $schedule->class_id,
                'teacher_id' => $schedule->teacher_id,
                'room_id' => $schedule->room_id,
                'day' => $schedule->day_of_week,
                'time' => "{$schedule->start_time}-{$schedule->end_time}",
            ]),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pelajaran berhasil ditambahkan.',
            'data' => new ScheduleResource($schedule->load([
                'academicYear',
                'semester',
                'schoolClass',
                'subject',
                'teacher',
                'room',
            ])),
        ], 201);
    }

    /**
     * Display specific schedule.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $schedule = Schedule::with([
            'academicYear',
            'semester',
            'schoolClass',
            'subject',
            'teacher',
            'room',
            'courseAssignment',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ScheduleResource($schedule),
        ]);
    }

    /**
     * Update schedule after conflict validation.
     */
    public function update(UpdateScheduleRequest $request, int $id, ScheduleConflictService $conflictService): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $schedule = Schedule::findOrFail($id);
        $validated = $request->validated();

        // Merge existing attributes with changes to check full conflict profile
        $mergedData = array_merge([
            'academic_year_id' => $schedule->academic_year_id,
            'semester_id' => $schedule->semester_id,
            'class_id' => $schedule->class_id,
            'subject_id' => $schedule->subject_id,
            'teacher_id' => $schedule->teacher_id,
            'room_id' => $schedule->room_id,
            'day_of_week' => $schedule->day_of_week,
            'start_time' => $schedule->start_time,
            'end_time' => $schedule->end_time,
            'status' => $schedule->status,
        ], $validated);

        // Conflict check ignoring the current schedule
        $conflictService->validateSchedule($mergedData, $id);

        $schedule->update($validated);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'update_schedule',
            'details' => json_encode(['id' => $schedule->id, 'changes' => $validated]),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pelajaran berhasil diperbarui.',
            'data' => new ScheduleResource($schedule->load([
                'academicYear',
                'semester',
                'schoolClass',
                'subject',
                'teacher',
                'room',
            ])),
        ]);
    }

    /**
     * Delete schedule (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $schedule = Schedule::findOrFail($id);
        $schedule->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'delete_schedule',
            'details' => json_encode(['id' => $id]),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pelajaran berhasil dihapus.',
        ]);
    }

    /**
     * Get lookup options for creating/editing schedules.
     */
    public function options(Request $request): JsonResponse
    {
        $semesterId = $request->input('semester_id');

        // Course assignments for fast pre-filled selection
        $courseAssignments = CourseAssignment::with(['teacher', 'subject', 'schoolClass'])
            ->where('status', 'Aktif')
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->get()
            ->map(function ($ca) {
                return [
                    'id' => $ca->id,
                    'academic_year_id' => $ca->academic_year_id,
                    'semester_id' => $ca->semester_id,
                    'class_id' => $ca->class_id,
                    'class_name' => $ca->schoolClass?->name,
                    'subject_id' => $ca->subject_id,
                    'subject_name' => $ca->subject?->name,
                    'teacher_id' => $ca->teacher_id,
                    'teacher_name' => $ca->teacher?->name,
                    'label' => "{$ca->schoolClass?->name} - {$ca->subject?->name} ({$ca->teacher?->name})",
                ];
            });

        $classes = SchoolClass::where('status', 'Aktif')->orderBy('name')->get(['id', 'academic_year_id', 'code', 'name', 'grade']);
        $teachers = Teacher::where('status', 'Aktif')->orderBy('name')->get(['id', 'nip', 'name']);
        $subjects = Subject::where('status', 'Aktif')->orderBy('name')->get(['id', 'code', 'name']);
        $rooms = Room::where('status', 'Aktif')->orderBy('name')->get(['id', 'code', 'name', 'room_type', 'capacity']);
        $semesters = Semester::with('academicYear')->orderBy('id', 'desc')->get(['id', 'academic_year_id', 'name', 'status']);

        return response()->json([
            'success' => true,
            'data' => [
                'course_assignments' => $courseAssignments,
                'classes' => $classes,
                'teachers' => $teachers,
                'subjects' => $subjects,
                'rooms' => $rooms,
                'semesters' => $semesters,
                'days' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
            ],
        ]);
    }
}
