<?php

namespace App\Http\Requests;

use App\Models\HomeroomAssignment;
use App\Models\Teacher;
use Illuminate\Foundation\Http\FormRequest;

class UpdateHomeroomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('teacher_id')) {
            $data['teacher_id'] = $this->teacher_id ? (int)$this->teacher_id : null;
        }
        if ($this->has('sk_number')) {
            $data['sk_number'] = $this->sk_number ? trim($this->sk_number) : null;
        }
        if ($this->has('status')) {
            $data['status'] = $this->status ? trim($this->status) : null;
        }
        if ($this->has('notes')) {
            $data['notes'] = $this->notes ? trim($this->notes) : null;
        }
        if ($this->has('end_date')) {
            $data['end_date'] = $this->end_date;
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['sometimes', 'required', 'integer', 'exists:teachers,id'],
            'sk_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'required', 'string', 'in:Aktif,Nonaktif,Digantikan'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $id = $this->route('id');
            $assignment = HomeroomAssignment::find($id);
            if (!$assignment) return;

            if ($this->has('teacher_id') && $this->teacher_id !== $assignment->teacher_id) {
                $teacher = Teacher::find($this->teacher_id);
                if ($teacher && $teacher->status !== 'Aktif') {
                    $v->errors()->add(
                        'teacher_id',
                        "Guru {$teacher->name} berstatus {$teacher->status} dan tidak dapat ditugaskan sebagai wali kelas."
                    );
                }

                // Check if new teacher already has an active homeroom in this semester
                $teacherOtherClass = HomeroomAssignment::where('teacher_id', $this->teacher_id)
                    ->where('semester_id', $assignment->semester_id)
                    ->where('status', 'Aktif')
                    ->where('id', '!=', $id)
                    ->with('schoolClass')
                    ->first();

                if ($teacherOtherClass) {
                    $v->errors()->add(
                        'teacher_id',
                        "Guru {$teacher?->name} sudah menjadi wali kelas di rombel {$teacherOtherClass->schoolClass?->name} pada semester ini."
                    );
                }
            }
        });
    }
}
