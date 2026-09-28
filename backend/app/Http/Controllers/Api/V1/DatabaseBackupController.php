<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;

class DatabaseBackupController extends Controller
{
    private function configuration(): array
    {
        abort_unless(config('database.default') === 'mysql', 422, 'Backup memerlukan database MySQL/MariaDB.');
        $config = config('database.connections.mysql');
        abort_if(empty($config['database']), 422, 'Nama database belum dikonfigurasi.');
        return $config;
    }

    private function credentialsFile(array $config): string
    {
        $path = tempnam(sys_get_temp_dir(), 'eraport_db_');
        file_put_contents($path, "[client]\n" . implode("\n", [
            'host=' . ($config['host'] ?? '127.0.0.1'),
            'port=' . ($config['port'] ?? 3306),
            'user=' . ($config['username'] ?? ''),
            'password=' . ($config['password'] ?? ''),
        ]) . "\n");
        @chmod($path, 0600);
        return $path;
    }

    private function directory(): string
    {
        $directory = storage_path('app/private/database-backups');
        if (!is_dir($directory)) mkdir($directory, 0700, true);
        return $directory;
    }

    private function createDump(Request $request): array
    {
        $config = $this->configuration();
        $credentials = $this->credentialsFile($config);
        $fileName = 'backup_' . now()->format('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.sql';
        $path = $this->directory() . DIRECTORY_SEPARATOR . $fileName;
        $stream = fopen($path, 'wb');
        try {
            $process = new Process([
                config('backup.dump_binary'), '--defaults-extra-file=' . $credentials,
                '--single-transaction', '--quick', '--routines', '--triggers',
                '--default-character-set=utf8mb4', '--no-tablespaces', $config['database'],
            ]);
            $process->setTimeout(300);
            $process->run(function ($type, $buffer) use ($stream) {
                if ($type === Process::OUT) fwrite($stream, $buffer);
            });
            fflush($stream);
            if (!$process->isSuccessful() || filesize($path) === 0) {
                throw new \RuntimeException('Gagal membuat backup database: ' . trim($process->getErrorOutput()));
            }
            $id = DB::table('database_backups')->insertGetId([
                'file_name' => $fileName, 'size' => filesize($path),
                'created_by' => $request->user()->id, 'created_at' => now(),
            ]);
            AuditLog::create(['user_id' => $request->user()->id, 'action' => 'backup.create',
                'description' => "Backup database #{$id} dibuat.", 'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()]);
            return DB::table('database_backups')->where('id', $id)->first();
        } catch (\Throwable $error) {
            @unlink($path);
            throw $error;
        } finally {
            fclose($stream);
            @unlink($credentials);
        }
    }

    private function serialize(object $backup): array
    {
        return [
            'id' => $backup->id,
            'createdAt' => \Carbon\Carbon::parse($backup->created_at)->timezone('Asia/Jakarta')->format('d/m/Y H:i'),
            'createdAtIso' => $backup->created_at,
            'createdBy' => $backup->creator_name ?? 'Administrator',
            'size' => number_format($backup->size / 1024, 1, ',', '.') . ' KB',
            'status' => 'Berhasil', 'type' => 'Database MySQL/MariaDB',
        ];
    }

    public function index(): JsonResponse
    {
        $backups = DB::table('database_backups')->leftJoin('users', 'users.id', '=', 'database_backups.created_by')
            ->select('database_backups.*', 'users.name as creator_name')->orderByDesc('database_backups.id')->get();
        return response()->json(['data' => $backups->map(fn ($backup) => $this->serialize($backup))]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            return response()->json(['data' => $this->serialize($this->createDump($request))], 201);
        } catch (\Throwable $error) {
            report($error);
            return response()->json(['message' => 'Backup gagal. Periksa konfigurasi mysqldump dan izin penyimpanan server.'], 500);
        }
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $request->validate(['confirmation' => 'required|in:RESTORE']);
        $backup = DB::table('database_backups')->where('id', $id)->first();
        abort_unless($backup, 404);
        $path = $this->directory() . DIRECTORY_SEPARATOR . basename($backup->file_name);
        abort_unless(is_file($path), 404, 'File backup tidak ditemukan.');
        $config = $this->configuration();
        try {
            // Preserve the current database before replacing it.
            $this->createDump($request);
            $credentials = $this->credentialsFile($config);
            try {
                $process = new Process([config('backup.mysql_binary'), '--defaults-extra-file=' . $credentials,
                    '--default-character-set=utf8mb4', $config['database']]);
                $process->setInput(fopen($path, 'rb'));
                $process->setTimeout(300);
                $process->run();
                if (!$process->isSuccessful()) throw new \RuntimeException(trim($process->getErrorOutput()));
            } finally {
                @unlink($credentials);
            }
            AuditLog::create(['user_id' => $request->user()->id, 'action' => 'backup.restore',
                'description' => "Database dipulihkan dari backup #{$id}.", 'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()]);
            return response()->json(['message' => 'Database berhasil dipulihkan. Silakan muat ulang aplikasi.']);
        } catch (\Throwable $error) {
            report($error);
            return response()->json(['message' => 'Restore gagal. Database mungkin berubah sebagian; pulihkan dari backup otomatis yang baru dibuat.'], 500);
        }
    }
}
