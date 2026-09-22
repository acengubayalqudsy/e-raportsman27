<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeachingJournal extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'academic_year_id', 'semester_id', 'class_id', 'subject_id', 'teacher_id',
        'schedule_id', 'date', 'meeting', 'material', 'chapter', 'activities',
        'method', 'media', 'notes', 'attendance_present', 'attendance_total', 'status',
    ];

    protected $casts = [
        'academic_year_id' => 'integer', 'semester_id' => 'integer', 'class_id' => 'integer',
        'subject_id' => 'integer', 'teacher_id' => 'integer', 'schedule_id' => 'integer',
        'meeting' => 'integer', 'attendance_present' => 'integer', 'attendance_total' => 'integer',
        'date' => 'date',
    ];

    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function semester(): BelongsTo { return $this->belongsTo(Semester::class); }
    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class, 'class_id'); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class)->withTrashed(); }
    public function teacher(): BelongsTo { return $this->belongsTo(Teacher::class)->withTrashed(); }
    public function schedule(): BelongsTo { return $this->belongsTo(Schedule::class); }
}
