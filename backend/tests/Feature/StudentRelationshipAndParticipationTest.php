<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\Extracurricular;
use App\Models\FinalCourseGrade;
use App\Models\HomeroomAssignment;
use App\Models\HomeroomNote;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentCocurricular;
use App\Models\StudentExtracurricular;
use App\Models\StudentScore;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tests\TestCase;

class StudentRelationshipAndParticipationTest extends TestCase
{
    protected User $adminUser;
    protected User $guruUser;
    protected SchoolClass $class;
    protected Semester $semester;
    protected Student $student;
    protected Extracurricular $ekskul;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);

        $this->adminUser = User::firstOrCreate(
            ['username' => 'test_admin_remediation'],
            [
                'name' => 'Admin Remediation Test',
                'email' => 'admin_remediation@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->adminUser->roles()->where('role_id', $adminRole->id)->exists()) {
            $this->adminUser->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        $this->guruUser = User::firstOrCreate(
            ['username' => 'test_guru_remediation'],
            [
                'name' => 'Guru Remediation Test',
                'email' => 'guru_remediation@test.local',
                'password' => 'secret123',
                'is_active' => true,
            ]
        );
        if (!$this->guruUser->roles()->where('role_id', $guruRole->id)->exists()) {
            $this->guruUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        }

        $year = AcademicYear::firstOrCreate(
            ['name' => '2024/2025'],
            ['start_date' => '2024-07-01', 'end_date' => '2025-06-30', 'status' => 'Aktif']
        );
        $this->semester = Semester::firstOrCreate(
            ['academic_year_id' => $year->id, 'name' => 'Ganjil'],
            ['status' => 'Aktif', 'start_date' => '2024-07-15', 'end_date' => '2024-12-20']
        );

        $this->class = SchoolClass::firstOrCreate(
            ['academic_year_id' => $year->id, 'name' => 'X Remediasi 1'],
            ['code' => 'X-REM-1', 'grade' => 'X', 'status' => 'Aktif']
        );

        $this->student = Student::firstOrCreate(
            ['nis' => '999901'],
            [
                'nisn' => '0099990001',
                'name' => 'Siswa Test Remediasi',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '2008-05-10',
                'status' => 'Aktif',
                'current_class_name' => 'X Remediasi 1',
            ]
        );

        $this->ekskul = Extracurricular::firstOrCreate(
            ['code' => 'EKS-FUT'],
            ['name' => 'Futsal Prestasi', 'status' => 'Aktif']
        );

        ClassMember::firstOrCreate(
            [
                'class_id' => $this->class->id,
                'semester_id' => $this->semester->id,
                'student_id' => $this->student->id,
            ],
            [
                'academic_year_id' => $year->id,
                'status' => 'Aktif',
            ]
        );
    }

    public function test_student_has_formal_reverse_relationships(): void
    {
        $this->assertInstanceOf(HasMany::class, $this->student->finalGrades());
        $this->assertInstanceOf(HasMany::class, $this->student->studentExtracurriculars());
        $this->assertInstanceOf(HasMany::class, $this->student->attendances());
        $this->assertInstanceOf(HasMany::class, $this->student->scores());
        $this->assertInstanceOf(HasMany::class, $this->student->cocurriculars());
        $this->assertInstanceOf(HasMany::class, $this->student->homeroomNotes());
    }

    public function test_admin_can_save_and_retrieve_extracurricular_participation(): void
    {
        $payload = [
            'class_id' => $this->class->id,
            'semester_id' => $this->semester->id,
            'items' => [
                [
                    'student_id' => $this->student->id,
                    'activities' => [
                        [
                            'extracurricular_id' => $this->ekskul->id,
                            'activity_name' => $this->ekskul->name,
                            'predicate' => 'Sangat Baik',
                            'description' => 'Kapten tim futsal sekolah dan aktif latihan mingguan',
                        ],
                    ],
                ],
            ],
        ];

        $saveResponse = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/assessment/extracurriculars/batch', $payload);

        $saveResponse->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        // Verify retrieval via supplementary data endpoint
        $getResponse = $this->actingAs($this->adminUser)
            ->getJson("/api/v1/assessment/supplementary/{$this->class->id}/{$this->semester->id}");

        $getResponse->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $students = $getResponse->json('data.students');
        $this->assertNotEmpty($students);

        $foundStudent = collect($students)->firstWhere('student_id', $this->student->id);
        $this->assertNotNull($foundStudent);
        $this->assertNotEmpty($foundStudent['extracurriculars']);
        $this->assertEquals($this->ekskul->name, $foundStudent['extracurriculars'][0]['name']);
        $this->assertEquals('Sangat Baik', $foundStudent['extracurriculars'][0]['predicate']);
    }

    public function test_extracurricular_participation_persists_in_database_after_reload(): void
    {
        $payload = [
            'class_id' => $this->class->id,
            'semester_id' => $this->semester->id,
            'items' => [
                [
                    'student_id' => $this->student->id,
                    'activities' => [
                        [
                            'extracurricular_id' => $this->ekskul->id,
                            'activity_name' => $this->ekskul->name,
                            'predicate' => 'Sangat Baik',
                            'description' => 'Kapten tim futsal sekolah',
                        ],
                    ],
                ],
            ],
        ];

        $this->actingAs($this->adminUser)
            ->postJson('/api/v1/assessment/extracurriculars/batch', $payload)
            ->assertOk();

        // Query fresh from DB model using new Student reverse relationship
        $freshStudent = Student::find($this->student->id);
        $participations = $freshStudent->studentExtracurriculars()
            ->where('semester_id', $this->semester->id)
            ->get();

        $this->assertNotEmpty($participations);
        $firstPart = $participations->first();
        $this->assertEquals($this->ekskul->id, $firstPart->extracurricular_id);
        $this->assertEquals($this->ekskul->name, $firstPart->activity_name);
        $this->assertEquals('Sangat Baik', $firstPart->predicate);
    }

    public function test_cannot_save_extracurricular_with_invalid_extracurricular_id(): void
    {
        $payload = [
            'class_id' => $this->class->id,
            'semester_id' => $this->semester->id,
            'items' => [
                [
                    'student_id' => $this->student->id,
                    'activities' => [
                        [
                            'extracurricular_id' => 99999999, // non-existent
                            'predicate' => 'Baik',
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/assessment/extracurriculars/batch', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.activities.0.extracurricular_id']);
    }

    public function test_unauthorized_guru_cannot_save_extracurriculars_without_homeroom(): void
    {
        $payload = [
            'class_id' => $this->class->id,
            'semester_id' => $this->semester->id,
            'items' => [
                [
                    'student_id' => $this->student->id,
                    'activities' => [
                        [
                            'extracurricular_id' => $this->ekskul->id,
                            'predicate' => 'Baik',
                        ],
                    ],
                ],
            ],
        ];

        // guruUser is not homeroom teacher for $this->class
        $response = $this->actingAs($this->guruUser)
            ->postJson('/api/v1/assessment/extracurriculars/batch', $payload);

        $response->assertStatus(403);
    }
}
