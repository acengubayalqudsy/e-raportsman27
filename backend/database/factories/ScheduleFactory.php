<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\CourseAssignment;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

class ScheduleFactory extends Factory
{
    protected $model = Schedule::class;

    public function definition(): array
    {
        return [
            'academic_year_id' => AcademicYear::factory(),
            'semester_id' => Semester::factory(),
            'class_id' => SchoolClass::factory(),
            'subject_id' => Subject::factory(),
            'teacher_id' => Teacher::factory(),
            'room_id' => Room::factory(),
            'course_assignment_id' => null,
            'day_of_week' => $this->faker->randomElement(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']),
            'start_time' => '07:30',
            'end_time' => '09:00',
            'status' => 'Aktif',
            'notes' => $this->faker->sentence(),
        ];
    }
}
