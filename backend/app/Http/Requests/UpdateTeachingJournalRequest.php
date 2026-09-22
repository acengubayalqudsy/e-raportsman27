<?php

namespace App\Http\Requests;

class UpdateTeachingJournalRequest extends StoreTeachingJournalRequest
{
    protected function prepareForValidation(): void
    {
        $data = [];
        foreach (['academic_year_id', 'semester_id', 'class_id', 'subject_id', 'teacher_id', 'schedule_id', 'meeting', 'attendance_present', 'attendance_total'] as $field) {
            if ($this->has($field)) {
                $data[$field] = $this->input($field) === '' ? null : (int) $this->input($field);
            }
        }
        if ($this->has('status')) $data['status'] = $this->input('status') ?: 'Belum Lengkap';
        if ($data !== []) $this->merge($data);
    }

    public function rules(): array
    {
        return array_map(static function (array $rules): array {
            return array_merge(['sometimes'], $rules);
        }, parent::rules());
    }
}
