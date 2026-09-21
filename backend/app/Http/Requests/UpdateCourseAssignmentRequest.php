<?php

namespace App\Http\Requests;

use App\Models\CourseAssignment;
use App\Models\Teacher;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseAssignmentRequest extends FormRequest
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
        if ($this->has('weekly_hours') || $this->has('weeklyHours')) {
            $data['weekly_hours'] = $this->weekly_hours ? (int)$this->weekly_hours : ($this->weeklyHours ? (int)$this->weeklyHours : null);
        }
        if ($this->has('role')) {
            $data['role'] = $this->role ? trim($this->role) : null;
        }
        if ($this->has('status')) {
            $data['status'] = $this->status ? trim($this->status) : null;
        }
        if ($this->has('notes')) {
            $data['notes'] = $this->notes ? trim($this->notes) : null;
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['sometimes', 'required', 'integer', 'exists:teachers,id'],
            'weekly_hours' => ['sometimes', 'required', 'integer', 'min:1', 'max:20'],
            'role' => ['sometimes', 'required', 'string', 'in:Utama,Pendamping,Pengganti'],
            'status' => ['sometimes', 'required', 'string', 'in:Aktif,Nonaktif,Selesai'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $id = $this->route('id');
            $assignment = CourseAssignment::find($id);
            if (!$assignment) return;

            if ($this->has('teacher_id') && $this->teacher_id !== $assignment->teacher_id) {
                $teacher = Teacher::find($this->teacher_id);
                if ($teacher && $teacher->status !== 'Aktif') {
                    $v->errors()->add(
                        'teacher_id',
                        "Guru {$teacher->name} berstatus {$teacher->status} dan tidak dapat diberikan penugasan mengajar."
                    );
                }
            }

            // If changing role to 'Utama' or updating teacher while role is 'Utama'
            $targetRole = $this->role ?? $assignment->role;
            if ($targetRole === 'Utama') {
                $otherUtama = CourseAssignment::where('class_id', $assignment->class_id)
                    ->where('subject_id', $assignment->subject_id)
                    ->where('semester_id', $assignment->semester_id)
                    ->where('role', 'Utama')
                    ->where('status', 'Aktif')
                    ->where('id', '!=', $id)
                    ->with('teacher')
                    ->first();

                if ($otherUtama) {
                    $v->errors()->add(
                        'role',
                        "Sudah terdapat guru utama aktif ({$otherUtama->teacher?->name}) untuk mata pelajaran dan rombel ini."
                    );
                }
            }
        });
    }
}
