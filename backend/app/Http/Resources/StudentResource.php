<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $birthDate = $this->birth_date ? $this->birth_date->format('Y-m-d') : null;
        $admissionDate = $this->admission_date ? $this->admission_date->format('Y-m-d') : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'nis' => (string)$this->nis,
            'nisn' => (string)$this->nisn,
            'gender' => $this->gender_label,
            'gender_code' => $this->gender,
            'birth_place' => $this->birth_place,
            'birth_date' => $birthDate,
            'birth' => $this->birth,
            'avatar' => $this->avatar,
            'class_name' => $this->class_name,
            'grade' => $this->grade,
            'study_group' => $this->study_group,
            'religion' => $this->religion ?? 'Islam',
            'address' => $this->address ?? '',
            'phone' => $this->phone ?? '',
            'previous_school' => $this->previous_school ?? '',
            'accepted_class' => $this->accepted_class ?? '',
            'admission_date' => $admissionDate,
            'father_name' => $this->father_name ?? '',
            'mother_name' => $this->mother_name ?? '',
            'father_occupation' => $this->father_occupation ?? '',
            'mother_occupation' => $this->mother_occupation ?? '',
            'parent_phone' => $this->parent_phone ?? '',
            'guardian_name' => $this->guardian_name ?? '',
            'guardian_address' => $this->guardian_address ?? '',
            'guardian_phone' => $this->guardian_phone ?? '',
            'status' => $this->status,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // CamelCase aliases for seamless frontend compatibility
            'birthPlace' => $this->birth_place,
            'birthDate' => $birthDate,
            'className' => $this->class_name,
            'studyGroup' => $this->study_group,
            'previousSchool' => $this->previous_school ?? '',
            'acceptedClass' => $this->accepted_class ?? '',
            'admissionDate' => $admissionDate,
            'fatherName' => $this->father_name ?? '',
            'motherName' => $this->mother_name ?? '',
            'fatherOccupation' => $this->father_occupation ?? '',
            'motherOccupation' => $this->mother_occupation ?? '',
            'parentPhone' => $this->parent_phone ?? '',
            'guardianName' => $this->guardian_name ?? '',
            'guardianAddress' => $this->guardian_address ?? '',
            'guardianPhone' => $this->guardian_phone ?? '',
        ];
    }
}
