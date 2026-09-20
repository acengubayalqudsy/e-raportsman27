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
     * 2. Non-admin user (guru) must receive HTTP 403 on master students endpoints.
     */
    public function test_non_admin_cannot_access_students_endpoints(): void
    {
        $this->actingAs($this->guruUser);

        // GET index rejected
        $this->getJson('/api/v1/master/students')->assertStatus(403);

        // GET stats rejected
        $this->getJson('/api/v1/master/students/stats')->assertStatus(403);

        // GET detail rejected
        $this->getJson('/api/v1/master/students/1')->assertStatus(403);

        // POST store rejected
        $this->postJson('/api/v1/master/students', [
            'name' => 'Test Hacker',
            'nis' => '999999999',
            'nisn' => '9999999999',
        ])->assertStatus(403);
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
     * 5. Search and filter by class and status work correctly.
     */
    public function test_student_filtering_and_search_work(): void
    {
        $this->actingAs($this->adminUser);

        // Search by specific name
        $searchResponse = $this->getJson('/api/v1/master/students?search=ADITYA');
        $searchResponse->assertStatus(200);
        $this->assertTrue(count($searchResponse->json('data')) >= 1);
        $this->assertEquals('ADITYA PRATAMA', $searchResponse->json('data.0.name'));

        // Filter by status Alumni
        $alumniResponse = $this->getJson('/api/v1/master/students?status=Alumni');
        $alumniResponse->assertStatus(200);
        $this->assertCount(2, $alumniResponse->json('data'));
    }

    /**
     * 6. Admin can view detailed biodata of an individual student.
     */
    public function test_admin_can_view_student_detail(): void
    {
        $this->actingAs($this->adminUser);

        $student = Student::first();
        $this->assertNotNull($student);

        $response = $this->getJson("/api/v1/master/students/{$student->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $student->id);
        $response->assertJsonPath('data.nis', (string)$student->nis);
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

        $existing = Student::first();
        $this->assertNotNull($existing);

        $response = $this->postJson('/api/v1/master/students', [
            'name' => 'Siswa Baru Duplikat',
            'nis' => $existing->nis,
            'nisn' => '0099998888',
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
     */
    public function test_admin_can_create_and_update_student(): void
    {
        $this->actingAs($this->adminUser);

        $testNis = '999910001';
        $testNisn = '0099910001';

        // Cleanup if previously existed
        Student::withTrashed()->where('nis', $testNis)->forceDelete();

        $createResponse = $this->postJson('/api/v1/master/students', [
            'name' => 'MUHAMMAD ILHAM TESTING',
            'nis' => $testNis,
            'nisn' => $testNisn,
            'gender' => 'Laki-laki',
            'birth_place' => 'Garut',
            'birth_date' => '2008-05-15',
            'current_class_name' => 'X Merdeka 3',
            'religion' => 'Islam',
            'phone' => '081299990001',
            'address' => 'Jl. Pahlawan No. 99, Garut',
        ]);

        $createResponse->assertStatus(201);
        $createdId = $createResponse->json('data.id');
        $this->assertNotNull($createdId);

        // Verify persisted in database
        $this->assertDatabaseHas('students', [
            'id' => $createdId,
            'nis' => $testNis,
            'name' => 'MUHAMMAD ILHAM TESTING',
            'gender' => 'L',
        ]);

        // Update student (ignoring own NIS)
        $updateResponse = $this->putJson("/api/v1/master/students/{$createdId}", [
            'name' => 'MUHAMMAD ILHAM TESTING (EDITED)',
            'nis' => $testNis, // Same NIS is allowed for self
            'nisn' => $testNisn,
            'gender' => 'Laki-laki',
            'birth_place' => 'Bandung',
            'birth_date' => '2008-05-15',
            'current_class_name' => 'XI F1',
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('students', [
            'id' => $createdId,
            'name' => 'MUHAMMAD ILHAM TESTING (EDITED)',
            'birth_place' => 'Bandung',
        ]);

        // Clean up test record
        Student::where('id', $createdId)->forceDelete();
    }

    /**
     * 10. Admin can soft delete a student, hiding it from active lists without deleting users.
     */
    public function test_admin_can_soft_delete_student(): void
    {
        $this->actingAs($this->adminUser);

        $testNis = '999910002';
        $testNisn = '0099910002';

        // Create temporary student for soft delete test
        $tempStudent = Student::create([
            'name' => 'SISWA UNTUK DIHAPUS',
            'nis' => $testNis,
            'nisn' => $testNisn,
            'gender' => 'P',
            'birth_place' => 'Garut',
            'birth_date' => '2008-10-10',
            'current_class_name' => 'X Merdeka 1',
            'status' => 'Aktif',
        ]);

        $deleteResponse = $this->deleteJson("/api/v1/master/students/{$tempStudent->id}");
        $deleteResponse->assertStatus(200);

        // Verify soft deleted in DB (deleted_at is NOT NULL)
        $fresh = Student::withTrashed()->find($tempStudent->id);
        $this->assertNotNull($fresh);
        $this->assertTrue($fresh->trashed());

        // Verify it no longer appears in normal index
        $indexResponse = $this->getJson("/api/v1/master/students?search={$testNis}");
        $indexResponse->assertStatus(200);
        $this->assertCount(0, $indexResponse->json('data'));

        // Cleanup
        $fresh->forceDelete();
    }
}
