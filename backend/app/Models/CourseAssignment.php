<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'course_assignments';

    protected $fillable = [
        'academic_year_id',
        'semester_id',
        'class_id',
        'subject_id',
        'teacher_id',
        'weekly_hours',
        'role',
        'status',
        'notes',
    ];

    protected $casts = [
        'academic_year_id' => 'integer',
        'semester_id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'teacher_id' => 'integer',
        'weekly_hours' => 'integer',
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

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id')->withTrashed();
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id')->withTrashed();
    }

    public function assessments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Assessment::class, 'course_assignment_id');
    }

    public function finalCourseGrades(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(FinalCourseGrade::class, 'course_assignment_id');
    }

    public function scopeFilter($query, array $filters)
    {
        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['semester_id'])) {
            $query->where('semester_id', $filters['semester_id']);
        }

        if (!empty($filters['class_id']) && $filters['class_id'] !== 'Semua Kelas') {
            $query->where('class_id', $filters['class_id']);
        }

        if (!empty($filters['subject_id']) && $filters['subject_id'] !== 'Semua Mata Pelajaran') {
            $query->where('subject_id', $filters['subject_id']);
        }

        if (!empty($filters['teacher_id']) && $filters['teacher_id'] !== 'Semua Guru') {
            $query->where('teacher_id', $filters['teacher_id']);
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
                })->orWhereHas('subject', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                       ->orWhere('code', 'like', "%{$search}%");
                })->orWhereHas('schoolClass', function ($cq) use ($search) {
                    $cq->where('name', 'like', "%{$search}%");
                });
            });
        }

        return $query;
    }
}
