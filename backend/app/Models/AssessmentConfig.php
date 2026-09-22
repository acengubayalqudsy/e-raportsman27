<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentConfig extends Model
{
    use HasFactory;

    protected $table = 'assessment_configs';

    protected $fillable = [
        'academic_year_id',
        'semester_id',
        'subject_id',
        'passing_grade_default',
        'weight_sumatif_materi',
        'weight_sumatif_akhir',
        'include_formatif_in_final',
        'calculation_formula',
        'is_approved_by_school',
        'approval_reference',
        'approved_at',
    ];

    protected $casts = [
        'academic_year_id' => 'integer',
        'semester_id' => 'integer',
        'subject_id' => 'integer',
        'passing_grade_default' => 'float',
        'weight_sumatif_materi' => 'float',
        'weight_sumatif_akhir' => 'float',
        'include_formatif_in_final' => 'boolean',
        'is_approved_by_school' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
