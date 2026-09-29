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
                            {--dry-run : Run in read-only inspection mode (default)}
                            {--force : Execute safe database updates within a transaction}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely detect and reconcile unlinked User accounts with role "guru" to candidate Teacher profiles';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isForce = (bool) $this->option('force');
        $isDryRun = (bool) $this->option('dry-run') || !$isForce;

        $this->info('===========================================================');
        $this->info('  e-Raport SMAN 27 Garut — Teacher Identity Reconciliation ');
        $this->info('  Mode: ' . ($isDryRun ? 'DRY-RUN (READ-ONLY)' : 'FORCE (TRANSACTION WRITE)'));
        $this->info('===========================================================');

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
