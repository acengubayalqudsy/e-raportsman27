<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentScore extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'student_scores';

    protected $fillable = [
        'assessment_id',
        'student_id',
        'raw_score',
        'is_remedial',
        'remedial_score',
        'final_score',
        'notes',
    ];

    protected $casts = [
        'assessment_id' => 'integer',
        'student_id' => 'integer',
        'raw_score' => 'float',
        'is_remedial' => 'boolean',
        'remedial_score' => 'float',
        'final_score' => 'float',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class, 'assessment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
