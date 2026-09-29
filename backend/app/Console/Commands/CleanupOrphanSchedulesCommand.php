<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\Schedule;
use App\Models\SchoolClass;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupOrphanSchedulesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'eraport:cleanup-orphan-schedules
                            {--class-id= : Optional filter to only target schedules belonging to this specific soft-deleted Class ID}
                            {--expected-ids= : Optional comma-separated list of expected schedule IDs as a safety gate (e.g. 2,4,5,6)}
                            {--dry-run : Run in read-only inspection mode (default)}
                            {--force : Execute safe database updates within a transaction}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely detect and soft-delete active schedules whose parent school classes are soft-deleted';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isForce = (bool) $this->option('force');
        $isDryRun = (bool) $this->option('dry-run') || !$isForce;
        $classIdFilter = $this->option('class-id');
        $expectedIdsOpt = $this->option('expected-ids');

        $this->info('===========================================================');
        $this->info('  e-Raport SMAN 27 Garut — Orphan Schedule Cleanup ');
        $this->info('  Mode: ' . ($isDryRun ? 'DRY-RUN (READ-ONLY)' : 'FORCE (TRANSACTION WRITE)'));
        if ($classIdFilter) {
            $this->info("  Filter: Parent Class ID = {$classIdFilter}");
        }
        if ($expectedIdsOpt) {
            $this->info("  Safety Gate: Expected Schedule IDs = {$expectedIdsOpt}");
        }
        $this->info('===========================================================');

        // Query active schedules whose parent schoolClass is soft-deleted
        $query = Schedule::whereNull('deleted_at')
            ->whereHas('schoolClass', function ($q) {
                $q->onlyTrashed();
            })
            ->with(['schoolClass' => fn ($q) => $q->withTrashed()]);

        if ($classIdFilter) {
            $query->where('class_id', $classIdFilter);
        }

        $orphans = $query->orderBy('id')->get();

        if ($orphans->isEmpty()) {
            $this->info('No orphan schedules found. Database is clean.');
            return Command::SUCCESS;
        }

        $foundIds = $orphans->pluck('id')->sort()->values()->all();
        $parentClassIds = $orphans->pluck('class_id')->unique()->values()->all();

        $this->info("Discovered {$orphans->count()} active schedule(s) with soft-deleted parent class:");
        $tableRows = [];
        foreach ($orphans as $orphan) {
            $parent = $orphan->schoolClass;
            $tableRows[] = [
                'ID' => $orphan->id,
                'Class ID' => $orphan->class_id,
                'Class Name' => $parent ? $parent->name : 'N/A',
                'Class Deleted At' => $parent && $parent->deleted_at ? $parent->deleted_at->toDateTimeString() : 'N/A',
                'Teacher ID' => $orphan->teacher_id,
                'Subject ID' => $orphan->subject_id,
                'Day / Time' => "{$orphan->day_of_week} {$orphan->start_time}-{$orphan->end_time}",
                'Status' => $orphan->status,
            ];
        }
        $this->table(['ID', 'Class ID', 'Class Name', 'Class Deleted At', 'Teacher ID', 'Subject ID', 'Day / Time', 'Status'], $tableRows);

        // Validate against expected IDs if provided
        if ($expectedIdsOpt) {
            $expectedIds = array_map('intval', explode(',', $expectedIdsOpt));
            sort($expectedIds);
            $expectedIds = array_values($expectedIds);

            if ($foundIds !== $expectedIds) {
                $this->error("Safety Gate Failure: Discovered IDs [" . implode(',', $foundIds) . "] do not match expected IDs [" . implode(',', $expectedIds) . "]. Aborting.");
                return Command::FAILURE;
            }
            $this->info("Safety Gate Passed: Target IDs match expected set exactly [" . implode(',', $expectedIds) . "].");
        }

        if ($isDryRun) {
            $this->warn('DRY-RUN SUMMARY:');
            $this->line("  Orphan Schedule Count: {$orphans->count()}");
            $this->line("  IDs: " . implode(', ', $foundIds));
            $this->line("  Parent Class IDs: " . implode(', ', $parentClassIds));
            $this->line("  Database Changed: NO");
            $this->info('To execute soft-delete, re-run with --force.');
            return Command::SUCCESS;
        }

        // Execution mode (FORCE)
        $this->info('Starting database transaction...');

        try {
            DB::transaction(function () use ($foundIds, $parentClassIds, &$affectedCount) {
                // 1. Lock candidate schedules
                $lockedSchedules = Schedule::whereIn('id', $foundIds)
                    ->whereNull('deleted_at')
                    ->lockForUpdate()
                    ->get();

                if ($lockedSchedules->count() !== count($foundIds)) {
                    throw new \RuntimeException("State discrepancy: Expected " . count($foundIds) . " active schedules to lock, but found {$lockedSchedules->count()}. Aborting.");
                }

                // 2. Reload each parent class withTrashed and verify it is still trashed
                foreach ($lockedSchedules as $schedule) {
                    $parent = SchoolClass::withTrashed()->find($schedule->class_id);
                    if (!$parent || !$parent->trashed()) {
                        throw new \RuntimeException("Safety violation: Parent Class ID {$schedule->class_id} for Schedule ID {$schedule->id} is not trashed or missing! Rolling back.");
                    }
                }

                // 3. Perform Eloquent soft delete on each schedule
                $affectedCount = 0;
                foreach ($lockedSchedules as $schedule) {
                    $schedule->delete();
                    $affectedCount++;

                    // Individual AuditLog entry
                    AuditLog::create([
                        'user_id' => null,
                        'action' => 'delete_schedule',
                        'description' => "Orphan cleanup: soft-deleted schedule ID {$schedule->id} pointing to soft-deleted Class ID {$schedule->class_id}",
                        'ip_address' => '127.0.0.1',
                        'user_agent' => 'Artisan CLI / Wave 2C-1',
                        'created_at' => now(),
                    ]);
                }

                if ($affectedCount !== count($foundIds)) {
                    throw new \RuntimeException("Row count discrepancy: Expected to delete " . count($foundIds) . ", but deleted {$affectedCount}. Rolling back.");
                }

                // Summary AuditLog entry
                AuditLog::create([
                    'user_id' => null,
                    'action' => 'CLEANUP_ORPHAN_SCHEDULES',
                    'description' => "Safely soft-deleted " . count($foundIds) . " orphan schedule(s) [" . implode(', ', $foundIds) . "] pointing to soft-deleted UAT Class ID(s) [" . implode(', ', $parentClassIds) . "]",
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'Artisan CLI / Wave 2C-1',
                    'created_at' => now(),
                ]);
            });

            $this->info('===========================================================');
            $this->info("SUCCESS: Successfully soft-deleted {$affectedCount} orphan schedule(s).");
            $this->info("IDs soft-deleted: " . implode(', ', $foundIds));
            $this->info("Audit log entries created successfully.");
            $this->info('===========================================================');

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Cleanup failed and was rolled back: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
