<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (App\Models\Teacher::all() as $t) {
    echo "Teacher ID: {$t->id}, Name: {$t->name}, User ID: {$t->user_id}\n";
}
