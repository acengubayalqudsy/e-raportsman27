<?php

namespace Tests\Feature;

use App\Models\Religion;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Tests\TestCase;

class ReligionApiTest extends TestCase
{
    protected User $adminUser;
    protected User $guruUser;
    protected User $siswaUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);
        $siswaRole = Role::firstOrCreate(['name' => 'siswa'], ['display_name' => 'Siswa']);

        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_rel'],
            [
                'name' => 'Admin Religion Test',
                'email' => 'admin_rel@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        $this->guruUser = User::firstOrCreate(
            ['username' => 'test_guru_rel'],
            [
                'name' => 'Guru Religion Test',
                'email' => 'guru_rel@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->guruUser->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->guruUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        }

        $this->siswaUser = User::firstOrCreate(
            ['username' => 'test_siswa_rel'],
            [
                'name' => 'Siswa Religion Test',
                'email' => 'siswa_rel@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->siswaUser->roles()->where('role_id', $siswaRole->id)->exists()) {
            $this->siswaUser->roles()->attach($siswaRole->id, ['is_primary' => true]);
        }
    }

    public function test_admin_can_list_religions(): void
    {
        Religion::firstOrCreate(['name' => 'Islam'], ['is_active' => true]);
        Religion::firstOrCreate(['name' => 'Kristen Protestan'], ['is_active' => true]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/master-data/religions');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'status', 'is_active', 'students_count'],
                ],
            ]);
    }

    public function test_guru_can_view_religions(): void
    {
        Religion::firstOrCreate(['name' => 'Katolik'], ['is_active' => true]);

        $response = $this->actingAs($this->guruUser)
            ->getJson('/api/v1/master-data/religions');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_non_admin_cannot_create_religion(): void
    {
        $response = $this->actingAs($this->guruUser)
            ->postJson('/api/v1/master-data/religions', [
                'name' => 'Agama Baru',
            ]);

        $response->assertForbidden();
    }

    public function test_admin_can_create_religion(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/master-data/religions', [
                'name' => 'Shinto',
                'status' => 'Aktif',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Shinto')
            ->assertJsonPath('data.status', 'Aktif');

        $this->assertDatabaseHas('religions', [
            'name' => 'Shinto',
            'status' => 'Aktif',
        ]);
    }

    public function test_duplicate_religion_name_is_rejected(): void
    {
        Religion::firstOrCreate(['name' => 'Hindu'], ['status' => 'Aktif']);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/master-data/religions', [
                'name' => 'Hindu',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_admin_can_update_religion(): void
    {
        $religion = Religion::firstOrCreate(['name' => 'Buddha'], ['status' => 'Aktif']);

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/master-data/religions/{$religion->id}", [
                'name' => 'Buddha Theravada',
                'status' => 'Tidak Aktif',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Buddha Theravada')
            ->assertJsonPath('data.status', 'Tidak Aktif');

        $this->assertDatabaseHas('religions', [
            'id' => $religion->id,
            'name' => 'Buddha Theravada',
            'status' => 'Tidak Aktif',
        ]);
    }

    public function test_admin_can_toggle_religion_status(): void
    {
        $religion = Religion::firstOrCreate(['name' => 'Konghucu'], ['status' => 'Aktif']);

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/master-data/religions/{$religion->id}/toggle-status");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'Tidak Aktif');

        $this->assertDatabaseHas('religions', [
            'id' => $religion->id,
            'status' => 'Tidak Aktif',
        ]);
    }

    public function test_cannot_delete_religion_if_assigned_to_student(): void
    {
        $religion = Religion::firstOrCreate(['name' => 'Islam'], ['is_active' => true]);

        // Assign to a student
        Student::create([
            'nis' => '999901',
            'nisn' => '0099990001',
            'name' => 'Siswa Agama Protected',
            'gender' => 'Laki-laki',
            'birth_place' => 'Garut',
            'birth_date' => '2008-01-01',
            'religion_id' => $religion->id,
            'religion' => $religion->name,
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/master-data/religions/{$religion->id}");

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('religions', ['id' => $religion->id]);
    }

    public function test_admin_can_delete_unreferenced_religion(): void
    {
        $religion = Religion::create([
            'name' => 'Agama Hapus Test',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/master-data/religions/{$religion->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('religions', ['id' => $religion->id]);
    }
}
