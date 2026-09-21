<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $gender = $this->gender ?? $this->gender_code ?? $this->genderCode;
        $normalizedGender = null;
        if ($gender) {
            $normalizedGender = match (strtolower(trim($gender))) {
                'laki-laki', 'l' => 'L',
                'perempuan', 'p' => 'P',
                default => $gender,
            };
        }

        // Normalize NIP: null if empty string
        $rawNip = $this->nip !== null ? trim((string)$this->nip) : null;
        $normalizedNip = ($rawNip !== '' && $rawNip !== '-') ? $rawNip : null;

        // Normalize NUPTK: null if empty string
        $rawNuptk = $this->nuptk !== null ? trim((string)$this->nuptk) : null;
        $normalizedNuptk = ($rawNuptk !== '' && $rawNuptk !== '-') ? $rawNuptk : null;

        $employmentStatus = $this->employment_status ?? $this->employmentStatus;

        $this->merge([
            'name' => $this->name ? trim($this->name) : null,
            'nip' => $normalizedNip,
            'nuptk' => $normalizedNuptk,
            'gender' => $normalizedGender,
            'birth_place' => $this->birth_place ?? $this->birthPlace,
            'birth_date' => $this->birth_date ?? $this->birthDate,
            'phone' => $this->phone ? trim($this->phone) : null,
            'email' => $this->email ? trim($this->email) : null,
            'address' => $this->address ? trim($this->address) : null,
            'employment_status' => $employmentStatus ? trim($employmentStatus) : null,
            'type' => $this->type ? trim($this->type) : 'Guru',
            'subject' => $this->subject ? trim($this->subject) : null,
            'status' => $this->status ? trim($this->status) : 'Aktif',
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $teacherId = $this->route('id');

        return [
            'name' => ['required', 'string', 'max:120'],
            'nip' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('teachers', 'nip')->ignore($teacherId),
            ],
            'nuptk' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('teachers', 'nuptk')->ignore($teacherId),
            ],
            'gender' => ['required', 'in:L,P'],
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date_format:Y-m-d'],
            'phone' => ['nullable', 'string', 'max:25'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'employment_status' => ['required', 'string', 'in:ASN,PPPK,Honorer'],
            'type' => ['nullable', 'string', 'in:Guru,Tenaga Kependidikan'],
            'subject' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:Aktif,Tidak Aktif'],
        ];
    }

    /**
     * Custom validation messages in Indonesian.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap guru wajib diisi.',
            'name.max' => 'Nama lengkap maksimal 120 karakter.',
            'nip.unique' => "NIP ':input' sudah digunakan oleh guru lain.",
            'nuptk.unique' => "NUPTK ':input' sudah digunakan oleh guru lain.",
            'gender.required' => 'Jenis kelamin wajib dipilih.',
            'gender.in' => 'Jenis kelamin harus Laki-laki (L) atau Perempuan (P).',
            'birth_date.date_format' => 'Format tanggal lahir harus YYYY-MM-DD.',
            'email.email' => 'Format email tidak valid.',
            'employment_status.required' => 'Status kepegawaian wajib dipilih.',
            'employment_status.in' => 'Status kepegawaian harus salah satu dari: ASN, PPPK, Honorer.',
            'status.in' => 'Status harus Aktif atau Tidak Aktif.',
        ];
    }
}
