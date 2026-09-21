<?php

namespace App\Http\Requests;

use App\Models\HomeroomAssignment;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Teacher;
use Illuminate\Foundation\Http\FormRequest;

class StoreHomeroomRequest extends FormRequest
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
            'teacher_id' => $this->teacher_id ? (int)$this->teacher_id : null,
            'assignment_date' => $this->assignment_date ?? now()->format('Y-m-d'),
            'sk_number' => $this->sk_number ? trim($this->sk_number) : null,
            'status' => $this->status ?? 'Aktif',
        ]);
    }

    public function rules(): array
    {
        return [
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'teacher_id' => ['required', 'integer', 'exists:teachers,id'],
            'assignment_date' => ['required', 'date_format:Y-m-d'],
            'sk_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:Aktif,Nonaktif,Digantikan'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            if (!$this->semester_id || !$this->class_id || !$this->teacher_id) return;

            $semester = Semester::find($this->semester_id);
            $class = SchoolClass::find($this->class_id);
            $teacher = Teacher::find($this->teacher_id);

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
                    "Guru {$teacher->name} berstatus {$teacher->status} dan tidak dapat ditugaskan sebagai wali kelas."
                );
            }

            // Rule 3: Single active homeroom per class per semester
            $existingActive = HomeroomAssignment::where('class_id', $this->class_id)
                ->where('semester_id', $this->semester_id)
                ->where('status', 'Aktif')
                ->with('teacher')
                ->first();

            if ($existingActive) {
                $v->errors()->add(
                    'class_id',
                    "Rombel {$class?->name} sudah memiliki wali kelas aktif: {$existingActive->teacher?->name}."
                );
            }

            // Rule 4: Teacher cannot be homeroom for two different classes in same semester
            $teacherOtherClass = HomeroomAssignment::where('teacher_id', $this->teacher_id)
                ->where('semester_id', $this->semester_id)
                ->where('status', 'Aktif')
                ->with('schoolClass')
                ->first();

            if ($teacherOtherClass) {
                $v->errors()->add(
                    'teacher_id',
                    "Guru {$teacher?->name} sudah menjadi wali kelas di rombel {$teacherOtherClass->schoolClass?->name} pada semester ini."
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'semester_id.required' => 'Semester wajib dipilih.',
            'class_id.required' => 'Rombongan belajar wajib dipilih.',
            'teacher_id.required' => 'Guru wali kelas wajib dipilih.',
            'assignment_date.required' => 'Tanggal penetapan tugas wajib diisi.',
        ];
    }
}
