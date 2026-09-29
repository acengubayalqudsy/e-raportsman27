<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CleanupOrphanSchedulesTest extends TestCase
{
    use RefreshDatabase;

    protected AcademicYear $academicYear;
    protected Semester $semester;
    protected Teacher $teacher;
    protected Subject $subject;
    protected Room $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = AcademicYear::create([
            'name' => '2026/2027',
            'status' => 'Aktif',
            'start_date' => '2026-07-01',
            'end_date' => '2027-06-30',
        ]);

        $this->semester = Semester::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Ganjil',
            'status' => 'Aktif',
            'start_date' => '2026-07-01',
            'end_date' => '2026-12-31',
        ]);

        $this->teacher = Teacher::create([
            'name' => 'Guru Test',
            'gender' => 'L',
            'status' => 'Aktif',
        ]);

        $this->subject = Subject::create([
            'code' => 'MAT-TEST',
            'name' => 'Matematika Test',
            'order' => 1,
        ]);

        $this->room = Room::create([
            'academic_year_id' => $this->academicYear->id,
            'code' => 'R-TEST',
            'name' => 'Ruang Test',
            'capacity' => 36,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ]);
    }

    public function test_active_schedule_with_active_class_is_not_cleaned(): void
    {
        $activeClass = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'X-Merdeka-1',
            'grade' => 'X',
            'code' => 'X-M1',
            'capacity' => 36,
        ]);

        $schedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $activeClass->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $this->artisan('eraport:cleanup-orphan-schedules --force')
            ->expectsOutputToContain('No orphan schedules found')
            ->assertSuccessful();

        $this->assertDatabaseHas('schedules', [
            'id' => $schedule->id,
            'deleted_at' => null,
        ]);
    }

    public function test_active_schedule_with_soft_deleted_class_included_in_dry_run_without_modifying_db(): void
    {
        $class = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Kelas X E2E UAT',
            'grade' => 'X',
            'code' => 'X-UAT',
            'capacity' => 36,
        ]);

        $schedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        // Soft delete parent class
        $class->delete();

        $this->artisan('eraport:cleanup-orphan-schedules --dry-run')
            ->expectsOutputToContain('DRY-RUN SUMMARY:')
            ->expectsOutputToContain('Orphan Schedule Count: 1')
            ->expectsOutputToContain('Database Changed: NO')
            ->assertSuccessful();

        // Database must remain unchanged
        $this->assertDatabaseHas('schedules', [
            'id' => $schedule->id,
            'deleted_at' => null,
        ]);
    }

    public function test_force_mode_soft_deletes_orphan_schedule_and_creates_audit_logs(): void
    {
        $class = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Kelas X E2E UAT',
            'grade' => 'X',
            'code' => 'X-UAT',
            'capacity' => 36,
        ]);

        $schedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $class->delete();

        $this->artisan('eraport:cleanup-orphan-schedules --force')
            ->expectsOutputToContain("SUCCESS: Successfully soft-deleted 1 orphan schedule(s)")
            ->assertSuccessful();

        // Schedule must now be soft-deleted
        $this->assertNull(Schedule::find($schedule->id));
        $this->assertNotNull(Schedule::withTrashed()->find($schedule->id));
        $this->assertNotNull(Schedule::withTrashed()->find($schedule->id)->deleted_at);

        // Verify audit logs
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'delete_schedule',
            'description' => "Orphan cleanup: soft-deleted schedule ID {$schedule->id} pointing to soft-deleted Class ID {$class->id}",
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'CLEANUP_ORPHAN_SCHEDULES',
        ]);
    }

    public function test_parent_class_remains_soft_deleted_and_unchanged(): void
    {
        $class = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Kelas X E2E UAT',
            'grade' => 'X',
            'code' => 'X-UAT',
            'capacity' => 36,
        ]);

        $schedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $class->delete();
        $classDeletedAt = $class->fresh()->deleted_at->toDateTimeString();

        $this->artisan('eraport:cleanup-orphan-schedules --force')
            ->assertSuccessful();

        $reloadedClass = SchoolClass::withTrashed()->find($class->id);
        $this->assertTrue($reloadedClass->trashed());
        $this->assertEquals($classDeletedAt, $reloadedClass->deleted_at->toDateTimeString());
    }

    public function test_already_soft_deleted_schedule_is_ignored_idempotently(): void
    {
        $class = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Kelas X E2E UAT',
            'grade' => 'X',
            'code' => 'X-UAT',
            'capacity' => 36,
        ]);

        $schedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $class->delete();
        $schedule->delete(); // Already soft-deleted

        $this->artisan('eraport:cleanup-orphan-schedules --dry-run')
            ->expectsOutputToContain('No orphan schedules found')
            ->assertSuccessful();
    }

    public function test_multiple_orphan_schedules_soft_deleted_with_exact_count(): void
    {
        $class = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Kelas X E2E UAT',
            'grade' => 'X',
            'code' => 'X-UAT',
            'capacity' => 36,
        ]);

        $s1 = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $s2 = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Selasa',
            'start_time' => '09:30',
            'end_time' => '11:00',
            'status' => 'Aktif',
        ]);

        $class->delete();

        $this->artisan("eraport:cleanup-orphan-schedules --expected-ids={$s1->id},{$s2->id} --force")
            ->expectsOutputToContain('Safety Gate Passed')
            ->expectsOutputToContain('SUCCESS: Successfully soft-deleted 2 orphan schedule(s)')
            ->assertSuccessful();

        $this->assertNull(Schedule::find($s1->id));
        $this->assertNull(Schedule::find($s2->id));
    }

    public function test_valid_schedule_belonging_to_active_class_is_preserved(): void
    {
        $activeClass = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'XI-F1',
            'grade' => 'XI',
            'code' => 'XI-F1',
            'capacity' => 36,
        ]);

        $trashedClass = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Kelas X E2E UAT',
            'grade' => 'X',
            'code' => 'X-UAT',
            'capacity' => 36,
        ]);

        $validSchedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $activeClass->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Rabu',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $orphanSchedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $trashedClass->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Kamis',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $trashedClass->delete();

        $this->artisan('eraport:cleanup-orphan-schedules --force')
            ->expectsOutputToContain('SUCCESS: Successfully soft-deleted 1 orphan schedule(s)')
            ->assertSuccessful();

        // Valid schedule untouched
        $this->assertNotNull(Schedule::find($validSchedule->id));
        $this->assertNull(Schedule::find($validSchedule->id)->deleted_at);

        // Orphan schedule soft-deleted
        $this->assertNull(Schedule::find($orphanSchedule->id));
    }

    public function test_expected_ids_safety_gate_fails_when_mismatched(): void
    {
        $class = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Kelas X E2E UAT',
            'grade' => 'X',
            'code' => 'X-UAT',
            'capacity' => 36,
        ]);

        $schedule = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $class->delete();

        // Expected IDs 999 does not match actual schedule id
        $this->artisan('eraport:cleanup-orphan-schedules --expected-ids=999 --force')
            ->expectsOutputToContain('Safety Gate Failure')
            ->assertFailed();

        // Schedule must NOT have been deleted
        $this->assertNotNull(Schedule::find($schedule->id));
    }

    public function test_class_id_filter_targets_only_specified_class(): void
    {
        $class1 = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Class 1',
            'grade' => 'X',
            'code' => 'C1',
            'capacity' => 36,
        ]);

        $class2 = SchoolClass::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Class 2',
            'grade' => 'X',
            'code' => 'C2',
            'capacity' => 36,
        ]);

        $s1 = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class1->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $s2 = Schedule::create([
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'class_id' => $class2->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'room_id' => $this->room->id,
            'day_of_week' => 'Selasa',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $class1->delete();
        $class2->delete();

        // Filter only class1
        $this->artisan("eraport:cleanup-orphan-schedules --class-id={$class1->id} --force")
            ->expectsOutputToContain('SUCCESS: Successfully soft-deleted 1 orphan schedule(s)')
            ->assertSuccessful();

        $this->assertNull(Schedule::find($s1->id));
        // s2 still active because it belongs to class2
        $this->assertNotNull(Schedule::find($s2->id));
    }
}
