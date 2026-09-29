<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$hList = \App\Models\HomeroomAssignment::with(['schoolClass', 'teacher', 'semester'])->get();
foreach ($hList as $h) {
    echo "Homeroom #{$h->id}: Class='{$h->schoolClass?->name}' (id: {$h->class_id}), Teacher='{$h->teacher?->name}' (id: {$h->teacher_id}), Semester='{$h->semester?->name}' (id: {$h->semester_id}), Status='{$h->status}'\n";
}
