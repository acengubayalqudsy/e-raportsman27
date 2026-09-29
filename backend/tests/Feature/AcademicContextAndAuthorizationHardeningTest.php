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
use App\Services\AcademicAuthorizationService;
use App\Services\AssessmentService;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AcademicContextAndAuthorizationHardeningTest extends TestCase
{
    protected AcademicAuthorizationService $authService;
    protected AssessmentService $assessmentService;

    protected User $adminUser;
    protected User $guruUser;
    protected Teacher $teacher;

    protected AcademicYear $yearOld;
    protected AcademicYear $yearActive;
    protected Semester $semOld;
    protected Semester $semActive;

    protected SchoolClass $classOld;
    protected SchoolClass $classActive;
    protected Subject $subject;
    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->authService = app(AcademicAuthorizationService::class);
        $this->assessmentService = app(AssessmentService::class);

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);

        $this->adminUser = User::factory()->create();
        $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);

        $this->guruUser = User::factory()->create();
        $this->guruUser->roles()->attach($guruRole->id, ['is_primary' => true]);

        $this->teacher = Teacher::create([
            'user_id' => $this->guruUser->id,
            'nip' => '198901012020011001',
            'name' => $this->guruUser->name,
            'gender' => 'L',
            'status' => 'Aktif',
        ]);

        // Historical Year & Semester
        $this->yearOld = AcademicYear::create([
            'name' => '2024/2025',
            'start_date' => '2024-07-01',
            'end_date' => '2025-06-30',
            'status' => 'Selesai',
        ]);

        $this->semOld = Semester::create([
            'academic_year_id' => $this->yearOld->id,
            'name' => 'Ganjil',
            'start_date' => '2024-07-01',
            'end_date' => '2024-12-31',
            'status' => 'Tidak Aktif',
        ]);

        // Active Year & Semester
        // Note: Set any existing active years to Selesai first so only yearActive is Aktif
        AcademicYear::where('status', 'Aktif')->update(['status' => 'Selesai']);
        Semester::where('status', 'Aktif')->update(['status' => 'Tidak Aktif']);

        $this->yearActive = AcademicYear::create([
            'name' => '2026/2027',
            'start_date' => '2026-07-01',
            'end_date' => '2027-06-30',
            'status' => 'Aktif',
        ]);

        $this->semActive = Semester::create([
            'academic_year_id' => $this->yearActive->id,
            'name' => 'Ganjil',
            'start_date' => '2026-07-01',
            'end_date' => '2026-12-31',
            'status' => 'Aktif',
        ]);

        $this->classOld = SchoolClass::create([
            'academic_year_id' => $this->yearOld->id,
            'name' => 'X-OLD',
            'code' => 'X-OLD',
            'grade' => 'X',
            'status' => 'Aktif',
            'capacity' => 36,
        ]);

        $this->classActive = SchoolClass::create([
            'academic_year_id' => $this->yearActive->id,
            'name' => 'XI-ACT',
            'code' => 'XI-ACT',
            'grade' => 'XI',
            'status' => 'Aktif',
            'capacity' => 36,
        ]);

        $this->subject = Subject::create([
            'code' => 'TEST-01',
            'name' => 'Test Subject',
            'group' => 'Muatan Umum',
            'status' => 'Aktif',
        ]);

        $this->student = Student::create([
            'nis' => '999901',
            'nisn' => '0099990001',
            'name' => 'Siswa Test Context',
            'gender' => 'L',
            'birth_place' => 'Garut',
            'birth_date' => '2008-01-01',
            'status' => 'Aktif',
            'current_class_name' => 'X-OLD',
        ]);
    }

    // =========================================================================
    // 1. CONTEXT MISMATCH TESTS
    // =========================================================================

    public function test_assert_academic_context_throws_validation_exception_on_cross_year_class_semester(): void
    {
        $this->expectException(ValidationException::class);
        $this->authService->assertAcademicContext($this->classOld->id, $this->semActive->id);
    }

    public function test_assessment_endpoint_rejects_cross_year_class_semester_with_422(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson("/api/v1/assessment/validation-status?class_id={$this->classOld->id}&semester_id={$this->semActive->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['academic_context']);
    }

    public function test_attendance_endpoint_rejects_cross_year_class_semester_with_422(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson("/api/v1/assessment/attendance/entries?class_id={$this->classOld->id}&semester_id={$this->semActive->id}&scope=class");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['academic_context']);
    }

    public function test_report_list_endpoint_rejects_cross_year_class_semester_with_422(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson("/api/v1/assessment/report-list?class_id={$this->classOld->id}&semester_id={$this->semActive->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['academic_context']);
    }

    public function test_correct_same_year_pair_succeeds_without_exception(): void
    {
        [$cls, $sem] = $this->authService->assertAcademicContext($this->classActive->id, $this->semActive->id);

        $this->assertEquals($this->classActive->id, $cls->id);
        $this->assertEquals($this->semActive->id, $sem->id);
    }

    // =========================================================================
    // 2. AUTHORIZATION TESTS
    // =========================================================================

    public function test_teacher_assigned_old_semester_cannot_access_class_in_active_semester(): void
    {
        CourseAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Access for the assigned semester must be true
        $this->assertTrue($this->authService->canAccessClass($this->guruUser, $this->classOld->id, $this->semOld->id));

        // Cross-semester check must fail closed
        $this->assertFalse($this->authService->canAccessClass($this->guruUser, $this->classOld->id, $this->semActive->id));
    }

    public function test_get_allowed_class_ids_excludes_classes_from_other_semesters(): void
    {
        CourseAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        HomeroomAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'status' => 'Aktif',
        ]);

        $allowedInActive = $this->authService->getAllowedClassIds($this->guruUser, $this->semActive->id);
        $this->assertNotContains($this->classOld->id, $allowedInActive);
        $this->assertEmpty($allowedInActive);
    }

    // =========================================================================
    // 3. STUDENT MEMBERSHIP AUTHORIZATION TESTS
    // =========================================================================

    public function test_cannot_access_student_via_current_class_name_without_canonical_membership(): void
    {
        // Teacher assigned to classActive in active semester
        CourseAssignment::create([
            'academic_year_id' => $this->yearActive->id,
            'semester_id' => $this->semActive->id,
            'class_id' => $this->classActive->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Set student's current_class_name to matching classActive->name, but NO ClassMember record!
        $this->student->update(['current_class_name' => $this->classActive->name]);
        $this->assertEquals($this->classActive->name, $this->student->current_class_name);
        $this->assertEquals(0, ClassMember::where('student_id', $this->student->id)->where('class_id', $this->classActive->id)->count());

        // Must fail closed because current_class_name is not canonical
        $this->assertFalse($this->authService->canAccessStudent($this->guruUser, $this->student, $this->semActive->id));
    }

    public function test_can_access_student_with_canonical_active_class_member(): void
    {
        CourseAssignment::create([
            'academic_year_id' => $this->yearActive->id,
            'semester_id' => $this->semActive->id,
            'class_id' => $this->classActive->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        ClassMember::create([
            'academic_year_id' => $this->yearActive->id,
            'semester_id' => $this->semActive->id,
            'class_id' => $this->classActive->id,
            'student_id' => $this->student->id,
            'status' => 'Aktif',
        ]);

        $this->assertTrue($this->authService->canAccessStudent($this->guruUser, $this->student, $this->semActive->id));
    }

    // =========================================================================
    // 4. ASSESSMENT SERVICE ACTIVE CONTEXT TESTS
    // =========================================================================

    public function test_historical_course_assignments_are_not_returned_in_active_context(): void
    {
        // Teacher has assignment in old semester only
        CourseAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        $context = $this->assessmentService->getUserContext($this->guruUser);

        $this->assertEquals($this->yearActive->id, $context['active_academic_year']['id']);
        $this->assertEquals($this->semActive->id, $context['active_semester']['id']);
        $this->assertEmpty($context['assigned_courses']);
    }

    public function test_only_active_semester_course_assignments_returned(): void
    {
        CourseAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        $caActive = CourseAssignment::create([
            'academic_year_id' => $this->yearActive->id,
            'semester_id' => $this->semActive->id,
            'class_id' => $this->classActive->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        $context = $this->assessmentService->getUserContext($this->guruUser);

        $this->assertCount(1, $context['assigned_courses']);
        $this->assertEquals($caActive->id, $context['assigned_courses'][0]['course_assignment_id']);
    }

    // =========================================================================
    // 5. HOMEROOM OWNERSHIP TESTS
    // =========================================================================

    public function test_walikelas_without_assignment_fails_closed(): void
    {
        $walikelasRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);
        $this->guruUser->roles()->attach($walikelasRole->id, ['is_primary' => false]);

        // Another teacher owns classActive
        $otherTeacher = Teacher::create([
            'nip' => '198001012010011002',
            'name' => 'Other Teacher',
            'gender' => 'P',
            'status' => 'Aktif',
        ]);

        HomeroomAssignment::create([
            'academic_year_id' => $this->yearActive->id,
            'semester_id' => $this->semActive->id,
            'class_id' => $this->classActive->id,
            'teacher_id' => $otherTeacher->id,
            'status' => 'Aktif',
        ]);

        $context = $this->assessmentService->getUserContext($this->guruUser);

        $this->assertNull($context['homeroom_class']);
        $this->assertEmpty($context['homeroom_classes']);
    }

    public function test_wali_with_historical_homeroom_only_gets_empty_active_homeroom_context(): void
    {
        $walikelasRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);
        $this->guruUser->roles()->attach($walikelasRole->id, ['is_primary' => false]);

        // Historical homeroom only
        HomeroomAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'status' => 'Aktif',
        ]);

        $context = $this->assessmentService->getUserContext($this->guruUser);

        $this->assertNull($context['homeroom_class']);
        $this->assertEmpty($context['homeroom_classes']);
    }

    public function test_canonical_wali_teacher_gets_only_owned_active_semester_class(): void
    {
        $walikelasRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);
        $this->guruUser->roles()->attach($walikelasRole->id, ['is_primary' => false]);

        // Old semester homeroom
        HomeroomAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'status' => 'Aktif',
        ]);

        // Active semester homeroom
        HomeroomAssignment::create([
            'academic_year_id' => $this->yearActive->id,
            'semester_id' => $this->semActive->id,
            'class_id' => $this->classActive->id,
            'teacher_id' => $this->teacher->id,
            'status' => 'Aktif',
        ]);

        $context = $this->assessmentService->getUserContext($this->guruUser);

        $this->assertNotNull($context['homeroom_class']);
        $this->assertEquals($this->classActive->id, $context['homeroom_class']['class_id']);
        $this->assertCount(1, $context['homeroom_classes']);
        $this->assertEquals($this->classActive->id, $context['homeroom_classes'][0]['class_id']);
    }

    // =========================================================================
    // 6. ADMIN ACTIVE CONTEXT TESTS
    // =========================================================================

    public function test_admin_active_context_strictly_bound_to_active_year_and_semester(): void
    {
        // Old assignment
        CourseAssignment::create([
            'academic_year_id' => $this->yearOld->id,
            'semester_id' => $this->semOld->id,
            'class_id' => $this->classOld->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Active assignment
        $caActive = CourseAssignment::create([
            'academic_year_id' => $this->yearActive->id,
            'semester_id' => $this->semActive->id,
            'class_id' => $this->classActive->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        $context = $this->assessmentService->getUserContext($this->adminUser);

        $this->assertEquals($this->yearActive->id, $context['active_academic_year']['id']);
        $this->assertEquals($this->semActive->id, $context['active_semester']['id']);

        // Admin course list contains only active semester courses
        $courseIds = array_column($context['assigned_courses'], 'course_assignment_id');
        $this->assertContains($caActive->id, $courseIds);
        $this->assertNotContains($this->classOld->id, array_column($context['assigned_courses'], 'class_id'));

        // Admin classes list contains only active year classes
        $classIds = array_column($context['homeroom_classes'], 'class_id');
        $this->assertContains($this->classActive->id, $classIds);
        $this->assertNotContains($this->classOld->id, $classIds);
    }

    // =========================================================================
    // 7. NO ACTIVE CONTEXT DETERMINISTIC TESTS
    // =========================================================================

    public function test_no_active_academic_year_returns_null_without_fallback(): void
    {
        AcademicYear::query()->update(['status' => 'Selesai']);

        $context = $this->assessmentService->getUserContext($this->guruUser);

        $this->assertNull($context['active_academic_year']);
        $this->assertNull($context['active_semester']);
    }

    public function test_active_year_without_active_semester_returns_null_semester(): void
    {
        Semester::query()->update(['status' => 'Tidak Aktif']);

        $context = $this->assessmentService->getUserContext($this->guruUser);

        $this->assertNotNull($context['active_academic_year']);
        $this->assertEquals($this->yearActive->id, $context['active_academic_year']['id']);
        $this->assertNull($context['active_semester']);
    }
}
