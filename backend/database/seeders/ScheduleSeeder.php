<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\CourseAssignment;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing', 'development'])) {
            return;
        }

        $semester = Semester::where('status', 'Aktif')->first() ?? Semester::first();
        if (!$semester) {
            return;
        }

        $year = $semester->academicYear ?? AcademicYear::first();
        $class = SchoolClass::first();
        $teacher = Teacher::first();
        $subject = Subject::first();
        $room = Room::first();

        if ($class && $teacher && $subject && $room) {
            Schedule::firstOrCreate(
                [
                    'academic_year_id' => $year->id,
                    'semester_id' => $semester->id,
                    'class_id' => $class->id,
                    'subject_id' => $subject->id,
                    'day_of_week' => 'Senin',
                    'start_time' => '07:30',
                ],
                [
                    'teacher_id' => $teacher->id,
                    'room_id' => $room->id,
                    'end_time' => '09:00',
                    'status' => 'Aktif',
                    'notes' => 'Jadwal Reguler Seed',
                ]
            );
        }
    }
}
