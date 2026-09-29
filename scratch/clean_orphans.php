<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$delH = \App\Models\HomeroomAssignment::whereDoesntHave('schoolClass')->delete();
$delC = \App\Models\CourseAssignment::whereDoesntHave('schoolClass')->delete();
$delM = \App\Models\ClassMember::whereDoesntHave('schoolClass')->delete();

echo "Cleaned up: $delH orphaned homerooms, $delC orphaned course assignments, $delM orphaned class members.\n";
