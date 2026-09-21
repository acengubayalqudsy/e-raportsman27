<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\User;
use Tests\TestCase;

class AcademicApiTest extends TestCase
{
    protected ?User $adminUser = null;
    protected ?User $guruUser = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->adminUser = User::where('username', 'dev_admin')->first();
        $this->guruUser = User::where('username', 'dev_guru_walikelas')->first();
    }

    /**
     * 1. Unauthenticated requests to academic endpoints must receive HTTP 401.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/academic/years')->assertStatus(401);
        $this->getJson('/api/v1/academic/semesters')->assertStatus(401);
        $this->getJson('/api/v1/academic/classes')->assertStatus(401);
        $this->getJson('/api/v1/academic/subjects')->assertStatus(401);
    }

    /**
     * 2. Non-admin users (guru) must receive HTTP 403 on academic management endpoints.
     */
    public function test_non_admin_cannot_access_academic_endpoints(): void
    {
        $this->actingAs($this->guruUser);

        $this->getJson('/api/v1/academic/years')->assertStatus(403);
        $this->postJson('/api/v1/academic/years', ['name' => '2099/2100'])->assertStatus(403);

        $this->getJson('/api/v1/academic/semesters')->assertStatus(403);
        $this->postJson('/api/v1/academic/semesters', ['name' => 'Ganjil'])->assertStatus(403);

        $this->getJson('/api/v1/academic/classes')->assertStatus(403);
        $this->postJson('/api/v1/academic/classes', ['name' => 'Kelas Test'])->assertStatus(403);

        $this->getJson('/api/v1/academic/subjects')->assertStatus(403);
        $this->postJson('/api/v1/academic/subjects', ['code' => 'TEST'])->assertStatus(403);
    }

    /**
     * 3. Admin can CRUD academic years with date range & uniqueness validation.
     */
    public function test_admin_can_crud_academic_years(): void
    {
        $this->actingAs($this->adminUser);

        // Validation rejects when end_date <= start_date
        $invalidDateResponse = $this->postJson('/api/v1/academic/years', [
            'name' => '2030/2031',
            'start_date' => '2030-07-15',
            'end_date' => '2030-05-10', // Invalid: end before start
        ]);
        $invalidDateResponse->assertStatus(422);
        $invalidDateResponse->assertJsonValidationErrors(['end_date']);

        // Create valid academic year
        $createResponse = $this->postJson('/api/v1/academic/years', [
            'name' => '2030/2031',
            'start_date' => '2030-07-15',
            'end_date' => '2031-06-25',
        ]);
        $createResponse->assertStatus(201);
        $createdId = $createResponse->json('data.id');

        $this->assertDatabaseHas('academic_years', [
            'id' => $createdId,
            'name' => '2030/2031',
        ]);

        // Duplicate name rejected
        $dupResponse = $this->postJson('/api/v1/academic/years', [
            'name' => '2030/2031',
            'start_date' => '2030-07-15',
            'end_date' => '2031-06-25',
        ]);
        $dupResponse->assertStatus(422);
        $dupResponse->assertJsonValidationErrors(['name']);

        // Update academic year
        $updateResponse = $this->putJson("/api/v1/academic/years/{$createdId}", [
            'name' => '2030/2031 (Revisi)',
            'start_date' => '2030-07-20',
            'end_date' => '2031-06-30',
        ]);
        $updateResponse->assertStatus(200);

        // Soft delete
        $deleteResponse = $this->deleteJson("/api/v1/academic/years/{$createdId}");
        $deleteResponse->assertStatus(200);
        $this->assertSoftDeleted('academic_years', ['id' => $createdId]);
    }

    /**
     * 4. Academic year cannot be deleted if it still has associated semesters.
     */
    public function test_academic_year_cannot_be_deleted_if_it_has_semesters(): void
    {
        $this->actingAs($this->adminUser);

        $year = AcademicYear::create([
            'name' => '2035/2036',
            'start_date' => '2035-07-15',
            'end_date' => '2036-06-25',
            'status' => 'Tidak Aktif',
        ]);

        Semester::create([
            'academic_year_id' => $year->id,
            'name' => 'Ganjil',
            'start_date' => '2035-07-15',
            'end_date' => '2035-12-20',
            'status' => 'Tidak Aktif',
        ]);

        $deleteResponse = $this->deleteJson("/api/v1/academic/years/{$year->id}");
        $deleteResponse->assertStatus(422);
        $this->assertStringContainsString('masih memiliki data semester terkait', $deleteResponse->json('message'));
    }

    /**
     * 5. Activating academic year safely deactivates previously active year to 'Tidak Aktif'.
     */
    public function test_admin_can_activate_academic_year_safely(): void
    {
        $this->actingAs($this->adminUser);

        $yearA = AcademicYear::create([
            'name' => '2040/2041',
            'start_date' => '2040-07-15',
            'end_date' => '2041-06-25',
            'status' => 'Aktif',
        ]);

        $yearB = AcademicYear::create([
            'name' => '2041/2042',
            'start_date' => '2041-07-15',
            'end_date' => '2042-06-25',
            'status' => 'Tidak Aktif',
        ]);

        $activateResponse = $this->postJson("/api/v1/academic/years/{$yearB->id}/activate");
        $activateResponse->assertStatus(200);

        // Year B is now 'Aktif'
        $this->assertEquals('Aktif', $yearB->fresh()->status);
        // Year A is now 'Tidak Aktif' (NOT 'Selesai')
        $this->assertEquals('Tidak Aktif', $yearA->fresh()->status);
    }

    /**
     * 6. Admin can CRUD semesters with date bounds inside academic year.
     */
    public function test_admin_can_crud_semesters(): void
    {
        $this->actingAs($this->adminUser);

        $year = AcademicYear::create([
            'name' => '2050/2051',
            'start_date' => '2050-07-15',
            'end_date' => '2051-06-25',
            'status' => 'Tidak Aktif',
        ]);

        // Date outside year boundaries rejected
        $outOfBounds = $this->postJson('/api/v1/academic/semesters', [
            'academic_year_id' => $year->id,
            'name' => 'Ganjil',
            'start_date' => '2050-06-01', // Before year start!
            'end_date' => '2050-12-20',
        ]);
        $outOfBounds->assertStatus(422);
        $outOfBounds->assertJsonValidationErrors(['start_date']);

        // Create valid Ganjil semester
        $createResponse = $this->postJson('/api/v1/academic/semesters', [
            'academic_year_id' => $year->id,
            'name' => 'Ganjil',
            'start_date' => '2050-07-15',
            'end_date' => '2050-12-20',
        ]);
        $createResponse->assertStatus(201);
        $semId = $createResponse->json('data.id');

        // Duplicate Ganjil in same academic year rejected
        $dupResponse = $this->postJson('/api/v1/academic/semesters', [
            'academic_year_id' => $year->id,
            'name' => 'Ganjil',
            'start_date' => '2050-07-15',
            'end_date' => '2050-12-20',
        ]);
        $dupResponse->assertStatus(422);
        $dupResponse->assertJsonValidationErrors(['name']);

        // Soft delete semester
        $deleteResponse = $this->deleteJson("/api/v1/academic/semesters/{$semId}");
        $deleteResponse->assertStatus(200);
        $this->assertSoftDeleted('semesters', ['id' => $semId]);
    }

    /**
     * 7. Activating semester requires parent academic year to be active.
     */
    public function test_semester_activation_requires_active_academic_year(): void
    {
        $this->actingAs($this->adminUser);

        $inactiveYear = AcademicYear::create([
            'name' => '2060/2061',
            'start_date' => '2060-07-15',
            'end_date' => '2061-06-25',
            'status' => 'Tidak Aktif',
        ]);

        $sem = Semester::create([
            'academic_year_id' => $inactiveYear->id,
            'name' => 'Ganjil',
            'start_date' => '2060-07-15',
            'end_date' => '2060-12-20',
            'status' => 'Tidak Aktif',
        ]);

        // Attempt activation while year is inactive should fail with 422
        $failResponse = $this->postJson("/api/v1/academic/semesters/{$sem->id}/activate");
        $failResponse->assertStatus(422);
        $this->assertStringContainsString('belum berstatus Aktif', $failResponse->json('message'));

        // Now activate the year first
        $inactiveYear->update(['status' => 'Aktif']);

        // Now semester activation succeeds
        $successResponse = $this->postJson("/api/v1/academic/semesters/{$sem->id}/activate");
        $successResponse->assertStatus(200);
        $this->assertEquals('Aktif', $sem->fresh()->status);
    }

    /**
     * 8. Class codes can be reused across different academic years, but are unique within the same year.
     */
    public function test_class_codes_can_be_reused_across_years(): void
    {
        $this->actingAs($this->adminUser);

        $yearA = AcademicYear::create([
            'name' => '2070/2071',
            'start_date' => '2070-07-15',
            'end_date' => '2071-06-25',
            'status' => 'Aktif',
        ]);

        $yearB = AcademicYear::create([
            'name' => '2071/2072',
            'start_date' => '2071-07-15',
            'end_date' => '2072-06-25',
            'status' => 'Tidak Aktif',
        ]);

        // Create class in Year A
        $createA = $this->postJson('/api/v1/academic/classes', [
            'academic_year_id' => $yearA->id,
            'code' => 'X-TEST-1',
            'name' => 'X Test 1',
            'grade' => 'X',
            'capacity' => 36,
        ]);
        $createA->assertStatus(201);

        // Creating SAME code 'X-TEST-1' in Year B MUST SUCCEED (reusable across years)
        $createB = $this->postJson('/api/v1/academic/classes', [
            'academic_year_id' => $yearB->id,
            'code' => 'X-TEST-1',
            'name' => 'X Test 1',
            'grade' => 'X',
            'capacity' => 36,
        ]);
        $createB->assertStatus(201);

        // Creating SAME code 'X-TEST-1' again in Year A MUST FAIL with 422
        $createADup = $this->postJson('/api/v1/academic/classes', [
            'academic_year_id' => $yearA->id,
            'code' => 'X-TEST-1',
            'name' => 'X Test 1 Duplicate',
            'grade' => 'X',
            'capacity' => 36,
        ]);
        $createADup->assertStatus(422);
        $createADup->assertJsonValidationErrors(['code']);
    }

    /**
     * 9. Admin can CRUD subjects with unique code validation.
     */
    public function test_admin_can_crud_subjects(): void
    {
        $this->actingAs($this->adminUser);

        $createResponse = $this->postJson('/api/v1/academic/subjects', [
            'code' => 'ASTRONOMI',
            'name' => 'Astronomi dan Kebumian',
            'group' => 'IPA',
            'grades' => 'XI, XII',
            'weekly_hours' => 3,
        ]);
        $createResponse->assertStatus(201);
        $subId = $createResponse->json('data.id');

        // Duplicate code fails
        $dupResponse = $this->postJson('/api/v1/academic/subjects', [
            'code' => 'ASTRONOMI',
            'name' => 'Astronomi Lain',
            'group' => 'IPA',
        ]);
        $dupResponse->assertStatus(422);
        $dupResponse->assertJsonValidationErrors(['code']);

        // Update subject
        $updateResponse = $this->putJson("/api/v1/academic/subjects/{$subId}", [
            'code' => 'ASTRONOMI',
            'name' => 'Astronomi Modern',
            'group' => 'IPA',
            'weekly_hours' => 4,
        ]);
        $updateResponse->assertStatus(200);

        // Soft delete
        $deleteResponse = $this->deleteJson("/api/v1/academic/subjects/{$subId}");
        $deleteResponse->assertStatus(200);
        $this->assertSoftDeleted('subjects', ['id' => $subId]);
    }
}
