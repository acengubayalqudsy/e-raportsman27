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

    public function test_explicit_mapping_dry_run_proposes_exact_link_without_modifying_database(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Explicit Dry Run',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --dry-run")
            ->expectsOutputToContain('SAFE_EXPLICIT')
            ->expectsOutputToContain('DRY-RUN selesai. Tidak ada data yang diubah pada database.')
            ->assertSuccessful();

        $this->assertNull($teacher->fresh()->user_id);
    }

    public function test_explicit_mapping_force_mode_links_teacher_to_user_within_transaction(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Explicit Force',
            'gender' => 'P',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --force")
            ->expectsOutputToContain("BERHASIL: Exactly 1 baris diperbarui. Teacher ID {$teacher->id} kini secara canonical tertaut ke User ID {$user->id}.")
            ->assertSuccessful();

        $this->assertEquals($user->id, $teacher->fresh()->user_id);
        $this->assertEquals($teacher->id, $user->fresh()->teacher->id);
    }

    public function test_explicit_mapping_refuses_when_teacher_already_linked_to_another_user(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user2->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Claimed',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user1->id,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user2->id} --teacher-id={$teacher->id} --force")
            ->expectsOutputToContain("ERROR: Teacher ID {$teacher->id} sudah tertaut ke User ID {$user1->id} lain.")
            ->assertFailed();

        $this->assertEquals($user1->id, $teacher->fresh()->user_id);
    }

    public function test_explicit_mapping_refuses_when_user_already_has_another_teacher(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher1 = Teacher::create([
            'name' => 'Guru Asli',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user->id,
        ]);

        $teacher2 = Teacher::create([
            'name' => 'Guru Kedua',
            'gender' => 'P',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher2->id} --force")
            ->expectsOutputToContain("ERROR: User ID {$user->id} sudah memiliki profil Teacher ID {$teacher1->id}")
            ->assertFailed();

        $this->assertNull($teacher2->fresh()->user_id);
    }

    public function test_explicit_mapping_refuses_nonexistent_user_or_teacher(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id=999999 --teacher-id=1 --force")
            ->expectsOutputToContain('User ID 999999 tidak ditemukan')
            ->assertFailed();

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id=999999 --force")
            ->expectsOutputToContain('Teacher ID 999999 tidak ditemukan')
            ->assertFailed();
    }

    public function test_explicit_mapping_refuses_user_without_guru_role(): void
    {
        $nonGuru = User::factory()->create(); // No guru role

        $teacher = Teacher::create([
            'name' => 'Guru Santai',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$nonGuru->id} --teacher-id={$teacher->id} --force")
            ->expectsOutputToContain('tidak memiliki role "guru"')
            ->assertFailed();

        $this->assertNull($teacher->fresh()->user_id);
    }

    public function test_explicit_mapping_refuses_inactive_teacher(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Pensiun',
            'gender' => 'L',
            'status' => 'Nonaktif',
            'user_id' => null,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --force")
            ->expectsOutputToContain('berstatus "Nonaktif" (harus "Aktif")')
            ->assertFailed();

        $this->assertNull($teacher->fresh()->user_id);
    }

    public function test_explicit_mapping_is_idempotent_on_repeated_execution(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Idempotent Explicit',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => null,
        ]);

        // First execution -> success
        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --force")
            ->expectsOutputToContain('BERHASIL: Exactly 1 baris diperbarui.')
            ->assertSuccessful();

        // Second execution -> idempotent success
        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --force")
            ->expectsOutputToContain("IDEMPOTENT: User ID {$user->id} sudah tertaut dengan benar ke Teacher ID {$teacher->id}.")
            ->assertSuccessful();
    }

    public function test_restore_dry_run_proposes_restore_without_modifying_database(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Trashed',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user->id,
        ]);
        $teacher->delete();

        $this->assertTrue($teacher->fresh()->trashed());

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --restore --dry-run")
            ->expectsOutputToContain('RESTORE_ONLY')
            ->expectsOutputToContain('DRY-RUN selesai. Tidak ada data yang diubah pada database.')
            ->expectsOutputToContain('Database Changed:')
            ->expectsOutputToContain('NO')
            ->assertSuccessful();

        $this->assertTrue($teacher->fresh()->trashed());
        $this->assertEquals($user->id, $teacher->fresh()->user_id);
    }

    public function test_restore_force_restores_soft_deleted_teacher_and_preserves_user_id(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru To Restore',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user->id,
        ]);
        $teacher->delete();

        $this->assertTrue($teacher->fresh()->trashed());

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --restore --force")
            ->expectsOutputToContain("BERHASIL: Exactly 1 baris diperbarui. Teacher ID {$teacher->id} kini secara canonical tertaut ke User ID {$user->id}.")
            ->assertSuccessful();

        $refreshed = $teacher->fresh();
        $this->assertFalse($refreshed->trashed());
        $this->assertNull($refreshed->deleted_at);
        $this->assertEquals($user->id, $refreshed->user_id);
        $this->assertEquals($teacher->id, $user->fresh()->teacher->id);
    }

    public function test_restore_refuses_when_trashed_teacher_linked_to_different_user(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user2->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Other User',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user1->id,
        ]);
        $teacher->delete();

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user2->id} --teacher-id={$teacher->id} --restore --force")
            ->expectsOutputToContain("ERROR: Teacher ID {$teacher->id} memiliki user_id = {$user1->id} (harus {$user2->id} untuk restore).")
            ->assertFailed();

        $this->assertTrue($teacher->fresh()->trashed());
    }

    public function test_restore_refuses_when_user_already_has_another_active_teacher(): void
    {
        \Illuminate\Support\Facades\Schema::table('teachers', function ($table) {
            $table->dropUnique('uk_teacher_user');
        });

        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $activeTeacher = Teacher::create([
            'name' => 'Guru Active',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user->id,
        ]);

        $trashedTeacher = Teacher::create([
            'name' => 'Guru Trashed Second',
            'gender' => 'P',
            'status' => 'Aktif',
            'user_id' => $user->id,
        ]);
        $trashedTeacher->delete();

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$trashedTeacher->id} --restore --force")
            ->expectsOutputToContain("ERROR: User ID {$user->id} sudah memiliki profil Teacher ID {$activeTeacher->id}")
            ->assertFailed();

        $this->assertTrue($trashedTeacher->fresh()->trashed());
    }

    public function test_restore_refuses_when_duplicate_active_nip_or_nuptk_exists(): void
    {
        \Illuminate\Support\Facades\Schema::table('teachers', function ($table) {
            $table->dropUnique(['nip']);
            $table->dropUnique(['nuptk']);
        });

        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $trashedTeacher = Teacher::create([
            'name' => 'Guru Trashed With NIP',
            'gender' => 'L',
            'status' => 'Aktif',
            'nip' => '999905102003121003',
            'nuptk' => '9999757659200023',
            'user_id' => $user->id,
        ]);
        $trashedTeacher->delete();

        // Active teacher with identical NIP
        $activeDuplicate = Teacher::create([
            'name' => 'Guru Active Duplicate',
            'gender' => 'L',
            'status' => 'Aktif',
            'nip' => '999905102003121003',
            'user_id' => null,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$trashedTeacher->id} --restore --force")
            ->expectsOutputToContain("ERROR: Terdeteksi profil Teacher ID {$activeDuplicate->id} aktif lain dengan NIP identik (999905102003121003).")
            ->assertFailed();

        $this->assertTrue($trashedTeacher->fresh()->trashed());
    }

    public function test_restore_is_idempotent_when_teacher_is_already_active(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $teacher = Teacher::create([
            'name' => 'Guru Already Active',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $user->id,
        ]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id={$teacher->id} --restore --force")
            ->expectsOutputToContain("IDEMPOTENT: User ID {$user->id} sudah tertaut dengan benar ke Teacher ID {$teacher->id}.")
            ->assertSuccessful();

        $this->assertFalse($teacher->fresh()->trashed());
    }

    public function test_restore_refuses_when_teacher_missing(): void
    {
        $user = User::factory()->create();
        $user->roles()->attach($this->guruRole->id, ['is_primary' => true]);

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$user->id} --teacher-id=888888 --restore --force")
            ->expectsOutputToContain('Teacher ID 888888 tidak ditemukan di database (bahkan pada riwayat terhapus).')
            ->assertFailed();
    }

    public function test_restore_refuses_non_guru_user(): void
    {
        $nonGuru = User::factory()->create();

        $teacher = Teacher::create([
            'name' => 'Guru Non Guru Target',
            'gender' => 'L',
            'status' => 'Aktif',
            'user_id' => $nonGuru->id,
        ]);
        $teacher->delete();

        $this->artisan("eraport:reconcile-teacher-identities --user-id={$nonGuru->id} --teacher-id={$teacher->id} --restore --force")
            ->expectsOutputToContain('tidak memiliki role "guru"')
            ->assertFailed();

        $this->assertTrue($teacher->fresh()->trashed());
    }
}
