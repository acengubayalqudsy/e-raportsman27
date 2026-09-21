<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Schedule extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'schedules';

    protected $fillable = [
        'academic_year_id',
        'semester_id',
        'class_id',
        'subject_id',
        'teacher_id',
        'room_id',
        'course_assignment_id',
        'day_of_week',
        'start_time',
        'end_time',
        'status',
        'notes',
    ];

    protected $casts = [
        'academic_year_id' => 'integer',
        'semester_id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'teacher_id' => 'integer',
        'room_id' => 'integer',
        'course_assignment_id' => 'integer',
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
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    public function courseAssignment(): BelongsTo
    {
        return $this->belongsTo(CourseAssignment::class, 'course_assignment_id');
    }

    /**
     * Scope query filter.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function (Builder $q) use ($search) {
                $q->whereHas('teacher', function (Builder $t) use ($search) {
                    $t->where('name', 'like', $search);
                })
                ->orWhereHas('subject', function (Builder $s) use ($search) {
                    $s->where('name', 'like', $search)->orWhere('code', 'like', $search);
                })
                ->orWhereHas('schoolClass', function (Builder $c) use ($search) {
                    $c->where('name', 'like', $search);
                })
                ->orWhereHas('room', function (Builder $r) use ($search) {
                    $r->where('name', 'like', $search)->orWhere('code', 'like', $search);
                });
            });
        }

        if (!empty($filters['academic_year_id']) && $filters['academic_year_id'] !== 'Semua') {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['semester_id']) && $filters['semester_id'] !== 'Semua') {
            $query->where('semester_id', $filters['semester_id']);
        }

        if (!empty($filters['class_id']) && $filters['class_id'] !== 'Semua') {
            $query->where('class_id', $filters['class_id']);
        }

        if (!empty($filters['teacher_id']) && $filters['teacher_id'] !== 'Semua') {
            $query->where('teacher_id', $filters['teacher_id']);
        }

        if (!empty($filters['subject_id']) && $filters['subject_id'] !== 'Semua') {
            $query->where('subject_id', $filters['subject_id']);
        }

        if (!empty($filters['room_id']) && $filters['room_id'] !== 'Semua') {
            $query->where('room_id', $filters['room_id']);
        }

        if (!empty($filters['day_of_week']) && $filters['day_of_week'] !== 'Semua Hari') {
            $query->where('day_of_week', $filters['day_of_week']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'Semua Status') {
            $query->where('status', $filters['status']);
        }

        return $query;
    }
}
