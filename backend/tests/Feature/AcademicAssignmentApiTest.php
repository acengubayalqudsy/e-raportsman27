<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\HomeroomAssignment;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Tests\TestCase;

class AcademicAssignmentApiTest extends TestCase
{
    protected User $adminUser;
    protected User $regularUser;
    protected AcademicYear $year1;
    protected AcademicYear $year2;
    protected Semester $sem1;
    protected Semester $sem2;
    protected SchoolClass $classA;
    protected SchoolClass $classB;
    protected Student $student1;
    protected Student $student2;
    protected Teacher $teacher1;
    protected Teacher $teacher2;
    protected Subject $subject1;
    protected Subject $subject2;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);

        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_assignment'],
            [
                'name' => 'Admin Assignment Test',
                'email' => 'admin_assign@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        $this->regularUser = User::firstOrCreate(
            ['username' => 'test_guru_assignment'],
            [
                'name' => 'Guru Assignment Test',
                'email' => 'guru_assign@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->regularUser->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->regularUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        }

        // Academic Years
        $this->year1 = AcademicYear::firstOrCreate(
            ['name' => '2024/2025'],
            [
                'start_date' => '2024-07-15',
                'end_date' => '2025-06-30',
                'status' => 'Aktif',
            ]
        );

        $this->year2 = AcademicYear::firstOrCreate(
            ['name' => '2025/2026'],
            [
                'start_date' => '2025-07-15',
                'end_date' => '2026-06-30',
                'status' => 'Tidak Aktif',
            ]
        );

        // Semesters
        $this->sem1 = Semester::firstOrCreate(
            [
                'academic_year_id' => $this->year1->id,
                'name' => 'Ganjil',
            ],
            [
                'start_date' => '2024-07-15',
                'end_date' => '2024-12-20',
                'status' => 'Aktif',
            ]
        );

        $this->sem2 = Semester::firstOrCreate(
            [
                'academic_year_id' => $this->year1->id,
                'name' => 'Genap',
            ],
            [
                'start_date' => '2025-01-06',
                'end_date' => '2025-06-25',
                'status' => 'Tidak Aktif',
            ]
        );

        // Classes
        $this->classA = SchoolClass::firstOrCreate(
            ['code' => 'X-1'],
            [
                'academic_year_id' => $this->year1->id,
                'name' => 'X Merdeka 1',
                'grade' => 'X',
                'capacity' => 36,
                'status' => 'Aktif',
            ]
        );

        $this->classB = SchoolClass::firstOrCreate(
            ['code' => 'X-2'],
            [
                'academic_year_id' => $this->year1->id,
                'name' => 'X Merdeka 2',
                'grade' => 'X',
                'capacity' => 36,
                'status' => 'Aktif',
            ]
        );

        // Students
        $this->student1 = Student::firstOrCreate(
            ['nis' => '10001'],
            [
                'nisn' => '0010000001',
                'name' => 'Siswa Satu',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '2008-01-01',
                'status' => 'Aktif',
            ]
        );

        $this->student2 = Student::firstOrCreate(
            ['nis' => '10002'],
            [
                'nisn' => '0010000002',
                'name' => 'Siswa Dua',
                'gender' => 'P',
                'birth_place' => 'Garut',
                'birth_date' => '2008-02-02',
                'status' => 'Aktif',
            ]
        );

        // Teachers
        $this->teacher1 = Teacher::firstOrCreate(
            ['nip' => '198001012005011001'],
            [
                'name' => 'Guru Satu, S.Pd.',
                'gender' => 'L',
                'employment_status' => 'ASN',
                'status' => 'Aktif',
            ]
        );

        $this->teacher2 = Teacher::firstOrCreate(
            ['nip' => '198502022008022002'],
            [
                'name' => 'Guru Dua, M.Pd.',
                'gender' => 'P',
                'employment_status' => 'PPPK',
                'status' => 'Aktif',
            ]
        );

        // Subjects
        $this->subject1 = Subject::firstOrCreate(
            ['code' => 'MAT'],
            [
                'name' => 'Matematika',
                'group' => 'Umum',
                'weekly_hours' => 4,
                'status' => 'Aktif',
            ]
        );

        $this->subject2 = Subject::firstOrCreate(
            ['code' => 'FIS'],
            [
                'name' => 'Fisika',
                'group' => 'IPA',
                'weekly_hours' => 3,
                'status' => 'Aktif',
            ]
        );
    }

    public function test_can_enroll_students_in_rombel_and_list_members(): void
    {
        $payload = [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'student_ids' => [$this->student1->id, $this->student2->id],
            'join_date' => '2024-07-15',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/rombel/members', $payload);
        $res->assertStatus(201)
            ->assertJson(['success' => true, 'count' => 2]);

        $this->assertDatabaseHas('class_members', [
            'class_id' => $this->classA->id,
            'student_id' => $this->student1->id,
            'semester_id' => $this->sem1->id,
            'status' => 'Aktif',
        ]);

        // List members
        $listRes = $this->actingAs($this->adminUser)->getJson("/api/v1/academic/rombel/members?class_id={$this->classA->id}&semester_id={$this->sem1->id}");
        $listRes->assertStatus(200)
            ->assertJsonPath('meta.total', 2);
    }

    public function test_cannot_enroll_student_in_two_classes_in_same_semester(): void
    {
        // Enroll in classA
        ClassMember::create([
            'academic_year_id' => $this->year1->id,
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'student_id' => $this->student1->id,
            'status' => 'Aktif',
        ]);

        // Try enrolling same student in classB for same semester
        $payload = [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classB->id,
            'student_ids' => [$this->student1->id],
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/rombel/members', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['student_ids']);
    }

    public function test_cannot_enroll_student_if_class_year_does_not_match_semester(): void
    {
        // Class belonging to year 2
        $classYear2 = SchoolClass::create([
            'academic_year_id' => $this->year2->id,
            'code' => 'X-YEAR2',
            'name' => 'X Rombel Tahun 2',
            'grade' => 'X',
            'status' => 'Aktif',
        ]);

        // Try enrolling with sem1 (belonging to year 1)
        $payload = [
            'semester_id' => $this->sem1->id,
            'class_id' => $classYear2->id,
            'student_ids' => [$this->student1->id],
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/rombel/members', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['class_id']);
    }

    public function test_can_transfer_student_to_another_class_with_mutation_status(): void
    {
        $member = ClassMember::create([
            'academic_year_id' => $this->year1->id,
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'student_id' => $this->student1->id,
            'status' => 'Aktif',
            'join_date' => '2024-07-15',
        ]);

        $payload = [
            'target_class_id' => $this->classB->id,
            'transfer_date' => '2024-09-01',
            'reason' => 'Pindah peminatan',
        ];

        $res = $this->actingAs($this->adminUser)->postJson("/api/v1/academic/rombel/transfer/{$member->id}", $payload);
        $res->assertStatus(200)
            ->assertJson(['success' => true]);

        // Old member is now 'Pindah Rombel'
        $this->assertDatabaseHas('class_members', [
            'id' => $member->id,
            'status' => 'Pindah Rombel',
        ]);

        // New member is created in classB
        $this->assertDatabaseHas('class_members', [
            'class_id' => $this->classB->id,
            'student_id' => $this->student1->id,
            'status' => 'Aktif',
        ]);
    }

    public function test_student_enrollment_persists_across_different_semesters_without_overwriting(): void
    {
        // Semester 1
        ClassMember::create([
            'academic_year_id' => $this->year1->id,
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'student_id' => $this->student1->id,
            'status' => 'Aktif',
        ]);

        // Semester 2
        $payload = [
            'semester_id' => $this->sem2->id,
            'class_id' => $this->classA->id,
            'student_ids' => [$this->student1->id],
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/rombel/members', $payload);
        $res->assertStatus(201);

        // Both records exist
        $this->assertEquals(2, ClassMember::where('student_id', $this->student1->id)->count());
    }

    public function test_can_assign_homeroom_teacher(): void
    {
        $payload = [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'teacher_id' => $this->teacher1->id,
            'assignment_date' => '2024-07-15',
            'sk_number' => 'SK/421/001/2024',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/homeroom/assignments', $payload);
        $res->assertStatus(201)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('homeroom_assignments', [
            'class_id' => $this->classA->id,
            'teacher_id' => $this->teacher1->id,
            'semester_id' => $this->sem1->id,
            'status' => 'Aktif',
        ]);
    }

    public function test_cannot_assign_two_active_homeroom_teachers_to_same_class(): void
    {
        HomeroomAssignment::create([
            'academic_year_id' => $this->year1->id,
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'teacher_id' => $this->teacher1->id,
            'assignment_date' => '2024-07-15',
            'status' => 'Aktif',
        ]);

        // Try assigning teacher2 as homeroom for classA in same semester
        $payload = [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'teacher_id' => $this->teacher2->id,
            'assignment_date' => '2024-07-15',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/homeroom/assignments', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['class_id']);
    }

    public function test_cannot_assign_same_teacher_as_homeroom_to_two_different_classes(): void
    {
        HomeroomAssignment::create([
            'academic_year_id' => $this->year1->id,
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'teacher_id' => $this->teacher1->id,
            'assignment_date' => '2024-07-15',
            'status' => 'Aktif',
        ]);

        // Try assigning teacher1 as homeroom for classB
        $payload = [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classB->id,
            'teacher_id' => $this->teacher1->id,
            'assignment_date' => '2024-07-15',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/homeroom/assignments', $payload);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['teacher_id']);
    }

    public function test_can_assign_course_and_prevent_duplicate_utama_role(): void
    {
        $payload = [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
        ];

        $res = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/course-assignments', $payload);
        $res->assertStatus(201)
            ->assertJson(['success' => true]);

        // Try adding another teacher as 'Utama' for same class + subject + semester
        $payload2 = [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher2->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
        ];

        $res2 = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/course-assignments', $payload2);
        $res2->assertStatus(422)
            ->assertJsonValidationErrors(['teacher_id']);
    }

    public function test_teacher_can_teach_multiple_classes_and_multiple_subjects(): void
    {
        // Teacher 1 teaches Subject 1 in Class A
        CourseAssignment::create([
            'academic_year_id' => $this->year1->id,
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
            'status' => 'Aktif',
        ]);

        // Teacher 1 ALSO teaches Subject 1 in Class B
        $res1 = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/course-assignments', [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classB->id,
            'subject_id' => $this->subject1->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 4,
            'role' => 'Utama',
        ]);
        $res1->assertStatus(201);

        // Teacher 1 ALSO teaches Subject 2 in Class A (Pendamping)
        $res2 = $this->actingAs($this->adminUser)->postJson('/api/v1/academic/course-assignments', [
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'subject_id' => $this->subject2->id,
            'teacher_id' => $this->teacher1->id,
            'weekly_hours' => 2,
            'role' => 'Pendamping',
        ]);
        $res2->assertStatus(201);

        $this->assertEquals(3, CourseAssignment::where('teacher_id', $this->teacher1->id)->count());
    }

    public function test_academic_assignments_unauthenticated_and_unauthorized_checks(): void
    {
        // Unauthenticated -> 401
        $this->getJson('/api/v1/academic/rombel/members')->assertStatus(401);
        $this->postJson('/api/v1/academic/rombel/members', [])->assertStatus(401);
        $this->postJson('/api/v1/academic/homeroom/assignments', [])->assertStatus(401);
        $this->postJson('/api/v1/academic/course-assignments', [])->assertStatus(401);

        // Non-admin user -> 403
        $this->actingAs($this->regularUser)
            ->postJson('/api/v1/academic/rombel/members', [
                'semester_id' => $this->sem1->id,
                'class_id' => $this->classA->id,
                'student_ids' => [$this->student1->id],
            ])
            ->assertStatus(403);
    }

    public function test_assignment_stats_and_sync_contracts(): void
    {
        ClassMember::create([
            'academic_year_id' => $this->year1->id,
            'semester_id' => $this->sem1->id,
            'class_id' => $this->classA->id,
            'student_id' => $this->student1->id,
            'status' => 'Aktif',
        ]);

        $this->actingAs($this->adminUser)
            ->getJson("/api/v1/academic/rombel/stats?semester_id={$this->sem1->id}")
            ->assertOk()
            ->assertJsonPath('data.active_members', 1);

        $this->getJson("/api/v1/academic/homeroom/stats?semester_id={$this->sem1->id}")
            ->assertOk()
            ->assertJsonStructure(['data' => ['assigned_classes', 'unassigned_classes']]);

        $this->getJson("/api/v1/academic/rombel/sync-preview?semester_id={$this->sem1->id}")
            ->assertOk()
            ->assertJsonPath('data.out_of_sync', 1);

        $this->postJson('/api/v1/academic/rombel/sync-commit', ['semester_id' => $this->sem1->id])
            ->assertOk()
            ->assertJsonPath('data.updated_count', 1);

        $this->assertDatabaseHas('students', [
            'id' => $this->student1->id,
            'current_class_name' => $this->classA->name,
        ]);
    }
}
