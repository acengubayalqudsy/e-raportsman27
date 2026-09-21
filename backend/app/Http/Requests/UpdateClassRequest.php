<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $id = $this->route('id');
        $current = $id ? \App\Models\SchoolClass::find($id) : null;

        $ayId = $this->academic_year_id;
        if (!$ayId && $current) {
            $ayId = $current->academic_year_id;
        }

        $data = [];
        if ($ayId) {
            $data['academic_year_id'] = $ayId;
        }
        if ($this->has('code')) {
            $data['code'] = $this->code ? trim($this->code) : null;
        }
        if ($this->has('name')) {
            $data['name'] = $this->name ? trim($this->name) : null;
        }
        if ($this->has('grade')) {
            $data['grade'] = $this->grade ? trim($this->grade) : null;
        }
        if ($this->has('capacity')) {
            $data['capacity'] = $this->capacity !== null ? (int)$this->capacity : null;
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
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:30',
                Rule::unique('classes')
                    ->where('academic_year_id', $ayId)
                    ->ignore($id),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:50'],
            'grade' => ['sometimes', 'required', 'string', 'in:X,XI,XII'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:60'],
            'status' => ['sometimes', 'required', 'string', 'in:Aktif,Tidak Aktif'],
        ];
    }

    public function messages(): array
    {
        return [
            'academic_year_id.required' => 'Tahun ajaran wajib ditentukan untuk kelas referensi.',
            'academic_year_id.exists' => 'Tahun ajaran tidak valid.',
            'code.required' => 'Kode kelas wajib diisi.',
            'code.unique' => "Kode kelas ':input' sudah digunakan pada tahun ajaran ini.",
            'name.required' => 'Nama kelas wajib diisi.',
            'grade.required' => 'Tingkat kelas (X, XI, XII) wajib dipilih.',
            'grade.in' => 'Tingkat kelas harus X, XI, atau XII.',
        ];
    }
}
