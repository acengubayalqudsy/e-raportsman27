<?php

namespace App\Http\Requests;

use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\ClassMember;
use Illuminate\Foundation\Http\FormRequest;

class StoreClassMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        // Support either student_ids (array) or student_id (single)
        $ids = $this->student_ids ?? ($this->student_id ? [$this->student_id] : []);
        if (is_string($ids)) {
            $ids = array_filter(array_map('trim', explode(',', $ids)));
        }

        $this->merge([
            'semester_id' => $this->semester_id ? (int)$this->semester_id : null,
            'class_id' => $this->class_id ? (int)$this->class_id : null,
            'student_ids' => array_map('intval', (array)$ids),
            'join_date' => $this->join_date ?? now()->format('Y-m-d'),
        ]);
    }

    public function rules(): array
    {
        return [
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'exists:students,id'],
            'join_date' => ['nullable', 'date_format:Y-m-d'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            if (!$this->semester_id || !$this->class_id) return;

            $semester = Semester::find($this->semester_id);
            $class = SchoolClass::find($this->class_id);

            if ($semester && $class) {
                // Rule 1: Class and Semester must belong to same Academic Year
                if ($semester->academic_year_id !== $class->academic_year_id) {
                    $v->errors()->add(
                        'class_id',
                        'Kelas yang dipilih tidak berada pada tahun ajaran yang sama dengan semester.'
                    );
                }

                // Rule 2: Capacity check
                if ($class->capacity > 0) {
                    $currentCount = ClassMember::where('class_id', $this->class_id)
                        ->where('semester_id', $this->semester_id)
                        ->where('status', 'Aktif')
                        ->count();
                    $incomingCount = count($this->student_ids ?? []);
                    if (($currentCount + $incomingCount) > $class->capacity) {
                        $v->errors()->add(
                            'class_id',
                            "Kapasitas kelas {$class->name} ({$class->capacity} siswa) tidak mencukupi untuk menambahkan {$incomingCount} siswa baru (saat ini terisi {$currentCount})."
                        );
                    }
                }
            }

            // Rule 3: Check student double-enrollment in same semester
            if (!empty($this->student_ids)) {
                $alreadyEnrolled = ClassMember::where('semester_id', $this->semester_id)
                    ->whereIn('student_id', $this->student_ids)
                    ->where('status', 'Aktif')
                    ->with('student', 'schoolClass')
                    ->get();

                foreach ($alreadyEnrolled as $existing) {
                    $v->errors()->add(
                        'student_ids',
                        "Siswa {$existing->student?->name} sudah terdaftar aktif di rombel {$existing->schoolClass?->name} pada semester ini."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'semester_id.required' => 'Semester wajib dipilih.',
            'class_id.required' => 'Kelas/rombel wajib dipilih.',
            'student_ids.required' => 'Minimal satu siswa harus dipilih.',
            'student_ids.min' => 'Minimal satu siswa harus dipilih.',
        ];
    }
}
