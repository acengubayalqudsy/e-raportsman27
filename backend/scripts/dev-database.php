<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Connection;
use Illuminate\Foundation\Bootstrap\LoadConfiguration;

// Keep this CLI protocol machine-readable, including when bootstrap emits a warning.
$initialBufferLevel = ob_get_level();
ob_start();
ini_set('display_errors', '0');

function finish(array $result, int $exitCode): never
{
    global $initialBufferLevel;

    while (ob_get_level() > $initialBufferLevel) {
        ob_end_clean();
    }

    echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE).PHP_EOL;
    exit($exitCode);
}

/** Only return the connection fields needed by the launcher; never credentials or URLs. */
function connectionInfo(string $name, Connection $connection): array
{
    $port = $connection->getConfig('port');

    return [
        'connection' => $name,
        'driver' => $connection->getDriverName(),
        'host' => $connection->getConfig('host'),
        'port' => is_numeric($port) ? (int) $port : null,
        'database' => $connection->getDatabaseName(),
    ];
}

function backendUrl(mixed $url): ?string
{
    $parts = is_string($url) ? parse_url($url) : false;

    if (! is_array($parts) || ! isset($parts['host']) || ! in_array($parts['scheme'] ?? '', ['http', 'https'], true)) {
        return null;
    }

    // APP_URL is normally an origin. Do not expose URL credentials, queries or fragments.
    return $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '').($parts['path'] ?? '');
}

/** Classify internally; PDO and Laravel exception messages can contain secrets. */
function failureInfo(Throwable $exception, string $stage): array
{
    $vendorCodes = [];
    $sqlStates = [];
    $refused = false;
    $missingDriver = false;

    for ($current = $exception; $current !== null; $current = $current->getPrevious()) {
        if ($current instanceof PDOException && is_array($current->errorInfo)) {
            $sqlStates[] = (string) ($current->errorInfo[0] ?? '');
            $vendorCodes[] = (int) ($current->errorInfo[1] ?? 0);
        }

        $message = strtolower($current->getMessage());
        $refused = $refused || str_contains($message, 'connection refused') || str_contains($message, 'actively refused') || str_contains($message, '10061');
        $missingDriver = $missingDriver || str_contains($message, 'could not find driver');
    }

    if ($missingDriver) {
        return ['code' => 'driver_missing', 'message' => 'Driver PDO database belum tersedia. Aktifkan ekstensi PHP yang sesuai pada php.ini untuk PHP yang digunakan.'];
    }

    if (array_intersect($vendorCodes, [1044, 1045, 1142, 1698]) || array_intersect($sqlStates, ['28000', '28P01'])) {
        return ['code' => 'auth_error', 'message' => 'Akses database ditolak. Periksa akun, kata sandi, dan hak akses database pada backend/.env.'];
    }

    if (in_array(1049, $vendorCodes, true) || in_array('3D000', $sqlStates, true)) {
        return ['code' => 'database_missing', 'message' => 'Database yang dikonfigurasi belum tersedia. Periksa DB_DATABASE atau pulihkan database yang benar; launcher tidak membuat atau mengganti database.'];
    }

    if ($refused && (array_intersect($vendorCodes, [2002, 2003, 10061]) || in_array('08006', $sqlStates, true))) {
        return ['code' => 'connection_refused', 'message' => 'Server database menolak koneksi. Jalankan MariaDB/MySQL pada host dan port yang dikonfigurasi lalu coba lagi.'];
    }

    if ($stage === 'sessions' && (in_array(1146, $vendorCodes, true) || array_intersect($sqlStates, ['42S02', '42P01']))) {
        return ['code' => 'session_table_missing', 'message' => 'Tabel sesi belum tersedia. Periksa SESSION_CONNECTION dan SESSION_TABLE, lalu tinjau migrasi database sebelum menjalankannya.'];
    }

    if ($stage === 'sessions' && (in_array(1054, $vendorCodes, true) || array_intersect($sqlStates, ['42S22', '42703']))) {
        return ['code' => 'session_schema_error', 'message' => 'Struktur tabel sesi belum sesuai. Tinjau migrasi tabel sesi pada database yang dikonfigurasi.'];
    }

    return in_array($stage, ['bootstrap', 'configuration'], true)
        ? ['code' => 'configuration_error', 'message' => 'Konfigurasi Laravel tidak dapat dimuat. Periksa dependensi Composer dan konfigurasi backend/.env.']
        : ['code' => 'connection_error', 'message' => 'Pemeriksaan database gagal. Periksa host, port, nama database, dan tabel sesi pada konfigurasi Laravel.'];
}

$command = $argv[1] ?? '';
if (PHP_SAPI !== 'cli' || ! in_array($command, ['info', 'check'], true)) {
    finish(['ok' => false, 'code' => 'invalid_command', 'message' => 'Gunakan php backend/scripts/dev-database.php info atau check.'], 1);
}

$info = [];
$failedConnection = null;
$stage = 'bootstrap';
$outsideLocal = false;

try {
    require dirname(__DIR__).'/vendor/autoload.php';
    $app = require dirname(__DIR__).'/bootstrap/app.php';

    // Stop before providers boot or any connection is resolved outside local development.
    $app->afterBootstrapping(LoadConfiguration::class, function ($app) use (&$outsideLocal, &$info): void {
        $info['environment'] = $app->environment();
        if (! $app->environment('local')) {
            $outsideLocal = true;
            throw new RuntimeException('Local development only.');
        }
    });
    $app->make(Kernel::class)->bootstrap();

    $stage = 'configuration';
    $name = $app['db']->getDefaultConnection();
    // Laravel resolves DB_URL here, but creates PDO lazily: info never connects.
    $connection = $app['db']->connection($name);
    $info += connectionInfo($name, $connection);
    $info += [
        'backendUrl' => backendUrl($app['config']->get('app.url')),
        'sessionDriver' => $app['config']->get('session.driver'),
        'sessionTable' => $app['config']->get('session.table'),
        'sessionConnection' => $app['config']->get('session.connection') ?: $name,
    ];

    if ($command === 'check') {
        $failedConnection = connectionInfo($name, $connection);
        $stage = 'database';
        $connection->select('SELECT 1', [], false);

        if ($info['sessionDriver'] === 'database') {
            $stage = 'configuration';
            $sessionConnection = $app['db']->connection($info['sessionConnection']);
            $failedConnection = connectionInfo($info['sessionConnection'], $sessionConnection);
            $stage = 'sessions';
            // Verify the actual session connection/table/columns without reading session data.
            $sessionConnection->table($info['sessionTable'])
                ->whereRaw('1 = 0')
                ->get(['id', 'payload', 'last_activity']);
        }
    }

    finish(['ok' => true] + $info, 0);
} catch (Throwable $exception) {
    $failure = $outsideLocal
        ? ['code' => 'environment_not_local', 'message' => 'Launcher pengembangan hanya boleh digunakan dengan APP_ENV=local.']
        : failureInfo($exception, $stage);

    finish(['ok' => false] + $info + $failure + ($failedConnection ? ['failedConnection' => $failedConnection] : []), 1);
}
