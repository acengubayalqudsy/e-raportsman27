<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CompetencyAchievement extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'competency_achievements';

    protected $fillable = [
        'final_course_grade_id',
        'student_id',
        'highest_achievement',
        'lowest_achievement',
        'is_customized',
    ];

    protected $casts = [
        'final_course_grade_id' => 'integer',
        'student_id' => 'integer',
        'is_customized' => 'boolean',
    ];

    public function finalCourseGrade(): BelongsTo
    {
        return $this->belongsTo(FinalCourseGrade::class, 'final_course_grade_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
