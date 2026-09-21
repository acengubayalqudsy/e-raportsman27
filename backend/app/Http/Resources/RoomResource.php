<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'academic_year_name' => $this->academicYear?->name ?? '-',
            'code' => $this->code,
            'name' => $this->name,
            'building' => $this->building ?: '-',
            'floor' => $this->floor ?: '-',
            'capacity' => $this->capacity,
            'capacity_label' => "{$this->capacity} kursi",
            'room_type' => $this->room_type,
            'type' => $this->room_type,
            'location' => trim(($this->building ? "Gedung {$this->building}" : '') . ($this->floor ? " Lt. {$this->floor}" : '')) ?: '-',
            'status' => $this->status,
            'notes' => $this->notes ?: '-',
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
