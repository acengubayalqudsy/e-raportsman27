<?php

namespace App\Http\Requests;

use App\Models\CourseAssignment;
use App\Models\Semester;
use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        // If course_assignment_id is provided, auto-fill related IDs
        $caId = $this->course_assignment_id;
        $classId = $this->class_id;
        $subjectId = $this->subject_id;
        $teacherId = $this->teacher_id;
        $semesterId = $this->semester_id;
        $academicYearId = $this->academic_year_id;

        if ($caId) {
            $ca = CourseAssignment::find($caId);
            if ($ca) {
                $classId = $classId ?: $ca->class_id;
                $subjectId = $subjectId ?: $ca->subject_id;
                $teacherId = $teacherId ?: $ca->teacher_id;
                $semesterId = $semesterId ?: $ca->semester_id;
                $academicYearId = $academicYearId ?: $ca->academic_year_id;
            }
        }

        if (!$academicYearId && $semesterId) {
            $sem = Semester::find($semesterId);
            $academicYearId = $sem?->academic_year_id;
        }

        $this->merge([
            'academic_year_id' => $academicYearId,
            'semester_id' => $semesterId,
            'class_id' => $classId,
            'subject_id' => $subjectId,
            'teacher_id' => $teacherId,
            'room_id' => $this->room_id,
            'course_assignment_id' => $caId,
            'day_of_week' => $this->day_of_week ? trim($this->day_of_week) : null,
            'start_time' => $this->start_time ? trim($this->start_time) : null,
            'end_time' => $this->end_time ? trim($this->end_time) : null,
            'status' => $this->status ? trim($this->status) : 'Aktif',
            'notes' => $this->notes ? trim($this->notes) : null,
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
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'course_assignment_id' => ['nullable', 'integer', 'exists:course_assignments,id'],
            'day_of_week' => ['required', 'string', 'in:Senin,Selasa,Rabu,Kamis,Jumat'],
            'start_time' => ['required', 'string', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'end_time' => ['required', 'string', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/'],
            'status' => ['required', 'string', 'in:Aktif,Tidak Aktif'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'academic_year_id.required' => 'Tahun ajaran wajib dipilih.',
            'semester_id.required' => 'Semester wajib dipilih.',
            'class_id.required' => 'Kelas/Rombel wajib dipilih.',
            'subject_id.required' => 'Mata pelajaran wajib dipilih.',
            'teacher_id.required' => 'Guru pengampu wajib dipilih.',
            'room_id.required' => 'Ruangan belajar wajib dipilih.',
            'day_of_week.required' => 'Hari belajar wajib dipilih.',
            'day_of_week.in' => 'Hari belajar harus hari Senin sampai Jumat.',
            'start_time.required' => 'Jam mulai wajib diisi.',
            'start_time.regex' => 'Format jam mulai harus HH:mm (contoh: 07:30).',
            'end_time.required' => 'Jam selesai wajib diisi.',
            'end_time.regex' => 'Format jam selesai harus HH:mm (contoh: 09:00).',
            'status.in' => 'Status jadwal harus Aktif atau Tidak Aktif.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->course_assignment_id) {
                $ca = CourseAssignment::find($this->course_assignment_id);
                if ($ca) {
                    if ($this->teacher_id && (int)$this->teacher_id !== (int)$ca->teacher_id) {
                        $validator->errors()->add('teacher_id', 'Guru pengampu tidak sesuai dengan Penugasan Guru (Course Assignment).');
                    }
                    if ($this->subject_id && (int)$this->subject_id !== (int)$ca->subject_id) {
                        $validator->errors()->add('subject_id', 'Mata pelajaran tidak sesuai dengan Penugasan Guru (Course Assignment).');
                    }
                    if ($this->class_id && (int)$this->class_id !== (int)$ca->class_id) {
                        $validator->errors()->add('class_id', 'Kelas tidak sesuai dengan Penugasan Guru (Course Assignment).');
                    }
                    if ($this->semester_id && (int)$this->semester_id !== (int)$ca->semester_id) {
                        $validator->errors()->add('semester_id', 'Semester tidak sesuai dengan Penugasan Guru (Course Assignment).');
                    }
                    if ($this->academic_year_id && (int)$this->academic_year_id !== (int)$ca->academic_year_id) {
                        $validator->errors()->add('academic_year_id', 'Tahun ajaran tidak sesuai dengan Penugasan Guru (Course Assignment).');
                    }
                }
            }

            if ($this->class_id && $this->academic_year_id) {
                $cls = \App\Models\SchoolClass::find($this->class_id);
                if ($cls && (int)$cls->academic_year_id !== (int)$this->academic_year_id) {
                    $validator->errors()->add('class_id', 'Tahun ajaran kelas tidak sesuai dengan tahun ajaran jadwal.');
                }
            }
        });
    }
}
