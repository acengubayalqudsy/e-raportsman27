<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LearningObjective extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'learning_objectives';

    protected $fillable = [
        'subject_id',
        'academic_year_id',
        'semester_id',
        'grade',
        'code',
        'description',
        'created_by',
        'status',
    ];

    protected $casts = [
        'subject_id' => 'integer',
        'academic_year_id' => 'integer',
        'semester_id' => 'integer',
        'created_by' => 'integer',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class, 'learning_objective_id');
    }
}
