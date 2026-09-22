<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentConfig;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\GradeModificationLog;
use App\Models\HomeroomAssignment;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentExtracurricular;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportCardSupplementaryApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $guruWalikelasUser;
    protected User $otherGuruUser;
    protected SchoolClass $class;
    protected Semester $semester;
    protected AcademicYear $year;
    protected Student $student;
    protected CourseAssignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru Pengampu']);
        $waliRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);

        $this->year = AcademicYear::create([
            'name' => '2025/2026',
            'start_date' => '2025-07-15',
            'end_date' => '2026-06-20',
            'status' => 'Aktif',
        ]);

        $this->semester = Semester::create([
            'academic_year_id' => $this->year->id,
            'name' => 'Ganjil',
            'semester_type' => 'Ganjil',
            'start_date' => '2025-07-15',
            'end_date' => '2025-12-20',
            'status' => 'Aktif',
        ]);

        $this->class = SchoolClass::create([
            'academic_year_id' => $this->year->id,
            'name' => 'X-1',
            'code' => 'X-1',
            'grade' => '10',
            'capacity' => 36,
            'status' => 'Aktif',
        ]);

        $subject = Subject::create([
            'name' => 'Bahasa Indonesia',
            'code' => 'BINDO',
            'status' => 'Aktif',
        ]);

        // 1. Admin
        $this->adminUser = User::factory()->create(['email' => 'admin_test@test.local']);
        $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);

        // 2. Guru & Walikelas of this class
        $this->guruWalikelasUser = User::factory()->create(['email' => 'wali_test@test.local']);
        $this->guruWalikelasUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        $this->guruWalikelasUser->roles()->attach($waliRole->id, ['is_primary' => false]);
        $teacher1 = Teacher::create([
            'user_id' => $this->guruWalikelasUser->id,
            'name' => 'Wali Kelas SMAN 27',
            'gender' => 'L',
            'status' => 'Aktif',
        ]);

        HomeroomAssignment::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->class->id,
            'teacher_id' => $teacher1->id,
            'status' => 'Aktif',
        ]);

        $this->assignment = CourseAssignment::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->class->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher1->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // 3. Other guru with NO homeroom assignment
        $this->otherGuruUser = User::factory()->create(['email' => 'other_guru@test.local']);
        $this->otherGuruUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        Teacher::create([
            'user_id' => $this->otherGuruUser->id,
            'name' => 'Guru Lain',
            'gender' => 'P',
            'status' => 'Aktif',
        ]);

        // 4. Student enrolled in class
        $this->student = Student::factory()->create([
            'nis' => '10001',
            'nisn' => '0010000001',
            'name' => 'Siswa Sintetis 1',
            'gender' => 'L',
            'current_class_name' => 'X-1',
            'status' => 'Aktif',
        ]);

        ClassMember::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->class->id,
            'student_id' => $this->student->id,
            'status' => 'Aktif',
        ]);
    }

    public function test_unauthorized_user_cannot_access_supplementary_data(): void
    {
        $response = $this->actingAs($this->otherGuruUser)->getJson(
            "/api/v1/assessment/supplementary/{$this->class->id}/{$this->semester->id}"
        );
        $response->assertStatus(403);
    }

    public function test_admin_can_access_valid_supplementary_context(): void
    {
        $this->actingAs($this->adminUser)->getJson(
            "/api/v1/assessment/supplementary/{$this->class->id}/{$this->semester->id}"
        )->assertOk();
    }

    public function test_walikelas_can_access_and_save_supplementary_attendance(): void
    {
        // 1. Fetch supplementary (initially empty)
        $response = $this->actingAs($this->guruWalikelasUser)->getJson(
            "/api/v1/assessment/supplementary/{$this->class->id}/{$this->semester->id}"
        );
        $response->assertOk()
            ->assertJsonPath('data.students.0.name', 'Siswa Sintetis 1')
            ->assertJsonPath('data.students.0.attendance.is_recorded', false);

        // 2. Save batch attendance
        $saveResp = $this->actingAs($this->guruWalikelasUser)->postJson(
            '/api/v1/assessment/attendance/batch',
            [
                'class_id' => $this->class->id,
                'semester_id' => $this->semester->id,
                'items' => [
                    [
                        'student_id' => $this->student->id,
                        'sick' => 2,
                        'permitted' => 1,
                        'absent' => 0,
                        'notes' => 'Presensi semester ganjil',
                    ],
                ],
            ]
        );
        $saveResp->assertOk();

        // 3. Verify in database
        $this->assertDatabaseHas('student_attendances', [
            'student_id' => $this->student->id,
            'semester_id' => $this->semester->id,
            'sick' => 2,
            'permitted' => 1,
            'absent' => 0,
        ]);

        // 4. Verify the persisted values are returned after a fresh read.
        $this->actingAs($this->guruWalikelasUser)->getJson(
            "/api/v1/assessment/supplementary/{$this->class->id}/{$this->semester->id}"
        )->assertOk()
            ->assertJsonPath('data.students.0.attendance.sick', 2)
            ->assertJsonPath('data.students.0.attendance.permitted', 1)
            ->assertJsonPath('data.students.0.attendance.absent', 0)
            ->assertJsonPath('data.students.0.attendance.notes', 'Presensi semester ganjil');
    }

    public function test_walikelas_can_save_extracurriculars_and_homeroom_notes(): void
    {
        // 1. Save extracurriculars
        $ekskulResp = $this->actingAs($this->guruWalikelasUser)->postJson(
            '/api/v1/assessment/extracurriculars/batch',
            [
                'class_id' => $this->class->id,
                'semester_id' => $this->semester->id,
                'items' => [
                    [
                        'student_id' => $this->student->id,
                        'activities' => [
                            [
                                'activity_name' => 'Pramuka Wajib',
                                'predicate' => 'Sangat Baik',
                                'description' => 'Aktif dalam kegiatan kepramukaan dan kedisiplinan tinggi',
                            ],
                            [
                                'activity_name' => 'PMR',
                                'predicate' => 'Baik',
                                'description' => 'Mengikuti pertolongan pertama dengan sigap',
                            ],
                        ],
                    ],
                ],
            ]
        );
        $ekskulResp->assertOk();
        $this->assertEquals(2, StudentExtracurricular::where('student_id', $this->student->id)->count());

        // 2. Save homeroom note
        $noteResp = $this->actingAs($this->guruWalikelasUser)->postJson(
            '/api/v1/assessment/homeroom-notes/batch',
            [
                'class_id' => $this->class->id,
                'semester_id' => $this->semester->id,
                'items' => [
                    [
                        'student_id' => $this->student->id,
                        'note' => 'Pertahankan semangat belajar dan kedisiplinan yang sangat baik semester ini.',
                    ],
                ],
            ]
        );
        $noteResp->assertOk();
        $this->assertDatabaseHas('homeroom_notes', [
            'student_id' => $this->student->id,
            'semester_id' => $this->semester->id,
        ]);
    }

    public function test_walikelas_cannot_write_student_from_another_class(): void
    {
        $otherClass = SchoolClass::create([
            'academic_year_id' => $this->year->id,
            'name' => 'X-2',
            'code' => 'X-2',
            'grade' => '10',
            'capacity' => 36,
            'status' => 'Aktif',
        ]);
        $otherStudent = Student::factory()->create(['status' => 'Aktif']);
        ClassMember::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $otherClass->id,
            'student_id' => $otherStudent->id,
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($this->guruWalikelasUser)->postJson('/api/v1/assessment/attendance/batch', [
            'class_id' => $this->class->id,
            'semester_id' => $this->semester->id,
            'items' => [['student_id' => $otherStudent->id, 'sick' => 1, 'permitted' => 0, 'absent' => 0]],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('student_attendances', ['student_id' => $otherStudent->id]);
    }

    public function test_walikelas_cannot_write_student_from_another_semester(): void
    {
        $otherSemester = Semester::create([
            'academic_year_id' => $this->year->id,
            'name' => 'Genap',
            'semester_type' => 'Genap',
            'start_date' => '2026-01-01',
            'end_date' => '2026-06-20',
            'status' => 'Aktif',
        ]);
        $otherStudent = Student::factory()->create(['status' => 'Aktif']);
        ClassMember::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $otherSemester->id,
            'class_id' => $this->class->id,
            'student_id' => $otherStudent->id,
            'status' => 'Aktif',
        ]);

        $this->actingAs($this->guruWalikelasUser)->postJson('/api/v1/assessment/attendance/batch', [
            'class_id' => $this->class->id,
            'semester_id' => $this->semester->id,
            'items' => [['student_id' => $otherStudent->id, 'sick' => 1, 'permitted' => 0, 'absent' => 0]],
        ])->assertStatus(422);
    }

    public function test_invalid_student_in_batch_rolls_back_entire_write(): void
    {
        $response = $this->actingAs($this->guruWalikelasUser)->postJson('/api/v1/assessment/attendance/batch', [
            'class_id' => $this->class->id,
            'semester_id' => $this->semester->id,
            'items' => [
                ['student_id' => $this->student->id, 'sick' => 2, 'permitted' => 0, 'absent' => 0],
                ['student_id' => 999999, 'sick' => 1, 'permitted' => 0, 'absent' => 0],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('student_attendances', [
            'student_id' => $this->student->id,
            'semester_id' => $this->semester->id,
        ]);
    }

    public function test_unlock_course_requires_reason_and_creates_audit_log(): void
    {
        // Lock course first
        $assessment = Assessment::create([
            'course_assignment_id' => $this->assignment->id,
            'title' => 'Sumatif 1',
            'type' => 'Sumatif Lingkup Materi',
            'weight' => 100,
            'passing_grade' => 75,
            'status' => 'Aktif',
        ]);

        \App\Models\StudentScore::create([
            'assessment_id' => $assessment->id,
            'student_id' => $this->student->id,
            'final_score' => 85,
        ]);

        $this->actingAs($this->guruWalikelasUser)->postJson('/api/v1/assessment/final-grades/calculate', [
            'course_assignment_id' => $this->assignment->id,
        ])->assertOk();

        $this->actingAs($this->guruWalikelasUser)->postJson('/api/v1/assessment/validate-course', [
            'course_assignment_id' => $this->assignment->id,
        ])->assertOk();

        // Attempt unlock without reason -> validation error 422
        $this->actingAs($this->guruWalikelasUser)->postJson('/api/v1/assessment/unlock-course', [
            'course_assignment_id' => $this->assignment->id,
        ])->assertStatus(422);

        // Unlock with valid reason -> 200 OK
        $unlockResp = $this->actingAs($this->guruWalikelasUser)->postJson('/api/v1/assessment/unlock-course', [
            'course_assignment_id' => $this->assignment->id,
            'reason' => 'Perbaikan nilai remedial sumatif materi bab 2',
        ]);
        $unlockResp->assertOk();

        // Verify GradeModificationLog created
        $this->assertDatabaseHas('grade_modification_logs', [
            'course_assignment_id' => $this->assignment->id,
            'action' => 'UNLOCK_COURSE',
            'reason' => 'Perbaikan nilai remedial sumatif materi bab 2',
        ]);
    }

    public function test_report_card_embeds_real_supplementary_data_and_status(): void
    {
        // Setup attendance and homeroom note
        StudentAttendance::create([
            'student_id' => $this->student->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->class->id,
            'sick' => 1,
            'permitted' => 2,
            'absent' => 0,
        ]);

        StudentExtracurricular::create([
            'student_id' => $this->student->id,
            'semester_id' => $this->semester->id,
            'activity_name' => 'Paskibra',
            'predicate' => 'Sangat Baik',
            'description' => 'Disiplin dan aktif',
        ]);

        \App\Models\HomeroomNote::create([
            'student_id' => $this->student->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->class->id,
            'note' => 'Prestasi belajar sangat memuaskan.',
        ]);

        $response = $this->actingAs($this->guruWalikelasUser)->getJson(
            "/api/v1/assessment/report-card/{$this->student->id}?semester_id={$this->semester->id}"
        );

        $response->assertOk()
            ->assertJsonPath('data.attendance.sick', 1)
            ->assertJsonPath('data.attendance.permitted', 2)
            ->assertJsonPath('data.attendance.absent', 0)
            ->assertJsonPath('data.extracurriculars.0.name', 'Paskibra')
            ->assertJsonPath('data.homeroom_note', 'Prestasi belajar sangat memuaskan.')
            ->assertJsonPath('data.is_data_complete', true);
    }
}
