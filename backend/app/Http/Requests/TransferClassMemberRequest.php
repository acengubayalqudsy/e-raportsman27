<?php

namespace App\Http\Requests;

use App\Models\ClassMember;
use App\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;

class TransferClassMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'target_class_id' => $this->target_class_id ? (int)$this->target_class_id : null,
            'transfer_date' => $this->transfer_date ?? now()->format('Y-m-d'),
        ]);
    }

    public function rules(): array
    {
        return [
            'target_class_id' => ['required', 'integer', 'exists:classes,id'],
            'transfer_date' => ['required', 'date_format:Y-m-d'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $memberId = $this->route('id');
            $member = ClassMember::find($memberId);

            if (!$member) {
                $v->errors()->add('member_id', 'Data keanggotaan siswa tidak ditemukan.');
                return;
            }

            if ($member->class_id === $this->target_class_id) {
                $v->errors()->add('target_class_id', 'Rombel tujuan tidak boleh sama dengan rombel asal.');
                return;
            }

            $targetClass = SchoolClass::find($this->target_class_id);
            if ($targetClass && $targetClass->academic_year_id !== $member->academic_year_id) {
                $v->errors()->add('target_class_id', 'Rombel tujuan harus berada pada tahun ajaran yang sama dengan rombel asal.');
            }

            // Check capacity of target class
            if ($targetClass && $targetClass->capacity > 0) {
                $currentCount = ClassMember::where('class_id', $this->target_class_id)
                    ->where('semester_id', $member->semester_id)
                    ->where('status', 'Aktif')
                    ->count();
                if ($currentCount >= $targetClass->capacity) {
                    $v->errors()->add(
                        'target_class_id',
                        "Kapasitas rombel tujuan {$targetClass->name} sudah penuh ({$targetClass->capacity} siswa)."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'target_class_id.required' => 'Rombel tujuan mutasi wajib dipilih.',
            'target_class_id.exists' => 'Rombel tujuan tidak valid.',
            'transfer_date.required' => 'Tanggal mutasi/pemindahan wajib diisi.',
        ];
    }
}
