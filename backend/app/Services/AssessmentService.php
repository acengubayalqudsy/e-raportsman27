<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentConfig;
use App\Models\AuditLog;
use App\Models\ClassMember;
use App\Models\CompetencyAchievement;
use App\Models\CourseAssignment;
use App\Models\FinalCourseGrade;
use App\Models\GradeModificationLog;
use App\Models\HomeroomAssignment;
use App\Models\HomeroomNote;
use App\Models\LearningObjective;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentCocurricular;
use App\Models\StudentExtracurricular;
use App\Models\StudentScore;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssessmentService
{
    public function __construct(
        protected AcademicAuthorizationService $authService
    ) {}

    public function getUserContext(User $user): array
    {
        $activeYear = AcademicYear::where('status', 'Aktif')->orderBy('id', 'desc')->first()
            ?? AcademicYear::latest('id')->first();

        $activeSemester = null;
        if ($activeYear) {
            $activeSemester = Semester::where('academic_year_id', $activeYear->id)
                ->where('status', 'Aktif')
                ->first()
                ?? Semester::where('academic_year_id', $activeYear->id)->first();
        }

        $teacher = $user->teacher;
        $assignedCourses = [];
        $homeroomClass = null;

        if ($user->hasRole('admin')) {
            $query = CourseAssignment::with(['schoolClass', 'subject', 'teacher'])
                ->where('status', 'Aktif');
            if ($activeSemester && $query->clone()->where('semester_id', $activeSemester->id)->exists()) {
                $query->where('semester_id', $activeSemester->id);
            }
            $assignedCourses = $query->get()
                ->map(fn($ca) => [
                    'course_assignment_id' => $ca->id,
                    'class_id' => $ca->class_id,
                    'class_name' => $ca->schoolClass?->name ?? 'Kelas ' . $ca->class_id,
                    'subject_id' => $ca->subject_id,
                    'subject_name' => $ca->subject?->name ?? 'Mapel ' . $ca->subject_id,
                    'teacher_name' => $ca->teacher?->name ?? '-',
                    'role' => $ca->role,
                ])
                ->values()
                ->all();
        } elseif ($teacher) {
            $query = CourseAssignment::with(['schoolClass', 'subject'])
                ->where('teacher_id', $teacher->id)
                ->where('status', 'Aktif');
            if ($activeSemester && $query->clone()->where('semester_id', $activeSemester->id)->exists()) {
                $query->where('semester_id', $activeSemester->id);
            }
            $assignedCourses = $query->get()
                ->map(fn($ca) => [
                    'course_assignment_id' => $ca->id,
                    'class_id' => $ca->class_id,
                    'class_name' => $ca->schoolClass?->name ?? 'Kelas ' . $ca->class_id,
                    'subject_id' => $ca->subject_id,
                    'subject_name' => $ca->subject?->name ?? 'Mapel ' . $ca->subject_id,
                    'role' => $ca->role,
                ])
                ->values()
                ->all();

            $homeroom = HomeroomAssignment::with('schoolClass')
                ->where('teacher_id', $teacher->id)
                ->where('status', 'Aktif')
                ->when($activeSemester, fn($q) => $q->where('semester_id', $activeSemester->id))
                ->first();

            if ($homeroom) {
                $homeroomClass = [
                    'class_id' => $homeroom->class_id,
                    'class_name' => $homeroom->schoolClass?->name ?? 'Kelas ' . $homeroom->class_id,
                ];
            }
        }

        return [
            'active_academic_year' => $activeYear ? ['id' => $activeYear->id, 'name' => $activeYear->name] : null,
            'active_semester' => $activeSemester ? ['id' => $activeSemester->id, 'name' => $activeSemester->name] : null,
            'assigned_courses' => $assignedCourses,
            'homeroom_class' => $homeroomClass,
        ];
    }

    public function deriveReportStatus(Collection $grades, bool $isApprovedBySchool, bool $isDataComplete): string
    {
        $isLocked = $grades->isNotEmpty() && $grades->every(fn ($grade) => $grade->status === 'Terkunci');

        if ($isLocked && $isApprovedBySchool && $isDataComplete) {
            return 'RAPOR FINAL';
        }

        if ($isLocked) {
            return 'TERVALIDASI (DRAF - Menunggu Konfirmasi Kebijakan Sekolah)';
        }

        return 'DRAF PRATINJAU';
    }

    public function getReportList(int $classId, int $semesterId, ?string $search, ?string $status, int $page, int $perPage): array
    {
        [$schoolClass, $semester] = $this->authService->assertAcademicContext($classId, $semesterId);

        $members = ClassMember::query()
            ->with('student')
            ->where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->where('academic_year_id', $schoolClass->academic_year_id)
            ->where('status', 'Aktif')
            ->get();

        $studentIds = $members->pluck('student_id')->map(fn ($id) => (int) $id)->all();
        $gradesByStudent = FinalCourseGrade::where('semester_id', $semesterId)->whereIn('student_id', $studentIds)->get()->groupBy('student_id');
        $attendanceIds = StudentAttendance::where('semester_id', $semesterId)->whereIn('student_id', $studentIds)->pluck('student_id')->map(fn ($id) => (int) $id)->all();
        $notesByStudent = HomeroomNote::where('semester_id', $semesterId)->whereIn('student_id', $studentIds)->whereNotNull('note')->where('note', '<>', '')->pluck('student_id')->map(fn ($id) => (int) $id)->all();
        $configApproved = AssessmentConfig::where('semester_id', $semesterId)->where('is_approved_by_school', true)->exists();

        $rows = $members->map(function ($member) use ($gradesByStudent, $attendanceIds, $notesByStudent, $configApproved) {
            $student = $member->student;
            $grades = $gradesByStudent->get($member->student_id, new Collection());
            $isLocked = $grades->isNotEmpty() && $grades->every(fn ($grade) => $grade->status === 'Terkunci');
            $isDataComplete = in_array((int) $member->student_id, $attendanceIds, true) && in_array((int) $member->student_id, $notesByStudent, true);

            return [
                'student_id' => $student?->id,
                'nis' => $student?->nis,
                'nisn' => $student?->nisn,
                'name' => $student?->name,
                'birth' => ($student?->birth_place ? $student->birth_place . ', ' : '') . ($student?->birth_date ? $student->birth_date->format('d F Y') : '-'),
                'report_status' => $this->deriveReportStatus($grades, $configApproved, $isDataComplete),
                'is_locked' => $isLocked,
                'is_approved_by_school' => $configApproved,
                'is_data_complete' => $isDataComplete,
            ];
        })->filter(fn ($row) => $row['student_id'] !== null)->sortBy('name')->values();

        $summaryRows = $rows;
        $summary = [
            'total_students' => $summaryRows->count(),
            'draft_count' => $summaryRows->where('report_status', 'DRAF PRATINJAU')->count(),
            'validated_draft_count' => $summaryRows->where('report_status', 'TERVALIDASI (DRAF - Menunggu Konfirmasi Kebijakan Sekolah)')->count(),
            'final_count' => $summaryRows->where('report_status', 'RAPOR FINAL')->count(),
            'locked_count' => $summaryRows->where('is_locked', true)->count(),
            'complete_count' => $summaryRows->where('is_data_complete', true)->count(),
        ];
        $filteredRows = $rows->filter(function ($row) use ($search, $status) {
            $searchMatch = !$search
                || str_contains(strtolower((string) $row['name']), strtolower($search))
                || str_contains(strtolower((string) $row['nis']), strtolower($search))
                || str_contains(strtolower((string) $row['nisn']), strtolower($search));
            return $searchMatch && ($status === null || $row['report_status'] === $status);
        })->values();
        $total = $filteredRows->count();

        return [
            'context' => [
                'class' => ['id' => $schoolClass->id, 'name' => $schoolClass->name, 'grade' => $schoolClass->grade],
                'semester' => ['id' => $semester->id, 'name' => $semester->name],
                'academic_year' => ['id' => $semester->academic_year_id, 'name' => $semester->academicYear?->name],
            ],
            'students' => $filteredRows->forPage($page, $perPage)->values(),
            'summary' => $summary,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'last_page' => $total === 0 ? 1 : (int) ceil($total / $perPage),
                'total' => $total,
            ],
        ];
    }

    /**
     * Get Gradebook data for a course assignment: assessments, students, scores, final grades.
     */
    public function getGradebook(CourseAssignment $assignment): array
    {
        $assignment->load(['schoolClass', 'subject', 'teacher', 'semester', 'academicYear']);

        // 1. Enrolled active students
        $members = ClassMember::with('student')
            ->where('class_id', $assignment->class_id)
            ->where('semester_id', $assignment->semester_id)
            ->where('status', 'Aktif')
            ->get();

        $students = $members->map(fn($m) => $m->student)->filter()->sortBy('name')->values();

        // 2. Assessments for this course
        $assessments = Assessment::with('learningObjective')
            ->where('course_assignment_id', $assignment->id)
            ->orderBy('id')
            ->get();

        // 3. Existing scores indexed by [student_id][assessment_id]
        $assessmentIds = $assessments->pluck('id')->toArray();
        $studentIds = $students->pluck('id')->toArray();

        $scores = StudentScore::whereIn('assessment_id', $assessmentIds)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->groupBy('student_id')
            ->map(function ($group) {
                return $group->keyBy('assessment_id')->map(fn($item) => [
                    'score_id' => $item->id,
                    'raw_score' => $item->raw_score,
                    'final_score' => $item->final_score,
                    'is_remedial' => $item->is_remedial,
                    'notes' => $item->notes,
                ]);
            });

        // 4. Final grades & competency achievements
        $finalGrades = FinalCourseGrade::with('competencyAchievement')
            ->where('course_assignment_id', $assignment->id)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        $isLocked = $finalGrades->where('status', 'Terkunci')->isNotEmpty();

        $studentRows = $students->map(function ($st) use ($scores, $finalGrades) {
            $stScores = $scores->get($st->id, collect())->toArray();
            $fg = $finalGrades->get($st->id);

            return [
                'id' => $st->id,
                'nis' => $st->nis,
                'nisn' => $st->nisn,
                'name' => $st->name,
                'scores' => $stScores,
                'final_grade' => $fg ? [
                    'id' => $fg->id,
                    'score' => $fg->final_score,
                    'status' => $fg->status,
                    'highest_achievement' => $fg->competencyAchievement?->highest_achievement,
                    'lowest_achievement' => $fg->competencyAchievement?->lowest_achievement,
                    'is_customized' => (bool)$fg->competencyAchievement?->is_customized,
                ] : null,
            ];
        });

        return [
            'course_assignment' => [
                'id' => $assignment->id,
                'class_id' => $assignment->class_id,
                'class_name' => $assignment->schoolClass?->name,
                'subject_id' => $assignment->subject_id,
                'subject_name' => $assignment->subject?->name,
                'teacher_name' => $assignment->teacher?->name,
                'semester_name' => $assignment->semester?->name,
                'academic_year_name' => $assignment->academicYear?->name,
            ],
            'is_locked' => $isLocked,
            'assessments' => $assessments->map(fn($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'type' => $a->type,
                'weight' => (float)$a->weight,
                'passing_grade' => (float)$a->passing_grade,
                'learning_objective' => $a->learningObjective ? [
                    'id' => $a->learningObjective->id,
                    'code' => $a->learningObjective->code,
                    'description' => $a->learningObjective->description,
                ] : null,
            ]),
            'students' => $studentRows,
        ];
    }

    /**
     * Save batch scores atomically inside DB::transaction.
     */
    public function saveBatchScores(CourseAssignment $assignment, array $scoresData, User $user): int
    {
        $this->assertAssignmentIntegrity($assignment);
        if ($this->authService->isCourseGradeLocked($assignment)) {
            throw ValidationException::withMessages([
                'course_assignment_id' => ['Nilai mata pelajaran ini telah divalidasi dan dikunci. Hubungi Wali Kelas atau Kurikulum untuk membuka kunci.'],
            ]);
        }

        // Get allowed student IDs enrolled in this class & semester
        $allowedStudentIds = ClassMember::where('class_id', $assignment->class_id)
            ->where('semester_id', $assignment->semester_id)
            ->where('status', 'Aktif')
            ->pluck('student_id')
            ->toArray();

        $allowedAssessmentIds = Assessment::where('course_assignment_id', $assignment->id)
            ->pluck('id')
            ->toArray();

        $savedCount = 0;

        DB::transaction(function () use ($scoresData, $allowedStudentIds, $allowedAssessmentIds, $assignment, $user, &$savedCount) {
            foreach ($scoresData as $item) {
                $assessmentId = (int)$item['assessment_id'];
                $studentId = (int)$item['student_id'];
                $scoreVal = isset($item['score']) && $item['score'] !== '' && $item['score'] !== null
                    ? (float)$item['score']
                    : null;

                if (!in_array($studentId, $allowedStudentIds, true)) {
                    throw ValidationException::withMessages([
                        'scores' => ["Siswa dengan ID {$studentId} tidak terdaftar aktif di rombel ini."],
                    ]);
                }

                if (!in_array($assessmentId, $allowedAssessmentIds, true)) {
                    throw ValidationException::withMessages([
                        'scores' => ["Asesmen dengan ID {$assessmentId} tidak valid untuk penugasan ini."],
                    ]);
                }

                if ($scoreVal !== null && ($scoreVal < 0 || $scoreVal > 100)) {
                    throw ValidationException::withMessages([
                        'scores' => ["Skor nilai harus berada dalam rentang 0 sampai 100."],
                    ]);
                }

                $record = StudentScore::firstOrNew([
                    'assessment_id' => $assessmentId,
                    'student_id' => $studentId,
                ]);

                $record->raw_score = $scoreVal;
                $record->final_score = $scoreVal;
                if (!empty($item['notes'])) {
                    $record->notes = $item['notes'];
                }
                $record->save();
                $savedCount++;
            }

            // Record Audit Log
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'BATCH_SAVE_SCORES',
                'description' => "Menyimpan {$savedCount} skor nilai pada kelas {$assignment->class_id}, mapel {$assignment->subject_id}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });

        return $savedCount;
    }

    /**
     * Calculate final grades and generate draft competency achievements for all students in the course.
     */
    public function calculateFinalGrades(CourseAssignment $assignment, User $user): int
    {
        $this->assertAssignmentIntegrity($assignment);
        if ($this->authService->isCourseGradeLocked($assignment)) {
            throw ValidationException::withMessages([
                'course_assignment_id' => ['Nilai mata pelajaran ini telah divalidasi dan dikunci.'],
            ]);
        }

        $enrolledStudents = ClassMember::where('class_id', $assignment->class_id)
            ->where('semester_id', $assignment->semester_id)
            ->where('status', 'Aktif')
            ->pluck('student_id')
            ->toArray();

        if (empty($enrolledStudents)) {
            return 0;
        }

        // Assessments for this course
        $assessments = Assessment::with('learningObjective')
            ->where('course_assignment_id', $assignment->id)
            ->get();

        if ($assessments->isEmpty()) {
            throw ValidationException::withMessages([
                'course_assignment_id' => ['Belum ada instrumen asesmen yang dibuat untuk mata pelajaran ini.'],
            ]);
        }

        // Optional Config
        $config = AssessmentConfig::where('semester_id', $assignment->semester_id)
            ->where(function ($q) use ($assignment) {
                $q->where('subject_id', $assignment->subject_id)
                  ->orWhereNull('subject_id');
            })
            ->orderByRaw('subject_id IS NULL') // specific subject first
            ->first();

        $processedCount = 0;

        DB::transaction(function () use ($assignment, $enrolledStudents, $assessments, $config, $user, &$processedCount) {
            foreach ($enrolledStudents as $studentId) {
                // Get all scores of this student for this course's assessments
                $scores = StudentScore::whereIn('assessment_id', $assessments->pluck('id'))
                    ->where('student_id', $studentId)
                    ->whereNotNull('final_score')
                    ->get();

                if ($scores->isEmpty()) {
                    continue;
                }

                // Calculation logic (Kurikulum Merdeka):
                // 1. Group by Sumatif Lingkup Materi and Sumatif Akhir Semester
                $sumatifMateriScores = $scores->filter(function ($sc) use ($assessments) {
                    $ass = $assessments->firstWhere('id', $sc->assessment_id);
                    return $ass && $ass->type === 'Sumatif Lingkup Materi';
                });

                $sumatifAkhirScores = $scores->filter(function ($sc) use ($assessments) {
                    $ass = $assessments->firstWhere('id', $sc->assessment_id);
                    return $ass && $ass->type === 'Sumatif Akhir Semester';
                });

                $avgMateri = $sumatifMateriScores->isNotEmpty() ? $sumatifMateriScores->avg('final_score') : null;
                $avgAkhir = $sumatifAkhirScores->isNotEmpty() ? $sumatifAkhirScores->avg('final_score') : null;

                $finalScore = null;
                if ($avgMateri !== null && $avgAkhir !== null) {
                    $wMateri = $config ? $config->weight_sumatif_materi : 60.0;
                    $wAkhir = $config ? $config->weight_sumatif_akhir : 40.0;
                    $totalWeight = $wMateri + $wAkhir;
                    $finalScore = round((($avgMateri * $wMateri) + ($avgAkhir * $wAkhir)) / $totalWeight, 2);
                } elseif ($avgMateri !== null) {
                    $finalScore = round($avgMateri, 2);
                } elseif ($avgAkhir !== null) {
                    $finalScore = round($avgAkhir, 2);
                } else {
                    $finalScore = round($scores->avg('final_score'), 2);
                }

                // 2. Upsert FinalCourseGrade
                $finalGrade = FinalCourseGrade::firstOrNew([
                    'semester_id' => $assignment->semester_id,
                    'subject_id' => $assignment->subject_id,
                    'student_id' => $studentId,
                ]);

                $finalGrade->academic_year_id = $assignment->academic_year_id;
                $finalGrade->class_id = $assignment->class_id;
                $finalGrade->course_assignment_id = $assignment->id;
                $isApproved = (bool)($config && $config->is_approved_by_school);
                $finalGrade->final_score = $finalScore;
                if ($finalGrade->status !== 'Terkunci') {
                    $finalGrade->status = $isApproved ? 'Siap Validasi' : 'Draf';
                }
                $finalGrade->notes = $isApproved ? null : 'PENDING SCHOOL APPROVAL: Rumus perhitungan bobot resmi sekolah belum disetujui.';
                $finalGrade->save();

                // 3. Auto-generate draft competency achievements
                // Find assessment with linked learning objective having highest and lowest score
                $tpScores = $scores->map(function ($sc) use ($assessments) {
                    $ass = $assessments->firstWhere('id', $sc->assessment_id);
                    return [
                        'score' => (float)$sc->final_score,
                        'tp' => $ass?->learningObjective,
                    ];
                })->filter(fn($item) => !empty($item['tp']));

                $highestAchievement = null;
                $lowestAchievement = null;

                if ($tpScores->isNotEmpty()) {
                    $highest = $tpScores->sortByDesc('score')->first();
                    $lowest = $tpScores->sortBy('score')->first();

                    if ($highest && $highest['tp']) {
                        $desc = strtolower(rtrim($highest['tp']->description, '.'));
                        $highestAchievement = "Menunjukkan penguasaan sangat baik dalam {$desc}.";
                    }

                    if ($lowest && $lowest['tp'] && ($lowest['score'] < ($highest['score'] ?? 100) || $lowest['score'] < 75)) {
                        $desc = strtolower(rtrim($lowest['tp']->description, '.'));
                        $lowestAchievement = "Perlu bimbingan dan peningkatan dalam {$desc}.";
                    }
                }

                // Save competency achievement if not manually customized
                $achievement = CompetencyAchievement::firstOrNew([
                    'final_course_grade_id' => $finalGrade->id,
                ]);

                $achievement->student_id = $studentId;
                if (!$achievement->is_customized) {
                    $achievement->highest_achievement = $highestAchievement;
                    $achievement->lowest_achievement = $lowestAchievement;
                }
                $achievement->save();

                $processedCount++;
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'CALCULATE_FINAL_GRADES',
                'description' => "Menghitung nilai akhir untuk {$processedCount} siswa pada kelas {$assignment->class_id}, mapel {$assignment->subject_id}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });

        return $processedCount;
    }

    private function assertAssignmentIntegrity(CourseAssignment $assignment): void
    {
        $assignment->loadMissing(['schoolClass', 'semester']);

        if (!$assignment->schoolClass
            || !$assignment->semester
            || (int) $assignment->academic_year_id !== (int) $assignment->schoolClass->academic_year_id
            || (int) $assignment->academic_year_id !== (int) $assignment->semester->academic_year_id
        ) {
            throw ValidationException::withMessages([
                'course_assignment_id' => ['Penugasan mengajar memiliki kombinasi tahun ajaran, semester, dan kelas yang tidak konsisten.'],
            ]);
        }
    }

    /**
     * Save manual competency achievement narrative updates.
     */
    public function updateCompetencyAchievements(CourseAssignment $assignment, array $achievementsData, User $user): int
    {
        if ($this->authService->isCourseGradeLocked($assignment)) {
            throw ValidationException::withMessages([
                'course_assignment_id' => ['Nilai mata pelajaran ini telah divalidasi dan dikunci.'],
            ]);
        }

        $count = 0;
        DB::transaction(function () use ($assignment, $achievementsData, &$count) {
            foreach ($achievementsData as $item) {
                $studentId = (int)$item['student_id'];
                $finalGrade = FinalCourseGrade::where('course_assignment_id', $assignment->id)
                    ->where('student_id', $studentId)
                    ->first();

                if (!$finalGrade) {
                    continue;
                }

                $ach = CompetencyAchievement::firstOrNew([
                    'final_course_grade_id' => $finalGrade->id,
                ]);

                $ach->student_id = $studentId;
                if (isset($item['highest_achievement'])) {
                    $ach->highest_achievement = $item['highest_achievement'];
                }
                if (isset($item['lowest_achievement'])) {
                    $ach->lowest_achievement = $item['lowest_achievement'];
                }
                $ach->is_customized = true;
                $ach->save();
                $count++;
            }
        });

        return $count;
    }

    /**
     * Get Class Recap (Leger) for a specific class and semester.
     */
    public function getClassRecap(int $classId, int $semesterId): array
    {
        $schoolClass = \App\Models\SchoolClass::find($classId);
        $semester = Semester::with('academicYear')->find($semesterId);

        // 1. All active members of the class
        $members = ClassMember::with('student')
            ->where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->where('status', 'Aktif')
            ->get();

        $students = $members->map(fn($m) => $m->student)->filter()->sortBy('name')->values();

        // 2. All subjects taught in this class
        $courseAssignments = CourseAssignment::with('subject')
            ->where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->where('status', 'Aktif')
            ->get();

        $subjects = $courseAssignments->pluck('subject')->filter()->unique('id')->values();

        // 3. Final grades of this class
        $finalGrades = FinalCourseGrade::where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->get();

        $gradeMatrix = [];
        foreach ($finalGrades as $fg) {
            $gradeMatrix[$fg->student_id][$fg->subject_id] = (float)$fg->final_score;
        }

        $rows = [];
        foreach ($students as $st) {
            $studentScores = [];
            $total = 0;
            $count = 0;

            foreach ($subjects as $sb) {
                $score = $gradeMatrix[$st->id][$sb->id] ?? null;
                $studentScores[$sb->id] = $score;
                if ($score !== null) {
                    $total += $score;
                    $count++;
                }
            }

            $average = $count > 0 ? round($total / $count, 2) : 0;

            $rows[] = [
                'student_id' => $st->id,
                'nis' => $st->nis,
                'nisn' => $st->nisn,
                'name' => $st->name,
                'scores' => $studentScores,
                'total_score' => $total,
                'average_score' => $average,
            ];
        }

        return [
            'class' => [
                'id' => $schoolClass?->id,
                'name' => $schoolClass?->name,
                'grade' => $schoolClass?->grade,
            ],
            'semester' => [
                'id' => $semester?->id,
                'name' => $semester?->name,
                'academic_year' => $semester?->academicYear?->name,
            ],
            'subjects' => $subjects->map(fn($s) => [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
            ]),
            'students' => $rows,
        ];
    }

    /**
     * Validate and Lock course grades (performed by Wali Kelas or Admin).
     */
    public function validateAndLockCourse(CourseAssignment $assignment, User $user, ?string $notes = null): int
    {
        $enrolledCount = ClassMember::where('class_id', $assignment->class_id)
            ->where('semester_id', $assignment->semester_id)
            ->where('status', 'Aktif')
            ->count();

        $completedCount = FinalCourseGrade::where('course_assignment_id', $assignment->id)
            ->whereNotNull('final_score')
            ->count();

        if ($completedCount < $enrolledCount) {
            throw ValidationException::withMessages([
                'validation' => ["Nilai belum lengkap ({$completedCount}/{$enrolledCount} siswa). Semua siswa harus memiliki nilai akhir sebelum divalidasi."],
            ]);
        }

        $config = AssessmentConfig::where('semester_id', $assignment->semester_id)
            ->where(function ($q) use ($assignment) {
                $q->where('subject_id', $assignment->subject_id)
                  ->orWhereNull('subject_id');
            })
            ->first();

        $isApproved = (bool)($config && $config->is_approved_by_school);
        $noteMsg = $isApproved
            ? ($notes ?: 'Divalidasi dan dikunci oleh ' . $user->name)
            : 'Divalidasi sementara (DRAF - Menunggu Konfirmasi Rumus Sekolah) oleh ' . $user->name;

        $previousData = FinalCourseGrade::where('course_assignment_id', $assignment->id)
            ->get(['id', 'student_id', 'final_score', 'status'])
            ->toArray();

        $updated = FinalCourseGrade::where('course_assignment_id', $assignment->id)
            ->update([
                'status' => 'Terkunci',
                'validated_by' => $user->id,
                'validated_at' => now(),
                'notes' => $noteMsg,
            ]);

        Assessment::where('course_assignment_id', $assignment->id)->update(['status' => 'Terkunci']);

        GradeModificationLog::create([
            'user_id' => $user->id,
            'course_assignment_id' => $assignment->id,
            'action' => 'VALIDATE_LOCK_GRADES',
            'previous_data' => $previousData,
            'new_data' => ['status' => 'Terkunci', 'notes' => $noteMsg],
            'reason' => $notes ?: 'Validasi dan penguncian nilai kelas oleh ' . $user->name,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'VALIDATE_LOCK_GRADES',
            'description' => "Memvalidasi dan mengunci nilai mapel {$assignment->subject_id} pada kelas {$assignment->class_id}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return $updated;
    }

    /**
     * Unlock course grades (Admin or authorized Wali Kelas with mandatory reason and audit log).
     */
    public function unlockCourse(CourseAssignment $assignment, User $user, string $reason): int
    {
        $previousData = FinalCourseGrade::where('course_assignment_id', $assignment->id)
            ->get(['id', 'student_id', 'final_score', 'status'])
            ->toArray();

        $updated = FinalCourseGrade::where('course_assignment_id', $assignment->id)
            ->update([
                'status' => 'Draft',
                'notes' => 'Kunci dibuka oleh ' . $user->name . '. Alasan: ' . $reason,
            ]);

        Assessment::where('course_assignment_id', $assignment->id)->update(['status' => 'Aktif']);

        GradeModificationLog::create([
            'user_id' => $user->id,
            'course_assignment_id' => $assignment->id,
            'action' => 'UNLOCK_COURSE',
            'previous_data' => $previousData,
            'new_data' => ['status' => 'Draft'],
            'reason' => $reason,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'UNLOCK_GRADES',
            'description' => "Membuka kunci nilai mapel {$assignment->subject_id} pada kelas {$assignment->class_id}. Alasan: {$reason}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return $updated;
    }

    /**
     * Get Supplementary Data (Absensi, Ekskul, Kokurikuler, Catatan Wali Kelas) for a class & semester.
     */
    public function getSupplementaryData(int $classId, int $semesterId): array
    {
        $schoolClass = SchoolClass::find($classId);
        $semester = Semester::with('academicYear')->find($semesterId);

        $members = ClassMember::with('student')
            ->where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->where('status', 'Aktif')
            ->get();

        $students = $members->map(fn($m) => $m->student)->filter()->sortBy('name')->values();
        $studentIds = $students->pluck('id')->toArray();

        $attendances = StudentAttendance::where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->get()
            ->keyBy('student_id');

        $extracurriculars = StudentExtracurricular::with('extracurricular')
            ->whereIn('student_id', $studentIds)
            ->where('semester_id', $semesterId)
            ->get()
            ->groupBy('student_id');

        $cocurriculars = StudentCocurricular::where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->get()
            ->groupBy('student_id');

        $homeroomNotes = HomeroomNote::where('class_id', $classId)
            ->where('semester_id', $semesterId)
            ->get()
            ->keyBy('student_id');

        $studentRows = $students->map(function ($st) use ($attendances, $extracurriculars, $cocurriculars, $homeroomNotes) {
            $att = $attendances->get($st->id);
            $ekskul = $extracurriculars->get($st->id, collect())->map(fn($e) => [
                'id' => $e->id,
                'extracurricular_id' => $e->extracurricular_id,
                'name' => $e->extracurricular?->name ?? $e->activity_name,
                'activity_name' => $e->extracurricular?->name ?? $e->activity_name,
                'predicate' => $e->predicate,
                'description' => $e->description,
            ])->toArray();

            $kokurikuler = $cocurriculars->get($st->id, collect())->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'description' => $c->description,
            ])->toArray();

            $hrNote = $homeroomNotes->get($st->id);

            return [
                'student_id' => $st->id,
                'name' => $st->name,
                'nis' => $st->nis,
                'nisn' => $st->nisn,
                'attendance' => [
                    'sick' => $att?->sick ?? 0,
                    'permitted' => $att?->permitted ?? 0,
                    'absent' => $att?->absent ?? 0,
                    'notes' => $att?->notes,
                    'is_recorded' => $att !== null,
                ],
                'extracurriculars' => $ekskul,
                'cocurriculars' => $kokurikuler,
                'homeroom_note' => $hrNote?->note ?? '',
            ];
        });

        return [
            'class' => [
                'id' => $schoolClass?->id,
                'name' => $schoolClass?->name,
                'grade' => $schoolClass?->grade,
            ],
            'semester' => [
                'id' => $semester?->id,
                'name' => $semester?->name,
                'academic_year' => $semester?->academicYear?->name,
            ],
            'students' => $studentRows,
        ];
    }

    /**
     * Batch save student attendance.
     */
    public function saveAttendanceBatch(int $classId, int $semesterId, array $items, User $user): int
    {
        $this->authService->assertUserCanAccessAcademicContext($user, $classId, $semesterId);
        $this->authService->assertActiveClassMembers($classId, $semesterId, array_column($items, 'student_id'));
        $saved = 0;
        DB::transaction(function () use ($classId, $semesterId, $items, $user, &$saved) {
            foreach ($items as $item) {
                $studentId = (int)$item['student_id'];
                $att = StudentAttendance::firstOrNew([
                    'semester_id' => $semesterId,
                    'student_id' => $studentId,
                ]);

                $att->class_id = $classId;
                $att->sick = max(0, (int)($item['sick'] ?? 0));
                $att->permitted = max(0, (int)($item['permitted'] ?? 0));
                $att->absent = max(0, (int)($item['absent'] ?? 0));
                $att->notes = !empty($item['notes']) ? $item['notes'] : null;
                $att->save();
                $saved++;
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'BATCH_SAVE_ATTENDANCE',
                'description' => "Menyimpan data absensi untuk {$saved} siswa pada kelas {$classId}, semester {$semesterId}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });

        return $saved;
    }

    /**
     * Batch save student extracurriculars.
     */
    public function saveExtracurricularsBatch(int $classId, int $semesterId, array $items, User $user): int
    {
        $this->authService->assertUserCanAccessAcademicContext($user, $classId, $semesterId);
        $this->authService->assertActiveClassMembers($classId, $semesterId, array_column($items, 'student_id'));
        $saved = 0;
        DB::transaction(function () use ($semesterId, $items, $user, &$saved) {
            foreach ($items as $item) {
                $studentId = (int)$item['student_id'];
                
                // If explicit list given, sync records
                if (isset($item['activities']) && is_array($item['activities'])) {
                    // Remove existing for this student & semester then insert
                    StudentExtracurricular::where('student_id', $studentId)
                        ->where('semester_id', $semesterId)
                        ->delete();

                    foreach ($item['activities'] as $act) {
                        $actName = $act['activity_name'] ?? $act['name'] ?? null;
                        $ekskulId = $act['extracurricular_id'] ?? null;
                        if ($ekskulId && !$actName) {
                            $actName = \App\Models\Extracurricular::where('id', $ekskulId)->value('name');
                        } elseif (!$ekskulId && $actName) {
                            $ekskulId = \App\Models\Extracurricular::where('name', $actName)->value('id');
                        }

                        if (!empty($actName) || !empty($ekskulId)) {
                            StudentExtracurricular::create([
                                'student_id' => $studentId,
                                'semester_id' => $semesterId,
                                'extracurricular_id' => $ekskulId,
                                'activity_name' => $actName ?? 'Ekstrakurikuler',
                                'predicate' => $act['predicate'] ?? 'Baik',
                                'description' => $act['description'] ?? null,
                            ]);
                            $saved++;
                        }
                    }
                }
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'BATCH_SAVE_EXTRACURRICULARS',
                'description' => "Menyimpan {$saved} entri ekstrakurikuler semester {$semesterId}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });

        return $saved;
    }

    /**
     * Batch save student cocurriculars.
     */
    public function saveCocurricularsBatch(int $classId, int $semesterId, array $items, User $user): int
    {
        $this->authService->assertUserCanAccessAcademicContext($user, $classId, $semesterId);
        $this->authService->assertActiveClassMembers($classId, $semesterId, array_column($items, 'student_id'));
        $saved = 0;
        DB::transaction(function () use ($classId, $semesterId, $items, $user, &$saved) {
            foreach ($items as $item) {
                $studentId = (int)$item['student_id'];
                if (!empty($item['title']) && !empty($item['description'])) {
                    StudentCocurricular::updateOrCreate(
                        [
                            'student_id' => $studentId,
                            'semester_id' => $semesterId,
                            'class_id' => $classId,
                            'title' => trim($item['title']),
                        ],
                        [
                            'description' => trim($item['description']),
                        ]
                    );
                    $saved++;
                }
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'BATCH_SAVE_COCURRICULAR',
                'description' => "Menyimpan {$saved} entri kokurikuler pada kelas {$classId}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });

        return $saved;
    }

    /**
     * Batch save homeroom notes.
     */
    public function saveHomeroomNotesBatch(int $classId, int $semesterId, array $items, User $user): int
    {
        $this->authService->assertUserCanAccessAcademicContext($user, $classId, $semesterId);
        $this->authService->assertActiveClassMembers($classId, $semesterId, array_column($items, 'student_id'));
        $saved = 0;
        DB::transaction(function () use ($classId, $semesterId, $items, $user, &$saved) {
            $hrAssignment = HomeroomAssignment::where('class_id', $classId)
                ->where('semester_id', $semesterId)
                ->where('status', 'Aktif')
                ->first();

            foreach ($items as $item) {
                $studentId = (int)$item['student_id'];
                $noteText = isset($item['note']) ? trim($item['note']) : '';

                $record = HomeroomNote::firstOrNew([
                    'semester_id' => $semesterId,
                    'student_id' => $studentId,
                ]);

                $record->class_id = $classId;
                $record->homeroom_assignment_id = $hrAssignment?->id;
                $record->note = $noteText;
                $record->save();
                $saved++;
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'BATCH_SAVE_HOMEROOM_NOTES',
                'description' => "Menyimpan {$saved} catatan wali kelas pada kelas {$classId}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        });

        return $saved;
    }
}
