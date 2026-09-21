<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => $this->code ? strtoupper(trim($this->code)) : null,
            'name' => $this->name ? trim($this->name) : null,
            'group' => $this->group ? trim($this->group) : 'Umum',
            'grades' => $this->grades ? trim($this->grades) : 'X, XI, XII',
            'weekly_hours' => $this->weekly_hours ?? $this->weeklyHours ?? 2,
            'status' => $this->status ? trim($this->status) : 'Aktif',
        ]);
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:30', Rule::unique('subjects', 'code')],
            'name' => ['required', 'string', 'max:100'],
            'group' => ['required', 'string', 'in:Umum,IPA,IPS,Muatan Lokal,Layanan'],
            'grades' => ['nullable', 'string', 'max:50'],
            'weekly_hours' => ['nullable', 'integer', 'min:1', 'max:20'],
            'status' => ['nullable', 'string', 'in:Aktif,Tidak Aktif'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode mata pelajaran wajib diisi.',
            'code.unique' => "Kode mata pelajaran ':input' sudah terdaftar pada sistem.",
            'name.required' => 'Nama mata pelajaran wajib diisi.',
            'group.required' => 'Kelompok mata pelajaran wajib dipilih.',
            'group.in' => 'Kelompok harus salah satu dari: Umum, IPA, IPS, Muatan Lokal, Layanan.',
        ];
    }
}
