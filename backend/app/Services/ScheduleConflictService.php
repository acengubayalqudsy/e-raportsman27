<?php

namespace App\Services;

use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Validation\ValidationException;

class ScheduleConflictService
{
    /**
     * Validate times and detect conflicts for teacher, class, and room.
     * Throws ValidationException if a conflict or time ordering issue exists.
     *
     * @param array $data
     * @param int|null $ignoreId
     * @return void
     * @throws ValidationException
     */
    public function validateSchedule(array $data, ?int $ignoreId = null): void
    {
        $startTime = $data['start_time'];
        $endTime = $data['end_time'];
        $semesterId = $data['semester_id'];
        $dayOfWeek = $data['day_of_week'];
        $status = $data['status'] ?? 'Aktif';

        // 1. Time Order Validation: start_time must be strictly before end_time
        if ($startTime >= $endTime) {
            throw ValidationException::withMessages([
                'end_time' => ["Jam selesai ($endTime) harus lebih akhir dari jam mulai ($startTime)."],
            ]);
        }

        // If inactive, conflicts do not block
        if ($status !== 'Aktif') {
            return;
        }

        // 2. Conflict A: Teacher Overlap
        if (!empty($data['teacher_id'])) {
            $teacherConflict = Schedule::with(['schoolClass', 'subject'])
                ->where('semester_id', $semesterId)
                ->where('day_of_week', $dayOfWeek)
                ->where('teacher_id', $data['teacher_id'])
                ->where('status', 'Aktif')
                ->where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime)
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->first();

            if ($teacherConflict) {
                $teacher = Teacher::find($data['teacher_id']);
                $teacherName = $teacher?->name ?? 'Guru bersangkutan';
                $className = $teacherConflict->schoolClass?->name ?? 'Kelas lain';
                throw ValidationException::withMessages([
                    'teacher_id' => [
                        "Jadwal bentrok. Guru {$teacherName} sudah memiliki jadwal pada {$dayOfWeek}, {$teacherConflict->start_time}–{$teacherConflict->end_time} di kelas {$className}."
                    ],
                ]);
            }
        }

        // 3. Conflict B: Class / Rombel Overlap
        if (!empty($data['class_id'])) {
            $classConflict = Schedule::with(['subject', 'teacher'])
                ->where('semester_id', $semesterId)
                ->where('day_of_week', $dayOfWeek)
                ->where('class_id', $data['class_id'])
                ->where('status', 'Aktif')
                ->where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime)
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->first();

            if ($classConflict) {
                $schoolClass = SchoolClass::find($data['class_id']);
                $className = $schoolClass?->name ?? 'Rombel bersangkutan';
                $subjectName = $classConflict->subject?->name ?? 'Mata pelajaran lain';
                throw ValidationException::withMessages([
                    'class_id' => [
                        "Jadwal bentrok. Rombel {$className} sudah memiliki jadwal pelajaran {$subjectName} pada {$dayOfWeek}, {$classConflict->start_time}–{$classConflict->end_time}."
                    ],
                ]);
            }
        }

        // 4. Conflict C: Room Overlap
        if (!empty($data['room_id'])) {
            $roomConflict = Schedule::with(['schoolClass', 'teacher'])
                ->where('semester_id', $semesterId)
                ->where('day_of_week', $dayOfWeek)
                ->where('room_id', $data['room_id'])
                ->where('status', 'Aktif')
                ->where('start_time', '<', $endTime)
                ->where('end_time', '>', $startTime)
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->first();

            if ($roomConflict) {
                $room = Room::find($data['room_id']);
                $roomName = $room?->name ?? 'Ruangan bersangkutan';
                $className = $roomConflict->schoolClass?->name ?? 'Kelas lain';
                throw ValidationException::withMessages([
                    'room_id' => [
                        "Jadwal bentrok. Ruangan {$roomName} sedang digunakan untuk kelas {$className} pada {$dayOfWeek}, {$roomConflict->start_time}–{$roomConflict->end_time}."
                    ],
                ]);
            }
        }
    }
}
