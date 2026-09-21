<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $ayId = $this->academic_year_id;
        if (!$ayId) {
            $activeAy = AcademicYear::where('status', 'Aktif')->first() ?? AcademicYear::latest('id')->first();
            $ayId = $activeAy?->id;
        }

        $this->merge([
            'academic_year_id' => $ayId,
            'code' => $this->code ? trim($this->code) : null,
            'name' => $this->name ? trim($this->name) : null,
            'grade' => $this->grade ? trim($this->grade) : null,
            'capacity' => $this->capacity !== null ? (int)$this->capacity : 36,
            'status' => $this->status ? trim($this->status) : 'Aktif',
        ]);
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('classes')->where('academic_year_id', $this->academic_year_id),
            ],
            'name' => ['required', 'string', 'max:50'],
            'grade' => ['required', 'string', 'in:X,XI,XII'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:60'],
            'status' => ['nullable', 'string', 'in:Aktif,Tidak Aktif'],
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
