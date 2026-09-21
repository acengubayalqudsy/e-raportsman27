<?php

namespace Tests\Feature;

use App\Models\Teacher;
use App\Models\User;
use Tests\TestCase;

class TeacherApiTest extends TestCase
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
        $response = $this->getJson('/api/v1/master/teachers');
        $response->assertStatus(401);
    }

    /**
     * 2. Non-admin user (guru) must receive HTTP 403 on all master teachers endpoints.
     */
    public function test_non_admin_cannot_access_teachers_endpoints(): void
    {
        $this->actingAs($this->guruUser);

        // GET index rejected
        $this->getJson('/api/v1/master/teachers')->assertStatus(403);

        // GET stats rejected
        $this->getJson('/api/v1/master/teachers/stats')->assertStatus(403);

        // GET detail rejected
        $this->getJson('/api/v1/master/teachers/1')->assertStatus(403);

        // POST store rejected
        $this->postJson('/api/v1/master/teachers', [
            'name' => 'Guru Hacker',
            'gender' => 'Laki-laki',
            'employment_status' => 'Honorer',
        ])->assertStatus(403);

        // PUT update rejected
        $this->putJson('/api/v1/master/teachers/1', [
            'name' => 'Guru Hacker Edit',
            'gender' => 'Laki-laki',
            'employment_status' => 'Honorer',
        ])->assertStatus(403);

        // DELETE destroy rejected
        $this->deleteJson('/api/v1/master/teachers/1')->assertStatus(403);
    }

    /**
     * 3. Admin can access stats endpoint and receive accurate aggregates.
     */
    public function test_admin_can_access_stats_endpoint(): void
    {
        $this->actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/master/teachers/stats');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'total',
                'active',
                'inactive',
                'male',
                'female',
                'asn',
                'pppk',
                'honorer',
            ],
        ]);

        $this->assertTrue($response->json('data.total') >= 15);
        $this->assertTrue($response->json('data.active') >= 1);
        $this->assertTrue($response->json('data.asn') >= 1);
    }

    /**
     * 4. Admin can fetch paginated teachers list.
     */
    public function test_admin_can_fetch_paginated_teachers(): void
    {
        $this->actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/master/teachers?per_page=5&page=1');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'nip',
                    'nuptk',
                    'gender',
                    'gender_code',
                    'genderCode',
                    'birth_place',
                    'birth_date',
                    'birth',
                    'avatar',
                    'phone',
                    'email',
                    'address',
                    'employment_status',
                    'employmentStatus',
                    'type',
                    'subject',
                    'status',
                    'user_id',
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
     * 5. Search and filter by status, gender, and employment status work correctly.
     */
    public function test_teacher_filtering_and_search_work(): void
    {
        $this->actingAs($this->adminUser);

        // Create a unique fixture for search test
        $uniqueTeacher = Teacher::factory()->create([
            'name' => 'PROF. DR. ZULKARNAEN FIKTIF',
            'status' => 'Aktif',
            'gender' => 'L',
            'employment_status' => 'ASN',
        ]);

        // Search by unique name
        $searchResponse = $this->getJson('/api/v1/master/teachers?search=ZULKARNAEN');
        $searchResponse->assertStatus(200);
        $this->assertTrue(count($searchResponse->json('data')) >= 1);
        $this->assertEquals('PROF. DR. ZULKARNAEN FIKTIF', $searchResponse->json('data.0.name'));

        // Filter by employment status ASN
        $asnResponse = $this->getJson('/api/v1/master/teachers?employment_status=ASN');
        $asnResponse->assertStatus(200);
        $this->assertTrue(count($asnResponse->json('data')) >= 1);
        foreach ($asnResponse->json('data') as $item) {
            $this->assertEquals('ASN', $item['employment_status']);
        }
    }

    /**
     * 6. Admin can view detailed profile of an individual teacher.
     */
    public function test_admin_can_view_teacher_detail(): void
    {
        $this->actingAs($this->adminUser);

        $teacher = Teacher::first() ?? Teacher::factory()->create();
        $this->assertNotNull($teacher);

        $response = $this->getJson("/api/v1/master/teachers/{$teacher->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $teacher->id);
        $response->assertJsonPath('data.name', $teacher->name);
    }

    /**
     * 7. Required fields validation on creation returns HTTP 422.
     */
    public function test_create_teacher_requires_mandatory_fields(): void
    {
        $this->actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/master/teachers', []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'gender', 'employment_status']);
    }

    /**
     * 8. Teacher without NIP can be created successfully (Honorer / GTT).
     */
    public function test_teacher_without_nip_can_be_created(): void
    {
        $this->actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/master/teachers', [
            'name' => 'GURU HONORER TANPA NIP',
            'nip' => null,
            'nuptk' => null,
            'gender' => 'Perempuan',
            'birth_place' => 'Garut',
            'birth_date' => '1998-04-20',
            'phone' => '081299998888',
            'email' => 'honorer.tanpa.nip@sman27garut.local',
            'employment_status' => 'Honorer',
            'type' => 'Guru',
            'subject' => 'Seni Musik',
            'status' => 'Aktif',
        ]);

        $response->assertStatus(201);
        $createdId = $response->json('data.id');
        $this->assertNotNull($createdId);

        $this->assertDatabaseHas('teachers', [
            'id' => $createdId,
            'name' => 'GURU HONORER TANPA NIP',
            'nip' => null,
            'employment_status' => 'Honorer',
        ]);
    }

    /**
     * 9. Duplicate NIP and NUPTK are rejected with HTTP 422.
     */
    public function test_duplicate_nip_and_nuptk_are_rejected(): void
    {
        $this->actingAs($this->adminUser);

        $existing = Teacher::whereNotNull('nip')->first() ?? Teacher::factory()->create([
            'nip' => '198001012005011001',
            'nuptk' => '1122334455667788',
        ]);
        $this->assertNotNull($existing);

        // Test duplicate NIP
        $nipResponse = $this->postJson('/api/v1/master/teachers', [
            'name' => 'Guru NIP Duplikat',
            'nip' => $existing->nip,
            'gender' => 'Laki-laki',
            'employment_status' => 'ASN',
        ]);
        $nipResponse->assertStatus(422);
        $nipResponse->assertJsonValidationErrors(['nip']);

        // Test duplicate NUPTK
        if ($existing->nuptk) {
            $nuptkResponse = $this->postJson('/api/v1/master/teachers', [
                'name' => 'Guru NUPTK Duplikat',
                'nuptk' => $existing->nuptk,
                'gender' => 'Laki-laki',
                'employment_status' => 'PPPK',
            ]);
            $nuptkResponse->assertStatus(422);
            $nuptkResponse->assertJsonValidationErrors(['nuptk']);
        }
    }

    /**
     * 10. Admin can create and update teacher, persisting in DB.
     */
    public function test_admin_can_create_and_update_teacher(): void
    {
        $this->actingAs($this->adminUser);

        $testTeacher = Teacher::factory()->make([
            'name' => 'RAHMAT GUNAWAN, M.Pd.',
            'nip' => '198505152010011015',
            'gender' => 'L',
            'employment_status' => 'PPPK',
        ]);

        $createResponse = $this->postJson('/api/v1/master/teachers', [
            'name' => $testTeacher->name,
            'nip' => $testTeacher->nip,
            'nuptk' => $testTeacher->nuptk,
            'gender' => 'Laki-laki',
            'birth_place' => $testTeacher->birth_place,
            'birth_date' => $testTeacher->birth_date?->format('Y-m-d'),
            'phone' => '081299997777',
            'email' => 'rahmat.gunawan@sman27garut.local',
            'employment_status' => 'PPPK',
            'type' => 'Guru',
            'subject' => 'Fisika Terapan',
            'status' => 'Aktif',
        ]);

        $createResponse->assertStatus(201);
        $createdId = $createResponse->json('data.id');

        $this->assertDatabaseHas('teachers', [
            'id' => $createdId,
            'name' => 'RAHMAT GUNAWAN, M.Pd.',
            'nip' => '198505152010011015',
        ]);

        // Update teacher (same NIP allowed for self)
        $updateResponse = $this->putJson("/api/v1/master/teachers/{$createdId}", [
            'name' => 'DR. RAHMAT GUNAWAN, M.Pd.',
            'nip' => '198505152010011015',
            'gender' => 'Laki-laki',
            'employment_status' => 'ASN',
            'subject' => 'Fisika Inti',
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('teachers', [
            'id' => $createdId,
            'name' => 'DR. RAHMAT GUNAWAN, M.Pd.',
            'employment_status' => 'ASN',
            'subject' => 'Fisika Inti',
        ]);
    }

    /**
     * 11. Soft delete teacher hides record without deleting associated user account.
     */
    public function test_admin_can_soft_delete_teacher_without_deleting_user(): void
    {
        $this->actingAs($this->adminUser);

        $temporaryUser = User::factory()->create();
        $tempTeacher = Teacher::factory()->create([
            'name' => 'GURU SEMENTARA UNTUK DIHAPUS',
            'user_id' => $temporaryUser->id,
            'status' => 'Aktif',
        ]);

        $deleteResponse = $this->deleteJson("/api/v1/master/teachers/{$tempTeacher->id}");
        $deleteResponse->assertStatus(200);

        // Teacher is soft deleted
        $this->assertSoftDeleted('teachers', ['id' => $tempTeacher->id]);

        // User account MUST still exist and remain active
        $this->assertDatabaseHas('users', ['id' => $temporaryUser->id]);

        // It no longer appears in normal index
        $indexResponse = $this->getJson("/api/v1/master/teachers?search=" . urlencode('GURU SEMENTARA UNTUK DIHAPUS'));
        $indexResponse->assertStatus(200);
        $this->assertCount(0, $indexResponse->json('data'));
    }
}
