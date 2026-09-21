<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $roomId = $this->route('id') ?? $this->route('room');
        $ayId = $this->academic_year_id;
        if (!$ayId) {
            $activeAy = AcademicYear::where('status', 'Aktif')->first() ?? AcademicYear::latest('id')->first();
            $ayId = $activeAy?->id;
        }

        $merge = [];
        if ($this->has('code')) $merge['code'] = trim($this->code);
        if ($this->has('name')) $merge['name'] = trim($this->name);
        if ($this->has('building')) $merge['building'] = $this->building ? trim($this->building) : null;
        if ($this->has('floor')) $merge['floor'] = $this->floor ? trim($this->floor) : null;
        if ($this->has('capacity')) $merge['capacity'] = (int)$this->capacity;
        if ($this->has('room_type')) $merge['room_type'] = trim($this->room_type);
        if ($this->has('status')) $merge['status'] = trim($this->status);
        if ($this->has('notes')) $merge['notes'] = $this->notes ? trim($this->notes) : null;
        $merge['academic_year_id'] = $ayId;

        $this->merge($merge);
    }

    public function rules(): array
    {
        $roomId = $this->route('id') ?? $this->route('room');

        return [
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('rooms')->where(function ($query) {
                    return $query->where('academic_year_id', $this->academic_year_id)
                                 ->whereNull('deleted_at');
                })->ignore($roomId),
            ],
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('rooms')->where(function ($query) {
                    return $query->where('academic_year_id', $this->academic_year_id)
                                 ->whereNull('deleted_at');
                })->ignore($roomId),
            ],
            'building' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1', 'max:500'],
            'room_type' => ['sometimes', 'required', 'string', 'max:50'],
            'status' => ['sometimes', 'required', 'string', 'in:Aktif,Tidak Aktif'],
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
