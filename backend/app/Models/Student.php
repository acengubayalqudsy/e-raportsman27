<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'students';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'nis',
        'nisn',
        'name',
        'gender',
        'birth_place',
        'birth_date',
        'religion',
        'address',
        'phone',
        'previous_school',
        'accepted_class',
        'admission_date',
        'father_name',
        'mother_name',
        'father_occupation',
        'mother_occupation',
        'parent_phone',
        'guardian_name',
        'guardian_address',
        'guardian_phone',
        'status',
        'current_class_name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birth_date' => 'date:Y-m-d',
        'admission_date' => 'date:Y-m-d',
    ];

    /**
     * Get the associated user account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the student's class memberships.
     */
    public function classMembers(): HasMany
    {
        return $this->hasMany(ClassMember::class, 'student_id');
    }

    /**
     * Accessor for full gender label (Laki-laki / Perempuan).
     */
    public function getGenderLabelAttribute(): string
    {
        return match ($this->attributes['gender'] ?? '') {
            'L' => 'Laki-laki',
            'P' => 'Perempuan',
            default => $this->attributes['gender'] ?? '-',
        };
    }

    /**
     * Accessor for avatar initials.
     */
    public function getAvatarAttribute(): string
    {
        $words = preg_split('/\s+/', trim($this->name ?? ''));
        $initials = '';
        foreach (array_slice($words, 0, 2) as $w) {
            if ($w !== '') {
                $initials .= mb_strtoupper(mb_substr($w, 0, 1));
            }
        }
        return $initials ?: 'ST';
    }

    /**
     * Accessor for formatted birth string (e.g., "Garut, 12 Apr 2008").
     */
    public function getBirthAttribute(): string
    {
        $dateStr = $this->birth_date instanceof Carbon
            ? $this->birth_date->translatedFormat('d M Y')
            : ($this->birth_date ? Carbon::parse($this->birth_date)->translatedFormat('d M Y') : '');

        return trim("{$this->birth_place}, {$dateStr}", ', ');
    }

    /**
     * Accessor for class name.
     */
    public function getClassNameAttribute(): ?string
    {
        return $this->current_class_name ?: $this->accepted_class;
    }

    /**
     * Accessor for grade (X, XI, XII).
     */
    public function getGradeAttribute(): string
    {
        $class = $this->class_name ?? '';
        if (preg_match('/^(X|XI|XII)\b/i', $class, $matches)) {
            return strtoupper($matches[1]);
        }
        return '-';
    }

    /**
     * Accessor for study group / rombel.
     */
    public function getStudyGroupAttribute(): string
    {
        $class = $this->class_name ?? '';
        return trim(preg_replace('/^(X|XI|XII)\s*/i', '', $class)) ?: '-';
    }

    /**
     * Scope query to apply search and filters safely.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        // Search by name, NIS, or NISN
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('nis', 'like', $search)
                  ->orWhere('nisn', 'like', $search);
            });
        }

        // Filter by class_name
        if (!empty($filters['class_name'])) {
            $query->where('current_class_name', $filters['class_name']);
        }

        // Filter by grade (X, XI, XII)
        if (!empty($filters['grade'])) {
            $grade = strtoupper(trim($filters['grade']));
            $query->where(function (Builder $q) use ($grade) {
                $q->where('current_class_name', 'like', "{$grade} %")
                  ->orWhere('current_class_name', '=', $grade);
            });
        }

        // Filter by study group
        if (!empty($filters['study_group'])) {
            $sg = trim($filters['study_group']);
            $query->where('current_class_name', 'like', "% {$sg}");
        }

        // Filter by gender
        if (!empty($filters['gender'])) {
            $genderVal = match (strtolower(trim($filters['gender']))) {
                'laki-laki', 'l' => 'L',
                'perempuan', 'p' => 'P',
                default => null,
            };
            if ($genderVal) {
                $query->where('gender', $genderVal);
            }
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query;
    }
}
