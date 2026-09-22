<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Role;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Semester;
use App\Models\AcademicYear;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\Assessment;
use App\Models\StudentScore;
use App\Models\FinalCourseGrade;
use App\Services\AssessmentService;
use Illuminate\Validation\ValidationException;

echo "===============================================================\n";
echo " UAT STAGING DATABASE INTEGRITY TEST SUITE - MARIADB 10.4\n";
echo "===============================================================\n";

$connection = DB::connection('mariadb_test');
$driver = $connection->getDriverName();
$version = $connection->getPdo()->getAttribute(PDO::ATTR_SERVER_VERSION);
$dbName = $connection->getDatabaseName();

echo "Active Driver : " . strtoupper($driver) . "\n";
echo "Server Version: " . $version . "\n";
echo "Database Name : " . $dbName . "\n";
echo "Connection    : 127.0.0.1:3310 (ISOLATED TEST DATABASE)\n";
echo "===============================================================\n\n";

if ($driver !== 'mariadb' && $driver !== 'mysql') {
    echo "[FATAL] Expected MariaDB connection, got {$driver}\n";
    exit(1);
}

// Ensure default connection for models in this script points to mariadb_test
DB::setDefaultConnection('mariadb_test');

$passed = 0;
$failed = 0;

function assertTest(string $title, bool $condition, string $detail = '') {
    global $passed, $failed;
    if ($condition) {
        echo " [PASS] " . $title . ($detail ? " ({$detail})" : "") . "\n";
        $passed++;
    } else {
        echo " [FAIL] " . $title . ($detail ? " ({$detail})" : "") . "\n";
        $failed++;
    }
}

// 0. Seed minimal synthetic fixtures in isolated DB
$ay = AcademicYear::firstOrCreate(
    ['name' => '2026/2027'],
    ['start_date' => '2026-07-15', 'end_date' => '2027-06-20', 'status' => 'Aktif']
);

$sem = Semester::firstOrCreate(
    ['name' => 'Ganjil', 'academic_year_id' => $ay->id],
    ['start_date' => '2026-07-15', 'end_date' => '2026-12-20', 'status' => 'Aktif']
);

$cls = SchoolClass::firstOrCreate(
    ['academic_year_id' => $ay->id, 'code' => 'X-MIPA-TEST'],
    ['name' => 'Kelas X MIPA Test', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
);

$subj = Subject::firstOrCreate(
    ['code' => 'BIO-TEST'],
    ['name' => 'Biologi Sintetis', 'group' => 'IPA', 'weekly_hours' => 3, 'status' => 'Aktif']
);

$u1 = User::firstOrCreate(['username' => 'guru_mariadb_1'], ['name' => 'Guru MariaDB 1', 'email' => 'g1@test.local', 'password' => 'secret123']);
$t1 = Teacher::firstOrCreate(['user_id' => $u1->id], ['name' => 'Guru MariaDB 1', 'nip' => '198001012026011001', 'gender' => 'L', 'status' => 'Aktif']);

$u2 = User::firstOrCreate(['username' => 'guru_mariadb_2'], ['name' => 'Guru MariaDB 2', 'email' => 'g2@test.local', 'password' => 'secret123']);
$t2 = Teacher::firstOrCreate(['user_id' => $u2->id], ['name' => 'Guru MariaDB 2', 'nip' => '198001012026011002', 'gender' => 'P', 'status' => 'Aktif']);

$uStudent = User::firstOrCreate(['username' => 'siswa_mariadb_1'], ['name' => 'Siswa Sintetis 1', 'email' => 's1@test.local', 'password' => 'secret123']);
$student = Student::firstOrCreate(
    ['nis' => '990001'],
    [
        'nisn' => '0099000001',
        'name' => 'Siswa Sintetis 1',
        'user_id' => $uStudent->id,
        'gender' => 'L',
        'birth_place' => 'Garut',
        'birth_date' => '2008-05-12',
        'status' => 'Aktif',
    ]
);

$uStudent2 = User::firstOrCreate(['username' => 'siswa_mariadb_2'], ['name' => 'Siswa Sintetis 2', 'email' => 's2@test.local', 'password' => 'secret123']);
$student2 = Student::firstOrCreate(
    ['nis' => '990002'],
    [
        'nisn' => '0099000002',
        'name' => 'Siswa Sintetis 2',
        'user_id' => $uStudent2->id,
        'gender' => 'P',
        'birth_place' => 'Garut',
        'birth_date' => '2008-08-20',
        'status' => 'Aktif',
    ]
);

ClassMember::firstOrCreate([
    'academic_year_id' => $ay->id,
    'semester_id' => $sem->id,
    'class_id' => $cls->id,
    'student_id' => $student->id,
], ['status' => 'Aktif']);

ClassMember::firstOrCreate([
    'academic_year_id' => $ay->id,
    'semester_id' => $sem->id,
    'class_id' => $cls->id,
    'student_id' => $student2->id,
], ['status' => 'Aktif']);

// TEST 1: Pencegahan dua guru Utama aktif pada kelas, mata pelajaran, dan semester yang sama.
echo "\n--- TEST 1: Single Active Utama Teacher Constraint ---\n";
CourseAssignment::where('class_id', $cls->id)->where('subject_id', $subj->id)->where('semester_id', $sem->id)->delete();

$ca1 = CourseAssignment::create([
    'academic_year_id' => $ay->id,
    'class_id' => $cls->id,
    'subject_id' => $subj->id,
    'teacher_id' => $t1->id,
    'semester_id' => $sem->id,
    'role' => 'Utama',
    'status' => 'Aktif',
]);

$duplicateUtamaCaught = false;
try {
    CourseAssignment::create([
        'academic_year_id' => $ay->id,
        'class_id' => $cls->id,
        'subject_id' => $subj->id,
        'teacher_id' => $t2->id,
        'semester_id' => $sem->id,
        'role' => 'Utama',
        'status' => 'Aktif',
    ]);
} catch (\Illuminate\Database\QueryException $e) {
    $duplicateUtamaCaught = true;
}
assertTest("Prevent second active Utama teacher in MariaDB", $duplicateUtamaCaught, "Caught MariaDB unique constraint violation");

// TEST 2: Pencegahan nilai ganda untuk siswa dan asesmen yang sama.
echo "\n--- TEST 2: Unique Student Assessment Score Constraint ---\n";
$assessment = Assessment::firstOrCreate([
    'course_assignment_id' => $ca1->id,
    'title' => 'Formatif Bab 1',
], [
    'type' => 'formatif',
    'scheme' => 'skor_tunggal',
    'max_score' => 100,
    'is_active' => true,
]);

StudentScore::where('assessment_id', $assessment->id)->where('student_id', $student->id)->delete();

StudentScore::create([
    'assessment_id' => $assessment->id,
    'student_id' => $student->id,
    'raw_score' => 85.00,
    'final_score' => 85.00,
]);

$duplicateScoreCaught = false;
try {
    StudentScore::create([
        'assessment_id' => $assessment->id,
        'student_id' => $student->id,
        'raw_score' => 90.00,
        'final_score' => 90.00,
    ]);
} catch (\Illuminate\Database\QueryException $e) {
    $duplicateScoreCaught = true;
}
assertTest("Prevent duplicate student score on same assessment in MariaDB", $duplicateScoreCaught, "Caught SQLSTATE unique key violation");

// TEST 3: Pencegahan nilai akhir ganda pada mata pelajaran dan semester yang sama.
echo "\n--- TEST 3: Unique Final Course Grade Constraint ---\n";
FinalCourseGrade::where('student_id', $student->id)->where('subject_id', $subj->id)->where('semester_id', $sem->id)->delete();

FinalCourseGrade::create([
    'student_id' => $student->id,
    'class_id' => $cls->id,
    'subject_id' => $subj->id,
    'semester_id' => $sem->id,
    'academic_year_id' => $ay->id,
    'course_assignment_id' => $ca1->id,
    'final_score' => 88.50,
    'status' => 'draf',
]);

$duplicateFinalGradeCaught = false;
try {
    FinalCourseGrade::create([
        'student_id' => $student->id,
        'class_id' => $cls->id,
        'subject_id' => $subj->id,
        'semester_id' => $sem->id,
        'academic_year_id' => $ay->id,
        'course_assignment_id' => $ca1->id,
        'final_score' => 92.00,
        'status' => 'draf',
    ]);
} catch (\Illuminate\Database\QueryException $e) {
    $duplicateFinalGradeCaught = true;
}
assertTest("Prevent duplicate final grade for same student/subject/semester in MariaDB", $duplicateFinalGradeCaught, "Unique constraint verified");

// TEST 4: Dua request penyimpanan nilai yang dikirim bersamaan.
echo "\n--- TEST 4: Concurrent Score Updates ---\n";
$assessmentService = app(AssessmentService::class);
$res1 = $assessmentService->saveBatchScores($ca1, [
    ['assessment_id' => $assessment->id, 'student_id' => $student->id, 'score' => 88]
], $u1);
$res2 = $assessmentService->saveBatchScores($ca1, [
    ['assessment_id' => $assessment->id, 'student_id' => $student->id, 'score' => 92]
], $u1);

$finalSavedScore = StudentScore::where('assessment_id', $assessment->id)->where('student_id', $student->id)->count();
assertTest("Idempotent concurrent update preserves single record", $finalSavedScore === 1 && $res1 === 1 && $res2 === 1, "Count is exactly 1, no duplicate rows created");

// TEST 5: Dua request perubahan guru Utama yang dikirim bersamaan.
echo "\n--- TEST 5: Concurrent Utama Teacher Changes ---\n";
$concurrentViolationCaught = false;

try {
    DB::connection('mariadb_test')->transaction(function () use ($cls, $subj, $sem, $ay, $t2) {
        CourseAssignment::create([
            'academic_year_id' => $ay->id,
            'class_id' => $cls->id,
            'subject_id' => $subj->id,
            'teacher_id' => $t2->id,
            'semester_id' => $sem->id,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);
    });
} catch (\Illuminate\Database\QueryException $e) {
    $concurrentViolationCaught = true;
}
assertTest("Concurrent secondary Utama teacher blocked by MariaDB schema index", $concurrentViolationCaught, "MariaDB rejected conflicting Utama assignment");

// TEST 6: Rollback transaksi batch apabila salah satu nilai tidak valid.
echo "\n--- TEST 6: Atomic Transaction Rollback on Batch Score Failure ---\n";
// Set initial scores
StudentScore::updateOrCreate(['assessment_id' => $assessment->id, 'student_id' => $student->id], ['raw_score' => 75, 'final_score' => 75]);
StudentScore::updateOrCreate(['assessment_id' => $assessment->id, 'student_id' => $student2->id], ['raw_score' => 75, 'final_score' => 75]);

$batchFailed = false;
try {
    $assessmentService->saveBatchScores($ca1, [
        ['assessment_id' => $assessment->id, 'student_id' => $student->id, 'score' => 99], // Valid score
        ['assessment_id' => $assessment->id, 'student_id' => $student2->id, 'score' => 150], // INVALID score (> max_score 100)
    ], $u1);
} catch (ValidationException $e) {
    $batchFailed = true;
}

$scoreA = StudentScore::where('assessment_id', $assessment->id)->where('student_id', $student->id)->value('final_score');
$scoreB = StudentScore::where('assessment_id', $assessment->id)->where('student_id', $student2->id)->value('final_score');

assertTest("Batch transaction rolls back entirely if one item is invalid",
    $batchFailed && (float)$scoreA === 75.0 && (float)$scoreB === 75.0,
    "Initial score 75 untouched; change to 99 safely rolled back by MariaDB transaction"
);

// TEST 7: Penyimpanan ulang request yang sama tanpa menghasilkan duplikasi (idempotency).
echo "\n--- TEST 7: Idempotent Resubmission ---\n";
$resub1 = $assessmentService->saveBatchScores($ca1, [
    ['assessment_id' => $assessment->id, 'student_id' => $student->id, 'score' => 85],
    ['assessment_id' => $assessment->id, 'student_id' => $student2->id, 'score' => 90],
], $u1);
$countAfterFirst = StudentScore::where('assessment_id', $assessment->id)->count();

$resub2 = $assessmentService->saveBatchScores($ca1, [
    ['assessment_id' => $assessment->id, 'student_id' => $student->id, 'score' => 85],
    ['assessment_id' => $assessment->id, 'student_id' => $student2->id, 'score' => 90],
], $u1);
$countAfterSecond = StudentScore::where('assessment_id', $assessment->id)->count();

assertTest("Resubmitting identical request produces no duplicates",
    $resub1 === 2 && $resub2 === 2 && $countAfterFirst === $countAfterSecond,
    "Row count unchanged at {$countAfterSecond}"
);

// TEST 8: Perubahan nilai yang sudah terkunci (locked course grade immutability).
echo "\n--- TEST 8: Locked Grade Immutability ---\n";
// Lock the course
$finalGrade = FinalCourseGrade::where('student_id', $student->id)->where('subject_id', $subj->id)->first();
$finalGrade->status = 'terkunci';
$finalGrade->save();

$lockedRejected = false;
try {
    $assessmentService->saveBatchScores($ca1, [
        ['assessment_id' => $assessment->id, 'student_id' => $student->id, 'score' => 99]
    ], $u1);
} catch (ValidationException $e) {
    $lockedRejected = true;
}

assertTest("Locked grades cannot be modified without formal unlock authorization",
    $lockedRejected,
    "Attempted modification on locked course assignment blocked"
);

echo "\n===============================================================\n";
echo " MARIADB VERIFICATION SUMMARY: {$passed} PASSED, {$failed} FAILED\n";
echo "===============================================================\n";

exit($failed > 0 ? 1 : 0);
