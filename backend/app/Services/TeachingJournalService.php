<?php

namespace App\Services;

use App\Models\CourseAssignment;
use App\Models\Schedule;
use App\Models\Semester;
use App\Models\TeachingJournal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class TeachingJournalService
{
    public function __construct(private AcademicAuthorizationService $authorization) {}

    public function query(User $user, array $filters): Builder
    {
        $query = TeachingJournal::with(['academicYear', 'semester', 'schoolClass', 'subject', 'teacher'])
            ->orderByDesc('date')->orderByDesc('meeting');

        if (!$user->hasRole('admin')) {
            $teacher = $user->teacher;
            $query->where('teacher_id', $teacher?->id ?: 0);
        }

        foreach (['academic_year_id', 'semester_id', 'class_id', 'subject_id', 'teacher_id', 'status'] as $field) {
            if (isset($filters[$field]) && $filters[$field] !== '') {
                $query->where($field, $filters[$field]);
            }
        }
        if (!empty($filters['date_from'])) $query->whereDate('date', '>=', $filters['date_from']);
        if (!empty($filters['date_to'])) $query->whereDate('date', '<=', $filters['date_to']);

        return $query;
    }

    public function assertCanManage(User $user, array $data): void
    {
        $assignment = CourseAssignment::where([
            'academic_year_id' => $data['academic_year_id'],
            'semester_id' => $data['semester_id'],
            'class_id' => $data['class_id'],
            'subject_id' => $data['subject_id'],
            'teacher_id' => $data['teacher_id'],
            'status' => 'Aktif',
        ])->first();

        if (!$assignment) {
            throw ValidationException::withMessages([
                'academic_context' => ['Jurnal harus terkait penugasan mengajar aktif pada konteks akademik yang dipilih.'],
            ]);
        }
        $semester = Semester::find($data['semester_id']);
        $academicYear = $semester?->academicYear;
        if (!$semester || !$academicYear
            || (int) $semester->academic_year_id !== (int) $data['academic_year_id']
            || (int) $assignment->semester_id !== (int) $semester->id
            || (int) $assignment->academic_year_id !== (int) $academicYear->id
            || (int) $assignment->schoolClass?->academic_year_id !== (int) $academicYear->id) {
            throw ValidationException::withMessages([
                'academic_context' => ['Penugasan jurnal memiliki konteks tahun ajaran atau semester yang tidak konsisten.'],
            ]);
        }
        $journalDate = Carbon::parse($data['date']);
        if ($journalDate->lt(Carbon::parse($academicYear->start_date))
            || $journalDate->gt(Carbon::parse($academicYear->end_date))
            || $journalDate->lt(Carbon::parse($semester->start_date))
            || $journalDate->gt(Carbon::parse($semester->end_date))) {
            throw ValidationException::withMessages([
                'date' => ['Tanggal jurnal harus berada dalam rentang semester dan tahun ajaran yang dipilih.'],
            ]);
        }
        if (!$this->authorization->canManageCourseAssignment($user, $assignment)) {
            throw ValidationException::withMessages([
                'teacher_id' => ['Guru hanya dapat mengelola jurnal penugasannya sendiri.'],
            ]);
        }

        if (!empty($data['schedule_id'])) {
            $schedule = Schedule::find($data['schedule_id']);
            if (!$schedule || (int) $schedule->academic_year_id !== (int) $data['academic_year_id']
                || (int) $schedule->semester_id !== (int) $data['semester_id']
                || (int) $schedule->class_id !== (int) $data['class_id']
                || (int) $schedule->subject_id !== (int) $data['subject_id']
                || (int) $schedule->teacher_id !== (int) $data['teacher_id']
                || ($schedule->course_assignment_id && (int) $schedule->course_assignment_id !== (int) $assignment->id)) {
                throw ValidationException::withMessages([
                    'schedule_id' => ['Jadwal tidak sesuai dengan penugasan dan konteks akademik jurnal.'],
                ]);
            }
        }
    }

    public function create(User $user, array $data): TeachingJournal
    {
        $this->assertCanManage($user, $data);
        return TeachingJournal::create($data)->load(['academicYear', 'semester', 'schoolClass', 'subject', 'teacher']);
    }

    public function update(User $user, TeachingJournal $journal, array $data): TeachingJournal
    {
        $merged = array_merge($journal->only([
            'academic_year_id', 'semester_id', 'class_id', 'subject_id', 'teacher_id', 'schedule_id',
            'date', 'meeting', 'material', 'chapter', 'activities', 'method', 'media', 'notes',
            'attendance_present', 'attendance_total', 'status',
        ]), $data);
        $this->assertCanManage($user, $merged);
        $journal->update($data);
        return $journal->refresh()->load(['academicYear', 'semester', 'schoolClass', 'subject', 'teacher']);
    }
}
