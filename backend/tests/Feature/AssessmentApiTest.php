<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\FinalCourseGrade;
use App\Models\HomeroomAssignment;
use App\Models\LearningObjective;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentScore;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\QueryException;
use Tests\TestCase;

class AssessmentApiTest extends TestCase
{
    protected User $adminUser;
    protected User $guruUser1;
    protected User $guruUser2;
    protected Teacher $teacher1;
    protected Teacher $teacher2;
    protected AcademicYear $academicYear;
    protected Semester $semester;
    protected SchoolClass $classA;
    protected SchoolClass $classB;
    protected Subject $subject;
    protected CourseAssignment $assignment1;
    protected CourseAssignment $assignment2;
    protected Student $studentA1;
    protected Student $studentA2;
    protected Student $studentB1;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);
        $walikelasRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);

        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_ass'],
            ['name' => 'Admin Test', 'email' => 'admin_ass@test.local', 'password' => 'secret123', 'is_active' => true]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        $this->guruUser1 = User::firstOrCreate(
            ['username' => 'test_guru1_ass'],
            ['name' => 'Guru Satu, S.Pd.', 'email' => 'guru1_ass@test.local', 'password' => 'secret123', 'is_active' => true]
        );
        if (!$this->guruUser1->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->guruUser1->roles()->attach($guruRole->id, ['is_primary' => true]);
        }

        $this->guruUser2 = User::firstOrCreate(
            ['username' => 'test_guru2_ass'],
            ['name' => 'Guru Dua, M.Pd.', 'email' => 'guru2_ass@test.local', 'password' => 'secret123', 'is_active' => true]
        );
        if (!$this->guruUser2->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->guruUser2->roles()->attach($guruRole->id, ['is_primary' => true]);
        }
        if (!$this->guruUser2->roles()->where('role_id', $walikelasRole->id)->exists()) {
            $this->guruUser2->roles()->attach($walikelasRole->id, ['is_primary' => false]);
        }

        $this->teacher1 = Teacher::firstOrCreate(
            ['user_id' => $this->guruUser1->id],
            ['nip' => '198501012010011099', 'name' => $this->guruUser1->name, 'gender' => 'L', 'status' => 'Aktif']
        );

        $this->teacher2 = Teacher::firstOrCreate(
            ['user_id' => $this->guruUser2->id],
            ['nip' => '198702022010012099', 'name' => $this->guruUser2->name, 'gender' => 'P', 'status' => 'Aktif']
        );

        $this->academicYear = AcademicYear::firstOrCreate(
            ['name' => '2024/2025'],
            ['start_date' => '2024-07-15', 'end_date' => '2025-06-30', 'status' => 'Aktif']
        );

        $this->semester = Semester::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'name' => 'Ganjil'],
            ['start_date' => '2024-07-15', 'end_date' => '2024-12-20', 'status' => 'Aktif']
        );

        $this->classA = SchoolClass::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'name' => 'X-A'],
            ['code' => 'X-A', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
        );

        $this->classB = SchoolClass::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'name' => 'X-B'],
            ['code' => 'X-B', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
        );

        $this->subject = Subject::firstOrCreate(
            ['code' => 'MAT-ASS'],
            ['name' => 'Matematika Umum', 'group' => 'Muatan Umum', 'weekly_hours' => 4, 'status' => 'Aktif']
        );

        // Course Assignments
        $this->assignment1 = CourseAssignment::firstOrCreate(
            [
                'academic_year_id' => $this->academicYear->id,
                'semester_id' => $this->semester->id,
                'class_id' => $this->classA->id,
                'subject_id' => $this->subject->id,
                'teacher_id' => $this->teacher1->id,
            ],
            ['weekly_hours' => 4, 'role' => 'Utama', 'status' => 'Aktif']
        );

        $this->assignment2 = CourseAssignment::firstOrCreate(
            [
                'academic_year_id' => $this->academicYear->id,
                'semester_id' => $this->semester->id,
                'class_id' => $this->classB->id,
                'subject_id' => $this->subject->id,
                'teacher_id' => $this->teacher2->id,
            ],
            ['weekly_hours' => 4, 'role' => 'Utama', 'status' => 'Aktif']
        );

        // Homeroom: Teacher 2 is homeroom for Class A
        HomeroomAssignment::firstOrCreate(
            [
                'academic_year_id' => $this->academicYear->id,
                'semester_id' => $this->semester->id,
                'class_id' => $this->classA->id,
            ],
            ['teacher_id' => $this->teacher2->id, 'status' => 'Aktif']
        );

        // Students
        $this->studentA1 = Student::firstOrCreate(
            ['nis' => '80001', 'nisn' => '0080000001'],
            ['name' => 'Siswa A1', 'gender' => 'L', 'birth_place' => 'Garut', 'birth_date' => '2008-01-01', 'status' => 'Aktif', 'current_class_name' => 'X-A']
        );
        $this->studentA2 = Student::firstOrCreate(
            ['nis' => '80002', 'nisn' => '0080000002'],
            ['name' => 'Siswa A2', 'gender' => 'P', 'birth_place' => 'Garut', 'birth_date' => '2008-02-02', 'status' => 'Aktif', 'current_class_name' => 'X-A']
        );
        $this->studentB1 = Student::firstOrCreate(
            ['nis' => '80003', 'nisn' => '0080000003'],
            ['name' => 'Siswa B1', 'gender' => 'L', 'birth_place' => 'Garut', 'birth_date' => '2008-03-03', 'status' => 'Aktif', 'current_class_name' => 'X-B']
        );

        // Class memberships
        ClassMember::firstOrCreate(
            ['semester_id' => $this->semester->id, 'class_id' => $this->classA->id, 'student_id' => $this->studentA1->id],
            ['academic_year_id' => $this->academicYear->id, 'status' => 'Aktif']
        );
        ClassMember::firstOrCreate(
            ['semester_id' => $this->semester->id, 'class_id' => $this->classA->id, 'student_id' => $this->studentA2->id],
            ['academic_year_id' => $this->academicYear->id, 'status' => 'Aktif']
        );
        ClassMember::firstOrCreate(
            ['semester_id' => $this->semester->id, 'class_id' => $this->classB->id, 'student_id' => $this->studentB1->id],
            ['academic_year_id' => $this->academicYear->id, 'status' => 'Aktif']
        );
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/assessment/context')->assertStatus(401);
        $this->getJson('/api/v1/assessment/gradebook?course_assignment_id=1')->assertStatus(401);
    }

    public function test_user_context_returns_assigned_courses(): void
    {
        $res = $this->actingAs($this->guruUser1)->getJson('/api/v1/assessment/context');
        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.assigned_courses.0.course_assignment_id', $this->assignment1->id);
    }

    public function test_guru_can_create_learning_objective_and_assessment(): void
    {
        // 1. Create TP
        $tpRes = $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/learning-objectives', [
            'subject_id' => $this->subject->id,
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'grade' => 'X',
            'code' => 'TP-01',
            'description' => 'Memahami konsep dasar aljabar linear dan solusinya',
        ]);
        $tpRes->assertStatus(201);
        $tpId = $tpRes->json('data.id');

        // 2. Create Assessment linked to TP
        $assRes = $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/assessments', [
            'course_assignment_id' => $this->assignment1->id,
            'learning_objective_id' => $tpId,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Sumatif 1: Aljabar',
            'weight' => 1,
            'max_score' => 100,
            'passing_grade' => 75,
        ]);
        $assRes->assertStatus(201)
            ->assertJsonPath('data.title', 'Sumatif 1: Aljabar');
    }

    public function test_guru_cannot_create_assessment_for_other_class(): void
    {
        // Guru 1 tries to create assessment for Assignment 2 (Class B, taught by Teacher 2)
        $res = $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/assessments', [
            'course_assignment_id' => $this->assignment2->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Sumatif Ilegal',
        ]);
        $res->assertStatus(403);
    }

    public function test_assessment_rejects_learning_objective_from_another_subject(): void
    {
        $otherSubject = Subject::create([
            'name' => 'Fisika Integritas',
            'code' => 'FIS-INT',
            'status' => 'Aktif',
        ]);
        $objective = LearningObjective::create([
            'subject_id' => $otherSubject->id,
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'grade' => 'X',
            'code' => 'TP-FIS-01',
            'description' => 'Tujuan pembelajaran mata pelajaran lain',
            'status' => 'Aktif',
        ]);

        $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/assessments', [
            'course_assignment_id' => $this->assignment1->id,
            'learning_objective_id' => $objective->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Objective lintas mapel',
        ])->assertStatus(422);
    }

    public function test_assessment_rejects_learning_objective_from_another_semester(): void
    {
        $otherSemester = Semester::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Genap',
            'semester_type' => 'Genap',
            'start_date' => '2025-01-01',
            'end_date' => '2025-06-30',
            'status' => 'Aktif',
        ]);
        $objective = LearningObjective::create([
            'subject_id' => $this->subject->id,
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $otherSemester->id,
            'grade' => 'X',
            'code' => 'TP-GENAP-01',
            'description' => 'Tujuan pembelajaran semester lain',
            'status' => 'Aktif',
        ]);

        $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/assessments', [
            'course_assignment_id' => $this->assignment1->id,
            'learning_objective_id' => $objective->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Objective lintas semester',
        ])->assertStatus(422);
    }

    public function test_assessment_rejects_learning_objective_from_another_academic_year(): void
    {
        $otherYear = AcademicYear::create([
            'name' => '2025/2026 Objective Integrity',
            'start_date' => '2025-07-15',
            'end_date' => '2026-06-30',
            'status' => 'Akan Datang',
        ]);
        $otherSemester = Semester::create([
            'academic_year_id' => $otherYear->id,
            'name' => 'Ganjil Objective Integrity',
            'semester_type' => 'Ganjil',
            'start_date' => '2025-07-15',
            'end_date' => '2025-12-20',
            'status' => 'Akan Datang',
        ]);
        $objective = LearningObjective::create([
            'subject_id' => $this->subject->id,
            'academic_year_id' => $otherYear->id,
            'semester_id' => $otherSemester->id,
            'grade' => 'X',
            'code' => 'TP-YEAR-01',
            'description' => 'Tujuan pembelajaran tahun ajaran lain',
            'status' => 'Aktif',
        ]);

        $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/assessments', [
            'course_assignment_id' => $this->assignment1->id,
            'learning_objective_id' => $objective->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Objective lintas tahun ajaran',
        ])->assertStatus(422);
    }

    public function test_final_grade_rejects_mismatched_course_assignment_context(): void
    {
        $this->expectException(QueryException::class);

        FinalCourseGrade::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classB->id,
            'subject_id' => $this->subject->id,
            'student_id' => $this->studentA1->id,
            'course_assignment_id' => $this->assignment1->id,
            'final_score' => 80,
            'status' => 'Draft',
        ]);
    }

    public function test_guru_can_batch_save_scores_for_enrolled_students(): void
    {
        $assessment = Assessment::create([
            'course_assignment_id' => $this->assignment1->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Sumatif 1',
            'weight' => 1,
            'max_score' => 100,
            'passing_grade' => 75,
            'status' => 'Aktif',
        ]);

        $payload = [
            'course_assignment_id' => $this->assignment1->id,
            'scores' => [
                ['assessment_id' => $assessment->id, 'student_id' => $this->studentA1->id, 'score' => 85.5],
                ['assessment_id' => $assessment->id, 'student_id' => $this->studentA2->id, 'score' => 92.0],
            ],
        ];

        $res = $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/scores/batch', $payload);
        $res->assertStatus(200)
            ->assertJsonPath('data.saved_count', 2);

        // Verify stored in DB
        $this->assertDatabaseHas('student_scores', [
            'assessment_id' => $assessment->id,
            'student_id' => $this->studentA1->id,
            'final_score' => 85.5,
        ]);
    }

    public function test_batch_save_rejects_student_not_in_class(): void
    {
        $assessment = Assessment::create([
            'course_assignment_id' => $this->assignment1->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Sumatif 1',
            'status' => 'Aktif',
        ]);

        // Student B1 is in Class B, not Class A
        $payload = [
            'course_assignment_id' => $this->assignment1->id,
            'scores' => [
                ['assessment_id' => $assessment->id, 'student_id' => $this->studentB1->id, 'score' => 80],
            ],
        ];

        $res = $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/scores/batch', $payload);
        $res->assertStatus(422);
    }

    public function test_calculate_final_grades_and_competency_achievements(): void
    {
        $tp = LearningObjective::create([
            'subject_id' => $this->subject->id,
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'grade' => 'X',
            'code' => 'TP-01',
            'description' => 'Menyelesaikan persamaan kuadrat',
            'status' => 'Aktif',
        ]);

        $ass1 = Assessment::create([
            'course_assignment_id' => $this->assignment1->id,
            'learning_objective_id' => $tp->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Sumatif 1',
            'status' => 'Aktif',
        ]);

        $ass2 = Assessment::create([
            'course_assignment_id' => $this->assignment1->id,
            'type' => 'Sumatif Akhir Semester',
            'title' => 'SAS Ganjil',
            'status' => 'Aktif',
        ]);

        StudentScore::create(['assessment_id' => $ass1->id, 'student_id' => $this->studentA1->id, 'raw_score' => 80, 'final_score' => 80]);
        StudentScore::create(['assessment_id' => $ass2->id, 'student_id' => $this->studentA1->id, 'raw_score' => 90, 'final_score' => 90]);

        $res = $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/final-grades/calculate', [
            'course_assignment_id' => $this->assignment1->id,
        ]);
        $res->assertStatus(200);

        // Verify Final Course Grade calculated
        $this->assertDatabaseHas('final_course_grades', [
            'course_assignment_id' => $this->assignment1->id,
            'student_id' => $this->studentA1->id,
        ]);

        // Verify Competency Achievement created
        $this->assertDatabaseHas('competency_achievements', [
            'student_id' => $this->studentA1->id,
        ]);
    }

    public function test_walikelas_can_view_recap_and_validate_course(): void
    {
        // Calculate grades for student A1 & A2 first
        FinalCourseGrade::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject->id,
            'student_id' => $this->studentA1->id,
            'course_assignment_id' => $this->assignment1->id,
            'final_score' => 85.0,
            'status' => 'Siap Validasi',
        ]);

        FinalCourseGrade::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject->id,
            'student_id' => $this->studentA2->id,
            'course_assignment_id' => $this->assignment1->id,
            'final_score' => 90.0,
            'status' => 'Siap Validasi',
        ]);

        // Teacher 2 is walikelas of Class A
        $recapRes = $this->actingAs($this->guruUser2)->getJson("/api/v1/assessment/class-recap?class_id={$this->classA->id}&semester_id={$this->semester->id}");
        $recapRes->assertStatus(200)
            ->assertJsonPath('data.class.name', 'X-A');

        // Walikelas validates and locks course grades
        $valRes = $this->actingAs($this->guruUser2)->postJson('/api/v1/assessment/validate-course', [
            'course_assignment_id' => $this->assignment1->id,
            'notes' => 'Tervalidasi oleh walikelas',
        ]);
        $valRes->assertStatus(200);

        // Verify locked in database
        $this->assertDatabaseHas('final_course_grades', [
            'course_assignment_id' => $this->assignment1->id,
            'status' => 'Terkunci',
        ]);

        // Now Guru 1 attempts to modify scores -> Rejected with 422/403
        $ass = Assessment::create([
            'course_assignment_id' => $this->assignment1->id,
            'type' => 'Sumatif Lingkup Materi',
            'title' => 'Sumatif Baru',
            'status' => 'Aktif',
        ]);

        $modifyRes = $this->actingAs($this->guruUser1)->postJson('/api/v1/assessment/scores/batch', [
            'course_assignment_id' => $this->assignment1->id,
            'scores' => [
                ['assessment_id' => $ass->id, 'student_id' => $this->studentA1->id, 'score' => 99],
            ],
        ]);
        $modifyRes->assertStatus(422);
    }
}
