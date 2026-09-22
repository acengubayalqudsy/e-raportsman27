<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeachingJournalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $percentage = $this->attendance_total
            ? round(($this->attendance_present / $this->attendance_total) * 100, 2)
            : 0;

        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->academicYear?->name,
            'semester_id' => $this->semester_id,
            'semester_name' => $this->semester?->name,
            'class_id' => $this->class_id,
            'class_name' => $this->schoolClass?->name,
            'className' => $this->schoolClass?->name,
            'subject_id' => $this->subject_id,
            'subject_name' => $this->subject?->name,
            'subject' => $this->subject?->name,
            'teacher_id' => $this->teacher_id,
            'teacher_name' => $this->teacher?->name,
            'teacher' => $this->teacher?->name,
            'schedule_id' => $this->schedule_id,
            'date' => $this->date?->toDateString(),
            'meeting' => $this->meeting,
            'material' => $this->material,
            'chapter' => $this->chapter,
            'activities' => $this->activities,
            'method' => $this->method,
            'media' => $this->media,
            'notes' => $this->notes,
            'attendance_present' => $this->attendance_present,
            'attendance_total' => $this->attendance_total,
            'attendance_percentage' => $percentage,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
