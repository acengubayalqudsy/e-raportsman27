<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'nip' => $this->nip ?: '-',
            'nuptk' => $this->nuptk ?: '-',
            'gender' => $this->gender_label,
            'gender_code' => $this->gender,
            'genderCode' => $this->gender,
            'birth_place' => $this->birth_place,
            'birthPlace' => $this->birth_place,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'birthDate' => $this->birth_date?->format('Y-m-d'),
            'birth' => $this->birth,
            'avatar' => $this->avatar,
            'phone' => $this->phone ?: '-',
            'email' => $this->email ?: '-',
            'address' => $this->address ?: '-',
            'employment_status' => $this->employment_status,
            'employmentStatus' => $this->employment_status,
            'type' => $this->type,
            'subject' => $this->subject ?: '-',
            'status' => $this->status,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
