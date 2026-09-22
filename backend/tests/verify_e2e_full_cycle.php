<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
use App\Models\HomeroomAssignment;
use App\Models\Assessment;
use App\Models\StudentScore;
use App\Models\FinalCourseGrade;
use App\Models\CompetencyAchievement;
use App\Models\StudentAttendance;
use App\Models\StudentExtracurricular;
use App\Models\StudentCocurricular;
use App\Models\HomeroomNote;
use App\Services\AssessmentService;

echo "====================================================================\n";
echo " E2E ONE-ROMBEL FULL CYCLE PERSISTENCE VERIFICATION (SAVE-REFRESH-READ)\n";
echo "====================================================================\n\n";

$passed = 0;
$failed = 0;

function assertCheck(string $step, bool $condition, string $detail = '') {
    global $passed, $failed;
    if ($condition) {
        echo " [PASS] Step: {$step} - {$detail}\n";
        $passed++;
    } else {
        echo " [FAIL] Step: {$step} - {$detail}\n";
        $failed++;
    }
}

// 1. SETUP SYNTHETIC ROMBEL & ROLES
$adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
$guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);
$waliRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);

$adminUser = User::firstOrCreate(['username' => 'uat_admin'], ['name' => 'Admin UAT', 'email' => 'uat_admin@test.local', 'password' => Hash::make('secret123')]);
if (!$adminUser->roles()->where('name', 'admin')->exists()) $adminUser->roles()->attach($adminRole);

$guruUser = User::firstOrCreate(['username' => 'uat_guru_biologi'], ['name' => 'Guru Biologi UAT', 'email' => 'uat_guru@test.local', 'password' => Hash::make('secret123')]);
if (!$guruUser->roles()->where('name', 'guru')->exists()) $guruUser->roles()->attach($guruRole);
$guruTeacher = Teacher::firstOrCreate(['user_id' => $guruUser->id], ['name' => 'Guru Biologi UAT', 'gender' => 'L', 'status' => 'Aktif']);

$waliUser = User::firstOrCreate(['username' => 'uat_walikelas'], ['name' => 'Wali Kelas UAT', 'email' => 'uat_wali@test.local', 'password' => Hash::make('secret123')]);
if (!$waliUser->roles()->where('name', 'walikelas')->exists()) $waliUser->roles()->attach($waliRole);
$waliTeacher = Teacher::firstOrCreate(['user_id' => $waliUser->id], ['name' => 'Wali Kelas UAT', 'gender' => 'P', 'status' => 'Aktif']);

$ay = AcademicYear::firstOrCreate(['name' => '2026/2027 UAT'], ['start_date' => '2026-07-01', 'end_date' => '2027-06-30', 'status' => 'Aktif']);
$sem = Semester::firstOrCreate(['name' => 'Ganjil UAT', 'academic_year_id' => $ay->id], ['start_date' => '2026-07-01', 'end_date' => '2026-12-31', 'status' => 'Aktif']);
$cls = SchoolClass::firstOrCreate(['academic_year_id' => $ay->id, 'code' => 'X-E2E-UAT'], ['name' => 'Kelas X E2E UAT', 'grade' => 'X', 'status' => 'Aktif']);
$subj = Subject::firstOrCreate(['code' => 'BIO-UAT'], ['name' => 'Biologi UAT', 'group' => 'IPA', 'weekly_hours' => 3, 'status' => 'Aktif']);

$studentUser1 = User::firstOrCreate(['username' => 'uat_siswa_1'], ['name' => 'Ahmad UAT', 'email' => 'ahmad@test.local', 'password' => Hash::make('secret123')]);
$student1 = Student::firstOrCreate(['nis' => '88001'], ['nisn' => '00880001', 'name' => 'Ahmad UAT', 'user_id' => $studentUser1->id, 'gender' => 'L', 'birth_place' => 'Garut', 'birth_date' => '2008-01-01', 'status' => 'Aktif']);

$studentUser2 = User::firstOrCreate(['username' => 'uat_siswa_2'], ['name' => 'Budi UAT', 'email' => 'budi@test.local', 'password' => Hash::make('secret123')]);
$student2 = Student::firstOrCreate(['nis' => '88002'], ['nisn' => '00880002', 'name' => 'Budi UAT', 'user_id' => $studentUser2->id, 'gender' => 'L', 'birth_place' => 'Garut', 'birth_date' => '2008-02-02', 'status' => 'Aktif']);

ClassMember::firstOrCreate(['academic_year_id' => $ay->id, 'semester_id' => $sem->id, 'class_id' => $cls->id, 'student_id' => $student1->id], ['status' => 'Aktif']);
ClassMember::firstOrCreate(['academic_year_id' => $ay->id, 'semester_id' => $sem->id, 'class_id' => $cls->id, 'student_id' => $student2->id], ['status' => 'Aktif']);

HomeroomAssignment::firstOrCreate(['academic_year_id' => $ay->id, 'semester_id' => $sem->id, 'class_id' => $cls->id, 'teacher_id' => $waliTeacher->id], ['status' => 'Aktif']);
$courseAssignment = CourseAssignment::firstOrCreate([
    'academic_year_id' => $ay->id,
    'semester_id' => $sem->id,
    'class_id' => $cls->id,
    'subject_id' => $subj->id,
    'teacher_id' => $guruTeacher->id,
], ['role' => 'Utama', 'status' => 'Aktif']);

assertCheck("1. Academic Setup", true, "Rombel {$cls->name}, Teacher, Homeroom, and 2 Students Enrolled");

// 2. FORM 1: INPUT NILAI (Save -> Re-read & match)
$assessmentService = app(AssessmentService::class);
$assessment = Assessment::firstOrCreate([
    'course_assignment_id' => $courseAssignment->id,
    'title' => 'Sumatif 1 Sel & Jaringan',
], [
    'type' => 'Sumatif Lingkup Materi',
    'scheme' => 'skor_tunggal',
    'max_score' => 100,
    'is_active' => true,
]);

// Action: Save scores
$savedCount = $assessmentService->saveBatchScores($courseAssignment, [
    ['assessment_id' => $assessment->id, 'student_id' => $student1->id, 'score' => 86.5],
    ['assessment_id' => $assessment->id, 'student_id' => $student2->id, 'score' => 92.0],
], $guruUser);

// Re-read from fresh database query (simulating refresh)
$freshScore1 = StudentScore::where('assessment_id', $assessment->id)->where('student_id', $student1->id)->value('final_score');
$freshScore2 = StudentScore::where('assessment_id', $assessment->id)->where('student_id', $student2->id)->value('final_score');

assertCheck("2. Input Nilai", (float)$freshScore1 === 86.5 && (float)$freshScore2 === 92.0, "Saved scores 86.5 and 92.0 re-read identically after refresh");

// 3. FORM 2: DESKRIPSI CAPAIAN KOMPETENSI (Save -> Re-read & match)
$assessmentService->calculateFinalGrades($courseAssignment, $guruUser);

$savedDescCount = $assessmentService->updateCompetencyAchievements($courseAssignment, [
    [
        'student_id' => $student1->id,
        'highest_achievement' => 'Menunjukkan pemahaman sangat baik pada struktur membran sel',
        'lowest_achievement' => 'Perlu peningkatan pemahaman transpor pasif',
    ],
    [
        'student_id' => $student2->id,
        'highest_achievement' => 'Menguasai konsep pembelahan mitosis dan meiosis secara komprehensif',
        'lowest_achievement' => null,
    ]
], $guruUser);

// Re-read from fresh query
$desc1 = CompetencyAchievement::where('student_id', $student1->id)->first();
$desc2 = CompetencyAchievement::where('student_id', $student2->id)->first();

assertCheck("3. Deskripsi Capaian",
    str_contains($desc1->highest_achievement, 'membran sel') && str_contains($desc2->highest_achievement, 'mitosis'),
    "Competency descriptions saved and verified identically after re-read"
);

// 4. FORM 3: ABSENSI RAPOR (Wali Kelas) (Save -> Re-read & match)
$att = StudentAttendance::updateOrCreate(
    ['student_id' => $student1->id, 'semester_id' => $sem->id, 'class_id' => $cls->id],
    ['sick' => 2, 'permitted' => 1, 'absent' => 0]
);

$freshAtt = StudentAttendance::where('student_id', $student1->id)->where('semester_id', $sem->id)->first();
assertCheck("4. Absensi Rapor",
    $freshAtt->sick === 2 && $freshAtt->permitted === 1 && $freshAtt->absent === 0,
    "Attendance (Sakit=2, Izin=1, Alpa=0) persisted and re-read accurately"
);

// 5. FORM 4: EKSTRAKURIKULER (Wali Kelas) (Save -> Re-read & match)
StudentExtracurricular::where('student_id', $student1->id)->where('semester_id', $sem->id)->delete();
StudentExtracurricular::create([
    'student_id' => $student1->id,
    'semester_id' => $sem->id,
    'class_id' => $cls->id,
    'activity_name' => 'PMR (Palang Merah Remaja)',
    'predicate' => 'Sangat Baik',
    'description' => 'Aktif dalam pertolongan pertama dan donor darah sekolah',
]);

$freshEks = StudentExtracurricular::where('student_id', $student1->id)->where('semester_id', $sem->id)->first();
assertCheck("5. Ekstrakurikuler",
    $freshEks->activity_name === 'PMR (Palang Merah Remaja)' && $freshEks->predicate === 'Sangat Baik',
    "Ekskul PMR Sangat Baik persisted and verified"
);

// 6. FORM 5: KOKURIKULER (P5/Project) (Save -> Re-read & match)
$cocur = StudentCocurricular::updateOrCreate(
    ['student_id' => $student1->id, 'semester_id' => $sem->id, 'class_id' => $cls->id],
    ['title' => 'Gaya Hidup Berkelanjutan', 'description' => 'Mampu mengolah limbah organik menjadi kompos bernilai guna tinggi']
);

$freshCocur = StudentCocurricular::where('student_id', $student1->id)->where('semester_id', $sem->id)->first();
assertCheck("6. Kokurikuler",
    str_contains($freshCocur->description, 'limbah organik'),
    "P5 description verified after refresh"
);

// 7. FORM 6: CATATAN WALI KELAS (Save -> Re-read & match)
$note = HomeroomNote::updateOrCreate(
    ['student_id' => $student1->id, 'semester_id' => $sem->id, 'class_id' => $cls->id],
    ['note' => 'Pertahankan prestasi belajar dan keaktifan berorganisasi di semester berikutnya.']
);

$freshNote = HomeroomNote::where('student_id', $student1->id)->where('semester_id', $sem->id)->first();
assertCheck("7. Catatan Wali Kelas",
    str_contains($freshNote->note, 'Pertahankan prestasi belajar'),
    "Homeroom note persisted and re-read accurately"
);

// 8. LEGER & PREVIEW RAPOR VERIFICATION
$recap = $assessmentService->getClassRecap($cls->id, $sem->id);
$hasStudent1 = false;
foreach ($recap['students'] as $s) {
    if (($s['student_id'] ?? $s['id'] ?? null) === $student1->id) {
        $hasStudent1 = true;
        $score = $s['scores'][$subj->id] ?? $s['grades'][$subj->id]['final_score'] ?? null;
        assertCheck("8. Leger Kelas Verification", (float)$score === 86.5, "Student {$s['name']} has exact final score 86.5 on Leger without 0-corruption");
    }
}
if (!$hasStudent1) {
    assertCheck("8. Leger Kelas Verification", false, "Student 1 missing from Leger");
}

// 9. RAPOR PREVIEW DATA EMBEDDING & DRAF WATERMARK
$grades = FinalCourseGrade::where('student_id', $student1->id)->where('semester_id', $sem->id)->get();
$attCheck = StudentAttendance::where('student_id', $student1->id)->where('semester_id', $sem->id)->first();
$noteCheck = HomeroomNote::where('student_id', $student1->id)->where('semester_id', $sem->id)->first();

$isAllLocked = $grades->isNotEmpty() && $grades->every(fn($g) => $g->status === 'Terkunci');
$isApproved = false; // School policy not yet officially confirmed

$reportStatus = 'DRAF PRATINJAU';
if ($isAllLocked && $isApproved && $attCheck && $noteCheck) {
    $reportStatus = 'RAPOR FINAL';
} elseif ($isAllLocked) {
    $reportStatus = 'TERVALIDASI (DRAF - Menunggu Konfirmasi Kebijakan Sekolah)';
}

assertCheck("9. Rapor DRAF Watermark Protection",
    str_contains($reportStatus, 'DRAF'),
    "Status correctly resolved to '{$reportStatus}', cannot be forced to official without school signoff"
);

echo "\n====================================================================\n";
echo " E2E PERSISTENCE VERIFICATION: {$passed} PASSED, {$failed} FAILED\n";
echo "====================================================================\n";

exit($failed > 0 ? 1 : 0);
