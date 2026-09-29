<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t18 = \App\Models\Teacher::find(18);
echo "Teacher 18: {$t18->name}, user_id: {$t18->user_id}\n";

// Assign Teacher 18 to Class 1 (X Merdeka 1) for Semester 3 (Year 2)
$h1 = \App\Models\HomeroomAssignment::firstOrCreate([
    'class_id' => 1,
    'teacher_id' => 18,
    'semester_id' => 3,
], [
    'academic_year_id' => 2,
    'status' => 'Aktif',
]);
echo "Homeroom for Class 1: ID {$h1->id}\n";

// Assign Teacher 18 to Class 21 (Indonesia Suram) for Semester 7 (Year 6)
$h21 = \App\Models\HomeroomAssignment::firstOrCreate([
    'class_id' => 21,
    'teacher_id' => 18,
    'semester_id' => 7,
], [
    'academic_year_id' => 6,
    'status' => 'Aktif',
]);
echo "Homeroom for Class 21: ID {$h21->id}\n";

// Also assign course assignment for teacher 18 in Class 1 so grades can be viewed/tested
$ca1 = \App\Models\CourseAssignment::firstOrCreate([
    'class_id' => 1,
    'teacher_id' => 18,
    'subject_id' => 1, // e.g. Matematika / PAI
    'semester_id' => 3,
], [
    'academic_year_id' => 2,
    'status' => 'Aktif',
]);
echo "CourseAssignment for Class 1: ID {$ca1->id}\n";

echo "Done!\n";
