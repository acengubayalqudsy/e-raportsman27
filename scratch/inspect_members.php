<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$members = \App\Models\ClassMember::with('schoolClass')->get();
echo "Total class members: " . $members->count() . "\n";
$byClass = $members->groupBy('class_id');
foreach ($byClass as $cid => $group) {
    $className = $group->first()->schoolClass?->name ?? "Unknown class $cid";
    echo "Class ID $cid ($className): " . $group->count() . " students\n";
}
