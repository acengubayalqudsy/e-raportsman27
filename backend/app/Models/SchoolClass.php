<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'academic_year_id',
        'code',
        'name',
        'grade',
        'capacity',
        'status',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    /**
     * The parent academic year.
     */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ClassMember::class, 'class_id');
    }

    public function homeroomAssignments(): HasMany
    {
        return $this->hasMany(HomeroomAssignment::class, 'class_id');
    }

    public function courseAssignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class, 'class_id');
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

        if (!empty($filters['grade']) && $filters['grade'] !== 'Semua Tingkat') {
            $query->where('grade', $filters['grade']);
        }

        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'Semua Status') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }
}
