<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSemesterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $id = $this->route('id');
        $current = $id ? \App\Models\Semester::find($id) : null;

        $ayId = $this->academic_year_id;
        if (!$ayId && $this->academicYear) {
            $ay = AcademicYear::where('name', trim($this->academicYear))->first();
            $ayId = $ay?->id;
        }
        if (!$ayId && $current) {
            $ayId = $current->academic_year_id;
        }

        $data = [];
        if ($ayId) {
            $data['academic_year_id'] = $ayId;
        }
        if ($this->has('name')) {
            $data['name'] = $this->name ? trim($this->name) : null;
        }
        if ($this->has('start_date') || $this->has('startDate')) {
            $data['start_date'] = $this->start_date ?? $this->startDate;
        }
        if ($this->has('end_date') || $this->has('endDate')) {
            $data['end_date'] = $this->end_date ?? $this->endDate;
        }
        if ($this->has('status')) {
            $data['status'] = $this->status ? trim($this->status) : null;
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        $id = $this->route('id');
        $ayId = $this->academic_year_id;

        return [
            'academic_year_id' => ['sometimes', 'required', 'integer', 'exists:academic_years,id'],
            'name' => [
                'sometimes',
                'required',
                'string',
                'in:Ganjil,Genap',
                Rule::unique('semesters')
                    ->where('academic_year_id', $ayId)
                    ->ignore($id),
            ],
            'start_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'required', 'date_format:Y-m-d', 'after:start_date'],
            'status' => ['sometimes', 'required', 'string', 'in:Aktif,Tidak Aktif,Selesai,Akan Datang'],
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
