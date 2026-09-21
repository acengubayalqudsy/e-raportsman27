<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class HomeroomAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'homeroom_assignments';

    protected $fillable = [
        'academic_year_id',
        'semester_id',
        'class_id',
        'teacher_id',
        'assignment_date',
        'end_date',
        'status',
        'sk_number',
        'notes',
    ];

    protected $casts = [
        'academic_year_id' => 'integer',
        'semester_id' => 'integer',
        'class_id' => 'integer',
        'teacher_id' => 'integer',
        'assignment_date' => 'date',
        'end_date' => 'date',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function scopeFilter($query, array $filters)
    {
        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['semester_id'])) {
            $query->where('semester_id', $filters['semester_id']);
        }

        if (!empty($filters['class_id'])) {
            $query->where('class_id', $filters['class_id']);
        }

        if (!empty($filters['grade']) && $filters['grade'] !== 'Semua Tingkat') {
            $query->whereHas('schoolClass', function ($q) use ($filters) {
                $q->where('grade', $filters['grade']);
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'Semua Status') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->whereHas('teacher', function ($tq) use ($search) {
                    $tq->where('name', 'like', "%{$search}%")
                       ->orWhere('nip', 'like', "%{$search}%");
                })->orWhereHas('schoolClass', function ($cq) use ($search) {
                    $cq->where('name', 'like', "%{$search}%")
                       ->orWhere('code', 'like', "%{$search}%");
                });
            });
        }

        return $query;
    }
}
