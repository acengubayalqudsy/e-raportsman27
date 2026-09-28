<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\StudentAttendance;
use App\Models\StudentAttendanceEntry;
use App\Services\AcademicAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class AttendanceEntryController extends Controller
{
    public function __construct(protected AcademicAuthorizationService $authService) {}

    public function classes(Request $request): JsonResponse
    {
        $data = $request->validate(['semester_id' => 'required|integer|exists:semesters,id']);
        $classIds = $this->authService->getAllowedClassIds($request->user(), (int) $data['semester_id']);
        $semester = Semester::findOrFail($data['semester_id']);
        $classes = SchoolClass::whereIn('id', $classIds)
            ->where('academic_year_id', $semester->academic_year_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['success' => true, 'data' => $classes]);
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'scope' => ['required', Rule::in(['class', 'subject'])],
            'course_assignment_id' => 'nullable|integer|exists:course_assignments,id',
            'date' => 'nullable|date_format:Y-m-d',
            'student_id' => 'nullable|integer|exists:students,id',
        ]);

        $classId = (int) $data['class_id'];
        $semesterId = (int) $data['semester_id'];
        $this->authService->assertUserCanAccessAcademicContext($request->user(), $classId, $semesterId);
        $schoolClass = SchoolClass::findOrFail($classId);
        $semester = Semester::with('academicYear')->findOrFail($semesterId);

        $courseModels = CourseAssignment::with('subject')
            ->where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->where('status', 'Aktif')
            ->when(!$request->user()->hasRole('admin'), fn ($query) => $query->where('teacher_id', $request->user()->teacher?->id))
            ->get();
        $courses = $courseModels->map(fn ($course) => [
                'id' => $course->id,
                'subject_name' => $course->subject?->name ?? 'Mata Pelajaran',
            ]);

        $courseId = $data['scope'] === 'subject' ? (int) ($data['course_assignment_id'] ?? 0) : 0;
        if ($courseId && !$courses->contains('id', $courseId)) {
            return response()->json(['success' => false, 'message' => 'Penugasan mapel tidak tersedia pada kelas ini.'], 403);
        }

        $members = ClassMember::with('student')
            ->where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->where('status', 'Aktif')
            ->get()
            ->filter(fn ($member) => $member->student !== null)
            ->sortBy(fn ($member) => $member->student->name)
            ->values();
        $studentIds = $members->pluck('student_id')->map(fn ($id) => (int) $id)->all();
        if (!empty($data['student_id'])) {
            $this->authService->assertActiveClassMembers($classId, $semesterId, [(int) $data['student_id']]);
        }
        $summaries = StudentAttendance::where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        $entries = $courseId || $data['scope'] === 'class'
            ? StudentAttendanceEntry::where('class_id', $classId)
                ->where('semester_id', $semesterId)
                ->where('course_assignment_id', $courseId)
                ->when($data['date'] ?? null, fn ($query, $date) => $query->whereDate('attendance_date', $date))
                ->when($data['student_id'] ?? null, fn ($query, $id) => $query->where('student_id', $id))
                ->orderByDesc('attendance_date')
                ->get(['id', 'student_id', 'attendance_date', 'course_assignment_id', 'status', 'notes'])
            : collect();

        return response()->json(['success' => true, 'data' => [
            'class' => ['id' => $schoolClass->id, 'name' => $schoolClass->name],
            'semester' => ['id' => $semester->id, 'name' => $semester->name, 'academic_year' => $semester->academicYear?->name, 'start_date' => $semester->start_date?->format('Y-m-d'), 'end_date' => $semester->end_date?->format('Y-m-d')],
            'students' => $members->map(function ($member) use ($summaries) {
                $summary = $summaries->get($member->student_id);
                return [
                    'student_id' => $member->student_id,
                    'nis' => $member->student->nis,
                    'name' => $member->student->name,
                    'attendance' => [
                        'sick' => $summary?->sick ?? 0,
                        'permitted' => $summary?->permitted ?? 0,
                        'absent' => $summary?->absent ?? 0,
                        'notes' => $summary?->notes ?? '',
                    ],
                ];
            })->values(),
            'courses' => $courses->values(),
            'entries' => $entries,
            'can_edit' => $data['scope'] === 'class'
                ? $this->authService->isHomeroomTeacher($request->user(), $classId, $semesterId)
                : ($courseId > 0 && $this->authService->canManageCourseAssignment($request->user(), $courseModels->firstWhere('id', $courseId))),
        ]]);
    }

    public function saveBatch(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'scope' => ['required', Rule::in(['class', 'subject'])],
            'course_assignment_id' => 'nullable|integer|exists:course_assignments,id',
            'date' => 'required|date_format:Y-m-d',
            'items' => 'required|array|min:1',
            'items.*.student_id' => 'required|integer|exists:students,id',
            'items.*.status' => ['nullable', Rule::in(['Hadir', 'Sakit', 'Izin', 'Alpa'])],
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        $classId = (int) $data['class_id'];
        $semesterId = (int) $data['semester_id'];
        [, $semester] = $this->authService->assertAcademicContext($classId, $semesterId);
        if ($data['date'] < $semester->start_date->format('Y-m-d') || $data['date'] > $semester->end_date->format('Y-m-d')) {
            throw ValidationException::withMessages(['date' => ['Tanggal absensi harus berada dalam semester yang dipilih.']]);
        }

        $courseId = 0;
        if ($data['scope'] === 'class') {
            if (!$this->authService->isHomeroomTeacher($request->user(), $classId, $semesterId)) {
                return response()->json(['success' => false, 'message' => 'Hanya wali kelas atau admin yang dapat mengisi absensi kelas.'], 403);
            }
        } else {
            $courseId = (int) ($data['course_assignment_id'] ?? 0);
            $course = CourseAssignment::where('id', $courseId)
                ->where('class_id', $classId)
                ->where('semester_id', $semesterId)
                ->where('status', 'Aktif')
                ->first();
            if (!$course || !$this->authService->canManageCourseAssignment($request->user(), $course)) {
                return response()->json(['success' => false, 'message' => 'Anda tidak memiliki penugasan mapel pada kelas ini.'], 403);
            }
        }

        $studentIds = array_column($data['items'], 'student_id');
        if (count($studentIds) !== count(array_unique($studentIds))) {
            throw ValidationException::withMessages(['items' => ['Satu siswa hanya boleh muncul satu kali dalam batch.']]);
        }
        $this->authService->assertActiveClassMembers($classId, $semesterId, $studentIds);

        DB::transaction(function () use ($data, $classId, $semesterId, $courseId) {
            foreach ($data['items'] as $item) {
                $key = [
                    'student_id' => (int) $item['student_id'],
                    'semester_id' => $semesterId,
                    'attendance_date' => $data['date'],
                    'course_assignment_id' => $courseId,
                ];
                $entry = StudentAttendanceEntry::where($key)->lockForUpdate()->first();
                $oldStatus = $entry?->status;
                $newStatus = $item['status'] ?? null;

                if ($newStatus === null) {
                    $entry?->delete();
                } else {
                    $entry ??= new StudentAttendanceEntry($key);
                    $entry->class_id = $classId;
                    $entry->status = $newStatus;
                    $entry->notes = trim($item['notes'] ?? '') ?: null;
                    $entry->save();
                }

                if ($courseId === 0 && $oldStatus !== $newStatus) {
                    $summary = StudentAttendance::firstOrNew([
                        'student_id' => (int) $item['student_id'],
                        'semester_id' => $semesterId,
                    ]);
                    $summary->class_id = $classId;
                    foreach (['Sakit' => 'sick', 'Izin' => 'permitted', 'Alpa' => 'absent'] as $status => $column) {
                        $change = (int) ($newStatus === $status) - (int) ($oldStatus === $status);
                        $summary->{$column} = max(0, (int) $summary->{$column} + $change);
                    }
                    $summary->save();
                }
            }
        });

        return response()->json(['success' => true, 'message' => 'Absensi berhasil disimpan.', 'data' => ['saved_count' => count($data['items'])]]);
    }
}
