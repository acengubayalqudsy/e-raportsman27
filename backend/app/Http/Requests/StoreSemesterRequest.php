<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSemesterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $ayId = $this->academic_year_id;
        if (!$ayId && $this->academicYear) {
            $ay = AcademicYear::where('name', trim($this->academicYear))->first();
            $ayId = $ay?->id;
        }

        $this->merge([
            'academic_year_id' => $ayId,
            'name' => $this->name ? trim($this->name) : null,
            'start_date' => $this->start_date ?? $this->startDate,
            'end_date' => $this->end_date ?? $this->endDate,
            'status' => $this->status ? trim($this->status) : 'Akan Datang',
        ]);
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'name' => [
                'required',
                'string',
                'in:Ganjil,Genap',
                Rule::unique('semesters')->where('academic_year_id', $this->academic_year_id),
            ],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after:start_date'],
            'status' => ['nullable', 'string', 'in:Aktif,Tidak Aktif,Selesai,Akan Datang'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            if ($this->academic_year_id && $this->start_date && $this->end_date) {
                $ay = AcademicYear::find($this->academic_year_id);
                if ($ay) {
                    $ayStart = $ay->start_date->format('Y-m-d');
                    $ayEnd = $ay->end_date->format('Y-m-d');
                    if ($this->start_date < $ayStart || $this->end_date > $ayEnd) {
                        $v->errors()->add('start_date', "Rentang tanggal semester harus berada di dalam batas tahun ajaran ({$ayStart} s/d {$ayEnd}).");
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'academic_year_id.required' => 'Tahun ajaran induk wajib dipilih.',
            'academic_year_id.exists' => 'Tahun ajaran yang dipilih tidak valid.',
            'name.required' => 'Nama semester wajib diisi (Ganjil atau Genap).',
            'name.in' => 'Semester hanya dapat berupa Ganjil atau Genap.',
            'name.unique' => 'Semester :input sudah terdaftar pada tahun ajaran ini.',
            'start_date.required' => 'Tanggal mulai semester wajib diisi.',
            'end_date.required' => 'Tanggal selesai semester wajib diisi.',
            'end_date.after' => 'Tanggal selesai semester harus setelah tanggal mulai.',
        ];
    }
}
