<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Extracurricular extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'extracurriculars';

    protected $fillable = [
        'code',
        'name',
        'teacher_id',
        'description',
        'status',
    ];

    /**
     * Pembina / Teacher supervisor for this extracurricular activity.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    /**
     * Student participants and score entries in this activity.
     */
    public function studentExtracurriculars(): HasMany
    {
        return $this->hasMany(StudentExtracurricular::class, 'extracurricular_id');
    }

    /**
     * Determine if this extracurricular is referenced by any student records.
     */
    public function isReferencedByStudents(): bool
    {
        return $this->studentExtracurriculars()->exists()
            || StudentExtracurricular::where('activity_name', $this->name)->exists();
    }
}
