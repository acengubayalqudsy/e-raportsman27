<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('code')) {
            $data['code'] = $this->code ? strtoupper(trim($this->code)) : null;
        }
        if ($this->has('name')) {
            $data['name'] = $this->name ? trim($this->name) : null;
        }
        if ($this->has('group')) {
            $data['group'] = $this->group ? trim($this->group) : null;
        }
        if ($this->has('grades')) {
            $data['grades'] = $this->grades ? trim($this->grades) : null;
        }
        if ($this->has('weekly_hours') || $this->has('weeklyHours')) {
            $data['weekly_hours'] = $this->weekly_hours ?? $this->weeklyHours ?? null;
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
            'code' => ['sometimes', 'required', 'string', 'max:30', Rule::unique('subjects', 'code')->ignore($id)],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'group' => ['sometimes', 'required', 'string', 'in:Umum,IPA,IPS,Muatan Lokal,Layanan'],
            'grades' => ['sometimes', 'nullable', 'string', 'max:50'],
            'weekly_hours' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:20'],
            'status' => ['sometimes', 'required', 'string', 'in:Aktif,Tidak Aktif'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode mata pelajaran wajib diisi.',
            'code.unique' => "Kode mata pelajaran ':input' sudah digunakan oleh mata pelajaran lain.",
            'name.required' => 'Nama mata pelajaran wajib diisi.',
            'group.required' => 'Kelompok mata pelajaran wajib dipilih.',
            'group.in' => 'Kelompok harus salah satu dari: Umum, IPA, IPS, Muatan Lokal, Layanan.',
        ];
    }
}
