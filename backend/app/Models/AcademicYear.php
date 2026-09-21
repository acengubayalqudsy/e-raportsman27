<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicYear extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'academic_years';

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    /**
     * Semesters in this academic year.
     */
    public function semesters(): HasMany
    {
        return $this->hasMany(Semester::class, 'academic_year_id');
    }

    /**
     * Classes defined in this academic year.
     */
    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'academic_year_id');
    }

    /**
     * Scope query filter.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where('name', 'like', $search);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'Semua Status') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }
}
