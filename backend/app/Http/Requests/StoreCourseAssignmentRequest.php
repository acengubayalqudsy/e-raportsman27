<?php

namespace App\Http\Requests;

use App\Models\CourseAssignment;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Foundation\Http\FormRequest;

class StoreCourseAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'semester_id' => $this->semester_id ? (int)$this->semester_id : null,
            'class_id' => $this->class_id ? (int)$this->class_id : null,
            'subject_id' => $this->subject_id ? (int)$this->subject_id : null,
            'teacher_id' => $this->teacher_id ? (int)$this->teacher_id : null,
            'weekly_hours' => $this->weekly_hours ? (int)$this->weekly_hours : ($this->weeklyHours ? (int)$this->weeklyHours : null),
            'role' => $this->role ?? 'Utama',
            'status' => $this->status ?? 'Aktif',
            'notes' => $this->notes ? trim($this->notes) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'teacher_id' => ['required', 'integer', 'exists:teachers,id'],
            'weekly_hours' => ['required', 'integer', 'min:1', 'max:20'],
            'role' => ['nullable', 'string', 'in:Utama,Pendamping,Pengganti'],
            'status' => ['nullable', 'string', 'in:Aktif,Nonaktif,Selesai'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            if (!$this->semester_id || !$this->class_id || !$this->subject_id || !$this->teacher_id) return;

            $semester = Semester::find($this->semester_id);
            $class = SchoolClass::find($this->class_id);
            $teacher = Teacher::find($this->teacher_id);
            $subject = Subject::find($this->subject_id);

            // Rule 1: Class and Semester must share the same Academic Year
            if ($semester && $class && $semester->academic_year_id !== $class->academic_year_id) {
                $v->errors()->add(
                    'class_id',
                    'Kelas yang dipilih tidak berada pada tahun ajaran yang sama dengan semester.'
                );
            }

            // Rule 2: Teacher must be active
            if ($teacher && $teacher->status !== 'Aktif') {
                $v->errors()->add(
                    'teacher_id',
                    "Guru {$teacher->name} berstatus {$teacher->status} dan tidak dapat diberikan penugasan mengajar."
                );
            }

            // Rule 3: Single 'Utama' role per class + subject + semester
            if ($this->role === 'Utama') {
                $existingUtama = CourseAssignment::where('class_id', $this->class_id)
                    ->where('subject_id', $this->subject_id)
                    ->where('semester_id', $this->semester_id)
                    ->where('role', 'Utama')
                    ->where('status', 'Aktif')
                    ->with('teacher')
                    ->first();

                if ($existingUtama) {
                    $v->errors()->add(
                        'teacher_id',
                        "Mata pelajaran {$subject?->name} di rombel {$class?->name} sudah memiliki guru utama: {$existingUtama->teacher?->name}."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'semester_id.required' => 'Semester wajib dipilih.',
            'class_id.required' => 'Rombongan belajar wajib dipilih.',
            'subject_id.required' => 'Mata pelajaran wajib dipilih.',
            'teacher_id.required' => 'Guru pengampu wajib dipilih.',
            'weekly_hours.required' => 'Alokasi jam per minggu wajib ditentukan.',
        ];
    }
}
