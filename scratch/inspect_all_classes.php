<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$classes = \App\Models\SchoolClass::all();
foreach ($classes as $c) {
    $studentCount = \App\Models\ClassMember::where('class_id', $c->id)->count();
    $directCount = \App\Models\Student::where('accepted_class', $c->name)->orWhere('current_class_name', $c->name)->count();
    $homeroom = \App\Models\HomeroomAssignment::where('class_id', $c->id)->with('teacher')->first();
    $htName = $homeroom?->teacher?->name ?? 'Belum ada wali kelas';
    echo "Class {$c->id}: '{$c->name}', Year ID: {$c->academic_year_id}, Members: {$studentCount}, Direct: {$directCount}, Wali: {$htName}\n";
}
