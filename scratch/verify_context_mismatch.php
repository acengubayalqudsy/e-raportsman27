<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('username', 'dev_admin')->first();
$authSvc = app(\App\Services\AcademicAuthorizationService::class);

try {
    $authSvc->assertAcademicContext(1, 7);
    echo "Class 1 and Semester 7 match!\n";
} catch (\Exception $e) {
    echo "Class 1 and Semester 7 ERROR: " . $e->getMessage() . "\n";
}

try {
    $c = \App\Models\SchoolClass::find(1);
    echo "Class 1: {$c->name}, Year ID: {$c->academic_year_id}\n";
    $s = \App\Models\Semester::find(7);
    echo "Semester 7: {$s->name}, Year ID: {$s->academic_year_id}\n";
} catch (\Exception $e) {
    echo $e->getMessage();
}
