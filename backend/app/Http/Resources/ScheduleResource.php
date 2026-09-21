<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->academicYear?->name ?? '-',
            'semester_id' => $this->semester_id,
            'semester_name' => $this->semester?->name ?? '-',
            'class_id' => $this->class_id,
            'class_name' => $this->schoolClass?->name ?? '-',
            'className' => $this->schoolClass?->name ?? '-',
            'subject_id' => $this->subject_id,
            'subject_name' => $this->subject?->name ?? '-',
            'subject_code' => $this->subject?->code ?? '-',
            'subject' => $this->subject?->name ?? '-',
            'teacher_id' => $this->teacher_id,
            'teacher_name' => $this->teacher?->name ?? '-',
            'teacher' => $this->teacher?->name ?? '-',
            'room_id' => $this->room_id,
            'room_name' => $this->room?->name ?? '-',
            'room_code' => $this->room?->code ?? '-',
            'room' => $this->room?->name ?? '-',
            'course_assignment_id' => $this->course_assignment_id,
            'day_of_week' => $this->day_of_week,
            'day' => $this->day_of_week,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'time' => "{$this->start_time} - {$this->end_time}",
            'status' => $this->status,
            'notes' => $this->notes ?: '-',
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
