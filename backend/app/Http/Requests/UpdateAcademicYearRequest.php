<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $data = [];
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

        return [
            'name' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('academic_years', 'name')->ignore($id)],
            'start_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'required', 'date_format:Y-m-d', 'after:start_date'],
            'status' => ['sometimes', 'required', 'string', 'in:Aktif,Tidak Aktif,Selesai,Akan Datang'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama tahun ajaran wajib diisi.',
            'name.unique' => "Tahun ajaran ':input' sudah digunakan oleh periode lain.",
            'start_date.required' => 'Tanggal mulai wajib diisi.',
            'end_date.required' => 'Tanggal selesai wajib diisi.',
            'end_date.after' => 'Tanggal selesai harus setelah tanggal mulai.',
        ];
    }
}
