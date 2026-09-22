<?php

require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Semester;
use App\Models\AcademicYear;
use App\Models\CourseAssignment;
use App\Models\HomeroomAssignment;
use App\Models\ClassMember;
use App\Models\FinalCourseGrade;
use App\Services\AcademicAuthorizationService;
use App\Services\AssessmentService;
use Illuminate\Support\Facades\DB;
use App\Models\Role;

echo "====================================================================\n";
echo " AUTHORIZATION & LOCKING SECURITY AUDIT VERIFICATION\n";
echo "====================================================================\n\n";

$passed = 0;
$failed = 0;

function assertAuth(string $testName, bool $condition, string $details = '') {
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo " [PASS] {$testName}: {$details}\n";
    } else {
        $failed++;
        echo " [FAIL] {$testName}: {$details}\n";
    }
}

// Ensure roles exist
$roleAdmin = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
$roleGuru = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);
$roleWali = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);

$authService = app(AcademicAuthorizationService::class);
$assessmentService = app(AssessmentService::class);

DB::beginTransaction();

try {
    $ay = AcademicYear::firstOrCreate(['name' => '2026/2027 Auth'], [
        'start_date' => '2026-07-01', 'end_date' => '2027-06-30', 'status' => 'Aktif'
    ]);
    $sem = Semester::firstOrCreate(['name' => 'Ganjil Auth', 'academic_year_id' => $ay->id], [
        'start_date' => '2026-07-01', 'end_date' => '2026-12-31', 'status' => 'Aktif'
    ]);

    $classA = SchoolClass::firstOrCreate(['academic_year_id' => $ay->id, 'code' => 'X-AUTH-A'], ['name' => 'Kelas X-Auth-A', 'grade' => 'X', 'status' => 'Aktif']);
    $classB = SchoolClass::firstOrCreate(['academic_year_id' => $ay->id, 'code' => 'X-AUTH-B'], ['name' => 'Kelas X-Auth-B', 'grade' => 'X', 'status' => 'Aktif']);

    $subj = Subject::firstOrCreate(['code' => 'BIO-AUTH'], ['name' => 'Biologi Auth Test', 'group' => 'IPA', 'weekly_hours' => 3, 'status' => 'Aktif']);

    // Admin user
    $userAdmin = User::firstOrCreate(['username' => 'admin_auth_test'], [
        'email' => 'admin_auth_test@test.local', 'name' => 'Admin Auth Tester', 'password' => bcrypt('secret123')
    ]);
    $userAdmin->roles()->sync([$roleAdmin->id => ['is_primary' => true]]);

    // Teacher 1 (Guru Pengampu Class A)
    $userGuruA = User::firstOrCreate(['username' => 'guru_a_auth'], [
        'email' => 'guru_a_auth@test.local', 'name' => 'Guru Pengampu A', 'password' => bcrypt('secret123')
    ]);
    $userGuruA->roles()->sync([$roleGuru->id => ['is_primary' => true]]);
    $teacherA = Teacher::firstOrCreate(['user_id' => $userGuruA->id], [
        'name' => 'Guru Pengampu A', 'nip' => '99887711', 'gender' => 'L', 'status' => 'Aktif'
    ]);

    // Teacher 2 (Wali Kelas Class A, not teaching BIO)
    $userWaliA = User::firstOrCreate(['username' => 'wali_a_auth'], [
        'email' => 'wali_a_auth@test.local', 'name' => 'Wali Kelas A', 'password' => bcrypt('secret123')
    ]);
    $userWaliA->roles()->sync([$roleWali->id => ['is_primary' => true], $roleGuru->id => ['is_primary' => false]]);
    $teacherWaliA = Teacher::firstOrCreate(['user_id' => $userWaliA->id], [
        'name' => 'Wali Kelas A', 'nip' => '99887722', 'gender' => 'P', 'status' => 'Aktif'
    ]);
    HomeroomAssignment::firstOrCreate(
        ['class_id' => $classA->id, 'semester_id' => $sem->id],
        ['teacher_id' => $teacherWaliA->id, 'academic_year_id' => $ay->id, 'status' => 'Aktif']
    );

    // Teacher 3 (Wali Kelas Class B, completely unrelated to Class A)
    $userWaliB = User::firstOrCreate(['username' => 'wali_b_auth'], [
        'email' => 'wali_b_auth@test.local', 'name' => 'Wali Kelas B', 'password' => bcrypt('secret123')
    ]);
    $userWaliB->roles()->sync([$roleWali->id => ['is_primary' => true], $roleGuru->id => ['is_primary' => false]]);
    $teacherWaliB = Teacher::firstOrCreate(['user_id' => $userWaliB->id], [
        'name' => 'Wali Kelas B', 'nip' => '99887733', 'gender' => 'L', 'status' => 'Aktif'
    ]);
    HomeroomAssignment::firstOrCreate(
        ['class_id' => $classB->id, 'semester_id' => $sem->id],
        ['teacher_id' => $teacherWaliB->id, 'academic_year_id' => $ay->id, 'status' => 'Aktif']
    );

    // Course Assignment: Teacher A teaches BIO in Class A
    $assignmentA = CourseAssignment::firstOrCreate(
        ['class_id' => $classA->id, 'subject_id' => $subj->id, 'semester_id' => $sem->id],
        ['teacher_id' => $teacherA->id, 'academic_year_id' => $ay->id, 'type' => 'Utama', 'status' => 'Aktif']
    );

    // Student in Class A
    $userStd = User::firstOrCreate(['username' => 'std_a_auth'], [
        'email' => 'std_a_auth@test.local', 'name' => 'Siswa A', 'password' => bcrypt('secret123')
    ]);
    $studentA = Student::firstOrCreate(['user_id' => $userStd->id], [
        'name' => 'Siswa A', 'nis' => '9901', 'nisn' => '009901', 'gender' => 'L', 'birth_place' => 'Garut', 'birth_date' => '2008-01-01', 'status' => 'Aktif'
    ]);
    ClassMember::firstOrCreate(
        ['class_id' => $classA->id, 'student_id' => $studentA->id, 'semester_id' => $sem->id],
        ['academic_year_id' => $ay->id, 'status' => 'Aktif']
    );

    // 1. Audit canManageCourseAssignment (Input Nilai / Hitung Nilai Akhir)
    // - Guru Pengampu: ALLOWED
    // - Admin: ALLOWED
    // - Wali Kelas (not teaching): DENIED
    // - Unrelated Wali B: DENIED
    assertAuth(
        "1. canManageCourseAssignment (Guru Pengampu)",
        $authService->canManageCourseAssignment($userGuruA, $assignmentA) === true,
        "Guru Pengampu A can manage scores"
    );
    assertAuth(
        "2. canManageCourseAssignment (Admin)",
        $authService->canManageCourseAssignment($userAdmin, $assignmentA) === true,
        "Admin can manage scores"
    );
    assertAuth(
        "3. canManageCourseAssignment (Wali Kelas A Denied)",
        $authService->canManageCourseAssignment($userWaliA, $assignmentA) === false,
        "Wali Kelas A cannot directly edit/calculate subject teacher scores"
    );
    assertAuth(
        "4. canManageCourseAssignment (Wali Kelas B Denied)",
        $authService->canManageCourseAssignment($userWaliB, $assignmentA) === false,
        "Wali Kelas B completely denied"
    );

    // 2. Audit canValidateCourseGrades (Validasi & Kunci Nilai)
    // - Admin: ALLOWED
    // - Wali Kelas A (binaannya): ALLOWED
    // - Guru Pengampu (bukan wali kelas): DENIED
    // - Wali Kelas B (kelas lain): DENIED
    assertAuth(
        "5. canValidateCourseGrades (Admin)",
        $authService->canValidateCourseGrades($userAdmin, $assignmentA) === true,
        "Admin can validate and lock course"
    );
    assertAuth(
        "6. canValidateCourseGrades (Wali Kelas A)",
        $authService->canValidateCourseGrades($userWaliA, $assignmentA) === true,
        "Wali Kelas A can validate course in their own rombel"
    );
    assertAuth(
        "7. canValidateCourseGrades (Guru Pengampu Denied)",
        $authService->canValidateCourseGrades($userGuruA, $assignmentA) === false,
        "Subject teacher CANNOT validate/lock their own course grades"
    );
    assertAuth(
        "8. canValidateCourseGrades (Wali Kelas B Denied)",
        $authService->canValidateCourseGrades($userWaliB, $assignmentA) === false,
        "Wali Kelas of another class CANNOT validate Class A course grades"
    );

    // 3. Audit canAccessStudent (Akses Rapor Siswa)
    // - Admin: ALLOWED
    // - Wali Kelas A: ALLOWED (student is in Class A)
    // - Guru Pengampu A: ALLOWED (teaches student in Class A)
    // - Wali Kelas B: DENIED (student is NOT in Class B)
    assertAuth(
        "9. canAccessStudent (Admin)",
        $authService->canAccessStudent($userAdmin, $studentA, $sem->id) === true,
        "Admin has access to student report card"
    );
    assertAuth(
        "10. canAccessStudent (Wali Kelas A)",
        $authService->canAccessStudent($userWaliA, $studentA, $sem->id) === true,
        "Wali Kelas A has access to their rombel student"
    );
    assertAuth(
        "11. canAccessStudent (Guru Pengampu A)",
        $authService->canAccessStudent($userGuruA, $studentA, $sem->id) === true,
        "Subject teacher has access to taught student"
    );
    assertAuth(
        "12. canAccessStudent (Wali Kelas B Denied)",
        $authService->canAccessStudent($userWaliB, $studentA, $sem->id) === false,
        "Wali Kelas B cannot access student from Class A"
    );

    // 4. Audit Locked Modification Prevention
    // Simulate grade is locked
    FinalCourseGrade::updateOrCreate(
        ['student_id' => $studentA->id, 'subject_id' => $subj->id, 'semester_id' => $sem->id],
        ['academic_year_id' => $ay->id, 'class_id' => $classA->id, 'course_assignment_id' => $assignmentA->id, 'final_score' => 88.0, 'status' => 'Terkunci']
    );

    $isLocked = $authService->isCourseGradeLocked($assignmentA);
    assertAuth(
        "13. isCourseGradeLocked Detection",
        $isLocked === true,
        "Course assignment correctly recognized as locked"
    );

    // Attempt to save scores on locked assignment through AssessmentService
    $caughtLockedException = false;
    try {
        $assessmentService->saveBatchScores($assignmentA, [
            ['student_id' => $studentA->id, 'assessment_id' => 99999, 'score' => 95]
        ], $userGuruA);
    } catch (\Illuminate\Validation\ValidationException $e) {
        $caughtLockedException = true;
    } catch (\Exception $e) {
        if (str_contains($e->getMessage(), 'dikunci')) {
            $caughtLockedException = true;
        }
    }

    assertAuth(
        "14. Locked Grade Modification Prevention",
        $caughtLockedException === true,
        "Attempt to modify locked scores properly rejected with ValidationException"
    );

} finally {
    DB::rollBack();
}

echo "\n====================================================================\n";
echo " AUDIT SUMMARY: {$passed} PASSED, {$failed} FAILED\n";
echo "====================================================================\n";

exit($failed > 0 ? 1 : 0);
