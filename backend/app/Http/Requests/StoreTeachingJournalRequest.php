<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeachingJournalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->hasAnyRole(['admin', 'guru']);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'academic_year_id' => $this->academic_year_id ? (int) $this->academic_year_id : null,
            'semester_id' => $this->semester_id ? (int) $this->semester_id : null,
            'class_id' => $this->class_id ? (int) $this->class_id : null,
            'subject_id' => $this->subject_id ? (int) $this->subject_id : null,
            'teacher_id' => $this->teacher_id ? (int) $this->teacher_id : null,
            'schedule_id' => $this->schedule_id ? (int) $this->schedule_id : null,
            'meeting' => $this->meeting ? (int) $this->meeting : null,
            'attendance_present' => $this->attendance_present !== null ? (int) $this->attendance_present : 0,
            'attendance_total' => $this->attendance_total !== null ? (int) $this->attendance_total : 0,
            'status' => $this->status ?: 'Belum Lengkap',
        ]);
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'teacher_id' => ['required', 'integer', 'exists:teachers,id'],
            'schedule_id' => ['nullable', 'integer', 'exists:schedules,id'],
            'date' => ['required', 'date'],
            'meeting' => ['required', 'integer', 'min:1'],
            'material' => ['nullable', 'string'],
            'chapter' => ['nullable', 'string', 'max:255'],
            'activities' => ['nullable', 'string'],
            'method' => ['nullable', 'string', 'max:100'],
            'media' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'attendance_present' => ['nullable', 'integer', 'min:0'],
            'attendance_total' => ['nullable', 'integer', 'min:0', 'gte:attendance_present'],
            'status' => ['nullable', 'string', 'in:Lengkap,Belum Lengkap,Perlu Diperiksa'],
        ];
    }
}
