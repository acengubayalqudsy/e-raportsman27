<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconcileTeacherIdentitiesCommandTest extends TestCase
{
    use RefreshDatabase;

    protected Role $guruRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guruRole = Role::firstOrCreate(
            ['name' => 'guru'],
            ['label' => 'Guru Mata Pelajaran', 'guard_name' => 'web']
        );

        // Ensure any seeded guru users have a linked teacher so isolated test assertions are deterministic
        $seededGurus = User::whereHas('roles', fn ($q) => $q->where('name', 'guru'))
            ->whereDoesntHave('teacher')
            ->get();

        foreach ($seededGurus as $idx => $seededUser) {
            Teacher::create([
                'user_id' => $seededUser->id,
                'name' => 'Seeded Teacher ' . ($idx + 1),
                'gender' => 'L',
                'status' => 'Aktif',
            ]);
        }
    }

    public function test_dry_run_proposes_safe_link_without_modifying_database(): void
    {
        $user = User::factory()->create([
            'email' => 'guru.biologi@sman27garut.sch.id',
        ]);
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Biologi',
            'email' => 'guru.biologi@sman27garut.sch.id',
            'gender' => 'P',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        $this->artisan('eraport:reconcile-teacher-identities --dry-run')
            ->expectsOutputToContain('SAFE')
            ->expectsOutputToContain('DRY-RUN selesai. Tidak ada data yang diubah pada database.')
            ->assertSuccessful();

        $this->assertNull($teacher->fresh()->user_id);
    }

    public function test_force_mode_links_safe_candidate_within_transaction(): void
    {
        $user = User::factory()->create([
            'email' => 'guru.kimia@sman27garut.sch.id',
        ]);
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Kimia',
            'email' => 'guru.kimia@sman27garut.sch.id',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('BERHASIL: 1 profil Teacher berhasil ditautkan')
            ->assertSuccessful();

        $this->assertEquals($user->id, $teacher->fresh()->user_id);
    }

    public function test_multiple_teacher_candidates_is_marked_ambiguous_and_refuses_write(): void
    {
        $user = User::factory()->create([
            'email' => 'guru.kembar@sman27garut.sch.id',
        ]);
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        Teacher::create([
            'name' => 'Guru Kembar 1',
            'email' => 'guru.kembar@sman27garut.sch.id',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        Teacher::create([
            'name' => 'Guru Kembar 2',
            'email' => 'guru.kembar@sman27garut.sch.id',
            'gender' => 'P',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('AMBIGUOUS')
            ->assertSuccessful();

        $this->assertDatabaseMissing('teachers', ['user_id' => $user->id]);
    }

    public function test_candidate_already_linked_to_another_user_is_marked_conflict(): void
    {
        $otherUser = User::factory()->create();
        $user = User::factory()->create([
            'email' => 'guru.conflict@sman27garut.sch.id',
        ]);
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Conflict',
            'email' => 'guru.conflict@sman27garut.sch.id',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $otherUser->id,
        ]);

        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('CONFLICT')
            ->assertSuccessful();

        $this->assertEquals($otherUser->id, $teacher->fresh()->user_id);
    }

    public function test_user_already_linked_to_teacher_is_not_processed(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        Teacher::create([
            'name' => 'Guru Sudah Tertaut',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user->id,
        ]);

        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('Semua pengguna dengan role "guru" sudah terhubung ke profil Teacher yang valid.')
            ->assertSuccessful();
    }

    public function test_user_without_candidate_is_marked_no_match(): void
    {
        $user = User::factory()->create([
            'username' => 'guru_tanpa_profil',
            'email' => 'random_guru_999@domain.com',
        ]);
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('NO_MATCH')
            ->assertSuccessful();
    }

    public function test_non_guru_user_is_never_reconciled(): void
    {
        $siswaRole = Role::firstOrCreate(
            ['name' => 'siswa'],
            ['label' => 'Siswa', 'guard_name' => 'web']
        );

        $user = User::factory()->create([
            'email' => 'siswa.test@domain.com',
        ]);
        $user->roles()->attach($siswaRole->id, ['is_primary' => true]);

        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('Semua pengguna dengan role "guru" sudah terhubung ke profil Teacher yang valid.')
            ->assertSuccessful();
    }

    public function test_command_is_idempotent_when_run_repeatedly(): void
    {
        $user = User::factory()->create([
            'email' => 'guru.idempotent@sman27garut.sch.id',
        ]);
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        Teacher::create([
            'name' => 'Guru Idempotent',
            'email' => 'guru.idempotent@sman27garut.sch.id',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        // First run -> links
        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('BERHASIL: 1 profil Teacher berhasil ditautkan')
            ->assertSuccessful();

        // Second run -> already linked
        $this->artisan('eraport:reconcile-teacher-identities --force')
            ->expectsOutputToContain('Semua pengguna dengan role "guru" sudah terhubung ke profil Teacher yang valid.')
            ->assertSuccessful();
    }
}
