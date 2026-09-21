<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'subjects';

    protected $fillable = [
        'code',
        'name',
        'group',
        'grades',
        'weekly_hours',
        'status',
    ];

    protected $casts = [
        'weekly_hours' => 'integer',
    ];

    public function courseAssignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class, 'subject_id');
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
                  ->orWhere('code', 'like', $search);
            });
        }

        if (!empty($filters['group']) && $filters['group'] !== 'Semua Kelompok') {
            $query->where('group', $filters['group']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'Semua Status') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }
}
