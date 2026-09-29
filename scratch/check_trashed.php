<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c10 = \App\Models\SchoolClass::withTrashed()->find(10);
if ($c10) {
    echo "Class 10 exists! Name: {$c10->name}, Deleted at: {$c10->deleted_at}\n";
} else {
    echo "Class 10 does NOT exist in DB at all!\n";
}

$allTrashed = \App\Models\SchoolClass::onlyTrashed()->get();
echo "Trashed classes count: " . $allTrashed->count() . "\n";
foreach ($allTrashed as $t) {
    echo "Trashed: {$t->id} - {$t->name}\n";
}
