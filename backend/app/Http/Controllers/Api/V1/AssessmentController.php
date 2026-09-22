<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\FinalCourseGrade;
use App\Models\LearningObjective;
use App\Models\Semester;
use App\Services\AcademicAuthorizationService;
use App\Services\AssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function __construct(
        protected AssessmentService $assessmentService,
        protected AcademicAuthorizationService $authService
    ) {}

    /**
     * Get context for current teacher/admin.
     */
    public function context(Request $request): JsonResponse
    {
        $context = $this->assessmentService->getUserContext($request->user());

        return response()->json([
            'success' => true,
            'data' => $context,
        ]);
    }

    /**
     * List learning objectives for a subject.
     */
    public function getLearningObjectives(Request $request): JsonResponse
    {
        $request->validate([
            'subject_id' => 'required|integer|exists:subjects,id',
            'semester_id' => 'nullable|integer|exists:semesters,id',
            'grade' => 'nullable|string|in:X,XI,XII',
        ]);

        $query = LearningObjective::where('subject_id', $request->subject_id)
            ->when($request->semester_id, fn($q) => $q->where('semester_id', $request->semester_id))
            ->when($request->grade, fn($q) => $q->where('grade', $request->grade))
            ->where('status', 'Aktif')
            ->orderBy('code');

        $user = $request->user();
        if (!$user->hasRole('admin')) {
            $hasAssignment = CourseAssignment::where('subject_id', $request->subject_id)
                ->where('status', 'Aktif')
                ->when($request->semester_id, fn ($q) => $q->where('semester_id', $request->semester_id))
                ->where('teacher_id', $user->teacher?->id)
                ->exists();

            if (!$hasAssignment) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Create a learning objective.
     */
    public function storeLearningObjective(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject_id' => 'required|integer|exists:subjects,id',
            'academic_year_id' => 'required|integer|exists:academic_years,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'grade' => 'required|string|in:X,XI,XII',
            'code' => 'required|string|max:30',
            'description' => 'required|string',
        ]);

        $semester = Semester::find($validated['semester_id']);
        if (!$semester || (int) $semester->academic_year_id !== (int) $validated['academic_year_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Semester tidak berada pada tahun ajaran yang dipilih.',
            ], 422);
        }

        $validated['created_by'] = $request->user()->id;
        $validated['status'] = 'Aktif';

        $hasAssignment = $request->user()->hasRole('admin')
            || CourseAssignment::where('subject_id', $validated['subject_id'])
                ->where('academic_year_id', $validated['academic_year_id'])
                ->where('semester_id', $validated['semester_id'])
                ->where('status', 'Aktif')
                ->where('teacher_id', $request->user()->teacher?->id)
                ->exists();

        if (!$hasAssignment) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Anda tidak memiliki penugasan untuk konteks tujuan pembelajaran ini.'], 403);
        }

        $lo = LearningObjective::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tujuan Pembelajaran berhasil ditambahkan.',
            'data' => $lo,
        ], 201);
    }

    /**
     * List assessments for a course assignment.
     */
    public function getAssessments(Request $request): JsonResponse
    {
        $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
        ]);

        $assignment = CourseAssignment::findOrFail($request->course_assignment_id);
        if (!$this->authService->canViewCourseAssignment($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat asesmen pada penugasan ini.',
            ], 403);
        }

        $assessments = Assessment::with('learningObjective')
            ->where('course_assignment_id', $assignment->id)
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assessments,
        ]);
    }

    /**
     * Create a new assessment.
     */
    public function storeAssessment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
            'learning_objective_id' => 'nullable|integer|exists:learning_objectives,id',
            'type' => 'required|string|in:Formatif,Sumatif Lingkup Materi,Sumatif Akhir Semester',
            'title' => 'required|string|max:100',
            'weight' => 'nullable|numeric|min:0.1|max:100',
            'max_score' => 'nullable|numeric|min:1|max:100',
            'passing_grade' => 'nullable|numeric|min:0|max:100',
            'assessment_date' => 'nullable|date',
        ]);

        $assignment = CourseAssignment::findOrFail($validated['course_assignment_id']);
        if (!$this->authService->canManageCourseAssignment($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin membuat asesmen pada penugasan ini.',
            ], 403);
        }

        if ($this->authService->isCourseGradeLocked($assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Nilai mata pelajaran ini telah divalidasi dan dikunci.',
            ], 403);
        }

        $this->authService->assertLearningObjectiveMatchesAssignment(
            isset($validated['learning_objective_id']) ? (int) $validated['learning_objective_id'] : null,
            $assignment
        );

        $validated['status'] = 'Aktif';
        $assessment = Assessment::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Instrumen asesmen berhasil dibuat.',
            'data' => $assessment->load('learningObjective'),
        ], 201);
    }

    /**
     * Get complete gradebook for a course assignment.
     */
    public function getGradebook(Request $request): JsonResponse
    {
        $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
        ]);

        $assignment = CourseAssignment::findOrFail($request->course_assignment_id);
        if (!$this->authService->canViewCourseAssignment($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat buku nilai penugasan ini.',
            ], 403);
        }

        $data = $this->assessmentService->getGradebook($assignment);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Batch save scores for multiple students/assessments.
     */
    public function saveBatchScores(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
            'scores' => 'required|array',
            'scores.*.assessment_id' => 'required|integer|exists:assessments,id',
            'scores.*.student_id' => 'required|integer|exists:students,id',
            'scores.*.score' => 'nullable|numeric|min:0|max:100',
            'scores.*.notes' => 'nullable|string|max:255',
        ]);

        $assignment = CourseAssignment::findOrFail($validated['course_assignment_id']);
        if (!$this->authService->canManageCourseAssignment($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda bukan guru pengampu aktif dari kelas ini.',
            ], 403);
        }

        $savedCount = $this->assessmentService->saveBatchScores(
            $assignment,
            $validated['scores'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Sebanyak {$savedCount} nilai berhasil disimpan.",
            'data' => ['saved_count' => $savedCount],
        ]);
    }

    /**
     * Trigger calculation of final grades and draft competency achievements.
     */
    public function calculateFinalGrades(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
        ]);

        $assignment = CourseAssignment::findOrFail($validated['course_assignment_id']);
        if (!$this->authService->canManageCourseAssignment($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda bukan pengampu penugasan ini.',
            ], 403);
        }

        $count = $this->assessmentService->calculateFinalGrades($assignment, $request->user());

        return response()->json([
            'success' => true,
            'message' => "Nilai akhir berhasil dihitung untuk {$count} siswa.",
            'data' => ['processed_count' => $count],
        ]);
    }

    /**
     * Batch update customized competency achievements.
     */
    public function updateCompetencyAchievements(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
            'achievements' => 'required|array',
            'achievements.*.student_id' => 'required|integer|exists:students,id',
            'achievements.*.highest_achievement' => 'nullable|string',
            'achievements.*.lowest_achievement' => 'nullable|string',
        ]);

        $assignment = CourseAssignment::findOrFail($validated['course_assignment_id']);
        if (!$this->authService->canManageCourseAssignment($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda bukan pengampu penugasan ini.',
            ], 403);
        }

        $count = $this->assessmentService->updateCompetencyAchievements(
            $assignment,
            $validated['achievements'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Deskripsi capaian kompetensi berhasil disimpan untuk {$count} siswa.",
            'data' => ['updated_count' => $count],
        ]);
    }

    /**
     * Get Class Recap (Leger) for a class.
     */
    public function getClassRecap(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
        ]);

        if (!$this->authService->canAccessClass($request->user(), (int)$request->class_id, (int)$request->semester_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat rekap kelas ini.',
            ], 403);
        }

        $recap = $this->assessmentService->getClassRecap((int)$request->class_id, (int)$request->semester_id);

        return response()->json([
            'success' => true,
            'data' => $recap,
        ]);
    }

    /**
     * Get Validation Status for all courses in a class.
     */
    public function getValidationStatus(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
        ]);

        if (!$this->authService->canAccessClass($request->user(), (int)$request->class_id, (int)$request->semester_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $enrolledCount = ClassMember::where('class_id', $request->class_id)
            ->where('semester_id', $request->semester_id)
            ->where('status', 'Aktif')
            ->count();

        $courses = CourseAssignment::with(['subject', 'teacher'])
            ->where('class_id', $request->class_id)
            ->where('semester_id', $request->semester_id)
            ->where('status', 'Aktif')
            ->get();

        $statusList = $courses->map(function ($course) use ($enrolledCount) {
            $grades = FinalCourseGrade::with('competencyAchievement')
                ->where('course_assignment_id', $course->id)
                ->whereNotNull('final_score')
                ->get();

            $scoredCount = $grades->count();
            $descriptionsCount = $grades->filter(fn($g) => !empty($g->competencyAchievement?->highest_achievement))->count();
            $isLocked = $grades->where('status', 'Terkunci')->isNotEmpty();
            $isComplete = $enrolledCount > 0 && $scoredCount >= $enrolledCount && $descriptionsCount >= $enrolledCount;

            $statusText = 'Belum Lengkap';
            if ($isLocked) {
                $statusText = 'Sudah Divalidasi';
            } elseif ($isComplete) {
                $statusText = 'Siap Divalidasi';
            }

            return [
                'course_assignment_id' => $course->id,
                'subject_id' => $course->subject_id,
                'subject_name' => $course->subject?->name,
                'teacher_name' => $course->teacher?->name,
                'total_students' => $enrolledCount,
                'scored_count' => $scoredCount,
                'descriptions_count' => $descriptionsCount,
                'is_complete' => $isComplete,
                'is_locked' => $isLocked,
                'status' => $statusText,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $statusList,
        ]);
    }

    /**
     * Validate and Lock course grades (Wali Kelas / Admin).
     */
    public function validateCourse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
            'notes' => 'nullable|string|max:255',
        ]);

        $assignment = CourseAssignment::findOrFail($validated['course_assignment_id']);
        if (!$this->authService->canValidateCourseGrades($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Wali Kelas aktif atau Administrator yang dapat memvalidasi nilai.',
            ], 403);
        }

        $this->assessmentService->validateAndLockCourse($assignment, $request->user(), $validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Nilai mata pelajaran berhasil divalidasi dan dikunci.',
        ]);
    }

    /**
     * Unlock course grades (Admin / authorized Wali Kelas).
     */
    public function unlockCourse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_assignment_id' => 'required|integer|exists:course_assignments,id',
            'reason' => 'required|string|min:5|max:255',
        ]);

        $assignment = CourseAssignment::findOrFail($validated['course_assignment_id']);
        if (!$this->authService->canValidateCourseGrades($request->user(), $assignment)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin membuka kunci nilai ini.',
            ], 403);
        }

        $this->assessmentService->unlockCourse($assignment, $request->user(), $validated['reason']);

        return response()->json([
            'success' => true,
            'message' => 'Kunci nilai mata pelajaran berhasil dibuka.',
        ]);
    }

    /**
     * Get Report Card (Rapor Siswa) Data.
     */
    public function getReportCard(Request $request, int $studentId): JsonResponse
    {
        $student = \App\Models\Student::findOrFail($studentId);
        $semesterId = $request->semester_id ?: \App\Models\Semester::where('status', 'Aktif')->value('id');

        if (!$this->authService->canAccessStudent($request->user(), $student, $semesterId ? (int)$semesterId : null)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin mengakses data rapor siswa ini.',
            ], 403);
        }

        $semester = \App\Models\Semester::with('academicYear')->find($semesterId);

        $member = \App\Models\ClassMember::with('schoolClass')
            ->where('student_id', $student->id)
            ->where('semester_id', $semesterId)
            ->where('status', 'Aktif')
            ->first();

        $grades = \App\Models\FinalCourseGrade::with(['subject', 'competencyAchievement'])
            ->where('student_id', $student->id)
            ->where('semester_id', $semesterId)
            ->get();

        $isAllLocked = $grades->isNotEmpty() && $grades->every(fn($g) => $g->status === 'Terkunci');

        $academicResults = $grades->map(function ($g) {
            return [
                'subject_id' => $g->subject_id,
                'subject_name' => $g->subject?->name ?? 'Mapel ' . $g->subject_id,
                'subject_code' => $g->subject?->code,
                'score' => (float)$g->final_score,
                'highest_achievement' => $g->competencyAchievement?->highest_achievement ?? '-',
                'lowest_achievement' => $g->competencyAchievement?->lowest_achievement,
                'status' => $g->status,
            ];
        });

        // Supplementary data
        $attendance = \App\Models\StudentAttendance::where('student_id', $student->id)
            ->where('semester_id', $semesterId)
            ->first();

        $extracurriculars = \App\Models\StudentExtracurricular::with('extracurricular')
            ->where('student_id', $student->id)
            ->where('semester_id', $semesterId)
            ->get();

        $cocurricular = \App\Models\StudentCocurricular::where('student_id', $student->id)
            ->where('semester_id', $semesterId)
            ->first();

        $homeroomNote = \App\Models\HomeroomNote::where('student_id', $student->id)
            ->where('semester_id', $semesterId)
            ->first();

        $config = \App\Models\AssessmentConfig::where('semester_id', $semesterId)
            ->where('is_approved_by_school', true)
            ->first();

        $isConfigApproved = (bool)$config;
        $isDataComplete = $attendance !== null && $homeroomNote !== null && !empty($homeroomNote->note);

        $reportStatus = 'DRAF PRATINJAU';
        if ($isAllLocked && $isConfigApproved && $isDataComplete) {
            $reportStatus = 'RAPOR FINAL';
        } elseif ($isAllLocked) {
            $reportStatus = 'TERVALIDASI (DRAF - Menunggu Konfirmasi Kebijakan Sekolah)';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'report_status' => $reportStatus,
                'is_locked' => $isAllLocked,
                'is_approved_by_school' => $isConfigApproved,
                'is_data_complete' => $isDataComplete,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nis,
                    'nisn' => $student->nisn,
                    'birth' => ($student->birth_place ? $student->birth_place . ', ' : '') . ($student->birth_date ? date('d F Y', strtotime($student->birth_date)) : '-'),
                    'class_name' => $member?->schoolClass?->name ?? $student->current_class_name,
                    'semester_name' => $semester?->name ?? '-',
                    'academic_year_name' => $semester?->academicYear?->name ?? '-',
                ],
                'academic_results' => $academicResults,
                'attendance' => [
                    'sick' => $attendance?->sick ?? 0,
                    'permitted' => $attendance?->permitted ?? 0,
                    'absent' => $attendance?->absent ?? 0,
                    'notes' => $attendance?->notes,
                    'is_recorded' => $attendance !== null,
                ],
                'extracurriculars' => $extracurriculars->map(fn($e) => [
                    'id' => $e->id,
                    'extracurricular_id' => $e->extracurricular_id,
                    'name' => $e->extracurricular?->name ?? $e->activity_name,
                    'activity_name' => $e->extracurricular?->name ?? $e->activity_name,
                    'grade' => $e->predicate,
                    'predicate' => $e->predicate,
                    'description' => $e->description ?? '',
                ])->toArray(),
                'cocurricular' => $cocurricular ? [
                    'title' => $cocurricular->title,
                    'description' => $cocurricular->description,
                ] : null,
                'homeroom_note' => $homeroomNote?->note ?? '',
            ],
        ]);
    }

    /**
     * Get Supplementary Data for class & semester (Wali Kelas & Admin).
     */
    public function getSupplementary(Request $request, int $classId, int $semesterId): JsonResponse
    {
        if (!$this->authService->isHomeroomTeacher($request->user(), $classId, $semesterId) && !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Wali Kelas atau Administrator yang dapat mengakses data pelengkap kelas ini.',
            ], 403);
        }
        $this->authService->assertUserCanAccessAcademicContext($request->user(), $classId, $semesterId);

        $data = $this->assessmentService->getSupplementaryData($classId, $semesterId);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Batch save student attendance.
     */
    public function saveAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'items' => 'required|array',
            'items.*.student_id' => 'required|integer|exists:students,id',
            'items.*.sick' => 'nullable|integer|min:0',
            'items.*.permitted' => 'nullable|integer|min:0',
            'items.*.absent' => 'nullable|integer|min:0',
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        if (!$this->authService->isHomeroomTeacher($request->user(), $validated['class_id'], $validated['semester_id']) && !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }
        $this->authService->assertUserCanAccessAcademicContext($request->user(), $validated['class_id'], $validated['semester_id']);
        $this->authService->assertActiveClassMembers($validated['class_id'], $validated['semester_id'], array_column($validated['items'], 'student_id'));

        $saved = $this->assessmentService->saveAttendanceBatch(
            $validated['class_id'],
            $validated['semester_id'],
            $validated['items'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Data presensi {$saved} siswa berhasil disimpan.",
            'data' => ['saved_count' => $saved],
        ]);
    }

    /**
     * Batch save student extracurriculars.
     */
    public function saveExtracurriculars(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'items' => 'required|array',
            'items.*.student_id' => 'required|integer|exists:students,id',
            'items.*.activities' => 'required|array',
            'items.*.activities.*.extracurricular_id' => 'nullable|integer|exists:extracurriculars,id',
            'items.*.activities.*.activity_name' => 'nullable|string|max:100',
            'items.*.activities.*.name' => 'nullable|string|max:100',
            'items.*.activities.*.predicate' => 'required|string|max:20',
            'items.*.activities.*.description' => 'nullable|string|max:255',
        ]);

        if (!$this->authService->isHomeroomTeacher($request->user(), $validated['class_id'], $validated['semester_id']) && !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }
        $this->authService->assertUserCanAccessAcademicContext($request->user(), $validated['class_id'], $validated['semester_id']);
        $this->authService->assertActiveClassMembers($validated['class_id'], $validated['semester_id'], array_column($validated['items'], 'student_id'));

        $saved = $this->assessmentService->saveExtracurricularsBatch(
            $validated['class_id'],
            $validated['semester_id'],
            $validated['items'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Data ekstrakurikuler ({$saved} kegiatan) berhasil disimpan.",
            'data' => ['saved_count' => $saved],
        ]);
    }

    /**
     * Batch save student cocurriculars.
     */
    public function saveCocurriculars(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'items' => 'required|array',
            'items.*.student_id' => 'required|integer|exists:students,id',
            'items.*.title' => 'required|string|max:150',
            'items.*.description' => 'required|string',
        ]);

        if (!$this->authService->isHomeroomTeacher($request->user(), $validated['class_id'], $validated['semester_id']) && !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }
        $this->authService->assertUserCanAccessAcademicContext($request->user(), $validated['class_id'], $validated['semester_id']);
        $this->authService->assertActiveClassMembers($validated['class_id'], $validated['semester_id'], array_column($validated['items'], 'student_id'));

        $saved = $this->assessmentService->saveCocurricularsBatch(
            $validated['class_id'],
            $validated['semester_id'],
            $validated['items'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Data kokurikuler ({$saved} entri) berhasil disimpan.",
            'data' => ['saved_count' => $saved],
        ]);
    }

    /**
     * Batch save homeroom notes.
     */
    public function saveHomeroomNotes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'semester_id' => 'required|integer|exists:semesters,id',
            'items' => 'required|array',
            'items.*.student_id' => 'required|integer|exists:students,id',
            'items.*.note' => 'nullable|string',
        ]);

        if (!$this->authService->isHomeroomTeacher($request->user(), $validated['class_id'], $validated['semester_id']) && !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }
        $this->authService->assertUserCanAccessAcademicContext($request->user(), $validated['class_id'], $validated['semester_id']);
        $this->authService->assertActiveClassMembers($validated['class_id'], $validated['semester_id'], array_column($validated['items'], 'student_id'));

        $saved = $this->assessmentService->saveHomeroomNotesBatch(
            $validated['class_id'],
            $validated['semester_id'],
            $validated['items'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => "Catatan wali kelas untuk {$saved} siswa berhasil disimpan.",
            'data' => ['saved_count' => $saved],
        ]);
    }
}
