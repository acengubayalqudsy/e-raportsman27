<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Tests\TestCase;

class StudentApiTest extends TestCase
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
     * 1. Unauthenticated request must receive HTTP 401.
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/master/students');
        $response->assertStatus(401);
    }

    /**
     * 2. Non-admin user (guru) can read filtered students but cannot access stats, unauthorized students, or write endpoints.
     */
    public function test_non_admin_cannot_access_students_endpoints(): void
    {
        $this->actingAs($this->guruUser);

        // GET index allowed but returns filtered data (empty for unassigned teacher)
        $this->getJson('/api/v1/master/students')
            ->assertStatus(200)
            ->assertJson(['success' => true, 'data' => []]);

        // GET stats rejected (admin only)
        $this->getJson('/api/v1/master/students/stats')->assertStatus(403);

        // GET detail allowed for student inside teacher's assigned class
        $this->getJson('/api/v1/master/students/1')->assertStatus(200);

        // GET detail rejected for student outside teacher's assigned classes
        $outsideStudent = Student::where('id', '>', 10)->first();
        if ($outsideStudent) {
            $this->getJson("/api/v1/master/students/{$outsideStudent->id}")->assertStatus(403);
        }

        // POST store rejected (admin only)
        $this->postJson('/api/v1/master/students', [
            'name' => 'Test Hacker',
            'nis' => '999999999',
            'nisn' => '9999999999',
        ])->assertStatus(403);

        // DELETE rejected (admin only)
        $this->deleteJson('/api/v1/master/students/1')->assertStatus(403);
    }

    /**
     * 3. Admin can access stats endpoint and receive accurate aggregates.
     */
    public function test_admin_can_access_stats_endpoint(): void
    {
        $this->actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/master/students/stats');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'total',
                'male',
                'female',
                'active',
                'alumni',
                'mutated',
                'active_classes',
            ],
        ]);

        $this->assertTrue($response->json('data.total') >= 20);
        $this->assertEquals(2, $response->json('data.alumni'));
        $this->assertEquals(2, $response->json('data.mutated'));
    }

    /**
     * 4. Admin can fetch paginated students list with search and filters.
     */
    public function test_admin_can_fetch_paginated_students(): void
    {
        $this->actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/master/students?per_page=5&page=1');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'nis',
                    'nisn',
                    'gender',
                    'gender_code',
                    'birth_place',
                    'birth_date',
                    'birth',
                    'avatar',
                    'class_name',
                    'status',
                ],
            ],
            'meta' => [
                'current_page',
                'from',
                'last_page',
                'per_page',
                'to',
                'total',
            ],
        ]);

        $this->assertCount(5, $response->json('data'));
    }

    /**
     * 5. Search and filter by class and status work correctly using test fixtures.
     */
    public function test_student_filtering_and_search_work(): void
    {
        $this->actingAs($this->adminUser);

        // Create a unique student fixture for search testing
        $targetStudent = Student::factory()->create([
            'name' => 'ZULFIKAR AL-FATIH TEST',
            'status' => 'Aktif',
            'current_class_name' => 'X Merdeka 1',
        ]);

        // Search by unique name
        $searchResponse = $this->getJson('/api/v1/master/students?search=ZULFIKAR');
        $searchResponse->assertStatus(200);
        $this->assertTrue(count($searchResponse->json('data')) >= 1);
        $this->assertEquals('ZULFIKAR AL-FATIH TEST', $searchResponse->json('data.0.name'));

        // Filter by status Alumni
        $alumniResponse = $this->getJson('/api/v1/master/students?status=Alumni');
        $alumniResponse->assertStatus(200);
        $this->assertTrue(count($alumniResponse->json('data')) >= 2);
    }

    /**
     * 6. Admin can view detailed biodata of an individual student.
     */
    public function test_admin_can_view_student_detail(): void
    {
        $this->actingAs($this->adminUser);

        $student = Student::first() ?? Student::factory()->create();
        $this->assertNotNull($student);

        $response = $this->getJson("/api/v1/master/students/{$student->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $student->id);
        $response->assertJsonPath('data.nis', (string) $student->nis);
        $response->assertJsonPath('data.name', $student->name);
    }

    /**
     * 7. Required fields validation on creation returns HTTP 422.
     */
    public function test_create_student_requires_mandatory_fields(): void
    {
        $this->actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/master/students', []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'nis', 'nisn', 'gender', 'birth_place', 'birth_date', 'current_class_name']);
    }

    /**
     * 8. Duplicate NIS or NISN is rejected with HTTP 422.
     */
    public function test_duplicate_nis_and_nisn_are_rejected(): void
    {
        $this->actingAs($this->adminUser);

        $existing = Student::first() ?? Student::factory()->create();
        $this->assertNotNull($existing);

        $response = $this->postJson('/api/v1/master/students', [
            'name' => 'Siswa Baru Duplikat',
            'nis' => $existing->nis,
            'nisn' => fake()->unique()->numerify('008#######'),
            'gender' => 'Laki-laki',
            'birth_place' => 'Garut',
            'birth_date' => '2008-01-01',
            'current_class_name' => 'X Merdeka 1',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['nis']);
    }

    /**
     * 9. Admin can create a new student and it persists in the database.
     * Uses factory-generated test data and DatabaseTransactions for cleanup without forceDelete().
     */
    public function test_admin_can_create_and_update_student(): void
    {
        $this->actingAs($this->adminUser);

        $testStudent = Student::factory()->make([
            'name' => 'MUHAMMAD ILHAM TESTING',
            'gender' => 'L',
        ]);

        $birthDate = is_string($testStudent->birth_date)
            ? $testStudent->birth_date
            : $testStudent->birth_date->format('Y-m-d');

        $createResponse = $this->postJson('/api/v1/master/students', [
            'name' => $testStudent->name,
            'nis' => $testStudent->nis,
            'nisn' => $testStudent->nisn,
            'gender' => 'Laki-laki',
            'birth_place' => $testStudent->birth_place,
            'birth_date' => $birthDate,
            'current_class_name' => $testStudent->current_class_name,
            'religion' => 'Islam',
            'phone' => '081299990001',
            'address' => 'Jl. Pahlawan No. 99, Garut',
        ]);

        $createResponse->assertStatus(201);
        $createdId = $createResponse->json('data.id');
        $this->assertNotNull($createdId);

        // Verify persisted in isolated testing database
        $this->assertDatabaseHas('students', [
            'id' => $createdId,
            'nis' => $testStudent->nis,
            'name' => 'MUHAMMAD ILHAM TESTING',
            'gender' => 'L',
        ]);

        // Update student (ignoring own NIS)
        $updateResponse = $this->putJson("/api/v1/master/students/{$createdId}", [
            'name' => 'MUHAMMAD ILHAM TESTING (EDITED)',
            'nis' => $testStudent->nis, // Same NIS is allowed for self
            'nisn' => $testStudent->nisn,
            'gender' => 'Laki-laki',
            'birth_place' => 'Bandung',
            'birth_date' => $birthDate,
            'current_class_name' => 'XI F1',
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('students', [
            'id' => $createdId,
            'name' => 'MUHAMMAD ILHAM TESTING (EDITED)',
            'birth_place' => 'Bandung',
        ]);
        // Note: No forceDelete() needed! DatabaseTransactions automatically rolls back cleanly.
    }

    /**
     * 10. Admin can soft delete a student, hiding it from active lists without deleting records permanently.
     */
    public function test_admin_can_soft_delete_student(): void
    {
        $this->actingAs($this->adminUser);

        // Create temporary student for soft delete test using factory
        $tempStudent = Student::factory()->create([
            'name' => 'SISWA UNTUK DIHAPUS TEST',
            'status' => 'Aktif',
        ]);

        $deleteResponse = $this->deleteJson("/api/v1/master/students/{$tempStudent->id}");
        $deleteResponse->assertStatus(200);

        // Verify soft deleted in DB (deleted_at is NOT NULL)
        $fresh = Student::withTrashed()->find($tempStudent->id);
        $this->assertNotNull($fresh);
        $this->assertTrue($fresh->trashed());
        $this->assertSoftDeleted('students', ['id' => $tempStudent->id]);

        // Verify it no longer appears in normal index
        $indexResponse = $this->getJson("/api/v1/master/students?search={$tempStudent->nis}");
        $indexResponse->assertStatus(200);
        $this->assertCount(0, $indexResponse->json('data'));

        // Note: No forceDelete() needed! DatabaseTransactions automatically rolls back cleanly.
    }
}
