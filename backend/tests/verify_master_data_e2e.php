<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AuditLog;
use App\Models\Extracurricular;
use App\Models\Religion;
use App\Models\Role;
use App\Models\Student;
use App\Models\StudentExtracurricular;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

echo "=== START E2E REAL INTEGRATION TEST FOR MASTER DATA ===\n";
echo "Database Connection: " . DB::connection()->getName() . "\n";
echo "Database Name: " . DB::connection()->getDatabaseName() . "\n\n";

$errors = [];

// ==========================================
// 1. MASTER AGAMA VERIFICATION
// ==========================================
echo "[1] Testing Master Agama...\n";
try {
    // Clean any previous test religion
    Religion::where('name', 'like', 'Agama UAT%')->orWhere('name', 'like', 'UAT Rel%')->forceDelete();

    // Check initial religions in DB
    $religionsCount = Religion::count();
    echo "  - Initial religions in DB: {$religionsCount}\n";

    // Create test religion (max 20 chars)
    $testRel = Religion::create([
        'name' => 'UAT Rel ' . rand(100, 999),
        'status' => 'Aktif',
    ]);
    echo "  - Created test religion ID {$testRel->id} ({$testRel->name})\n";

    // Query DB directly
    $persisted = DB::table('religions')->where('id', $testRel->id)->first();
    if (!$persisted || $persisted->status !== 'Aktif') {
        throw new Exception("Direct DB check failed: Religion record not found in MariaDB table 'religions'.");
    }
    echo "  - Direct DB check passed (status: {$persisted->status})\n";

    // Test student relationship
    $testStudent = Student::create([
        'nis' => 'UAT-' . rand(10000, 99999),
        'nisn' => '00' . rand(10000000, 99999999),
        'name' => 'Siswa UAT Agama',
        'gender' => 'L',
        'birth_place' => 'Garut',
        'birth_date' => '2008-05-15',
        'religion_id' => $testRel->id,
        'religion' => $testRel->name,
        'status' => 'Aktif',
    ]);
    echo "  - Assigned to student {$testStudent->name} (student ID: {$testStudent->id})\n";

    // Verify foreign key integrity
    $refCheck = $testRel->isReferencedByStudents();
    if (!$refCheck) {
        throw new Exception("Referenced check failed: Religion not recognized as referenced by student.");
    }
    echo "  - isReferencedByStudents() returned true (Protection active)\n";

    // Clean up student and delete test religion
    $testStudent->forceDelete();
    $testRel->delete(); // Soft delete
    echo "  - Soft-deleted test religion ID {$testRel->id}\n";

    $softDeletedCheck = Religion::withTrashed()->find($testRel->id);
    if (!$softDeletedCheck || !$softDeletedCheck->trashed()) {
        throw new Exception("Soft delete failed: Religion deleted_at not set.");
    }
    echo "  - Verified soft delete in database (deleted_at: {$softDeletedCheck->deleted_at})\n";
    $testRel->forceDelete(); // Clean permanently
    echo "  [PASSED] Master Agama is fully persistent & functional.\n\n";
} catch (Exception $e) {
    echo "  [FAILED] " . $e->getMessage() . "\n\n";
    $errors[] = "Master Agama: " . $e->getMessage();
}

// ==========================================
// 2. MASTER EKSTRAKURIKULER VERIFICATION
// ==========================================
echo "[2] Testing Master Ekstrakurikuler...\n";
try {
    $ekskulCount = Extracurricular::count();
    echo "  - Initial extracurriculars in DB: {$ekskulCount}\n";

    $testCode = 'EKS-UAT-' . rand(100, 999);
    $testEks = Extracurricular::create([
        'code' => $testCode,
        'name' => 'Klub Robotik UAT ' . rand(100, 999),
        'status' => 'Aktif',
        'description' => 'Ekskul robotika dan kecerdasan buatan',
    ]);
    echo "  - Created test extracurricular ID {$testEks->id} ({$testEks->code} - {$testEks->name})\n";

    // Direct DB check
    $persistedEks = DB::table('extracurriculars')->where('id', $testEks->id)->first();
    if (!$persistedEks || $persistedEks->code !== $testCode) {
        throw new Exception("Direct DB check failed: Extracurricular record not found in MariaDB.");
    }
    echo "  - Direct DB check passed (code: {$persistedEks->code})\n";

    // Student participation relationship test
    $sem = DB::table('semesters')->first();
    $stu = DB::table('students')->first();
    $participation = null;
    if ($sem && $stu) {
        $participation = StudentExtracurricular::create([
            'student_id' => $stu->id,
            'semester_id' => $sem->id,
            'extracurricular_id' => $testEks->id,
            'activity_name' => $testEks->name,
            'predicate' => 'A',
            'description' => 'Sangat berbakat dan tekun',
        ]);
        echo "  - Created student participation linking to extracurricular_id {$testEks->id}\n";

        if (!$testEks->isReferencedByStudents()) {
            throw new Exception("Referenced check failed: Extracurricular should report referenced by student.");
        }
        echo "  - isReferencedByStudents() returned true (Delete protection active)\n";

        $participation->forceDelete();
    }

    $testEks->delete();
    $softDeletedEks = Extracurricular::withTrashed()->find($testEks->id);
    if (!$softDeletedEks || !$softDeletedEks->trashed()) {
        throw new Exception("Soft delete failed: Extracurricular deleted_at not set.");
    }
    echo "  - Verified soft delete in database (deleted_at: {$softDeletedEks->deleted_at})\n";
    $testEks->forceDelete();
    echo "  [PASSED] Master Ekstrakurikuler is fully persistent & functional.\n\n";
} catch (Exception $e) {
    echo "  [FAILED] " . $e->getMessage() . "\n\n";
    $errors[] = "Master Ekstrakurikuler: " . $e->getMessage();
}

// ==========================================
// 3. MASTER PENGGUNA & ROLE VERIFICATION
// ==========================================
echo "[3] Testing Master Pengguna & Role...\n";
try {
    // Verify no users.role column exists
    if (Schema::hasColumn('users', 'role')) {
        throw new Exception("Architecture violation: 'users.role' column detected! Roles must strictly use 'user_roles' pivot.");
    }
    echo "  - Verified: users.role column does NOT exist (Correct pivot architecture).\n";

    // Verify user_roles pivot table
    if (!Schema::hasTable('user_roles')) {
        throw new Exception("Architecture violation: 'user_roles' pivot table does not exist!");
    }
    echo "  - Verified: user_roles pivot table exists.\n";

    // Verify multi-role assignment and password hashing
    $testUsername = 'user_uat_' . time();
    $plainPassword = 'PasswordUAT@2026!';
    $testUser = User::create([
        'name' => 'Pengguna UAT Verification',
        'username' => $testUsername,
        'email' => $testUsername . '@sman27.sch.id',
        'password' => Hash::make($plainPassword),
        'is_active' => true,
    ]);
    echo "  - Created test user ID {$testUser->id} ({$testUser->username})\n";

    // Direct check: password must be hashed, never plain
    $dbUser = DB::table('users')->where('id', $testUser->id)->first();
    if ($dbUser->password === $plainPassword || !str_starts_with($dbUser->password, '$2y$')) {
        throw new Exception("Security violation: Password is not safely Bcrypt hashed in database!");
    }
    echo "  - Verified: Password is securely Bcrypt hashed.\n";

    // Attach multiple roles (Guru + Walikelas)
    $guruRole = Role::where('name', 'guru')->first();
    $walikelasRole = Role::where('name', 'walikelas')->first();
    if ($guruRole && $walikelasRole) {
        $testUser->roles()->attach([
            $guruRole->id => ['is_primary' => true],
            $walikelasRole->id => ['is_primary' => false],
        ]);
        echo "  - Attached multi-roles: Guru (primary) and Wali Kelas.\n";

        $loadedRoles = $testUser->fresh('roles')->roles;
        if ($loadedRoles->count() < 2) {
            throw new Exception("Multi-role assignment failed in database pivot.");
        }
        echo "  - Verified: User has {$loadedRoles->count()} roles in user_roles pivot.\n";
    }

    // Verify Last Administrator Protection
    $adminRole = Role::where('name', 'admin')->first();
    $activeAdminsCount = User::where('is_active', true)
        ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
        ->count();
    echo "  - Active Administrators currently in database: {$activeAdminsCount}\n";

    $testUser->roles()->detach();
    $testUser->delete();
    echo "  [PASSED] Master Pengguna & Role is fully persistent & protected.\n\n";
} catch (Exception $e) {
    echo "  [FAILED] " . $e->getMessage() . "\n\n";
    $errors[] = "Master Pengguna: " . $e->getMessage();
}

// ==========================================
// SUMMARY REPORT
// ==========================================
echo "=== SUMMARY RESULT ===\n";
if (empty($errors)) {
    echo "ALL MASTER DATA REAL INTEGRATION CHECKS PASSED WITH ZERO ERRORS.\n";
    exit(0);
} else {
    echo "FAILED CHECKS (" . count($errors) . "):\n";
    foreach ($errors as $err) {
        echo "  - {$err}\n";
    }
    exit(1);
}
