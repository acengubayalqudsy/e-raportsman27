<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== TABLES AUDIT ===\n";
$tables = [
    'religions',
    'extracurriculars',
    'student_extracurriculars',
    'extracurricular_participations',
    'students',
    'teachers',
    'users',
    'roles',
    'user_roles'
];

foreach ($tables as $t) {
    echo str_pad($t, 32) . ": " . (Schema::hasTable($t) ? "EXISTS" : "NOT FOUND") . "\n";
}

echo "\n=== DISTINCT STUDENTS.RELIGION ===\n";
if (Schema::hasTable('students') && Schema::hasColumn('students', 'religion')) {
    $religions = DB::table('students')->select('religion', DB::raw('count(*) as count'))->groupBy('religion')->get();
    foreach ($religions as $r) {
        echo "'" . ($r->religion ?? 'NULL') . "' => " . $r->count . " students\n";
    }
}

echo "\n=== STUDENT EXTRACURRICULARS DATA ===\n";
if (Schema::hasTable('student_extracurriculars')) {
    $ekskuls = DB::table('student_extracurriculars')->select('activity_name', DB::raw('count(*) as count'))->groupBy('activity_name')->get();
    foreach ($ekskuls as $e) {
        echo "'" . ($e->activity_name ?? 'NULL') . "' => " . $e->count . " records\n";
    }
}

echo "\n=== ROLES AUDIT ===\n";
if (Schema::hasTable('roles')) {
    $roles = DB::table('roles')->get();
    foreach ($roles as $rl) {
        echo "Role: {$rl->name} (id: {$rl->id}, display: {$rl->display_name})\n";
    }
}

echo "\n=== USERS COUNT BY ROLE ===\n";
if (Schema::hasTable('user_roles')) {
    $userRoles = DB::table('user_roles')
        ->join('roles', 'user_roles.role_id', '=', 'roles.id')
        ->select('roles.name', DB::raw('count(distinct user_roles.user_id) as user_count'))
        ->groupBy('roles.name')
        ->get();
    foreach ($userRoles as $ur) {
        echo "{$ur->name}: {$ur->user_count} users\n";
    }
}

echo "\n=== TOTAL USERS & ADMIN COUNT ===\n";
if (Schema::hasTable('users')) {
    $totalUsers = DB::table('users')->count();
    $activeUsers = DB::table('users')->where('is_active', 1)->count();
    $adminRole = DB::table('roles')->where('name', 'admin')->first();
    $adminCount = 0;
    if ($adminRole) {
        $adminCount = DB::table('user_roles')->where('role_id', $adminRole->id)->count();
    }
    echo "Total Users: {$totalUsers}, Active: {$activeUsers}, Admins: {$adminCount}\n";
}
