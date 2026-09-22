<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
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
        $gender = $this->gender ?? $this->gender_code;
        $normalizedGender = null;
        if ($gender) {
            $normalizedGender = match (strtolower(trim($gender))) {
                'laki-laki', 'l' => 'L',
                'perempuan', 'p' => 'P',
                default => $gender,
            };
        }

        $className = $this->current_class_name ?? $this->className ?? $this->class_name ?? $this->accepted_class ?? $this->acceptedClass;

        $religionId = $this->religion_id ?? $this->religionId;
        $religionName = $this->religion;
        if ($religionId && !$religionName) {
            $religionName = \App\Models\Religion::where('id', $religionId)->value('name');
        } elseif (!$religionId && $religionName) {
            $religionId = \App\Models\Religion::where('name', $religionName)->value('id');
        }

        $this->merge([
            'name' => $this->name ? trim($this->name) : null,
            'nis' => $this->nis !== null ? trim((string)$this->nis) : null,
            'nisn' => $this->nisn !== null ? trim((string)$this->nisn) : null,
            'gender' => $normalizedGender,
            'birth_place' => $this->birth_place ?? $this->birthPlace,
            'birth_date' => $this->birth_date ?? $this->birthDate,
            'religion' => $religionName,
            'religion_id' => $religionId ? (int)$religionId : null,
            'previous_school' => $this->previous_school ?? $this->previousSchool,
            'accepted_class' => $this->accepted_class ?? $this->acceptedClass ?? $className,
            'admission_date' => $this->admission_date ?? $this->admissionDate,
            'father_name' => $this->father_name ?? $this->fatherName,
            'mother_name' => $this->mother_name ?? $this->motherName,
            'father_occupation' => $this->father_occupation ?? $this->fatherOccupation,
            'mother_occupation' => $this->mother_occupation ?? $this->motherOccupation,
            'parent_phone' => $this->parent_phone ?? $this->parentPhone,
            'guardian_name' => $this->guardian_name ?? $this->guardianName,
            'guardian_address' => $this->guardian_address ?? $this->guardianAddress,
            'guardian_phone' => $this->guardian_phone ?? $this->guardianPhone,
            'current_class_name' => $className,
            'status' => $this->status ?? 'Aktif',
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'nis' => ['required', 'string', 'max:20', Rule::unique('students', 'nis')],
            'nisn' => ['required', 'string', 'max:20', Rule::unique('students', 'nisn')],
            'gender' => ['required', 'in:L,P'],
            'birth_place' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date_format:Y-m-d'],
            'religion' => ['nullable', 'string', 'max:50'],
            'religion_id' => ['nullable', 'integer', 'exists:religions,id'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:25'],
            'previous_school' => ['nullable', 'string', 'max:150'],
            'accepted_class' => ['nullable', 'string', 'max:50'],
            'admission_date' => ['nullable', 'date_format:Y-m-d'],
            'father_name' => ['nullable', 'string', 'max:150'],
            'mother_name' => ['nullable', 'string', 'max:150'],
            'father_occupation' => ['nullable', 'string', 'max:100'],
            'mother_occupation' => ['nullable', 'string', 'max:100'],
            'parent_phone' => ['nullable', 'string', 'max:25'],
            'guardian_name' => ['nullable', 'string', 'max:150'],
            'guardian_address' => ['nullable', 'string'],
            'guardian_phone' => ['nullable', 'string', 'max:25'],
            'status' => ['nullable', 'in:Aktif,Alumni,Mutasi,Nonaktif'],
            'current_class_name' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * Custom validation messages in Indonesian.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap siswa wajib diisi.',
            'name.max' => 'Nama lengkap maksimal 150 karakter.',
            'nis.required' => 'NIS wajib diisi.',
            'nis.unique' => "NIS ':input' sudah terdaftar pada sistem.",
            'nisn.required' => 'NISN wajib diisi.',
            'nisn.unique' => "NISN ':input' sudah terdaftar pada sistem.",
            'gender.required' => 'Jenis kelamin wajib dipilih.',
            'gender.in' => 'Jenis kelamin harus Laki-laki (L) atau Perempuan (P).',
            'birth_place.required' => 'Tempat lahir wajib diisi.',
            'birth_date.required' => 'Tanggal lahir wajib diisi.',
            'birth_date.date_format' => 'Format tanggal lahir harus YYYY-MM-DD.',
            'current_class_name.required' => 'Kelas/rombel siswa wajib diisi.',
        ];
    }
}
