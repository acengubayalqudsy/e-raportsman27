<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assessment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'assessments';

    protected $fillable = [
        'course_assignment_id',
        'learning_objective_id',
        'type',
        'title',
        'weight',
        'max_score',
        'passing_grade',
        'assessment_date',
        'status',
    ];

    protected $casts = [
        'course_assignment_id' => 'integer',
        'learning_objective_id' => 'integer',
        'weight' => 'float',
        'max_score' => 'float',
        'passing_grade' => 'float',
        'assessment_date' => 'date',
    ];

    public function courseAssignment(): BelongsTo
    {
        return $this->belongsTo(CourseAssignment::class, 'course_assignment_id');
    }

    public function learningObjective(): BelongsTo
    {
        return $this->belongsTo(LearningObjective::class, 'learning_objective_id');
    }

    public function studentScores(): HasMany
    {
        return $this->hasMany(StudentScore::class, 'assessment_id');
    }
}
