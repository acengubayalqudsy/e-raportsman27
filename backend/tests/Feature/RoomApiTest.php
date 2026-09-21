<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Role;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Tests\TestCase;

class RoomApiTest extends TestCase
{
    protected User $adminUser;
    protected User $regularUser;
    protected AcademicYear $year;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);

        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_room'],
            [
                'name' => 'Admin Room Test',
                'email' => 'admin_room@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        $this->regularUser = User::firstOrCreate(
            ['username' => 'test_guru_room'],
            [
                'name' => 'Guru Room Test',
                'email' => 'guru_room@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->regularUser->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->regularUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        }

        $this->year = AcademicYear::firstOrCreate(
            ['name' => '2024/2025'],
            [
                'start_date' => '2024-07-15',
                'end_date' => '2025-06-30',
                'status' => 'Aktif',
            ]
        );
    }

    public function test_admin_can_list_rooms(): void
    {
        Room::create([
            'academic_year_id' => $this->year->id,
            'code' => 'R-101',
            'name' => 'Ruang Teori 101',
            'capacity' => 36,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ]);

        $res = $this->actingAs($this->adminUser)->getJson('/api/v1/rooms');
        $res->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'code', 'name', 'capacity', 'room_type', 'status']
                ]
            ]);
    }

    public function test_admin_can_create_room(): void
    {
        $payload = [
            'academic_year_id' => $this->year->id,
            'code' => 'LAB-KOM-1',
            'name' => 'Laboratorium Komputer 1',
            'capacity' => 40,
            'room_type' => 'Laboratorium',
            'building' => 'Gedung B',
            'floor' => 'Lantai 2',
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/rooms', $payload);
        $res->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'code' => 'LAB-KOM-1',
                    'name' => 'Laboratorium Komputer 1',
                ]
            ]);

        $this->assertDatabaseHas('rooms', [
            'code' => 'LAB-KOM-1',
            'room_type' => 'Laboratorium',
        ]);
    }

    public function test_cannot_create_room_with_duplicate_code(): void
    {
        Room::create([
            'academic_year_id' => $this->year->id,
            'code' => 'DUP-01',
            'name' => 'Ruang Pertama',
            'capacity' => 30,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ]);

        $payload = [
            'academic_year_id' => $this->year->id,
            'code' => 'DUP-01',
            'name' => 'Ruang Kedua',
            'capacity' => 32,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/rooms', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_cannot_create_room_with_negative_capacity(): void
    {
        $payload = [
            'academic_year_id' => $this->year->id,
            'code' => 'INV-01',
            'name' => 'Ruang Kapasitas Minus',
            'capacity' => -5,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/rooms', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['capacity']);
    }

    public function test_admin_can_show_and_update_room(): void
    {
        $room = Room::create([
            'academic_year_id' => $this->year->id,
            'code' => 'R-202',
            'name' => 'Ruang Teori 202',
            'capacity' => 36,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ]);

        $showRes = $this->actingAs($this->adminUser)->getJson("/api/v1/rooms/{$room->id}");
        $showRes->assertStatus(200)
            ->assertJson(['data' => ['code' => 'R-202']]);

        $updateRes = $this->actingAs($this->adminUser)->putJson("/api/v1/rooms/{$room->id}", [
            'name' => 'Ruang Teori 202 Updated',
            'capacity' => 38,
        ]);
        $updateRes->assertStatus(200)
            ->assertJson(['data' => ['name' => 'Ruang Teori 202 Updated', 'capacity' => 38]]);
    }

    public function test_admin_can_delete_room_without_active_schedules(): void
    {
        $room = Room::create([
            'academic_year_id' => $this->year->id,
            'code' => 'R-DEL-1',
            'name' => 'Ruang Hapus',
            'capacity' => 30,
            'room_type' => 'Lainnya',
            'status' => 'Aktif',
        ]);

        $res = $this->actingAs($this->adminUser)->deleteJson("/api/v1/rooms/{$room->id}");
        $res->assertStatus(200);

        $this->assertSoftDeleted('rooms', ['id' => $room->id]);
    }

    public function test_cannot_delete_room_with_active_schedules(): void
    {
        $room = Room::create([
            'academic_year_id' => $this->year->id,
            'code' => 'R-PROT-1',
            'name' => 'Ruang Terjadwal',
            'capacity' => 36,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ]);

        $sem = Semester::firstOrCreate(
            ['academic_year_id' => $this->year->id, 'name' => 'Ganjil'],
            ['start_date' => '2024-07-15', 'end_date' => '2024-12-20', 'status' => 'Aktif']
        );
        $cls = SchoolClass::firstOrCreate(
            ['code' => 'X-TEST-R'],
            ['academic_year_id' => $this->year->id, 'name' => 'X Test Room', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']
        );
        $subj = Subject::firstOrCreate(
            ['code' => 'BIO-R'],
            ['name' => 'Biologi Room Test', 'group' => 'MIPA', 'weekly_hours' => 2, 'status' => 'Aktif']
        );
        $tch = Teacher::firstOrCreate(
            ['nip' => '198901012015011099'],
            ['name' => 'Guru Room Protection', 'gender' => 'L', 'employment_status' => 'ASN', 'status' => 'Aktif']
        );

        Schedule::create([
            'academic_year_id' => $this->year->id,
            'semester_id' => $sem->id,
            'class_id' => $cls->id,
            'subject_id' => $subj->id,
            'teacher_id' => $tch->id,
            'room_id' => $room->id,
            'day_of_week' => 'Senin',
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
        ]);

        $res = $this->actingAs($this->adminUser)->deleteJson("/api/v1/rooms/{$room->id}");
        $res->assertStatus(422)
            ->assertJsonFragment(['message' => 'Ruangan tidak dapat dihapus karena masih digunakan pada 1 jadwal aktif.']);
    }

    public function test_non_admin_cannot_create_or_modify_rooms(): void
    {
        $payload = [
            'academic_year_id' => $this->year->id,
            'code' => 'GURU-01',
            'name' => 'Ruang Guru Buat',
            'capacity' => 30,
            'room_type' => 'Kelas',
            'status' => 'Aktif',
        ];

        $postRes = $this->actingAs($this->regularUser)->postJson('/api/v1/rooms', $payload);
        $postRes->assertStatus(403);
    }
}
