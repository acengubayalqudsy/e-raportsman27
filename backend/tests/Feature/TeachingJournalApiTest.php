<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\CourseAssignment;
use App\Models\Role;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeachingJournal;
use App\Models\User;
use Tests\TestCase;

class TeachingJournalApiTest extends TestCase
{
    private User $admin;
    private User $teacherUser;
    private Teacher $teacher;
    private CourseAssignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrator']);
        $guruRole = Role::firstOrCreate(['name' => 'guru'], ['display_name' => 'Guru']);
        $this->admin = User::factory()->create();
        $this->admin->roles()->attach($adminRole->id, ['is_primary' => true]);
        $this->teacherUser = User::factory()->create();
        $this->teacherUser->roles()->attach($guruRole->id, ['is_primary' => true]);
        $this->teacher = Teacher::create([
            'user_id' => $this->teacherUser->id, 'nip' => 'JRN-'.uniqid(), 'name' => 'Guru Jurnal',
            'gender' => 'L', 'employment_status' => 'ASN', 'status' => 'Aktif',
        ]);
        $year = AcademicYear::create(['name' => 'Jurnal '.uniqid(), 'start_date' => '2024-07-15', 'end_date' => '2025-06-30', 'status' => 'Aktif']);
        $semester = Semester::create(['academic_year_id' => $year->id, 'name' => 'Ganjil', 'start_date' => '2024-07-15', 'end_date' => '2024-12-20', 'status' => 'Aktif']);
        $class = SchoolClass::create(['academic_year_id' => $year->id, 'code' => 'JRN-'.uniqid(), 'name' => 'X Jurnal', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif']);
        $subject = Subject::create(['code' => 'JRN-'.uniqid(), 'name' => 'Mapel Jurnal', 'group' => 'Umum', 'weekly_hours' => 2, 'status' => 'Aktif']);
        $this->assignment = CourseAssignment::create([
            'academic_year_id' => $year->id, 'semester_id' => $semester->id, 'class_id' => $class->id,
            'subject_id' => $subject->id, 'teacher_id' => $this->teacher->id, 'weekly_hours' => 2,
            'role' => 'Utama', 'status' => 'Aktif',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'academic_year_id' => $this->assignment->academic_year_id,
            'semester_id' => $this->assignment->semester_id,
            'class_id' => $this->assignment->class_id,
            'subject_id' => $this->assignment->subject_id,
            'teacher_id' => $this->assignment->teacher_id,
            'date' => '2024-08-01',
            'meeting' => 1,
            'material' => 'Bilangan',
            'activities' => 'Diskusi',
            'attendance_present' => 30,
            'attendance_total' => 32,
        ], $overrides);
    }

    private function createJournal(array $overrides = []): TeachingJournal
    {
        $journal = $this->actingAs($this->teacherUser)
            ->postJson('/api/v1/journals', $this->payload($overrides))
            ->assertCreated()
            ->json('data');

        return TeachingJournal::findOrFail($journal['id']);
    }

    private function otherTeacherUser(): User
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', 'guru')->first()->id, ['is_primary' => true]);

        return $user;
    }

    public function test_teacher_can_create_persist_and_read_own_journal_from_fresh_get(): void
    {
        $journal = $this->createJournal();

        $this->assertDatabaseHas('teaching_journals', [
            'id' => $journal->id, 'teacher_id' => $this->teacher->id, 'meeting' => 1,
        ]);
        $this->actingAs($this->teacherUser)
            ->getJson('/api/v1/journals/'.$journal->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $journal->id)
            ->assertJsonPath('data.material', 'Bilangan');
    }

    public function test_teacher_can_update_own_journal(): void
    {
        $journal = $this->createJournal();

        $this->actingAs($this->teacherUser)
            ->putJson('/api/v1/journals/'.$journal->id, [
                'material' => 'Persamaan Linear', 'meeting' => 2, 'attendance_present' => 31,
            ])
            ->assertOk()
            ->assertJsonPath('data.material', 'Persamaan Linear')
            ->assertJsonPath('data.meeting', 2);
        $this->assertDatabaseHas('teaching_journals', [
            'id' => $journal->id, 'material' => 'Persamaan Linear', 'meeting' => 2,
        ]);
    }

    public function test_other_teacher_cannot_read_update_or_delete_journal(): void
    {
        $journal = $this->createJournal();
        $other = $this->otherTeacherUser();

        $this->actingAs($other)->getJson('/api/v1/journals/'.$journal->id)->assertForbidden();
        $this->actingAs($other)->putJson('/api/v1/journals/'.$journal->id, ['material' => 'Tidak boleh'])->assertForbidden();
        $this->actingAs($other)->deleteJson('/api/v1/journals/'.$journal->id)->assertForbidden();
        $this->assertDatabaseHas('teaching_journals', ['id' => $journal->id]);
    }

    public function test_cross_class_subject_semester_and_academic_year_contexts_are_rejected(): void
    {
        $year = AcademicYear::findOrFail($this->assignment->academic_year_id);
        $otherClass = SchoolClass::create([
            'academic_year_id' => $year->id, 'code' => 'JRN-'.uniqid(), 'name' => 'XI Jurnal',
            'grade' => 'XI', 'capacity' => 36, 'status' => 'Aktif',
        ]);
        $otherSubject = Subject::create([
            'code' => 'JRN-'.uniqid(), 'name' => 'Mapel Lain', 'group' => 'Umum',
            'weekly_hours' => 2, 'status' => 'Aktif',
        ]);
        $otherSemester = Semester::create([
            'academic_year_id' => $year->id, 'name' => 'Genap', 'start_date' => '2025-01-06',
            'end_date' => '2025-06-20', 'status' => 'Aktif',
        ]);
        $otherYear = AcademicYear::create([
            'name' => 'Jurnal Lain '.uniqid(), 'start_date' => '2025-07-15',
            'end_date' => '2026-06-30', 'status' => 'Aktif',
        ]);
        $otherSemesterForYear = Semester::create([
            'academic_year_id' => $otherYear->id, 'name' => 'Ganjil', 'start_date' => '2025-07-15',
            'end_date' => '2025-12-20', 'status' => 'Aktif',
        ]);

        foreach ([
            ['class_id' => $otherClass->id],
            ['subject_id' => $otherSubject->id],
            ['semester_id' => $otherSemester->id],
            ['academic_year_id' => $otherYear->id, 'semester_id' => $otherSemesterForYear->id],
        ] as $mismatch) {
            $this->actingAs($this->teacherUser)
                ->postJson('/api/v1/journals', $this->payload($mismatch))
                ->assertStatus(422)
                ->assertJsonValidationErrors('academic_context');
        }
    }

    public function test_invalid_payload_is_rejected_including_present_greater_than_total(): void
    {
        $this->actingAs($this->teacherUser)
            ->postJson('/api/v1/journals', $this->payload([
                'date' => 'not-a-date', 'meeting' => 0, 'attendance_present' => 33, 'attendance_total' => 32,
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['date', 'meeting', 'attendance_total']);
    }

    public function test_date_outside_selected_semester_is_rejected(): void
    {
        $this->actingAs($this->teacherUser)
            ->postJson('/api/v1/journals', $this->payload(['date' => '2025-01-05']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('date');
    }

    public function test_admin_can_create_a_valid_journal_operation(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/v1/journals', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.teacher_id', $this->teacher->id);
        $this->assertDatabaseHas('teaching_journals', ['teacher_id' => $this->teacher->id, 'meeting' => 1]);
    }

    public function test_schedule_from_another_context_is_rejected_when_supplied(): void
    {
        $room = Room::create([
            'academic_year_id' => $this->assignment->academic_year_id, 'code' => 'R-'.uniqid(),
            'name' => 'Ruang Jurnal', 'capacity' => 36, 'room_type' => 'Kelas', 'status' => 'Aktif',
        ]);
        $otherClass = SchoolClass::create([
            'academic_year_id' => $this->assignment->academic_year_id, 'code' => 'JRN-'.uniqid(),
            'name' => 'Kelas Jadwal Lain', 'grade' => 'X', 'capacity' => 36, 'status' => 'Aktif',
        ]);
        $schedule = Schedule::create([
            'academic_year_id' => $this->assignment->academic_year_id,
            'semester_id' => $this->assignment->semester_id, 'class_id' => $otherClass->id,
            'subject_id' => $this->assignment->subject_id, 'teacher_id' => $this->teacher->id,
            'room_id' => $room->id, 'course_assignment_id' => null, 'day_of_week' => 'Senin',
            'start_time' => '07:00', 'end_time' => '08:00', 'status' => 'Aktif',
        ]);

        $this->actingAs($this->teacherUser)
            ->postJson('/api/v1/journals', $this->payload(['schedule_id' => $schedule->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('schedule_id');
    }
}
