<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$invalidHomerooms = \App\Models\HomeroomAssignment::whereDoesntHave('schoolClass')->get();
echo "Homerooms pointing to deleted/missing class: " . $invalidHomerooms->count() . "\n";
foreach ($invalidHomerooms as $h) {
    echo "  Homeroom ID {$h->id}, class_id: {$h->class_id}, teacher_id: {$h->teacher_id}\n";
}

$invalidCourses = \App\Models\CourseAssignment::whereDoesntHave('schoolClass')->get();
echo "CourseAssignments pointing to deleted/missing class: " . $invalidCourses->count() . "\n";
foreach ($invalidCourses as $c) {
    echo "  CourseAssignment ID {$c->id}, class_id: {$c->class_id}, teacher_id: {$c->teacher_id}\n";
}
