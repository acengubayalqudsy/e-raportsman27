<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
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
            'building' => $this->building ? trim($this->building) : null,
            'floor' => $this->floor ? trim($this->floor) : null,
            'capacity' => $this->capacity !== null ? (int)$this->capacity : 36,
            'room_type' => $this->room_type ? trim($this->room_type) : 'Kelas',
            'status' => $this->status ? trim($this->status) : 'Aktif',
            'notes' => $this->notes ? trim($this->notes) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('rooms')->where(function ($query) {
                    return $query->where('academic_year_id', $this->academic_year_id)
                                 ->whereNull('deleted_at');
                }),
            ],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('rooms')->where(function ($query) {
                    return $query->where('academic_year_id', $this->academic_year_id)
                                 ->whereNull('deleted_at');
                }),
            ],
            'building' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'capacity' => ['required', 'integer', 'min:1', 'max:500'],
            'room_type' => ['required', 'string', 'max:50'],
            'status' => ['required', 'string', 'in:Aktif,Tidak Aktif'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode ruangan wajib diisi.',
            'code.unique' => 'Kode ruangan sudah digunakan pada tahun ajaran ini.',
            'name.required' => 'Nama ruangan wajib diisi.',
            'name.unique' => 'Nama ruangan sudah digunakan pada tahun ajaran ini.',
            'capacity.required' => 'Kapasitas ruangan wajib diisi.',
            'capacity.min' => 'Kapasitas ruangan minimal 1 orang.',
            'room_type.required' => 'Tipe ruangan wajib dipilih.',
            'status.in' => 'Status ruangan harus Aktif atau Tidak Aktif.',
        ];
    }
}
