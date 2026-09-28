<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SavedReport extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type', 'title', 'academic_year_id', 'semester_id', 'class_id',
        'student_id', 'created_by', 'notes', 'snapshot', 'generated_at',
    ];

    protected $casts = [
        'snapshot' => 'array',
        'generated_at' => 'datetime',
    ];

    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class, 'class_id'); }
    public function semester(): BelongsTo { return $this->belongsTo(Semester::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
