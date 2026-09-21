<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rooms';

    protected $fillable = [
        'academic_year_id',
        'code',
        'name',
        'building',
        'floor',
        'capacity',
        'room_type',
        'status',
        'notes',
    ];

    protected $casts = [
        'academic_year_id' => 'integer',
        'capacity' => 'integer',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'room_id');
    }

    /**
     * Scope query filter.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('code', 'like', $search)
                  ->orWhere('building', 'like', $search);
            });
        }

        if (!empty($filters['academic_year_id']) && $filters['academic_year_id'] !== 'Semua') {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['room_type']) && $filters['room_type'] !== 'Semua Jenis') {
            $query->where('room_type', $filters['room_type']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'Semua Status') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }
}
