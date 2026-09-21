<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\CourseAssignment;
use App\Models\Role;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Tests\TestCase;

class ScheduleApiTest extends TestCase
{
    protected User $adminUser;
    protected User $regularUser;
    protected AcademicYear $year;
    protected Semester $semester;
    protected SchoolClass $classA;
    protected SchoolClass $classB;
    protected Teacher $teacher1;
    protected Teacher $teacher2;
    protected Subject $subject1;
    protected Subject $subject2;
    protected Room $room1;
    protected Room $room2;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);

        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_sched'],
            [
                'name' => 'Admin Sched Test',
                'email' => 'admin_sched@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        $this->regularUser = User::firstOrCreate(
            ['username' => 'test_guru_sched'],
            [
                'name' => 'Guru Sched Test',
                'email' => 'guru_sched@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->regularUser->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->regularUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        }

        $this->year = AcademicYear::firstOrCreate(
            ['name' => '2024/2025'],
            ['start_date' => '2024-07-15', 'end_date' => '2025-06-30', 'status' => 'Aktif']
        );

        $this->semester = Semester::firstOrCreate(
            ['academic_year_id' => $this->year->id, 'name' => 'Ganjil'],
            ['start_date' => '2024-07-15', 'end_date' => '2024-12-20', 'status' => 'Aktif']
        );

        $this->classA = SchoolClass::firstOrCreate(
            ['code' => 'X-SCHED-1'],
            ['academic_year_id' => $this->year->id, 'name' => 'X Sched 1', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
        );
        $this->classB = SchoolClass::firstOrCreate(
            ['code' => 'X-SCHED-2'],
            ['academic_year_id' => $this->year->id, 'name' => 'X Sched 2', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
        );

        $this->teacher1 = Teacher::firstOrCreate(
            ['nip' => '198801012012011001'],
            ['name' => 'Guru Sched Satu', 'gender' => 'L', 'employment_status' => 'ASN', 'status' => 'Aktif']
        );
        $this->teacher2 = Teacher::firstOrCreate(
            ['nip' => '198802022012022002'],
            ['name' => 'Guru Sched Dua', 'gender' => 'P', 'employment_status' => 'PPPK', 'status' => 'Aktif']
        );

        $this->subject1 = Subject::firstOrCreate(
            ['code' => 'MAT-SCH'],
            ['name' => 'Matematika Sched', 'group' => 'Umum', 'weekly_hours' => 4, 'status' => 'Aktif']
        );
        $this->subject2 = Subject::firstOrCreate(
            ['code' => 'FIS-SCH'],
            ['name' => 'Fisika Sched', 'group' => 'MIPA', 'weekly_hours' => 3, 'status' => 'Aktif']
        );

        $this->room1 = Room::firstOrCreate(
            ['code' => 'RM-101'],
            ['academic_year_id' => $this->year->id, 'name' => 'Ruang 101', 'capacity' => 36, 'room_type' => 'Kelas', 'status' => 'Aktif']
        );
        $this->room2 = Room::firstOrCreate(
            ['code' => 'RM-102'],
            ['academic_year_id' => $this->year->id, 'name' => 'Ruang 102', 'capacity' => 36, 'room_type' => 'Kelas', 'status' => 'Aktif']
        );
    }

    public function test_admin_can_create_schedule(): void
    {
        $payload = [
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
            'notes' => 'Jam pertama Matematika',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', $payload);
        $res->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'day_of_week' => 'Senin',
                    'start_time' => '07:30',
                    'end_time' => '09:00',
                ]
            ]);

        $this->assertDatabaseHas('schedules', [
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'day_of_week' => 'Senin',
        ]);
    }

    public function test_cannot_create_schedule_with_invalid_time_ordering(): void
    {
        $payload = [
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Senin',
            'start_time' => '09:00',
            'end_time' => '07:30', // inverted time!
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', $payload);
        $res->assertStatus(422);
    }

    public function test_cannot_create_schedule_with_teacher_overlap_conflict(): void
    {
        // Existing schedule for teacher1: Senin 07:30 - 09:00 in Class A, Room 1
        Schedule::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        // Attempt new schedule for same teacher1: Senin 08:30 - 10:00 (overlaps) in Class B, Room 2
        $payload = [
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classB->id,
            'subject_id' => $this->subject2->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room2->id,
            'day_of_week' => 'Senin',
            'start_time' => '08:30',
            'end_time' => '10:00',
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['teacher_id']);
    }

    public function test_cannot_create_schedule_with_room_overlap_conflict(): void
    {
        // Existing schedule: Senin 07:30 - 09:00 in Room 1 (Teacher 1, Class A)
        Schedule::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        // Attempt new schedule: Senin 08:00 - 09:30 in SAME Room 1 (Teacher 2, Class B)
        $payload = [
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classB->id,
            'subject_id' => $this->subject2->id,
            'teacher_id' => $this->teacher2->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Senin',
            'start_time' => '08:00',
            'end_time' => '09:30',
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['room_id']);
    }

    public function test_cannot_create_schedule_with_class_overlap_conflict(): void
    {
        // Existing schedule: Senin 07:30 - 09:00 for Class A
        Schedule::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        // Attempt new schedule: Senin 07:45 - 08:45 for SAME Class A (Different Teacher & Room)
        $payload = [
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject2->id,
            'teacher_id' => $this->teacher2->id,
            'room_id' => $this->room2->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:45',
            'end_time' => '08:45',
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['class_id']);
    }

    public function test_can_update_schedule_without_self_conflict(): void
    {
        $sched = Schedule::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Selasa',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        // Update notes or shift 15 mins without conflicting with self
        $res = $this->actingAs($this->adminUser)->putJson("/api/v1/schedules/{$sched->id}", [
            'notes' => 'Updated notes for schedule',
            'start_time' => '07:30',
            'end_time' => '09:15',
        ]);
        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'notes' => 'Updated notes for schedule',
                    'end_time' => '09:15',
                ]
            ]);
    }

    public function test_admin_can_soft_delete_schedule(): void
    {
        $sched = Schedule::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Rabu',
            'start_time' => '10:00',
            'end_time' => '11:30',
            'status' => 'Aktif',
        ]);

        $res = $this->actingAs($this->adminUser)->deleteJson("/api/v1/schedules/{$sched->id}");
        $res->assertStatus(200);

        $this->assertSoftDeleted('schedules', ['id' => $sched->id]);
    }

    public function test_non_admin_cannot_manage_schedules(): void
    {
        $payload = [
            'academic_year_id' => $this->year->id,
            'semester_id' => $this->semester->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'room_id' => $this->room1->id,
            'day_of_week' => 'Kamis',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->regularUser)->postJson('/api/v1/schedules', $payload);
        $res->assertStatus(403);
    }
}
