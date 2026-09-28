<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Role;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $roleModel = Role::firstOrCreate(['name' => $role], ['display_name' => ucfirst($role)]);
        $user = User::factory()->create();
        $user->roles()->attach($roleModel->id, ['is_primary' => true]);
        return $user;
    }

    public function test_identity_settings_persist_and_are_admin_only(): void
    {
        $payload = [
            'schoolName' => 'SMA Contoh', 'npsn' => '12345678', 'address' => 'Jalan Sekolah',
            'phone' => '021123456', 'email' => 'sekolah@example.com', 'principal' => 'Ibu Kepala',
            'logoRemoved' => true,
        ];
        $this->getJson('/api/v1/settings/identity')->assertUnauthorized();
        $this->actingAs($this->userWithRole('guru'))->putJson('/api/v1/settings/identity', $payload)->assertForbidden();
        $this->actingAs($this->userWithRole('admin'))->putJson('/api/v1/settings/identity', $payload)
            ->assertOk()->assertJsonPath('data.schoolName', 'SMA Contoh');
        $this->getJson('/api/v1/settings/identity')->assertOk()->assertJsonPath('data.npsn', '12345678');
        $this->getJson('/api/v1/settings/activity-logs')->assertOk()->assertJsonPath('data.0.activity', 'settings.update');
        $this->putJson('/api/v1/settings/identity', [...$payload, 'npsn' => 'invalid'])->assertUnprocessable();
    }

    public function test_academic_settings_change_active_context(): void
    {
        $old = AcademicYear::create(['name' => '2025/2026', 'start_date' => '2025-07-01', 'end_date' => '2026-06-30', 'status' => 'Aktif']);
        $new = AcademicYear::create(['name' => '2026/2027', 'start_date' => '2026-07-01', 'end_date' => '2027-06-30', 'status' => 'Tidak Aktif']);
        Semester::create(['academic_year_id' => $old->id, 'name' => 'Genap', 'start_date' => '2026-01-01', 'end_date' => '2026-06-30', 'status' => 'Aktif']);
        $target = Semester::create(['academic_year_id' => $new->id, 'name' => 'Ganjil', 'start_date' => '2026-07-01', 'end_date' => '2026-12-31', 'status' => 'Tidak Aktif']);
        $payload = [
            'academicYear' => '2026/2027', 'semester' => 'Ganjil',
            'semesterStartDate' => '2026-07-01', 'semesterEndDate' => '2026-12-31',
            'schoolDays' => 120, 'classNameFormat' => 'Default', 'semesterEnabled' => true,
            'scoreInputEnabled' => true, 'attendanceInputEnabled' => true, 'reportGenerationEnabled' => true,
        ];
        $this->actingAs($this->userWithRole('admin'))->putJson('/api/v1/settings/academic', $payload)->assertOk();
        $this->assertDatabaseHas('academic_years', ['id' => $new->id, 'status' => 'Aktif']);
        $this->assertDatabaseHas('semesters', ['id' => $target->id, 'status' => 'Aktif']);
        $this->getJson('/api/v1/settings/academic')->assertJsonPath('data.academicYear', '2026/2027');
    }
}
