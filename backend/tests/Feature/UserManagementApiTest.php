<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    protected User $admin1;
    protected User $admin2;
    protected User $guruUser;
    protected Role $adminRole;
    protected Role $guruRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $this->guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);

        $this->admin1 = User::firstOrCreate(
            ['username' => 'test_admin_mgmt1'],
            [
                'name' => 'Admin Mgmt 1',
                'email' => 'admin_mgmt1@test.local',
                'password' => Hash::make('secret123'),
                'is_active' => true,
            ]
        );
        if (!$this->admin1->roles()->where('role_id', $this->adminRole->id)->exists()) {
            $this->admin1->roles()->attach($this->adminRole->id, ['is_primary' => true]);
        }

        $this->admin2 = User::firstOrCreate(
            ['username' => 'test_admin_mgmt2'],
            [
                'name' => 'Admin Mgmt 2',
                'email' => 'admin_mgmt2@test.local',
                'password' => Hash::make('secret123'),
                'is_active' => true,
            ]
        );
        if (!$this->admin2->roles()->where('role_id', $this->adminRole->id)->exists()) {
            $this->admin2->roles()->attach($this->adminRole->id, ['is_primary' => true]);
        }

        $this->guruUser = User::firstOrCreate(
            ['username' => 'test_guru_mgmt'],
            [
                'name' => 'Guru Mgmt Test',
                'email' => 'guru_mgmt@test.local',
                'password' => Hash::make('secret123'),
                'is_active' => true,
            ]
        );
        if (!$this->guruUser->roles()->where('role_id', $this->guruRole->id)->exists()) {
            $this->guruUser->roles()->attach($this->guruRole->id, ['is_primary' => true]);
        }
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $response = $this->actingAs($this->guruUser)
            ->getJson('/api/v1/master-data/users');

        $response->assertForbidden();
    }

    public function test_admin_can_list_users(): void
    {
        $response = $this->actingAs($this->admin1)
            ->getJson('/api/v1/master-data/users');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'username', 'email', 'role', 'status'],
                ],
            ]);

        // Assert password never leaks in listing
        $content = $response->getContent();
        $this->assertStringNotContainsString('"password"', $content);
    }

    public function test_admin_can_create_user_with_role_and_hashed_password(): void
    {
        $response = $this->actingAs($this->admin1)
            ->postJson('/api/v1/master-data/users', [
                'name' => 'Staf Baru SMAN 27',
                'username' => 'staf_baru',
                'email' => 'staf_baru@sman27.sch.id',
                'password' => 'PasswordAman123!',
                'role' => 'Guru',
                'status' => 'Aktif',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Staf Baru SMAN 27')
            ->assertJsonPath('data.username', 'staf_baru');

        // Verify password never exposed
        $response->assertJsonMissing(['password']);

        // Verify database persistence and hashing
        $createdUser = User::where('username', 'staf_baru')->first();
        $this->assertNotNull($createdUser);
        $this->assertTrue(Hash::check('PasswordAman123!', $createdUser->password));
        $this->assertTrue($createdUser->roles()->where('role_id', $this->guruRole->id)->exists());
    }

    public function test_duplicate_username_is_rejected(): void
    {
        $response = $this->actingAs($this->admin1)
            ->postJson('/api/v1/master-data/users', [
                'name' => 'Duplikat Admin',
                'username' => 'test_admin_mgmt1',
                'password' => 'Password123!',
                'role' => 'Admin',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username']);
    }

    public function test_admin_can_update_user_and_optional_password(): void
    {
        $targetUser = User::create([
            'name' => 'User Edit Test',
            'username' => 'user_edit_test',
            'email' => 'user_edit@test.local',
            'password' => Hash::make('OldPassword123'),
            'is_active' => true,
        ]);
        $targetUser->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        // Update without changing password
        $response = $this->actingAs($this->admin1)
            ->putJson("/api/v1/master-data/users/{$targetUser->id}", [
                'name' => 'User Edit Renamed',
                'username' => 'user_edit_test',
                'role' => 'Guru',
                'status' => 'Aktif',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'User Edit Renamed');

        // Ensure old password is still valid
        $targetUser->refresh();
        $this->assertTrue(Hash::check('OldPassword123', $targetUser->password));

        // Now update WITH new password
        $response2 = $this->actingAs($this->admin1)
            ->putJson("/api/v1/master-data/users/{$targetUser->id}", [
                'name' => 'User Edit Renamed',
                'username' => 'user_edit_test',
                'password' => 'BrandNewPassword456',
                'role' => 'Guru',
            ]);

        $response2->assertOk();
        $targetUser->refresh();
        $this->assertTrue(Hash::check('BrandNewPassword456', $targetUser->password));
    }

    public function test_admin_can_toggle_user_status(): void
    {
        $targetUser = User::create([
            'name' => 'User Toggle Test',
            'username' => 'user_toggle_test',
            'email' => 'user_toggle@test.local',
            'password' => Hash::make('secret123'),
            'is_active' => true,
        ]);
        $targetUser->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $response = $this->actingAs($this->admin1)
            ->patchJson("/api/v1/master-data/users/{$targetUser->id}/toggle-status");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'Tidak Aktif');

        $this->assertFalse((bool) $targetUser->fresh()->is_active);
    }

    public function test_last_active_admin_cannot_be_deleted(): void
    {
        // Deactivate all other admins so admin1 is the ONLY active admin
        User::where('id', '!=', $this->admin1->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->update(['is_active' => false]);

        $response = $this->actingAs($this->admin1)
            ->deleteJson("/api/v1/master-data/users/{$this->admin1->id}");

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('users', ['id' => $this->admin1->id]);
    }

    public function test_last_active_admin_cannot_be_deactivated(): void
    {
        // Deactivate all other admins so admin1 is the ONLY active admin
        User::where('id', '!=', $this->admin1->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->update(['is_active' => false]);

        $response = $this->actingAs($this->admin1)
            ->patchJson("/api/v1/master-data/users/{$this->admin1->id}/toggle-status");

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertTrue((bool) $this->admin1->fresh()->is_active);
    }

    public function test_last_active_admin_cannot_have_admin_role_removed(): void
    {
        // Deactivate all other admins so admin1 is the ONLY active admin
        User::where('id', '!=', $this->admin1->id)
            ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->update(['is_active' => false]);

        // Attempt to demote admin1 to Guru only
        $response = $this->actingAs($this->admin1)
            ->putJson("/api/v1/master-data/users/{$this->admin1->id}", [
                'name' => $this->admin1->name,
                'username' => $this->admin1->username,
                'role' => 'Guru',
                'status' => 'Aktif',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertTrue($this->admin1->fresh()->roles()->where('role_id', $this->adminRole->id)->exists());
    }

    public function test_admin_can_delete_regular_user(): void
    {
        $targetUser = User::create([
            'name' => 'User Hapus Test',
            'username' => 'user_hapus_test',
            'email' => 'user_hapus@test.local',
            'password' => Hash::make('secret123'),
            'is_active' => true,
        ]);
        $targetUser->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $response = $this->actingAs($this->admin1)
            ->deleteJson("/api/v1/master-data/users/{$targetUser->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
    }
}
