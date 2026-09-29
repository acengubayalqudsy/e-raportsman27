<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$years = App\Models\AcademicYear::all(['id', 'name', 'status']);
$semesters = App\Models\Semester::all(['id', 'name', 'academic_year_id', 'status']);
$classes = App\Models\SchoolClass::all(['id', 'name', 'academic_year_id', 'status']);
$homerooms = App\Models\HomeroomAssignment::with(['schoolClass', 'teacher', 'semester'])->get()->map(function($h) {
    return [
        'id' => $h->id,
        'class_id' => $h->class_id,
        'class' => $h->schoolClass?->name,
        'teacher_id' => $h->teacher_id,
        'teacher' => $h->teacher?->name,
        'semester_id' => $h->semester_id,
        'status' => $h->status,
    ];
});
$courseAssignments = App\Models\CourseAssignment::with(['schoolClass', 'teacher', 'subject', 'semester'])->get()->map(function($c) {
    return [
        'id' => $c->id,
        'class_id' => $c->class_id,
        'class' => $c->schoolClass?->name,
        'teacher_id' => $c->teacher_id,
        'teacher' => $c->teacher?->name,
        'subject' => $c->subject?->name,
        'semester_id' => $c->semester_id,
        'status' => $c->status,
    ];
});
$users = App\Models\User::with(['roles', 'teacher'])->get()->map(function($u) {
    return [
        'id' => $u->id,
        'username' => $u->username,
        'name' => $u->name,
        'roles' => $u->roles->pluck('name'),
        'teacher_id' => $u->teacher?->id,
        'teacher_name' => $u->teacher?->name,
    ];
});

echo json_encode([
    'years' => $years,
    'semesters' => $semesters,
    'classes' => $classes,
    'homerooms' => $homerooms,
    'courseAssignments' => $courseAssignments,
    'users' => $users,
], JSON_PRETTY_PRINT);
