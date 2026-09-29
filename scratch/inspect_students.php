<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$students = \App\Models\Student::with('schoolClass')->get();
echo "Total students: " . $students->count() . "\n";
$byClass = $students->groupBy('class_id');
foreach ($byClass as $cid => $group) {
    $className = $group->first()->schoolClass?->name ?? "Unknown class $cid";
    echo "Class ID $cid ($className): " . $group->count() . " students\n";
}

$classes = \App\Models\SchoolClass::all();
echo "\nAll Classes:\n";
foreach ($classes as $c) {
    echo "ID: {$c->id}, Name: {$c->name}, Year ID: {$c->academic_year_id}, Status: {$c->status}\n";
}
