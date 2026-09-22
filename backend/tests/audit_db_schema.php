<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== READ-ONLY DATABASE AUDIT ===\n";
echo "Database Connection: " . DB::connection()->getName() . "\n";
echo "Database Name: " . DB::connection()->getDatabaseName() . "\n\n";

$tables = [
    'students',
    'teachers',
    'classes',
    'class_members',
    'rooms',
    'subjects',
    'academic_years',
    'semesters',
    'religions',
    'extracurriculars',
    'student_extracurriculars',
    'users',
    'roles',
    'user_roles',
];

$databaseName = DB::connection()->getDatabaseName();

foreach ($tables as $table) {
    echo "--------------------------------------------------\n";
    if (!Schema::hasTable($table)) {
        echo "TABLE: {$table} -> [NOT FOUND]\n";
        continue;
    }

    $count = DB::table($table)->count();
    echo "TABLE: {$table} (Rows: {$count})\n";

    // Get Columns
    $columns = DB::select("
        SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    ", [$databaseName, $table]);

    echo "  COLUMNS:\n";
    foreach ($columns as $col) {
        $pk = ($col->COLUMN_KEY === 'PRI') ? ' [PK]' : '';
        $uni = ($col->COLUMN_KEY === 'UNI') ? ' [UNI]' : '';
        $nul = ($col->IS_NULLABLE === 'YES') ? 'NULL' : 'NOT NULL';
        $def = ($col->COLUMN_DEFAULT !== null) ? " DEFAULT '{$col->COLUMN_DEFAULT}'" : '';
        echo "    - {$col->COLUMN_NAME}: {$col->COLUMN_TYPE} {$nul}{$pk}{$uni}{$def}\n";
    }

    // Get Foreign Keys
    $fks = DB::select("
        SELECT 
            CONSTRAINT_NAME,
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = ? 
          AND REFERENCED_TABLE_NAME IS NOT NULL
    ", [$databaseName, $table]);

    if (!empty($fks)) {
        echo "  FOREIGN KEYS:\n";
        foreach ($fks as $fk) {
            echo "    - {$fk->COLUMN_NAME} -> {$fk->REFERENCED_TABLE_NAME}.{$fk->REFERENCED_COLUMN_NAME} ({$fk->CONSTRAINT_NAME})\n";
        }
    } else {
        echo "  FOREIGN KEYS: [None]\n";
    }

    // Check soft deletes
    $hasSoftDeletes = Schema::hasColumn($table, 'deleted_at');
    echo "  SOFT DELETES: " . ($hasSoftDeletes ? 'YES (deleted_at)' : 'NO') . "\n";
}
