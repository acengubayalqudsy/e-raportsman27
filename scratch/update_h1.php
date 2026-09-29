<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$h1 = \App\Models\HomeroomAssignment::where('class_id', 1)->first();
if ($h1) {
    $h1->teacher_id = 18;
    $h1->save();
    echo "Homeroom 1 teacher updated to 18!\n";
}

$h21 = \App\Models\HomeroomAssignment::where('class_id', 21)->first();
if ($h21) {
    $h21->teacher_id = 18;
    $h21->save();
    echo "Homeroom 21 (Indonesia Suram) teacher updated to 18!\n";
}
