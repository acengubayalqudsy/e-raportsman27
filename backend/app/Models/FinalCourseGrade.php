<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinalCourseGrade extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'final_course_grades';

    protected $fillable = [
        'academic_year_id',
        'semester_id',
        'class_id',
        'subject_id',
        'student_id',
        'course_assignment_id',
        'final_score',
        'status',
        'validated_by',
        'validated_at',
        'notes',
    ];

    protected $casts = [
        'academic_year_id' => 'integer',
        'semester_id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'student_id' => 'integer',
        'course_assignment_id' => 'integer',
        'final_score' => 'float',
        'validated_by' => 'integer',
        'validated_at' => 'datetime',
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

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function courseAssignment(): BelongsTo
    {
        return $this->belongsTo(CourseAssignment::class, 'course_assignment_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function competencyAchievement(): HasOne
    {
        return $this->hasOne(CompetencyAchievement::class, 'final_course_grade_id');
    }
}
