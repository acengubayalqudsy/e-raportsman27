<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Religion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'religions';

    protected $fillable = [
        'name',
        'status',
    ];

    protected $appends = [
        'is_active',
    ];

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'Aktif';
    }

    /**
     * Students adhering to this religion.
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'religion_id');
    }

    /**
     * Determine if the religion is currently referenced by any student records.
     */
    public function isReferencedByStudents(): bool
    {
        return $this->students()->exists() || Student::where('religion', $this->name)->exists();
    }
}
