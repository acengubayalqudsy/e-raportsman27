<?php

namespace App\Console\Commands;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileTeacherIdentities extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'eraport:reconcile-teacher-identities
                            {--user-id= : Explicit target User ID to reconcile}
                            {--teacher-id= : Explicit target Teacher ID to link or restore}
                            {--restore : Explicitly restore a soft-deleted Teacher profile}
                            {--dry-run : Run in read-only inspection mode (default)}
                            {--force : Execute safe database updates within a transaction}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely detect, reconcile, and restore unlinked/soft-deleted User accounts with role "guru" to candidate Teacher profiles';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isForce = (bool) $this->option('force');
        $isDryRun = (bool) $this->option('dry-run') || !$isForce;
        $isRestore = (bool) $this->option('restore');
        $explicitUserId = $this->option('user-id');
        $explicitTeacherId = $this->option('teacher-id');

        $this->info('===========================================================');
        $this->info('  e-Raport SMAN 27 Garut — Teacher Identity Reconciliation ');
        $this->info('  Mode: ' . ($isDryRun ? 'DRY-RUN (READ-ONLY)' : 'FORCE (TRANSACTION WRITE)'));
        if ($isRestore) {
            $this->info('  Action: RESTORE SOFT-DELETED TEACHER PROFILE');
        }
        $this->info('===========================================================');

        // Handle explicit mapping or restore if either option is passed
        if ($explicitUserId !== null || $explicitTeacherId !== null || $isRestore) {
            return $this->handleExplicitMapping($explicitUserId, $explicitTeacherId, $isRestore, $isDryRun);
        }

        // 1. Identify users with role 'guru' who do NOT have a teacher profile linked
        $guruUsers = User::whereHas('roles', fn ($q) => $q->where('name', 'guru'))
            ->whereDoesntHave('teacher')
            ->get();

        if ($guruUsers->isEmpty()) {
            $this->info('Semua pengguna dengan role "guru" sudah terhubung ke profil Teacher yang valid.');
            return self::SUCCESS;
        }

        $this->warn(sprintf('Ditemukan %d akun pengguna dengan role "guru" tanpa tautan Teacher.', $guruUsers->count()));

        $results = [];
        $safeMatches = [];
        $ambiguousMatches = [];
        $conflictMatches = [];
        $noMatches = [];

        foreach ($guruUsers as $user) {
            $analysis = $this->evaluateUserCandidate($user);
            $results[] = $analysis;

            match ($analysis['status']) {
                'SAFE' => $safeMatches[] = $analysis,
                'AMBIGUOUS' => $ambiguousMatches[] = $analysis,
                'CONFLICT' => $conflictMatches[] = $analysis,
                'NO_MATCH' => $noMatches[] = $analysis,
            };
        }

        // Display results table
        $tableRows = array_map(function ($row) {
            return [
                'User ID' => $row['user_id'],
                'Username' => $row['username'],
                'User Email' => $row['user_email'],
                'Candidate Teacher ID' => $row['candidate_teacher_id'] ?? '-',
                'Candidate Teacher Name' => $row['candidate_teacher_name'] ?? '-',
                'Matching Method' => $row['match_reason'] ?? '-',
                'Current user_id' => $row['current_teacher_user_id'] ?? '-',
                'Status' => $row['status'],
            ];
        }, $results);

        $this->table(
            ['User ID', 'Username', 'User Email', 'Teacher ID', 'Teacher Name', 'Matching Method', 'Current FK', 'Status'],
            $tableRows
        );

        $this->newLine();
        $this->line(sprintf('Ringkasan: Total=%d | SAFE=%d | AMBIGUOUS=%d | CONFLICT=%d | NO_MATCH=%d',
            count($results),
            count($safeMatches),
            count($ambiguousMatches),
            count($conflictMatches),
            count($noMatches)
        ));

        if ($isDryRun) {
            $this->newLine();
            $this->info('DRY-RUN selesai. Tidak ada data yang diubah pada database.');
            if (count($safeMatches) > 0) {
                $this->comment(sprintf('Tersedia %d kandidat SAFE yang siap ditautkan jika dijalankan dengan flag --force.', count($safeMatches)));
            }
            return self::SUCCESS;
        }

        // 2. Perform write in transaction when --force is supplied
        if (empty($safeMatches)) {
            $this->warn('Tidak ada kandidat dengan status SAFE untuk diperbarui.');
            return self::SUCCESS;
        }

        $this->newLine();
        $this->warn('Menjalankan mutasi database dalam Database Transaction...');

        $updatedCount = DB::transaction(function () use ($safeMatches) {
            $count = 0;
            foreach ($safeMatches as $match) {
                // Re-verify state in transaction before updating
                $teacher = Teacher::lockForUpdate()->find($match['candidate_teacher_id']);
                $user = User::lockForUpdate()->find($match['user_id']);

                if (!$teacher || !$user) {
                    throw new \RuntimeException(sprintf('Concurrent state changed: User %d or Teacher %d not found.', $match['user_id'], $match['candidate_teacher_id']));
                }

                if ($teacher->user_id !== null) {
                    throw new \RuntimeException(sprintf('Concurrent conflict: Teacher %d already linked to User %d.', $teacher->id, $teacher->user_id));
                }

                if ($user->teacher !== null) {
                    throw new \RuntimeException(sprintf('Concurrent conflict: User %d already has a linked Teacher.', $user->id));
                }

                $teacher->user_id = $user->id;
                $teacher->save();
                $count++;
            }
            return $count;
        });

        $this->info(sprintf('BERHASIL: %d profil Teacher berhasil ditautkan ke akun pengguna yang bersesuaian.', $updatedCount));
        return self::SUCCESS;
    }

    /**
     * Handle strictly validated explicit manual mapping or restore.
     */
    protected function handleExplicitMapping(?string $userIdInput, ?string $teacherIdInput, bool $isRestore, bool $isDryRun): int
    {
        if ($userIdInput === null || $teacherIdInput === null) {
            $this->error('ERROR: Explicit mapping memerlukan kedua opsi --user-id dan --teacher-id.');
            return self::FAILURE;
        }

        $userId = (int) $userIdInput;
        $teacherId = (int) $teacherIdInput;

        $user = User::with(['roles', 'teacher'])->find($userId);
        if (!$user) {
            $this->error(sprintf('ERROR: User ID %d tidak ditemukan di database.', $userId));
            return self::FAILURE;
        }

        // Include trashed records if restore is requested
        $teacher = $isRestore ? Teacher::withTrashed()->find($teacherId) : Teacher::find($teacherId);
        if (!$teacher) {
            $this->error(sprintf('ERROR: Teacher ID %d tidak ditemukan di database%s.', $teacherId, $isRestore ? ' (bahkan pada riwayat terhapus)' : ''));
            return self::FAILURE;
        }

        // Invariant 1: User must have 'guru' role
        if (!$user->hasRole('guru')) {
            $this->error(sprintf('ERROR: User ID %d ("%s") tidak memiliki role "guru".', $user->id, $user->username));
            return self::FAILURE;
        }

        // Invariant 2: Teacher status must be active
        if ($teacher->status !== 'Aktif') {
            $this->error(sprintf('ERROR: Teacher ID %d ("%s") berstatus "%s" (harus "Aktif").', $teacher->id, $teacher->name, $teacher->status));
            return self::FAILURE;
        }

        // Invariant 3: Check duplicate active canonical NIP/NUPTK if restoring
        if ($isRestore && $teacher->trashed()) {
            if (!empty($teacher->nip)) {
                $dupNip = Teacher::where('nip', $teacher->nip)->where('id', '!=', $teacher->id)->first();
                if ($dupNip) {
                    $this->error(sprintf('ERROR: Terdeteksi profil Teacher ID %d aktif lain dengan NIP identik (%s).', $dupNip->id, $teacher->nip));
                    return self::FAILURE;
                }
            }
            if (!empty($teacher->nuptk)) {
                $dupNuptk = Teacher::where('nuptk', $teacher->nuptk)->where('id', '!=', $teacher->id)->first();
                if ($dupNuptk) {
                    $this->error(sprintf('ERROR: Terdeteksi profil Teacher ID %d aktif lain dengan NUPTK identik (%s).', $dupNuptk->id, $teacher->nuptk));
                    return self::FAILURE;
                }
            }
        }

        // Idempotency check: Already active and linked correctly
        if (!$teacher->trashed() && (int) $teacher->user_id === $user->id && $user->teacher?->id === $teacher->id) {
            $this->info(sprintf('IDEMPOTENT: User ID %d sudah tertaut dengan benar ke Teacher ID %d.', $user->id, $teacher->id));
            return self::SUCCESS;
        }

        // Invariant 4: User already linked to another active teacher
        if ($user->teacher !== null && (int) $user->teacher->id !== $teacher->id) {
            $this->error(sprintf('ERROR: User ID %d sudah memiliki profil Teacher ID %d ("%s") yang aktif.', $user->id, $user->teacher->id, $user->teacher->name));
            return self::FAILURE;
        }

        // Invariant 5: If not restoring, teacher cannot be linked to another user
        if (!$isRestore && $teacher->user_id !== null && (int) $teacher->user_id !== $user->id) {
            $this->error(sprintf('ERROR: Teacher ID %d sudah tertaut ke User ID %d lain.', $teacher->id, $teacher->user_id));
            return self::FAILURE;
        }

        // Invariant 6: For restore mode, teacher.user_id must match target user_id
        if ($isRestore && (int) $teacher->user_id !== $user->id) {
            $this->error(sprintf('ERROR: Teacher ID %d memiliki user_id = %s (harus %d untuk restore).', $teacher->id, $teacher->user_id ?? 'NULL', $user->id));
            return self::FAILURE;
        }

        // Invariant 7: No other ACTIVE teacher linked to target user
        $existingLinkedTeacher = Teacher::where('user_id', $user->id)->where('id', '!=', $teacher->id)->first();
        if ($existingLinkedTeacher) {
            $this->error(sprintf('ERROR: Ditemukan Teacher ID %d lain yang aktif dengan user_id = %d.', $existingLinkedTeacher->id, $user->id));
            return self::FAILURE;
        }

        $actionLabel = $isRestore ? 'RESTORE_ONLY' : 'SAFE_EXPLICIT';

        $this->table(
            ['User ID', 'Username', 'Teacher ID', 'Teacher Name', 'Teacher NIP', 'Subject', 'Current user_id', 'Current deleted_at', 'Proposed deleted_at', 'Action'],
            [[
                'User ID' => $user->id,
                'Username' => $user->username,
                'Teacher ID' => $teacher->id,
                'Teacher Name' => $teacher->name,
                'Teacher NIP' => $teacher->nip ?: '-',
                'Subject' => $teacher->subject ?: '-',
                'Current user_id' => $teacher->user_id ?? 'NULL',
                'Current deleted_at' => $teacher->deleted_at ? $teacher->deleted_at->format('Y-m-d H:i:s') : 'NULL',
                'Proposed deleted_at' => 'NULL',
                'Action' => $actionLabel,
            ]]
        );

        $this->newLine();
        $this->line(sprintf('Teacher ID: %d', $teacher->id));
        $this->line(sprintf('User ID: %d', $user->id));
        $this->newLine();
        $this->line('Current:');
        $this->line(sprintf('user_id = %s', $teacher->user_id ?? 'NULL'));
        $this->line(sprintf('deleted_at = %s', $teacher->deleted_at ? $teacher->deleted_at->format('Y-m-d H:i:s') : 'NULL'));
        $this->newLine();
        $this->line('Proposed:');
        $this->line(sprintf('user_id = %d', $user->id));
        $this->line('deleted_at = NULL');
        $this->newLine();
        $this->line(sprintf('Action: %s', $actionLabel));
        $this->newLine();
        $this->line('Rows to change:');
        $this->line('1');
        $this->newLine();
        $this->line('Database Changed:');
        $this->line($isDryRun ? 'NO' : 'YES');

        if ($isDryRun) {
            $this->newLine();
            $this->info('DRY-RUN selesai. Tidak ada data yang diubah pada database.');
            $this->comment('Untuk mengeksekusi aksi ini, jalankan kembali dengan menambahkan flag --force.');
            return self::SUCCESS;
        }

        $this->newLine();
        $this->warn(sprintf('Menjalankan mutasi %s dalam Database Transaction...', $actionLabel));

        $affectedRows = DB::transaction(function () use ($userId, $teacherId, $isRestore) {
            // Lock rows for update
            $lockedUser = User::lockForUpdate()->find($userId);
            $lockedTeacher = Teacher::withTrashed()->lockForUpdate()->find($teacherId);

            if (!$lockedUser || !$lockedTeacher) {
                throw new \RuntimeException('Concurrent state changed: User or Teacher was deleted during transaction.');
            }

            if ($isRestore) {
                if (!$lockedTeacher->trashed()) {
                    return 0; // Already restored
                }
                if ((int) $lockedTeacher->user_id !== $lockedUser->id) {
                    throw new \RuntimeException(sprintf('Concurrent conflict: Teacher %d user_id changed to %s.', $lockedTeacher->id, $lockedTeacher->user_id ?? 'NULL'));
                }
                $lockedTeacher->restore();
            } else {
                if ($lockedTeacher->user_id !== null && (int) $lockedTeacher->user_id !== $lockedUser->id) {
                    throw new \RuntimeException(sprintf('Concurrent conflict: Teacher %d claimed by User %d.', $lockedTeacher->id, $lockedTeacher->user_id));
                }
                if ($lockedUser->teacher !== null && (int) $lockedUser->teacher->id !== $lockedTeacher->id) {
                    throw new \RuntimeException(sprintf('Concurrent conflict: User %d already has Teacher %d.', $lockedUser->id, $lockedUser->teacher->id));
                }
                $lockedTeacher->user_id = $lockedUser->id;
                $lockedTeacher->save();
            }

            return 1;
        });

        // Read-back verification
        $refreshedTeacher = Teacher::find($teacherId);
        $refreshedUser = User::with('teacher')->find($userId);

        if (!$refreshedTeacher || $refreshedTeacher->trashed()) {
            throw new \RuntimeException('Post-write read-back verification failed: Teacher record is still soft-deleted or missing.');
        }

        if ((int) $refreshedTeacher->user_id !== $userId || (int) $refreshedUser?->teacher?->id !== $teacherId) {
            throw new \RuntimeException('Post-write read-back verification failed: Canonical linkage did not match expected IDs.');
        }

        $this->info(sprintf('BERHASIL: Exactly %d baris diperbarui. Teacher ID %d kini secara canonical tertaut ke User ID %d.', $affectedRows, $teacherId, $userId));
        return self::SUCCESS;
    }

    /**
     * Deterministically analyze candidate Teacher for a given unlinked user.
     *
     * @return array{
     *     user_id: int,
     *     username: string,
     *     user_email: string,
     *     candidate_teacher_id: ?int,
     *     candidate_teacher_name: ?string,
     *     match_reason: ?string,
     *     current_teacher_user_id: ?int,
     *     status: 'SAFE'|'AMBIGUOUS'|'CONFLICT'|'NO_MATCH'
     * }
     */
    public function evaluateUserCandidate(User $user): array
    {
        $base = [
            'user_id' => $user->id,
            'username' => $user->username,
            'user_email' => $user->email,
            'candidate_teacher_id' => null,
            'candidate_teacher_name' => null,
            'match_reason' => null,
            'current_teacher_user_id' => null,
            'status' => 'NO_MATCH',
        ];

        // 1. Attempt normalized exact email match
        if (!empty($user->email)) {
            $emailMatches = Teacher::whereRaw('LOWER(TRIM(email)) = ?', [strtolower(trim($user->email))])->get();

            if ($emailMatches->count() === 1) {
                $candidate = $emailMatches->first();
                $base['candidate_teacher_id'] = $candidate->id;
                $base['candidate_teacher_name'] = $candidate->name;
                $base['current_teacher_user_id'] = $candidate->user_id;
                $base['match_reason'] = 'EXACT_EMAIL';

                if ($candidate->user_id !== null) {
                    $base['status'] = 'CONFLICT'; // Already claimed by another user
                } else {
                    $base['status'] = 'SAFE';
                }
                return $base;
            }

            if ($emailMatches->count() > 1) {
                $base['match_reason'] = 'MULTIPLE_EMAIL_MATCHES';
                $base['status'] = 'AMBIGUOUS';
                return $base;
            }
        }

        // 2. Attempt exact NIP match against username
        if (!empty($user->username)) {
            $nipMatches = Teacher::where('nip', trim($user->username))->get();

            if ($nipMatches->count() === 1) {
                $candidate = $nipMatches->first();
                $base['candidate_teacher_id'] = $candidate->id;
                $base['candidate_teacher_name'] = $candidate->name;
                $base['current_teacher_user_id'] = $candidate->user_id;
                $base['match_reason'] = 'EXACT_NIP';

                if ($candidate->user_id !== null) {
                    $base['status'] = 'CONFLICT';
                } else {
                    $base['status'] = 'SAFE';
                }
                return $base;
            }

            if ($nipMatches->count() > 1) {
                $base['match_reason'] = 'MULTIPLE_NIP_MATCHES';
                $base['status'] = 'AMBIGUOUS';
                return $base;
            }
        }

        // 3. Known development account deterministic mapping fallback
        if ($user->username === 'dev_guru_mata_pelajaran' || str_contains($user->email, 'dev_guru')) {
            $unlinkedActiveTeachers = Teacher::whereNull('user_id')
                ->where('status', 'Aktif')
                ->get();

            if ($unlinkedActiveTeachers->count() === 1) {
                $candidate = $unlinkedActiveTeachers->first();
                $base['candidate_teacher_id'] = $candidate->id;
                $base['candidate_teacher_name'] = $candidate->name;
                $base['current_teacher_user_id'] = $candidate->user_id;
                $base['match_reason'] = 'SINGLE_UNLINKED_ACTIVE_TEACHER';
                $base['status'] = 'SAFE';
                return $base;
            }

            if ($unlinkedActiveTeachers->count() > 1) {
                $base['match_reason'] = sprintf('AMBIGUOUS: %d unlinked active teachers in database', $unlinkedActiveTeachers->count());
                $base['status'] = 'AMBIGUOUS';
                return $base;
            }

            $base['match_reason'] = 'MANUAL_MAPPING_REQUIRED: No unlinked active teacher found';
            $base['status'] = 'NO_MATCH';
            return $base;
        }

        $base['status'] = 'NO_MATCH';
        return $base;
    }
}
