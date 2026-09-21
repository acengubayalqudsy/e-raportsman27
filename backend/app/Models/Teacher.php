<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'teachers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'nip',
        'nuptk',
        'name',
        'gender',
        'birth_place',
        'birth_date',
        'phone',
        'email',
        'address',
        'employment_status',
        'type',
        'subject',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birth_date' => 'date:Y-m-d',
    ];

    /**
     * Get the associated user account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function homeroomAssignments(): HasMany
    {
        return $this->hasMany(HomeroomAssignment::class, 'teacher_id');
    }

    public function courseAssignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class, 'teacher_id');
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
     * Accessor for avatar initials (e.g. "DK" for "Deden Kurnia, S.Pd.").
     */
    public function getAvatarAttribute(): string
    {
        $cleanName = preg_replace('/,.*$/', '', trim($this->name ?? ''));
        $words = preg_split('/\s+/', $cleanName);
        $initials = '';
        foreach (array_slice($words, 0, 2) as $w) {
            if ($w !== '') {
                $initials .= mb_strtoupper(mb_substr($w, 0, 1));
            }
        }
        return $initials ?: 'GR';
    }

    /**
     * Accessor for formatted birth string (e.g. "Garut, 15 Mar 1980").
     */
    public function getBirthAttribute(): string
    {
        if (!$this->birth_date) {
            return $this->birth_place ?: '-';
        }

        $dateStr = $this->birth_date instanceof Carbon
            ? $this->birth_date->translatedFormat('d M Y')
            : Carbon::parse($this->birth_date)->translatedFormat('d M Y');

        return trim("{$this->birth_place}, {$dateStr}", ', ');
    }

    /**
     * Scope query to apply search and filters safely.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        // Search by name, NIP, or NUPTK
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('nip', 'like', $search)
                  ->orWhere('nuptk', 'like', $search);
            });
        }

        // Filter by status
        if (!empty($filters['status']) && $filters['status'] !== 'Semua Status') {
            $query->where('status', $filters['status']);
        }

        // Filter by gender
        if (!empty($filters['gender']) && $filters['gender'] !== 'Semua') {
            $genderVal = match (strtolower(trim($filters['gender']))) {
                'laki-laki', 'l' => 'L',
                'perempuan', 'p' => 'P',
                default => null,
            };
            if ($genderVal) {
                $query->where('gender', $genderVal);
            }
        }

        // Filter by employment status
        if (!empty($filters['employment_status']) && $filters['employment_status'] !== 'Semua Kepegawaian') {
            $query->where('employment_status', $filters['employment_status']);
        }

        // Filter by subject
        if (!empty($filters['subject']) && $filters['subject'] !== 'Semua Mata Pelajaran') {
            $query->where('subject', $filters['subject']);
        }

        // Filter by type (Guru / Tenaga Kependidikan)
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        return $query;
    }
}
