<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassMember;
use App\Models\HomeroomAssignment;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavedReportApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $wali;
    private User $otherWali;
    private SchoolClass $class;
    private Semester $semester;
    private Student $student;

    protected function setUp(): void
    {
        parent::setUp();
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $waliRole = Role::firstOrCreate(['name' => 'walikelas'], ['display_name' => 'Wali Kelas']);
        $year = AcademicYear::create(['name' => '2026/2027', 'start_date' => '2026-07-01', 'end_date' => '2027-06-30', 'status' => 'Aktif']);
        $this->semester = Semester::create(['academic_year_id' => $year->id, 'name' => 'Ganjil', 'semester_type' => 'Ganjil', 'start_date' => '2026-07-01', 'end_date' => '2026-12-31', 'status' => 'Aktif']);
        $this->class = SchoolClass::create(['academic_year_id' => $year->id, 'name' => 'X-1', 'code' => 'X-1', 'grade' => '10', 'capacity' => 36, 'status' => 'Aktif']);
        $this->admin = User::factory()->create();
        $this->admin->roles()->attach($adminRole->id, ['is_primary' => true]);
        $this->wali = User::factory()->create();
        $this->wali->roles()->attach($waliRole->id, ['is_primary' => true]);
        $teacher = Teacher::create(['user_id' => $this->wali->id, 'name' => 'Wali Kelas', 'gender' => 'P', 'status' => 'Aktif']);
        HomeroomAssignment::create(['academic_year_id' => $year->id, 'semester_id' => $this->semester->id, 'class_id' => $this->class->id, 'teacher_id' => $teacher->id, 'status' => 'Aktif']);
        $this->otherWali = User::factory()->create();
        $this->otherWali->roles()->attach($waliRole->id, ['is_primary' => true]);
        Teacher::create(['user_id' => $this->otherWali->id, 'name' => 'Wali Lain', 'gender' => 'L', 'status' => 'Aktif']);
        $this->student = Student::factory()->create(['nis' => '26001', 'name' => 'Siswa Laporan', 'status' => 'Aktif']);
        ClassMember::create(['academic_year_id' => $year->id, 'semester_id' => $this->semester->id, 'class_id' => $this->class->id, 'student_id' => $this->student->id, 'status' => 'Aktif']);
    }

    private function payload(string $type = 'absensi'): array
    {
        return ['type' => $type, 'semester_id' => $this->semester->id, 'class_id' => $this->class->id];
    }

    public function test_saved_report_lifecycle_and_mine_scope(): void
    {
        StudentAttendance::create(['student_id' => $this->student->id, 'class_id' => $this->class->id, 'semester_id' => $this->semester->id, 'sick' => 2, 'permitted' => 1, 'absent' => 0]);
        $created = $this->actingAs($this->wali)->postJson('/api/v1/reports', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.snapshot.rows.0.0', '26001')
            ->assertJsonPath('data.snapshot.rows.0.4', 2);
        $id = $created->json('data.id');
        $this->getJson("/api/v1/reports?mine=1&semester_id={$this->semester->id}")
            ->assertOk()->assertJsonPath('meta.total', 1);
        $this->putJson("/api/v1/reports/{$id}", ['title' => 'Rekap Absensi X-1', 'notes' => 'Semester ganjil'])
            ->assertOk()->assertJsonPath('data.title', 'Rekap Absensi X-1');
        StudentAttendance::where('student_id', $this->student->id)->update(['sick' => 3]);
        $this->postJson("/api/v1/reports/{$id}/refresh")
            ->assertOk()->assertJsonPath('data.snapshot.rows.0.4', 3);
        $this->deleteJson("/api/v1/reports/{$id}")->assertOk();
        $this->getJson("/api/v1/reports/{$id}")->assertNotFound();
    }

    public function test_mine_and_class_permissions_are_enforced(): void
    {
        $this->getJson('/api/v1/reports')->assertUnauthorized();
        $created = $this->actingAs($this->admin)->postJson('/api/v1/reports', $this->payload())->assertCreated();
        $id = $created->json('data.id');
        $this->actingAs($this->wali)->getJson("/api/v1/reports/{$id}")->assertOk();
        $this->getJson("/api/v1/reports?mine=1&semester_id={$this->semester->id}")
            ->assertOk()->assertJsonPath('meta.total', 0);
        $this->putJson("/api/v1/reports/{$id}", ['title' => 'Tidak berhak'])->assertForbidden();
        $this->actingAs($this->otherWali)->getJson("/api/v1/reports/{$id}")->assertForbidden();
        $this->postJson('/api/v1/reports', $this->payload())->assertForbidden();
    }

    public function test_student_report_requires_an_active_class_member(): void
    {
        $this->actingAs($this->admin)->postJson('/api/v1/reports', $this->payload('per-siswa'))
            ->assertUnprocessable()->assertJsonValidationErrors('student_id');
        $this->postJson('/api/v1/reports', array_merge($this->payload('per-siswa'), ['student_id' => $this->student->id]))
            ->assertCreated()->assertJsonPath('data.snapshot.rows.0.1', 'Siswa Laporan');
    }

    public function test_every_report_type_can_be_created_from_current_class_data(): void
    {
        $this->actingAs($this->admin);
        $types = ['nilai', 'absensi', 'ekstrakurikuler', 'kokurikuler', 'per-kelas', 'per-siswa', 'rekapitulasi-rapor'];
        foreach ($types as $type) {
            $payload = $this->payload($type);
            if ($type === 'per-siswa') $payload['student_id'] = $this->student->id;
            $response = $this->postJson('/api/v1/reports', $payload)->assertCreated();
            $this->assertSame($type, $response->json('data.type'));
            $this->assertNotEmpty($response->json('data.snapshot.columns'));
        }
        $this->getJson("/api/v1/reports?semester_id={$this->semester->id}")
            ->assertOk()->assertJsonPath('meta.total', count($types));
    }
}
