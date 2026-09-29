<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$svc = app(\App\Services\AssessmentService::class);
$users = \App\Models\User::all();

foreach ($users as $u) {
    echo "User: {$u->username} ({$u->id}) Roles: " . $u->roles->pluck('name')->join(', ') . "\n";
    $ctx = $svc->getUserContext($u);
    echo "  Homeroom: " . json_encode($ctx['homeroom_class']) . "\n";
    echo "  Courses count: " . count($ctx['assigned_courses']) . "\n";
    echo "  Active Year: " . json_encode($ctx['active_academic_year']) . "\n";
    echo "  Active Semester: " . json_encode($ctx['active_semester']) . "\n";
}
