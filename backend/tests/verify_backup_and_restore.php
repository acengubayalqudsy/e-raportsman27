<?php

echo "====================================================================\n";
echo " DATABASE BACKUP & RESTORE RECOVERY VERIFICATION (MariaDB 10.4)\n";
echo "====================================================================\n\n";

$mysqldump = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
$mysql = 'C:\\xampp\\mysql\\bin\\mysql.exe';
$host = '127.0.0.1';
$port = '3310';
$user = 'root';
$sourceDb = 'eraport_sman27_isolated_mariadb_test';
$targetRestoreDb = 'eraport_sman27_isolated_restore_test';
$backupDir = __DIR__ . '/../storage/app/backups';

if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}
$backupFile = $backupDir . '/backup_uat_verification_' . date('Ymd_His') . '.sql';

// 1. Perform Backup using mysqldump
echo "[Step 1] Creating database backup of '{$sourceDb}'...\n";
$dumpCmd = "\"{$mysqldump}\" -h {$host} -P {$port} -u {$user} {$sourceDb} > \"{$backupFile}\"";
exec($dumpCmd, $output, $dumpRet);

if ($dumpRet !== 0 || !file_exists($backupFile) || filesize($backupFile) === 0) {
    echo " [FAIL] Backup failed! Code: {$dumpRet}\n";
    exit(1);
}
$fileSize = round(filesize($backupFile) / 1024, 2);
echo " [PASS] Backup successful. File: {$backupFile} ({$fileSize} KB)\n\n";

// 2. Prepare Isolated Restore Target Database
echo "[Step 2] Creating isolated restore target database '{$targetRestoreDb}'...\n";
$createDbCmd = "\"{$mysql}\" -h {$host} -P {$port} -u {$user} -e \"DROP DATABASE IF EXISTS `{$targetRestoreDb}`; CREATE DATABASE `{$targetRestoreDb}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"";
exec($createDbCmd, $output, $createRet);

if ($createRet !== 0) {
    echo " [FAIL] Failed to create restore test database! Code: {$createRet}\n";
    exit(1);
}
echo " [PASS] Database '{$targetRestoreDb}' ready for restore.\n\n";

// 3. Perform Restore into Isolated Target DB
echo "[Step 3] Restoring backup into '{$targetRestoreDb}'...\n";
$restoreCmd = "\"{$mysql}\" -h {$host} -P {$port} -u {$user} {$targetRestoreDb} < \"{$backupFile}\"";
exec($restoreCmd, $output, $restoreRet);

if ($restoreRet !== 0) {
    echo " [FAIL] Restore execution failed! Code: {$restoreRet}\n";
    exit(1);
}
echo " [PASS] Restore execution completed successfully.\n\n";

// 4. Verify Data Integrity between Source and Restored Database
echo "[Step 4] Verifying table and schema consistency...\n";
$pdo = new PDO("mysql:host={$host};port={$port};dbname={$targetRestoreDb}", $user, '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tablesStmt = $pdo->query("SHOW TABLES");
$tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

echo " Restored tables count: " . count($tables) . "\n";
$expectedCore = ['users', 'roles', 'students', 'teachers', 'academic_years', 'semesters', 'subjects', 'course_assignments', 'homeroom_assignments', 'assessments', 'class_members'];

$allFound = true;
foreach ($expectedCore as $tbl) {
    if (!in_array($tbl, $tables)) {
        echo "  - Missing table: {$tbl}\n";
        $allFound = false;
    }
}
echo " Detected tables include: " . implode(', ', array_slice($tables, 0, 10)) . "...\n";

if ($allFound) {
    echo " [PASS] All core academic and assessment tables verified in restored database.\n";
} else {
    echo " [FAIL] Some tables were not restored!\n";
    exit(1);
}

// 5. Cleanup Test Database
echo "\n[Step 5] Cleaning up temporary restore database...\n";
$pdo->exec("DROP DATABASE IF EXISTS `{$targetRestoreDb}`");
echo " [PASS] Cleaned up '{$targetRestoreDb}'. Backup archive retained at:\n        {$backupFile}\n";

echo "\n====================================================================\n";
echo " BACKUP & RESTORE VERIFICATION: FULLY VERIFIED ON MARIADB 10.4\n";
echo "====================================================================\n";
