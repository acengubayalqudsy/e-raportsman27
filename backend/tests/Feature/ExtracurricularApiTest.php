<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Extracurricular;
use App\Models\Role;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentExtracurricular;
use App\Models\Teacher;
use App\Models\User;
use Tests\TestCase;

class ExtracurricularApiTest extends TestCase
{
    protected User $adminUser;
    protected User $guruUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);

        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_ekskul'],
            [
                'name' => 'Admin Ekskul Test',
                'email' => 'admin_ekskul@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        $this->guruUser = User::firstOrCreate(
            ['username' => 'test_guru_ekskul'],
            [
                'name' => 'Guru Ekskul Test',
                'email' => 'guru_ekskul@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->guruUser->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->guruUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        }
    }

    public function test_admin_can_list_extracurriculars(): void
    {
        Extracurricular::firstOrCreate(['code' => 'EKS-PMR'], ['name' => 'Palang Merah Remaja', 'is_active' => true]);
        Extracurricular::firstOrCreate(['code' => 'EKS-PRA'], ['name' => 'Pramuka', 'is_active' => true]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/master-data/extracurriculars');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'code', 'name', 'supervisor', 'members', 'status', 'is_active'],
                ],
            ]);
    }

    public function test_guru_can_view_extracurriculars(): void
    {
        $response = $this->actingAs($this->guruUser)
            ->getJson('/api/v1/master-data/extracurriculars');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_non_admin_cannot_create_extracurricular(): void
    {
        $response = $this->actingAs($this->guruUser)
            ->postJson('/api/v1/master-data/extracurriculars', [
                'code' => 'EKS-FUT',
                'name' => 'Futsal',
            ]);

        $response->assertForbidden();
    }

    public function test_admin_can_create_extracurricular(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/master-data/extracurriculars', [
                'code' => 'EKS-ROH-NEW',
                'name' => 'Rohis SMAN 27 Baru',
                'status' => 'Aktif',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'EKS-ROH-NEW')
            ->assertJsonPath('data.name', 'Rohis SMAN 27 Baru');

        $this->assertDatabaseHas('extracurriculars', [
            'code' => 'EKS-ROH-NEW',
            'name' => 'Rohis SMAN 27 Baru',
            'status' => 'Aktif',
        ]);
    }

    public function test_duplicate_code_is_rejected(): void
    {
        Extracurricular::firstOrCreate(['code' => 'EKS-KOD'], ['name' => 'Klub Coding', 'status' => 'Aktif']);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/master-data/extracurriculars', [
                'code' => 'EKS-KOD',
                'name' => 'Klub Coding 2',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_admin_can_update_extracurricular(): void
    {
        $ekskul = Extracurricular::firstOrCreate(['code' => 'EKS-TAR'], ['name' => 'Seni Tari', 'status' => 'Aktif']);

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/master-data/extracurriculars/{$ekskul->id}", [
                'code' => 'EKS-TAR',
                'name' => 'Seni Tari Tradisional & Modern',
                'status' => 'Tidak Aktif',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Seni Tari Tradisional & Modern')
            ->assertJsonPath('data.status', 'Tidak Aktif');

        $this->assertDatabaseHas('extracurriculars', [
            'id' => $ekskul->id,
            'status' => 'Tidak Aktif',
        ]);
    }

    public function test_cannot_delete_extracurricular_with_student_participations(): void
    {
        $year = AcademicYear::firstOrCreate(['name' => '2024/2025'], ['start_date' => '2024-07-01', 'end_date' => '2025-06-30', 'status' => 'Aktif']);
        $semester = Semester::firstOrCreate(
            ['academic_year_id' => $year->id, 'semester' => '1'],
            ['name' => 'Semester Ganjil', 'start_date' => '2024-07-15', 'end_date' => '2024-12-31', 'is_active' => true]
        );

        $ekskul = Extracurricular::where('name', 'Paskibra')->first()
            ?? Extracurricular::create(['code' => 'EKS-PASKIB-TEST', 'name' => 'Paskibra', 'status' => 'Aktif']);

        $student = Student::create([
            'nis' => '999902',
            'nisn' => '0099990002',
            'name' => 'Siswa Paskibra',
            'gender' => 'Laki-laki',
            'birth_place' => 'Garut',
            'birth_date' => '2008-01-01',
            'status' => 'Aktif',
        ]);

        StudentExtracurricular::create([
            'student_id' => $student->id,
            'semester_id' => $semester->id,
            'extracurricular_id' => $ekskul->id,
            'activity_name' => $ekskul->name,
            'predicate' => 'A',
            'description' => 'Sangat disiplin dan aktif',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/master-data/extracurriculars/{$ekskul->id}");

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('extracurriculars', ['id' => $ekskul->id]);
    }

    public function test_admin_can_delete_unreferenced_extracurricular(): void
    {
        $ekskul = Extracurricular::create([
            'code' => 'EKS-UNUSED',
            'name' => 'Ekskul Belum Ada Siswa',
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/master-data/extracurriculars/{$ekskul->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('extracurriculars', ['id' => $ekskul->id]);
    }

    public function test_admin_can_create_extracurricular_with_pembina(): void
    {
        $teacher = Teacher::create([
            'name' => 'Guru Pembina Test',
            'nip' => '198901012015011999',
            'gender' => 'L',
            'birth_place' => 'Garut',
            'birth_date' => '1989-01-01',
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/master-data/extracurriculars', [
                'code' => 'EKS-ROB-TEST',
                'name' => 'Klub Robotik Test',
                'teacher_id' => $teacher->id,
                'status' => 'Aktif',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'EKS-ROB-TEST')
            ->assertJsonPath('data.teacher_id', $teacher->id)
            ->assertJsonPath('data.supervisor', 'Guru Pembina Test');

        $this->assertDatabaseHas('extracurriculars', [
            'code' => 'EKS-ROB-TEST',
            'teacher_id' => $teacher->id,
        ]);
    }

    public function test_admin_can_update_extracurricular_pembina(): void
    {
        $teacherA = Teacher::create([
            'name' => 'Guru Pembina A',
            'nip' => '198901012015011001',
            'gender' => 'L',
            'birth_place' => 'Garut',
            'birth_date' => '1989-01-01',
            'status' => 'Aktif',
        ]);

        $teacherB = Teacher::create([
            'name' => 'Guru Pembina B',
            'nip' => '198901012015011002',
            'gender' => 'P',
            'birth_place' => 'Garut',
            'birth_date' => '1989-01-01',
            'status' => 'Aktif',
        ]);

        $ekskul = Extracurricular::create([
            'code' => 'EKS-DANCE-TEST',
            'name' => 'Modern Dance Test',
            'teacher_id' => $teacherA->id,
            'status' => 'Aktif',
        ]);

        // Update to Teacher B
        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/master-data/extracurriculars/{$ekskul->id}", [
                'code' => 'EKS-DANCE-TEST',
                'name' => 'Modern Dance Test',
                'teacher_id' => $teacherB->id,
                'status' => 'Aktif',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.teacher_id', $teacherB->id)
            ->assertJsonPath('data.supervisor', 'Guru Pembina B');

        $this->assertDatabaseHas('extracurriculars', [
            'id' => $ekskul->id,
            'teacher_id' => $teacherB->id,
        ]);

        // Persistence check after fresh model reload from DB
        $reloaded = Extracurricular::with('teacher')->find($ekskul->id);
        $this->assertEquals($teacherB->id, $reloaded->teacher_id);
        $this->assertEquals('Guru Pembina B', $reloaded->teacher->name);
    }

    public function test_admin_can_clear_extracurricular_pembina(): void
    {
        $teacher = Teacher::create([
            'name' => 'Guru Pembina C',
            'nip' => '198901012015011003',
            'gender' => 'L',
            'birth_place' => 'Garut',
            'birth_date' => '1989-01-01',
            'status' => 'Aktif',
        ]);

        $ekskul = Extracurricular::create([
            'code' => 'EKS-CLEAR-TEST',
            'name' => 'Ekskul Clear Test',
            'teacher_id' => $teacher->id,
            'status' => 'Aktif',
        ]);

        // Clear teacher_id with null
        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/master-data/extracurriculars/{$ekskul->id}", [
                'code' => 'EKS-CLEAR-TEST',
                'name' => 'Ekskul Clear Test',
                'teacher_id' => null,
                'status' => 'Aktif',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.teacher_id', null)
            ->assertJsonPath('data.supervisor', '-');

        $this->assertDatabaseHas('extracurriculars', [
            'id' => $ekskul->id,
            'teacher_id' => null,
        ]);
    }

    public function test_invalid_pembina_teacher_id_is_rejected(): void
    {
        $ekskul = Extracurricular::create([
            'code' => 'EKS-INV-TEST',
            'name' => 'Ekskul Invalid Test',
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/master-data/extracurriculars/{$ekskul->id}", [
                'code' => 'EKS-INV-TEST',
                'name' => 'Ekskul Invalid Test',
                'teacher_id' => 999999,
                'status' => 'Aktif',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['teacher_id']);
    }
}
