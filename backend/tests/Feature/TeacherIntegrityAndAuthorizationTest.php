<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\HomeroomAssignment;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\QueryException;
use Tests\TestCase;

class TeacherIntegrityAndAuthorizationTest extends TestCase
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
    protected Subject $subject1;
    protected Subject $subject2;
    protected Student $studentA1;
    protected Student $studentA2;
    protected Student $studentB1;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);
        $walikelasRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);

        // 1. Admin User
        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_auth_f1'],
            ['name' => 'Admin Auth F1', 'email' => 'admin_auth_f1@test.local', 'password' => 'secret123', 'is_active' => true]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        // 2. Guru User 1
        $this->guruUser1 = User::firstOrCreate(
            ['username' => 'test_guru1_f1'],
            ['name' => 'Guru Satu, S.Pd.', 'email' => 'guru1_f1@test.local', 'password' => 'secret123', 'is_active' => true]
        );
        if (!$this->guruUser1->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->guruUser1->roles()->attach($guruRole->id, ['is_primary' => true]);
        }

        // 3. Guru User 2 (Also Wali Kelas)
        $this->guruUser2 = User::firstOrCreate(
            ['username' => 'test_guru2_f1'],
            ['name' => 'Guru Dua, M.Pd.', 'email' => 'guru2_f1@test.local', 'password' => 'secret123', 'is_active' => true]
        );
        if (!$this->guruUser2->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->guruUser2->roles()->attach($guruRole->id, ['is_primary' => true]);
        }
        if (!$this->guruUser2->roles()->where('role_id', $walikelasRole->id)->exists()) {
            $this->guruUser2->roles()->attach($walikelasRole->id, ['is_primary' => false]);
        }

        // Teachers linked to users
        $this->teacher1 = Teacher::firstOrCreate(
            ['user_id' => $this->guruUser1->id],
            ['nip' => '198501012010011001', 'name' => $this->guruUser1->name, 'gender' => 'L', 'status' => 'Aktif']
        );

        $this->teacher2 = Teacher::firstOrCreate(
            ['user_id' => $this->guruUser2->id],
            ['nip' => '198702022010012002', 'name' => $this->guruUser2->name, 'gender' => 'P', 'status' => 'Aktif']
        );

        // Academic Year & Semester
        $this->academicYear = AcademicYear::firstOrCreate(
            ['name' => '2024/2025'],
            ['start_date' => '2024-07-15', 'end_date' => '2025-06-30', 'status' => 'Aktif']
        );

        $this->semester = Semester::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'name' => 'Ganjil'],
            ['start_date' => '2024-07-15', 'end_date' => '2024-12-20', 'status' => 'Aktif']
        );

        // Classes
        $this->classA = SchoolClass::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'name' => 'X-A'],
            ['code' => 'X-A', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
        );

        $this->classB = SchoolClass::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'name' => 'X-B'],
            ['code' => 'X-B', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
        );

        // Subjects
        $this->subject1 = Subject::firstOrCreate(
            ['code' => 'MAT-01'],
            ['name' => 'Matematika Wajib', 'group' => 'Muatan Umum', 'weekly_hours' => 4, 'status' => 'Aktif']
        );

        $this->subject2 = Subject::firstOrCreate(
            ['code' => 'FIS-01'],
            ['name' => 'Fisika', 'group' => 'Pilihan MIPA', 'weekly_hours' => 3, 'status' => 'Aktif']
        );

        // Students
        $this->studentA1 = Student::firstOrCreate(
            ['nis' => '10001', 'nisn' => '0010000001'],
            ['name' => 'Siswa A1 Kelas A', 'gender' => 'L', 'birth_place' => 'Garut', 'birth_date' => '2008-01-01', 'status' => 'Aktif', 'current_class_name' => 'X-A']
        );

        $this->studentA2 = Student::firstOrCreate(
            ['nis' => '10002', 'nisn' => '0010000002'],
            ['name' => 'Siswa A2 Kelas A', 'gender' => 'P', 'birth_place' => 'Garut', 'birth_date' => '2008-02-02', 'status' => 'Aktif', 'current_class_name' => 'X-A']
        );

        $this->studentB1 = Student::firstOrCreate(
            ['nis' => '20001', 'nisn' => '0020000001'],
            ['name' => 'Siswa B1 Kelas B', 'gender' => 'L', 'birth_place' => 'Garut', 'birth_date' => '2008-03-03', 'status' => 'Aktif', 'current_class_name' => 'X-B']
        );

        // Class Memberships
        ClassMember::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'semester_id' => $this->semester->id, 'class_id' => $this->classA->id, 'student_id' => $this->studentA1->id],
            ['status' => 'Aktif']
        );
        ClassMember::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'semester_id' => $this->semester->id, 'class_id' => $this->classA->id, 'student_id' => $this->studentA2->id],
            ['status' => 'Aktif']
        );
        ClassMember::firstOrCreate(
            ['academic_year_id' => $this->academicYear->id, 'semester_id' => $this->semester->id, 'class_id' => $this->classB->id, 'student_id' => $this->studentB1->id],
            ['status' => 'Aktif']
        );
    }

    // =========================================================================
    // PART A: INTEGRITAS DATABASE SATU GURU UTAMA PER KELAS-MAPEL-SEMESTER
    // =========================================================================

    public function test_database_constraint_rejects_second_active_utama_teacher_on_direct_insert(): void
    {
        // 1. Assign Teacher 1 as 'Utama'
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // 2. Direct insertion of Teacher 2 as 'Utama' for the exact same (semester, class, subject)
        // Must fail with QueryException (SQLSTATE 23000 / unique constraint violation)
        $this->expectException(QueryException::class);

        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher2->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);
    }

    public function test_api_store_rejects_second_utama_with_clean_422_response(): void
    {
        // 1. Assign Teacher 1 as Utama via API
        $res1 = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/course-assignments', [
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);
        $res1->assertStatus(201)->assertJson(['success' => true]);

        // 2. Assign Teacher 2 as Utama for same class and subject via API -> Must be rejected with 422
        $res2 = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/course-assignments', [
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher2->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);
        $res2->assertStatus(422)
             ->assertJsonValidationErrors(['teacher_id']);
    }

    public function test_multiple_active_pendamping_and_pengganti_are_allowed(): void
    {
        // 1. Teacher 1 is Utama
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // 2. Teacher 2 can be Pendamping for the same class and subject
        $caPendamping = CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher2->id,
            'weekly_hours' => 2,
            'role' => 'Pendamping',
            'status' => 'Aktif',
        ]);
        $this->assertNotNull($caPendamping->id);

        // Count for subject 1 in class A is 2
        $this->assertEquals(2, CourseAssignment::where('class_id', $this->classA->id)
            ->where('subject_id', $this->subject1->id)
            ->where('semester_id', $this->semester->id)
            ->count());
    }

    public function test_soft_deleted_utama_allows_new_active_utama(): void
    {
        // Teacher 1 as Utama is soft deleted
        $ca1 = CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);
        $ca1->delete(); // Soft delete

        // Now Teacher 2 can be assigned as Utama without conflict
        $ca2 = CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher2->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);
        $this->assertNotNull($ca2->id);
    }

    public function test_inactive_status_utama_allows_new_active_utama(): void
    {
        // Teacher 1 as Utama has status 'Nonaktif'
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Nonaktif',
        ]);

        // Teacher 2 can be assigned as active Utama
        $ca2 = CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher2->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);
        $this->assertNotNull($ca2->id);
    }

    // =========================================================================
    // PART B: HAK AKSES GURU DAN WALI KELAS (ROW-LEVEL SECURITY)
    // =========================================================================

    public function test_guru_can_only_view_students_in_assigned_classes(): void
    {
        // Teacher 1 is assigned to teach Class A only
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Teacher 1 calls GET /api/v1/master/students
        $res = $this->actingAs($this->guruUser1)->getJson('/api/v1/master/students');
        $res->assertOk();

        $studentNames = collect($res->json('data'))->pluck('name')->toArray();
        $this->assertContains('Siswa A1 Kelas A', $studentNames);
        $this->assertContains('Siswa A2 Kelas A', $studentNames);
        // Must NOT contain student from Class B
        $this->assertNotContains('Siswa B1 Kelas B', $studentNames);
    }

    public function test_guru_cannot_view_student_detail_from_other_class(): void
    {
        // Teacher 1 is assigned to Class A only
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Teacher 1 tries to view Student B1 (from Class B) by ID
        $res = $this->actingAs($this->guruUser1)->getJson("/api/v1/master/students/{$this->studentB1->id}");
        // Must receive 403 Forbidden
        $res->assertStatus(403)
            ->assertJson(['success' => false]);
    }

    public function test_guru_can_view_student_detail_from_assigned_class(): void
    {
        // Teacher 1 is assigned to Class A
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Teacher 1 views Student A1 (from Class A) by ID -> 200 OK
        $res = $this->actingAs($this->guruUser1)->getJson("/api/v1/master/students/{$this->studentA1->id}");
        $res->assertOk()
            ->assertJsonPath('data.name', 'Siswa A1 Kelas A');
    }

    public function test_walikelas_can_view_students_in_homeroom_class(): void
    {
        // Teacher 2 is assigned as Wali Kelas of Class B
        HomeroomAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classB->id,
            'teacher_id' => $this->teacher2->id,
            'assignment_date' => '2024-07-15',
            'status' => 'Aktif',
        ]);

        // Teacher 2 views Student B1 (from homeroom class) -> 200 OK
        $resOk = $this->actingAs($this->guruUser2)->getJson("/api/v1/master/students/{$this->studentB1->id}");
        $resOk->assertOk()
              ->assertJsonPath('data.name', 'Siswa B1 Kelas B');

        // Teacher 2 tries to view Student A1 (from Class A, not their homeroom) -> 403 Forbidden
        $resForbidden = $this->actingAs($this->guruUser2)->getJson("/api/v1/master/students/{$this->studentA1->id}");
        $resForbidden->assertStatus(403);
    }

    public function test_guru_cannot_perform_administrative_crud_on_students(): void
    {
        // Teacher 1 tries to create student -> 403 Forbidden
        $this->actingAs($this->guruUser1)
            ->postJson('/api/v1/master/students', [
                'name' => 'Illegal Student',
                'nis' => '99999',
                'nisn' => '9999999999',
            ])
            ->assertStatus(403);

        // Teacher 1 tries to delete student -> 403 Forbidden
        $this->actingAs($this->guruUser1)
            ->deleteJson("/api/v1/master/students/{$this->studentA1->id}")
            ->assertStatus(403);

        // Teacher 1 tries to get administrative stats -> 403 Forbidden
        $this->actingAs($this->guruUser1)
            ->getJson('/api/v1/master/students/stats')
            ->assertStatus(403);
    }

    public function test_guru_can_read_rombel_members_of_own_class_only(): void
    {
        // Teacher 1 teaches Class A
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Reading members of Class A -> 200 OK
        $resA = $this->actingAs($this->guruUser1)
            ->getJson("/api/v1/academic/rombel/members?class_id={$this->classA->id}");
        $resA->assertOk()
             ->assertJsonPath('meta.total', 2);

        // Reading members of Class B -> 403 Forbidden
        $resB = $this->actingAs($this->guruUser1)
            ->getJson("/api/v1/academic/rombel/members?class_id={$this->classB->id}");
        $resB->assertStatus(403);
    }

    public function test_guru_can_read_own_course_assignments_only(): void
    {
        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        CourseAssignment::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classB->id,
            'subject_id' => $this->subject2->id,
            'teacher_id' => $this->teacher2->id,
            'weekly_hours' => 3,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Teacher 1 calls GET /api/v1/academic/course-assignments
        $res = $this->actingAs($this->guruUser1)->getJson('/api/v1/academic/course-assignments');
        $res->assertOk();

        $items = $res->json('data');
        $this->assertCount(1, $items);
        $this->assertEquals($this->teacher1->id, $items[0]['teacher_id']);
    }

    public function test_admin_maintains_full_unrestricted_access(): void
    {
        // Admin views all students
        $resStudents = $this->actingAs($this->adminUser)->getJson('/api/v1/master/students');
        $resStudents->assertOk();
        $this->assertGreaterThanOrEqual(3, $resStudents->json('meta.total'));

        // Admin views stats
        $this->actingAs($this->adminUser)->getJson('/api/v1/master/students/stats')->assertOk();

        // Admin views any class members
        $this->actingAs($this->adminUser)
            ->getJson("/api/v1/academic/rombel/members?class_id={$this->classB->id}")
            ->assertOk();
    }

    public function test_unauthenticated_requests_return_401(): void
    {
        $this->getJson('/api/v1/master/students')->assertStatus(401);
        $this->getJson("/api/v1/master/students/{$this->studentA1->id}")->assertStatus(401);
        $this->getJson('/api/v1/academic/rombel/members')->assertStatus(401);
        $this->getJson('/api/v1/academic/course-assignments')->assertStatus(401);
    }
}
