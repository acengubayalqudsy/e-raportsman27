<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Room;
use App\Models\Religion;
use App\Models\Extracurricular;
use App\Models\Schedule;
use App\Models\TeachingJournal;
use App\Models\StudentExtracurricular;
use App\Models\StudentCocurricular;
use App\Models\HomeroomNote;
use App\Models\FinalCourseGrade;
use App\Models\HomeroomAssignment;
use App\Models\CompetencyAchievement;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentAttendanceEntry;
use App\Models\StudentAttendance;
use App\Models\StudentScore;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExcelTransferService
{
    private const REFERENCE_IMPORTS = ['classes', 'subjects', 'years', 'semesters', 'rooms', 'religions', 'extracurriculars'];

    public const COLUMNS = [
        'students' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'JK' => 'gender',
            'Tempat Lahir' => 'birth_place', 'Tanggal Lahir' => 'birth_date', 'Kelas' => 'current_class_name',
            'Agama' => 'religion', 'Status' => 'status'],
        'teachers' => ['NIP' => 'nip', 'NUPTK' => 'nuptk', 'Nama' => 'name', 'Email' => 'email', 'Mapel' => 'subject'],
        'classes' => ['Kode' => 'code', 'Nama' => 'name', 'Tingkat' => 'grade', 'Tahun Pelajaran ID' => 'academic_year_id', 'Kapasitas' => 'capacity'],
        'subjects' => ['Kode' => 'code', 'Nama' => 'name', 'Kelompok' => 'group', 'Jam per Minggu' => 'weekly_hours'],
        'years' => ['Tahun Pelajaran' => 'name', 'Mulai' => 'start_date', 'Selesai' => 'end_date', 'Status' => 'status'],
        'semesters' => ['Semester ID' => 'id', 'Tahun Pelajaran ID' => 'academic_year_id', 'Nama' => 'name', 'Mulai' => 'start_date', 'Selesai' => 'end_date', 'Status' => 'status'],
        'rooms' => ['Ruangan ID' => 'id', 'Tahun Pelajaran ID' => 'academic_year_id', 'Kode' => 'code', 'Nama' => 'name', 'Gedung' => 'building', 'Lantai' => 'floor', 'Kapasitas' => 'capacity', 'Tipe' => 'room_type'],
        'religions' => ['Nama' => 'name', 'Status' => 'status'],
        'extracurriculars' => ['Kode' => 'code', 'Nama' => 'name', 'Pembina ID' => 'teacher_id', 'Status' => 'status'],
        'users' => ['Username' => 'username', 'Nama' => 'name', 'Email' => 'email', 'Aktif' => 'is_active'],
        'schedules' => ['Jadwal ID' => 'id', 'Tahun Pelajaran ID' => 'academic_year_id', 'Semester ID' => 'semester_id', 'Kelas ID' => 'class_id', 'Mapel ID' => 'subject_id', 'Guru ID' => 'teacher_id', 'Ruangan ID' => 'room_id', 'Hari' => 'day_of_week', 'Mulai' => 'start_time', 'Selesai' => 'end_time'],
        'journals' => ['Jurnal ID' => 'id', 'Tanggal' => 'date', 'Kelas ID' => 'class_id', 'Mapel ID' => 'subject_id', 'Guru ID' => 'teacher_id', 'Pertemuan' => 'meeting', 'Materi' => 'material', 'Aktivitas' => 'activities', 'Catatan' => 'notes', 'Status' => 'status'],
        'participations' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Kode Ekskul' => 'code', 'Kegiatan' => 'activity_name', 'Predikat' => 'predicate', 'Deskripsi' => 'description'],
        'leger' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Kode Mapel' => 'subject_code', 'Nilai Akhir' => 'final_score', 'Status' => 'status'],
        'rombel_members' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Kelas ID' => 'class_id', 'Semester ID' => 'semester_id', 'Status' => 'status'],
        'homeroom_assignments' => ['Penugasan ID' => 'id', 'Kelas ID' => 'class_id', 'Semester ID' => 'semester_id', 'Guru ID' => 'teacher_id', 'No SK' => 'sk_number', 'Status' => 'status'],
        'course_assignments' => ['Penugasan ID' => 'id', 'Kelas ID' => 'class_id', 'Semester ID' => 'semester_id', 'Mapel ID' => 'subject_id', 'Guru ID' => 'teacher_id', 'Jam per Minggu' => 'weekly_hours', 'Peran' => 'role', 'Status' => 'status'],
        'class_recap' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Kode Mapel' => 'subject_code', 'Nilai Akhir' => 'final_score', 'Status' => 'status'],
        'competencies' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Capaian Tertinggi' => 'highest_achievement', 'Capaian Terendah' => 'lowest_achievement'],
        'report_card' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Kode Mapel' => 'subject_code', 'Mapel' => 'subject_name', 'Nilai Akhir' => 'final_score', 'Capaian Tertinggi' => 'highest_achievement', 'Capaian Terendah' => 'lowest_achievement', 'Status' => 'status'],
        'validation_status' => ['Penugasan ID' => 'course_assignment_id', 'Kode Mapel' => 'subject_code', 'Mapel' => 'subject_name', 'Guru' => 'teacher_name', 'Jumlah Siswa' => 'total_students', 'Sudah Dinilai' => 'scored_count', 'Punya Deskripsi' => 'descriptions_count', 'Status' => 'status'],
        'cocurriculars' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Projek ID' => 'project_id', 'Projek' => 'title', 'Catatan' => 'description'],
        'homeroom_notes' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Catatan Wali Kelas' => 'note'],
        'scores' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Assessment ID' => 'assessment_id', 'Nilai' => 'score', 'Catatan' => 'notes'],
        'attendance' => ['NISN' => 'nisn', 'NIS' => 'nis', 'Nama' => 'name', 'Tanggal' => 'date', 'Status' => 'status', 'Keterangan' => 'notes'],
    ];

    public function __construct(private AcademicAuthorizationService $auth) {}

    public function headers(string $module): array
    {
        return array_keys(self::COLUMNS[$module] ?? throw ValidationException::withMessages(['module' => 'Modul Excel belum didukung.']));
    }

    public function export(string $module, User $user, array $context): array
    {
        $this->authorize($module, $user, $context, false);
        $rows = match ($module) {
            'students' => $this->studentQuery($user, $context)->orderBy('name')->get(),
            'teachers' => $this->teacherQuery($context)->orderBy('name')->get(),
            'classes', 'subjects', 'years', 'semesters', 'rooms', 'religions', 'extracurriculars', 'users' => $this->referenceQuery($module, $context)->get(),
            'schedules' => Schedule::query()->when($context['academic_year_id'] ?? null, fn (Builder $q, $v) => $q->where('academic_year_id', $v))
                ->when($context['semester_id'] ?? null, fn (Builder $q, $v) => $q->where('semester_id', $v))
                ->when($context['class_id'] ?? null, fn (Builder $q, $v) => $q->where('class_id', $v))
                ->when($context['day_of_week'] ?? null, fn (Builder $q, $v) => $q->where('day_of_week', $v))
                ->when($context['search'] ?? null, fn (Builder $q, $v) => $q->where(fn (Builder $inner) => $inner
                    ->whereHas('subject', fn (Builder $s) => $s->where('name', 'like', '%' . $v . '%'))
                    ->orWhereHas('teacher', fn (Builder $t) => $t->where('name', 'like', '%' . $v . '%'))))
                ->orderBy('day_of_week')->orderBy('start_time')->get(),
            'journals' => TeachingJournal::query()->when(!$user->hasRole('admin'), fn (Builder $q) => $q->where('teacher_id', $user->teacher?->id ?? 0))
                ->when($context['academic_year_id'] ?? null, fn (Builder $q, $v) => $q->where('academic_year_id', $v))
                ->when($context['semester_id'] ?? null, fn (Builder $q, $v) => $q->where('semester_id', $v))
                ->when($context['class_id'] ?? null, fn (Builder $q, $v) => $q->where('class_id', $v))
                ->when($context['subject_id'] ?? null, fn (Builder $q, $v) => $q->where('subject_id', $v))
                ->when($context['search'] ?? null, fn (Builder $q, $v) => $q->where(fn (Builder $inner) => $inner
                    ->where('material', 'like', '%' . $v . '%')->orWhere('activities', 'like', '%' . $v . '%')->orWhere('notes', 'like', '%' . $v . '%')))
                ->orderBy('date')->get(),
            'participations' => $this->participationRows($context),
            'leger' => $this->legerRows($context),
            'rombel_members' => $this->rombelRows($context),
            'homeroom_assignments' => HomeroomAssignment::query()->when($context['semester_id'] ?? null, fn (Builder $q, $v) => $q->where('semester_id', $v))
                ->when($context['class_id'] ?? null, fn (Builder $q, $v) => $q->where('class_id', $v))->orderBy('class_id')->get(),
            'course_assignments' => CourseAssignment::query()->when($context['semester_id'] ?? null, fn (Builder $q, $v) => $q->where('semester_id', $v))
                ->when($context['class_id'] ?? null, fn (Builder $q, $v) => $q->where('class_id', $v))
                ->when($context['subject_id'] ?? null, fn (Builder $q, $v) => $q->where('subject_id', $v))
                ->when($context['teacher_id'] ?? null, fn (Builder $q, $v) => $q->where('teacher_id', $v))->orderBy('class_id')->orderBy('subject_id')->get(),
            'class_recap' => $this->legerRows($context),
            'competencies' => $this->competencyRows($context),
            'report_card' => $this->reportCardRows($context),
            'validation_status' => $this->validationStatusRows($context),
            'cocurriculars' => $this->cocurricularRows($context),
            'homeroom_notes' => $this->homeroomNoteRows($context),
            'scores' => $this->scoreRows($context),
            'attendance' => $this->attendanceRows($context),
        };
        $fields = array_values(self::COLUMNS[$module]);
        $result = [];
        foreach ($rows as $row) {
            $result[] = array_map(static function ($field) use ($row) {
                $value = $row->{$field} ?? '';
                return $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value;
            }, $fields);
        }
        return $result;
    }

    private function studentQuery(User $user, array $context): Builder
    {
        $query = Student::query();
        if (!$user->hasAnyRole(['admin', 'kepala_sekolah'])) {
            $ids = $this->auth->getAllowedClassIds($user, isset($context['semester_id']) ? (int) $context['semester_id'] : null);
            $semesterId = $context['semester_id'] ?? null;
            $query->whereHas('classMembers', fn (Builder $member) => $member->whereIn('class_id', $ids)
                ->where('status', 'Aktif')->when($semesterId, fn (Builder $m) => $m->where('semester_id', $semesterId)));
        }
        if ($context['class_id'] ?? null) {
            $schoolClass = SchoolClass::findOrFail($context['class_id']);
            $semesterId = $context['semester_id'] ?? null;
            $query->where(function (Builder $q) use ($schoolClass, $semesterId, $user) {
                $q->whereHas('classMembers', fn (Builder $member) => $member->where('class_id', $schoolClass->id)
                    ->where('status', 'Aktif')->when($semesterId, fn (Builder $m) => $m->where('semester_id', $semesterId)));
                if (!$semesterId && $user->hasAnyRole(['admin', 'kepala_sekolah'])) $q->orWhere('current_class_name', $schoolClass->name);
            });
        }
        if (($context['class_name'] ?? '') !== '') $query->where('current_class_name', $context['class_name']);
        if (($context['status'] ?? '') !== '') $query->where('status', $context['status']);
        if (($context['gender'] ?? '') !== '') $query->where('gender', $context['gender']);
        if (($context['grade'] ?? '') !== '') $query->where('current_class_name', 'like', $context['grade'] . ' %');
        if (($context['study_group'] ?? '') !== '') $query->where('current_class_name', 'like', '% ' . $context['study_group']);
        if ($context['search'] ?? null) {
            $term = '%' . trim($context['search']) . '%';
            $query->where(fn (Builder $q) => $q->where('nisn', 'like', $term)->orWhere('nis', 'like', $term)->orWhere('name', 'like', $term));
        }
        return $query;
    }

    private function teacherQuery(array $context): Builder
    {
        $query = Teacher::query();
        if ($context['search'] ?? null) {
            $term = '%' . trim($context['search']) . '%';
            $query->where(fn (Builder $q) => $q->where('name', 'like', $term)->orWhere('nip', 'like', $term)->orWhere('nuptk', 'like', $term));
        }
        foreach (['status' => 'status', 'gender' => 'gender', 'employment_status' => 'employment_status', 'subject' => 'subject'] as $filter => $column) {
            if (($context[$filter] ?? '') !== '') $query->where($column, $context[$filter]);
        }
        if ($context['ids'] ?? null) $query->whereIn('id', array_map('intval', explode(',', $context['ids'])));
        return $query;
    }

    private function referenceQuery(string $module, array $context): Builder
    {
        $class = match ($module) {
            'classes' => SchoolClass::class, 'subjects' => Subject::class, 'years' => AcademicYear::class,
            'semesters' => Semester::class, 'rooms' => Room::class, 'religions' => Religion::class,
            'extracurriculars' => Extracurricular::class, 'users' => User::class,
        };
        $query = $class::query();
        if (in_array($module, ['classes', 'semesters'], true) && ($context['academic_year_id'] ?? null)) $query->where('academic_year_id', $context['academic_year_id']);
        if (($context['status'] ?? '') !== '' && $module !== 'users') $query->where('status', $context['status']);
        if ($module === 'subjects' && ($context['group'] ?? '') !== '') $query->where('group', $context['group']);
        if ($module === 'rooms' && ($context['type'] ?? '') !== '') $query->where('room_type', $context['type']);
        if ($module === 'users' && ($context['role'] ?? '') !== '') $query->whereHas('roles', fn (Builder $q) => $q->where('name', $context['role']));
        if ($context['search'] ?? null) {
            $term = '%' . trim($context['search']) . '%';
            $query->where(function (Builder $q) use ($module, $term) {
                $q->where($module === 'users' ? 'username' : 'name', 'like', $term);
                if (in_array($module, ['classes', 'subjects', 'rooms', 'extracurriculars'], true)) $q->orWhere('code', 'like', $term);
            });
        }
        return $query->orderBy($module === 'users' ? 'username' : 'name');
    }

    private function scoreRows(array $context): array
    {
        $assignment = CourseAssignment::findOrFail($context['course_assignment_id']);
        $assessments = Assessment::where('course_assignment_id', $assignment->id)->get();
        $members = ClassMember::with('student')->where('class_id', $assignment->class_id)
            ->where('semester_id', $assignment->semester_id)->where('status', 'Aktif')->get();
        $scores = StudentScore::whereIn('assessment_id', $assessments->pluck('id'))->get()->keyBy(fn ($s) => $s->assessment_id . ':' . $s->student_id);
        $rows = [];
        foreach ($assessments as $assessment) {
            foreach ($members as $member) {
                if (!$member->student) continue;
                $score = $scores->get($assessment->id . ':' . $member->student_id);
                $rows[] = (object) ['nisn' => $member->student->nisn, 'nis' => $member->student->nis, 'name' => $member->student->name,
                    'assessment_id' => $assessment->id, 'score' => $score?->raw_score, 'notes' => $score?->notes];
            }
        }
        return $rows;
    }

    private function attendanceRows(array $context): array
    {
        $query = StudentAttendanceEntry::where('class_id', $context['class_id'])->where('semester_id', $context['semester_id']);
        if (isset($context['course_assignment_id'])) $query->where('course_assignment_id', $context['course_assignment_id']);
        else $query->where('course_assignment_id', 0);
        if ($context['date'] ?? null) $query->whereDate('attendance_date', $context['date']);
        return $query->orderBy('attendance_date')->get()->map(function ($entry) {
            $student = Student::find($entry->student_id);
            return (object) ['nisn' => $student?->nisn, 'nis' => $student?->nis, 'name' => $student?->name,
                'date' => $entry->attendance_date?->format('Y-m-d'), 'status' => $entry->status, 'notes' => $entry->notes];
        })->all();
    }

    private function participationRows(array $context): array
    {
        $memberIds = ClassMember::where('class_id', $context['class_id'])->where('semester_id', $context['semester_id'])
            ->where('status', 'Aktif')->pluck('student_id');
        return StudentExtracurricular::with(['student', 'extracurricular'])
            ->where('semester_id', $context['semester_id'])->whereIn('student_id', $memberIds)
            ->when($context['activity_name'] ?? null, fn (Builder $q, $v) => $q->where('activity_name', $v))
            ->when($context['status'] ?? null, function (Builder $q, $status) {
                if ($status === 'Sudah Dinilai') $q->whereNotNull('predicate')->where('predicate', '<>', '')->whereNotNull('description')->where('description', '<>', '');
                if ($status === 'Belum Dinilai') $q->where(fn (Builder $inner) => $inner->whereNull('predicate')->orWhere('predicate', '')->orWhereNull('description')->orWhere('description', ''));
            })
            ->when($context['search'] ?? null, fn (Builder $q, $v) => $q->where(fn (Builder $inner) => $inner
                ->whereHas('student', fn (Builder $s) => $s->where('name', 'like', '%' . $v . '%')->orWhere('nis', 'like', '%' . $v . '%'))
                ->orWhere('activity_name', 'like', '%' . $v . '%')))->get()
            ->map(static fn ($item) => (object) ['nisn' => $item->student?->nisn, 'nis' => $item->student?->nis,
                'name' => $item->student?->name, 'code' => $item->extracurricular?->code,
                'activity_name' => $item->activity_name, 'predicate' => $item->predicate, 'description' => $item->description])->all();
    }

    private function legerRows(array $context): array
    {
        return FinalCourseGrade::with(['student', 'subject'])->where('class_id', $context['class_id'])
            ->where('semester_id', $context['semester_id'])->orderBy('student_id')->orderBy('subject_id')->get()
            ->map(static fn ($grade) => (object) ['nisn' => $grade->student?->nisn, 'nis' => $grade->student?->nis,
                'name' => $grade->student?->name, 'subject_code' => $grade->subject?->code,
                'final_score' => $grade->final_score, 'status' => $grade->status])->all();
    }

    private function rombelRows(array $context): array
    {
        return ClassMember::with('student')->where('class_id', $context['class_id'])
            ->where('semester_id', $context['semester_id'])->orderBy('student_id')->get()
            ->map(static fn ($member) => (object) ['nisn' => $member->student?->nisn, 'nis' => $member->student?->nis,
                'name' => $member->student?->name, 'class_id' => $member->class_id,
                'semester_id' => $member->semester_id, 'status' => $member->status])->all();
    }

    private function competencyRows(array $context): array
    {
        return FinalCourseGrade::with(['student', 'competencyAchievement'])
            ->where('course_assignment_id', $context['course_assignment_id'])->orderBy('student_id')->get()
            ->map(static fn ($grade) => (object) ['nisn' => $grade->student?->nisn, 'nis' => $grade->student?->nis,
                'name' => $grade->student?->name, 'highest_achievement' => $grade->competencyAchievement?->highest_achievement,
                'lowest_achievement' => $grade->competencyAchievement?->lowest_achievement])->all();
    }

    private function reportCardRows(array $context): array
    {
        $student = Student::findOrFail($context['student_id']);
        return FinalCourseGrade::with(['subject', 'competencyAchievement'])
            ->where('student_id', $student->id)->where('semester_id', $context['semester_id'])->orderBy('subject_id')->get()
            ->map(static fn ($grade) => (object) ['nisn' => $student->nisn, 'nis' => $student->nis, 'name' => $student->name,
                'subject_code' => $grade->subject?->code, 'subject_name' => $grade->subject?->name,
                'final_score' => $grade->final_score, 'highest_achievement' => $grade->competencyAchievement?->highest_achievement,
                'lowest_achievement' => $grade->competencyAchievement?->lowest_achievement, 'status' => $grade->status])->all();
    }

    private function validationStatusRows(array $context): array
    {
        $classId = $context['class_id'];
        $semesterId = $context['semester_id'];
        $total = ClassMember::where('class_id', $classId)->where('semester_id', $semesterId)->where('status', 'Aktif')->count();
        return CourseAssignment::with(['subject', 'teacher'])->where('class_id', $classId)->where('semester_id', $semesterId)
            ->where('status', 'Aktif')->orderBy('subject_id')->get()->map(function ($course) use ($total) {
                $grades = FinalCourseGrade::with('competencyAchievement')->where('course_assignment_id', $course->id)
                    ->whereNotNull('final_score')->get();
                $scored = $grades->count();
                $described = $grades->filter(fn ($grade) => !empty($grade->competencyAchievement?->highest_achievement))->count();
                $status = $grades->contains(fn ($grade) => $grade->status === 'Terkunci') ? 'Sudah Divalidasi'
                    : ($total > 0 && $scored >= $total && $described >= $total ? 'Siap Divalidasi' : 'Belum Lengkap');
                return (object) ['course_assignment_id' => $course->id, 'subject_code' => $course->subject?->code,
                    'subject_name' => $course->subject?->name, 'teacher_name' => $course->teacher?->name,
                    'total_students' => $total, 'scored_count' => $scored, 'descriptions_count' => $described, 'status' => $status];
            })->all();
    }

    private function cocurricularRows(array $context): array
    {
        $members = ClassMember::where('class_id', $context['class_id'])->where('semester_id', $context['semester_id'])
            ->where('status', 'Aktif')->pluck('student_id');
        return StudentCocurricular::with('student')->where('class_id', $context['class_id'])
            ->where('semester_id', $context['semester_id'])->whereIn('student_id', $members)
            ->when($context['search'] ?? null, fn (Builder $q, $term) => $q->where(fn (Builder $inner) => $inner
                ->where('title', 'like', '%' . $term . '%')->orWhereHas('student', fn (Builder $s) => $s
                    ->where('name', 'like', '%' . $term . '%')->orWhere('nis', 'like', '%' . $term . '%'))))
            ->when($context['status'] ?? null, function (Builder $q, $status) {
                if ($status === 'Terisi') $q->whereNotNull('description')->where('description', '<>', '');
                if ($status === 'Belum Terisi') $q->where(fn (Builder $inner) => $inner->whereNull('description')->orWhere('description', ''));
            })->orderBy('student_id')->get()
            ->map(static fn ($item) => (object) ['nisn' => $item->student?->nisn, 'nis' => $item->student?->nis,
                'name' => $item->student?->name, 'project_id' => $item->id, 'title' => $item->title,
                'description' => $item->description])->all();
    }

    private function homeroomNoteRows(array $context): array
    {
        $members = ClassMember::with('student')->where('class_id', $context['class_id'])
            ->where('semester_id', $context['semester_id'])->where('status', 'Aktif')
            ->when($context['search'] ?? null, fn (Builder $q, $term) => $q->whereHas('student', fn (Builder $s) => $s
                ->where('name', 'like', '%' . $term . '%')->orWhere('nis', 'like', '%' . $term . '%')))
            ->orderBy('student_id')->get();
        $notes = HomeroomNote::where('class_id', $context['class_id'])->where('semester_id', $context['semester_id'])
            ->whereIn('student_id', $members->pluck('student_id'))->get()->keyBy('student_id');
        return $members->filter(function ($member) use ($notes, $context) {
            $status = $context['status'] ?? '';
            $filled = trim((string) $notes->get($member->student_id)?->note) !== '';
            return $status === 'Terisi' ? $filled : ($status === 'Belum Terisi' ? !$filled : true);
        })->map(static fn ($member) => (object) ['nisn' => $member->student?->nisn, 'nis' => $member->student?->nis,
            'name' => $member->student?->name, 'note' => $notes->get($member->student_id)?->note])->values()->all();
    }

    public function authorize(string $module, User $user, array $context, bool $write): void
    {
        if (!isset(self::COLUMNS[$module])) abort(404);
        if ($module === 'rombel_members') $this->auth->assertAcademicContext((int) ($context['class_id'] ?? 0), (int) ($context['semester_id'] ?? 0));
        if (in_array($module, ['teachers', 'classes', 'subjects', 'years', 'semesters', 'rooms', 'religions', 'extracurriculars', 'users', 'rombel_members', 'homeroom_assignments', 'course_assignments'], true) || ($write && $module === 'students')) {
            abort_unless($user->hasRole('admin'), 403);
        } elseif ($module === 'students') {
            abort_unless($user->hasAnyRole(['admin', 'guru', 'walikelas', 'kepala_sekolah']), 403);
            if ($context['class_id'] ?? null) abort_unless($this->auth->canAccessClass($user, (int) $context['class_id'], isset($context['semester_id']) ? (int) $context['semester_id'] : null) || $user->hasRole('kepala_sekolah'), 403);
        } elseif (in_array($module, ['scores', 'competencies'], true)) {
            $assignment = CourseAssignment::findOrFail($context['course_assignment_id'] ?? 0);
            abort_unless($write ? $this->auth->canManageCourseAssignment($user, $assignment) : $this->auth->canViewCourseAssignment($user, $assignment), 403);
        } elseif ($module === 'attendance') {
            $classId = (int) ($context['class_id'] ?? 0);
            $semesterId = (int) ($context['semester_id'] ?? 0);
            $this->auth->assertAcademicContext($classId, $semesterId);
            if ($context['course_assignment_id'] ?? null) {
                $course = CourseAssignment::whereKey($context['course_assignment_id'])->where('class_id', $classId)->where('semester_id', $semesterId)->firstOrFail();
                abort_unless($write ? $this->auth->canManageCourseAssignment($user, $course) : $this->auth->canViewCourseAssignment($user, $course), 403);
            } else {
                abort_unless($this->auth->isHomeroomTeacher($user, $classId, $semesterId), 403);
            }
        } elseif ($module === 'schedules') {
            abort_unless($user->hasRole('admin'), 403);
        } elseif ($module === 'journals') {
            abort_unless($user->hasAnyRole(['admin', 'guru']), 403);
        } elseif (in_array($module, ['participations', 'leger', 'cocurriculars', 'homeroom_notes'], true)) {
            $classId = (int) ($context['class_id'] ?? 0);
            $semesterId = (int) ($context['semester_id'] ?? 0);
            $this->auth->assertAcademicContext($classId, $semesterId);
            abort_unless($user->hasAnyRole(['admin', 'kepala_sekolah'])
                || $this->auth->canAccessClass($user, $classId, $semesterId), 403);
            if ($write && $module === 'participations') abort_unless($user->hasRole('admin')
                || $this->auth->isHomeroomTeacher($user, $classId, $semesterId), 403);
        } elseif (in_array($module, ['class_recap', 'validation_status'], true)) {
            $classId = (int) ($context['class_id'] ?? 0);
            $semesterId = (int) ($context['semester_id'] ?? 0);
            $this->auth->assertAcademicContext($classId, $semesterId);
            abort_unless($this->auth->canAccessClass($user, $classId, $semesterId), 403);
        } elseif ($module === 'report_card') {
            $student = Student::findOrFail((int) ($context['student_id'] ?? 0));
            $semesterId = (int) ($context['semester_id'] ?? 0);
            abort_unless(Semester::whereKey($semesterId)->exists() && $this->auth->canAccessStudent($user, $student, $semesterId), 403);
            if (!$user->hasAnyRole(['admin', 'kepala_sekolah'])) {
                abort_unless(ClassMember::where('student_id', $student->id)->where('semester_id', $semesterId)
                    ->whereIn('class_id', $this->auth->getAllowedClassIds($user, $semesterId))
                    ->where('status', 'Aktif')->exists(), 403);
            }
        }
    }

    public function preview(string $module, User $user, array $context, array $rows): array
    {
        $this->authorize($module, $user, $context, true);
        if (!in_array($module, array_merge(['students', 'teachers', 'scores', 'attendance', 'journals', 'participations', 'competencies'], self::REFERENCE_IMPORTS), true)) {
            throw ValidationException::withMessages(['module' => 'Import untuk modul ini belum tersedia.']);
        }
        if (!$rows || count($rows) > 10001) throw ValidationException::withMessages(['file' => 'Workbook kosong atau lebih dari 10.000 baris.']);
        $normalize = static fn ($header) => preg_replace('/[^a-z0-9]/', '', strtolower(trim((string) $header)));
        $sourceHeaders = array_map($normalize, array_shift($rows));
        $columns = [];
        foreach (self::COLUMNS[$module] as $label => $field) {
            $position = array_search($normalize($label), $sourceHeaders, true);
            if ($position !== false) $columns[$field] = $position;
        }
        if ($module === 'students' && (!isset($columns['name']) || (!isset($columns['nisn']) && !isset($columns['nis'])))) {
            throw ValidationException::withMessages(['file' => 'Format file tidak sesuai template Import Siswa. Header wajib: NISN, NIS, Nama, JK, Tempat Lahir, Tanggal Lahir, Kelas, Agama, Status.']);
        }
        foreach (match ($module) {
            'students' => ['name'], 'teachers' => ['name'], 'scores' => ['assessment_id', 'score'], 'attendance' => ['date', 'status'],
            'competencies' => ['highest_achievement', 'lowest_achievement'],
            'classes' => ['code', 'academic_year_id'],
            'subjects', 'extracurriculars' => ['code'], 'rooms' => ['id', 'code'],
            'years', 'religions' => ['name'], 'semesters' => ['id'],
            'journals' => ['id'], 'participations' => ['code'],
        } as $required) {
            if (!isset($columns[$required])) throw ValidationException::withMessages(['header' => "Kolom {$required} wajib ada."]);
        }
        if (!in_array($module, [...self::REFERENCE_IMPORTS, 'journals'], true) && !isset($columns['nisn']) && !isset($columns['nis']) && $module !== 'teachers') throw ValidationException::withMessages(['header' => 'Kolom NISN atau NIS wajib ada.']);
        if ($module === 'teachers' && !isset($columns['nip']) && !isset($columns['nuptk'])) throw ValidationException::withMessages(['header' => 'Kolom NIP atau NUPTK wajib ada.']);
        $preview = [];
        $seen = [];
        $seenStudentNisn = [];
        $seenStudentNis = [];
        $plannedSeats = [];
        foreach ($rows as $index => $cells) {
            if (!array_filter($cells, static fn ($v) => trim((string) $v) !== '')) continue;
            $data = [];
            foreach ($columns as $field => $position) $data[$field] = trim((string) ($cells[$position] ?? ''));
            if ($module === 'students' && isset($data['birth_date'])) $data['birth_date'] = $this->normalizeExcelDate($data['birth_date']);
            [$status, $reason, $target, $extra] = $module === 'students'
                ? $this->validateStudentRow($context, $data)
                : [...$this->validateRow($module, $user, $context, $data), []];
            $extra ??= [];
            $baseline = $target ? $this->baseline($module, $context, $data, $target) : null;
            if ($status === 'WARNING' && $baseline !== null && empty($extra['enroll_class_id']) && $this->noChange($module, $data, $baseline)) {
                [$status, $reason] = ['VALID', 'Data sesuai dengan record existing.'];
            }
            $key = $module === 'journals' ? ($data['id'] ?? '') : (in_array($module, self::REFERENCE_IMPORTS, true)
                ? ($module === 'rooms' ? ($data['id'] ?? '') : ($data['code'] ?? $data['name'] ?? $data['id'] ?? '')) . ($module === 'classes' ? ':' . ($data['academic_year_id'] ?? '') : '')
                : ($module === 'teachers' ? (($data['nip'] ?? '') ?: ($data['nuptk'] ?? '')) : (($data['nisn'] ?? '') ?: ($data['nis'] ?? ''))));
            if ($module === 'scores') $key .= ':' . ($data['assessment_id'] ?? '');
            if ($module === 'attendance') $key .= ':' . ($data['date'] ?? '');
            if ($module === 'participations') $key .= ':' . ($data['code'] ?? '');
            $targetKey = $target ? "target:{$target}" . (in_array($module, ['scores', 'attendance', 'participations'], true) ? ':' . ($data['assessment_id'] ?? $data['date'] ?? $data['code'] ?? '') : '') : "source:{$key}";
            if (isset($seen[$targetKey])) [$status, $reason] = ['ERROR', 'Identifier duplikat dalam workbook.'];
            $seen[$targetKey] = true;
            if ($module === 'students') {
                $nisn = $data['nisn'] ?? '';
                $nis = $data['nis'] ?? '';
                if ($nisn !== '' && isset($seenStudentNisn[$nisn])) [$status, $reason] = ['ERROR', 'NISN duplikat dalam workbook.'];
                if ($nis !== '' && isset($seenStudentNis[$nis])) [$status, $reason] = ['ERROR', 'NIS duplikat dalam workbook.'];
                if ($nisn !== '') $seenStudentNisn[$nisn] = true;
                if ($nis !== '') $seenStudentNis[$nis] = true;
                $classId = $extra['enroll_class_id'] ?? null;
                if ($classId && $status !== 'ERROR') {
                    $schoolClass = SchoolClass::findOrFail($classId);
                    $occupied = ClassMember::where('class_id', $classId)->where('semester_id', $context['semester_id'])
                        ->where('status', 'Aktif')->count();
                    if ($schoolClass->capacity > 0 && $occupied + ($plannedSeats[$classId] ?? 0) >= $schoolClass->capacity) {
                        [$status, $reason] = ['ERROR', 'Kapasitas rombel tidak mencukupi untuk siswa ini.'];
                    } else {
                        $plannedSeats[$classId] = ($plannedSeats[$classId] ?? 0) + 1;
                    }
                }
            }
            $preview[] = ['row' => $index + 2, 'identifier' => $key, 'data' => $data, 'status' => $status,
                'reason' => $reason, 'target_id' => $target, 'baseline' => $baseline,
                'operation' => $target ? 'UPDATE' : ($module === 'students' && $status !== 'ERROR' ? 'CREATE' : null),
                'enroll_class_id' => $extra['enroll_class_id'] ?? null];
        }
        return ['rows' => $preview, 'total' => count($preview), 'valid' => count(array_filter($preview, fn ($r) => $r['status'] === 'VALID')),
            'warnings' => count(array_filter($preview, fn ($r) => $r['status'] === 'WARNING')),
            'errors' => count(array_filter($preview, fn ($r) => $r['status'] === 'ERROR'))];
    }

    private function normalizeExcelDate(string $value): string
    {
        if (!preg_match('/^\d{5}(?:\.\d+)?$/', $value)) return $value;
        $days = (int) floor((float) $value);
        if ($days < 20000 || $days > 80000) return $value;
        return (new \DateTimeImmutable('1899-12-30'))->modify("+{$days} days")->format('Y-m-d');
    }

    private function validateStudentRow(array $context, array &$data): array
    {
        $nisn = $data['nisn'] ?? '';
        $nis = $data['nis'] ?? '';
        if ($nisn === '' && $nis === '') return ['ERROR', 'NISN atau NIS wajib diisi.', null, []];
        if (strlen($nisn) > 20 || strlen($nis) > 20) return ['ERROR', 'NISN dan NIS maksimum 20 karakter.', null, []];
        $byNisn = $nisn !== '' ? Student::withTrashed()->where('nisn', $nisn)->first() : null;
        $byNis = $nis !== '' ? Student::withTrashed()->where('nis', $nis)->first() : null;
        if ($byNisn && $byNis && $byNisn->id !== $byNis->id) return ['ERROR', 'NISN dan NIS milik siswa yang berbeda.', null, []];
        $record = $byNisn ?: $byNis;
        if ($record?->trashed()) return ['ERROR', 'Identifier milik siswa yang sudah dihapus. Pulihkan melalui alur Master Data.', null, []];
        if ($record && (($nisn !== '' && $record->nisn !== $nisn) || ($nis !== '' && $record->nis !== $nis))) {
            return ['ERROR', 'NISN dan NIS tidak cocok dengan siswa existing.', null, []];
        }
        if (($data['name'] ?? '') === '' || mb_strlen($data['name']) > 150) return ['ERROR', 'Nama siswa wajib diisi dan maksimum 150 karakter.', null, []];
        $gender = strtolower($data['gender'] ?? '');
        $data['gender'] = match ($gender) { 'laki-laki', 'laki laki', 'l' => 'L', 'perempuan', 'p' => 'P', default => $data['gender'] ?? '' };
        if (($data['gender'] ?? '') !== '' && !in_array($data['gender'], ['L', 'P'], true)) return ['ERROR', 'JK harus L atau P.', null, []];
        if (mb_strlen($data['birth_place'] ?? '') > 100) return ['ERROR', 'Tempat lahir maksimum 100 karakter.', null, []];
        if (($data['birth_date'] ?? '') !== '' && !$this->validDate($data['birth_date'])) return ['ERROR', 'Tanggal lahir harus YYYY-MM-DD.', null, []];
        if (mb_strlen($data['current_class_name'] ?? '') > 50) return ['ERROR', 'Nama kelas maksimum 50 karakter.', null, []];
        if (mb_strlen($data['religion'] ?? '') > 30) return ['ERROR', 'Agama maksimum 30 karakter.', null, []];
        if (($data['religion'] ?? '') !== '' && $data['religion'] !== $record?->religion && !Religion::where('name', $data['religion'])->exists()) {
            return ['ERROR', 'Agama tidak ditemukan pada Master Data.', null, []];
        }
        if (($data['status'] ?? '') !== '' && !in_array($data['status'], ['Aktif', 'Alumni', 'Mutasi', 'Nonaktif'], true)) {
            return ['ERROR', 'Status siswa tidak valid.', null, []];
        }
        if ($record && ($data['status'] ?? '') !== '' && $data['status'] !== $record->status) {
            return ['ERROR', 'Status siswa harus diubah melalui formulir Master Data.', null, []];
        }
        if (!$record && (($data['nisn'] ?? '') === '' || ($data['nis'] ?? '') === '' || ($data['gender'] ?? '') === ''
            || ($data['birth_place'] ?? '') === '' || ($data['birth_date'] ?? '') === '' || ($data['current_class_name'] ?? '') === '')) {
            return ['ERROR', 'Siswa baru memerlukan NISN, NIS, Nama, JK, Tempat Lahir, Tanggal Lahir, dan Kelas.', null, []];
        }
        if (!$record && ($data['status'] ?? 'Aktif') !== 'Aktif') return ['ERROR', 'Siswa baru harus berstatus Aktif untuk didaftarkan ke rombel.', null, []];
        if ($record && ($data['current_class_name'] ?? '') !== '' && $record->current_class_name !== null
            && $record->current_class_name !== '' && $record->current_class_name !== $data['current_class_name']) {
            return ['ERROR', 'Kelas siswa berbeda. Perpindahan harus melalui modul Rombel.', null, []];
        }
        $extra = [];
        $className = $data['current_class_name'] ?? '';
        if ($className !== '') {
            $semester = isset($context['semester_id']) ? Semester::find($context['semester_id']) : null;
            if (!$semester && !$record) return ['ERROR', 'Pilih semester sebelum mengimport siswa baru.', null, []];
            if ($semester) {
                if (isset($context['academic_year_id']) && (int) $context['academic_year_id'] !== (int) $semester->academic_year_id) {
                    return ['ERROR', 'Tahun pelajaran dan semester yang dipilih tidak cocok.', null, []];
                }
                $class = SchoolClass::where('academic_year_id', $semester->academic_year_id)
                    ->where(fn (Builder $query) => $query->where('name', $className)->orWhere('code', $className))->first();
                if (!$class) return ['ERROR', 'Kelas tidak ditemukan pada tahun pelajaran semester terpilih.', null, []];
                $data['current_class_name'] = $class->name;
                if ($record) {
                    $member = ClassMember::where('student_id', $record->id)->where('semester_id', $semester->id)
                        ->where('status', 'Aktif')->first();
                    if ($member && (int) $member->class_id !== (int) $class->id) {
                        return ['ERROR', 'Siswa sudah aktif di rombel lain pada semester ini.', null, []];
                    }
                    if (!$member && ClassMember::withTrashed()->where('student_id', $record->id)
                        ->where('semester_id', $semester->id)->where('class_id', $class->id)->exists()) {
                        return ['ERROR', 'Keanggotaan rombel pernah ada; pulihkan melalui modul Rombel.', null, []];
                    }
                } else {
                    $member = null;
                }
                if (!$member) $extra['enroll_class_id'] = $class->id;
            }
        }
        if (!$record) return ['WARNING', 'Siswa dan keanggotaan rombel baru akan dibuat setelah konfirmasi.', null, $extra];
        return ['WARNING', !empty($extra['enroll_class_id'])
            ? 'Siswa existing akan didaftarkan ke rombel setelah konfirmasi.'
            : 'Data siswa existing akan diperbarui setelah konfirmasi.', $record->id, $extra];
    }

    private function validateRow(string $module, User $user, array $context, array $data): array
    {
        if (in_array($module, self::REFERENCE_IMPORTS, true)) return $this->validateReference($module, $data);
        if ($module === 'journals') {
            $journal = TeachingJournal::find((int) ($data['id'] ?? 0));
            if (!$journal) return ['ERROR', 'Jurnal tidak ditemukan.', null];
            if (!$user->hasRole('admin') && (int) $journal->teacher_id !== (int) $user->teacher?->id) return ['ERROR', 'Jurnal di luar penugasan Anda.', null];
            if (($context['semester_id'] ?? null) && (int) $journal->semester_id !== (int) $context['semester_id']) return ['ERROR', 'Jurnal di luar semester yang dipilih.', null];
            if (($context['class_id'] ?? null) && (int) $journal->class_id !== (int) $context['class_id']) return ['ERROR', 'Jurnal di luar kelas yang dipilih.', null];
            foreach (['class_id', 'subject_id', 'teacher_id', 'meeting'] as $field) if (($data[$field] ?? '') !== '' && (string) $journal->{$field} !== $data[$field]) return ['ERROR', "Konteks {$field} tidak sesuai jurnal existing.", null];
            if (($data['date'] ?? '') !== '' && $journal->date?->format('Y-m-d') !== $data['date']) return ['ERROR', 'Tanggal tidak sesuai jurnal existing.', null];
            return ['WARNING', 'Jurnal existing akan diperbarui setelah konfirmasi.', $journal->id];
        }
        if ($module === 'participations') {
            $identifier = ($data['nisn'] ?? '') ?: ($data['nis'] ?? '');
            if ($identifier === '') return ['ERROR', 'NISN atau NIS wajib diisi.', null];
            $student = ($data['nisn'] ?? '') !== '' ? Student::where('nisn', $data['nisn'])->first() : Student::where('nis', $data['nis'])->first();
            $activity = Extracurricular::where('code', $data['code'] ?? '')->first();
            if (!$student || !$activity) return ['ERROR', 'Siswa atau kode ekskul tidak ditemukan pada Master Data.', null];
            if (($data['nisn'] ?? '') !== '' && ($data['nis'] ?? '') !== '' && $student->nis !== $data['nis']) return ['ERROR', 'NIS tidak cocok dengan NISN.', null];
            if (($data['name'] ?? '') !== '' && $data['name'] !== $student->name) return ['ERROR', 'Nama siswa tidak cocok dengan identifier.', null];
            if (!ClassMember::where('student_id', $student->id)->where('class_id', $context['class_id'])->where('semester_id', $context['semester_id'])->where('status', 'Aktif')->exists()) return ['ERROR', 'Siswa bukan anggota aktif kelas/semester.', null];
            $records = StudentExtracurricular::where('student_id', $student->id)->where('semester_id', $context['semester_id'])->where('extracurricular_id', $activity->id)->get();
            if ($records->count() !== 1) return ['ERROR', $records->isEmpty() ? 'Keikutsertaan belum ada; tambah melalui formulir.' : 'Keikutsertaan duplikat di database; perbaiki dahulu.', null];
            if (($data['predicate'] ?? '') !== '' && !in_array($data['predicate'], ['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'A', 'B', 'C', 'D'], true)) return ['ERROR', 'Predikat tidak valid.', null];
            return ['WARNING', 'Keikutsertaan existing akan diperbarui setelah konfirmasi.', $records->first()->id];
        }
        if ($module === 'competencies') {
            $identifier = ($data['nisn'] ?? '') ?: ($data['nis'] ?? '');
            if ($identifier === '') return ['ERROR', 'NISN atau NIS wajib diisi.', null];
            $student = ($data['nisn'] ?? '') !== '' ? Student::where('nisn', $data['nisn'])->first() : Student::where('nis', $data['nis'])->first();
            $assignment = CourseAssignment::find($context['course_assignment_id']);
            if (!$student) return ['ERROR', 'Siswa tidak ditemukan pada Master Data.', null];
            if (($data['nisn'] ?? '') !== '' && ($data['nis'] ?? '') !== '' && $student->nis !== $data['nis']) return ['ERROR', 'NIS tidak cocok dengan NISN.', null];
            if (($data['name'] ?? '') !== '' && $data['name'] !== $student->name) return ['ERROR', 'Nama siswa tidak cocok dengan identifier.', null];
            $grade = FinalCourseGrade::where('course_assignment_id', $assignment->id)->where('student_id', $student->id)->first();
            if (!$grade) return ['ERROR', 'Nilai akhir belum tersedia untuk siswa dan penugasan ini.', null];
            if ($this->auth->isCourseGradeLocked($assignment)) return ['ERROR', 'Nilai dan capaian telah dikunci.', null];
            return ['WARNING', 'Capaian existing akan diperbarui setelah konfirmasi.', $grade->id];
        }
        $identifier = $module === 'teachers' ? (($data['nip'] ?? '') ?: ($data['nuptk'] ?? '')) : (($data['nisn'] ?? '') ?: ($data['nis'] ?? ''));
        if ($identifier === '') return ['ERROR', 'Identifier stabil wajib diisi.', null];
        if ($module === 'teachers') {
            $query = ($data['nip'] ?? '') !== '' ? Teacher::where('nip', $data['nip']) : Teacher::where('nuptk', $data['nuptk'] ?? '');
            $record = $query->first();
        } else {
            $query = ($data['nisn'] ?? '') !== '' ? Student::where('nisn', $data['nisn']) : Student::where('nis', $data['nis'] ?? '');
            $record = $query->first();
        }
        if (!$record) return ['ERROR', $module === 'teachers' ? 'Guru tidak ditemukan pada Master Data.' : 'Siswa tidak ditemukan pada Master Data.', null];
        if ($module !== 'teachers' && ($data['nisn'] ?? '') !== '' && ($data['nis'] ?? '') !== '' && $record->nis !== $data['nis']) return ['ERROR', 'NIS tidak cocok dengan NISN.', null];
        if (!in_array($module, ['students', 'teachers'], true) && ($data['name'] ?? '') !== '' && $record->name !== $data['name']) return ['ERROR', 'Nama siswa tidak cocok dengan identifier.', null];
        if ($module === 'students') {
            if (($data['name'] ?? '') === '') return ['ERROR', 'Nama siswa wajib diisi.', null];
            if (mb_strlen($data['name']) > 150) return ['ERROR', 'Nama siswa maksimum 150 karakter.', null];
            if (($data['nis'] ?? '') !== '' && $record->nis !== $data['nis']) return ['ERROR', 'NIS tidak cocok dengan NISN.', null];
            if (($data['gender'] ?? '') !== '' && !in_array($data['gender'], ['L', 'P'], true)) return ['ERROR', 'JK harus L atau P.', null];
            if (($data['current_class_name'] ?? '') !== '' && $record->current_class_name !== $data['current_class_name']) return ['ERROR', 'Kelas berbeda. Perubahan rombel harus melalui modul Rombel.', null];
        } elseif ($module === 'teachers') {
            if (($data['name'] ?? '') === '') return ['ERROR', 'Nama guru wajib diisi.', null];
            if (mb_strlen($data['name']) > 120) return ['ERROR', 'Nama guru maksimum 120 karakter.', null];
            if (($data['nuptk'] ?? '') !== '' && $record->nuptk !== $data['nuptk']) return ['ERROR', 'NUPTK tidak cocok dengan NIP.', null];
            if (($data['subject'] ?? '') !== '' && !Subject::where('name', $data['subject'])->exists()) return ['ERROR', 'Mapel tidak ditemukan pada Master Data.', null];
            if (($data['email'] ?? '') !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) return ['ERROR', 'Email tidak valid.', null];
            if (mb_strlen($data['email'] ?? '') > 100 || mb_strlen($data['subject'] ?? '') > 100) return ['ERROR', 'Email dan mapel maksimum 100 karakter.', null];
        } elseif ($module === 'scores') {
            $assessment = Assessment::find((int) ($data['assessment_id'] ?? 0));
            $assignment = CourseAssignment::find($context['course_assignment_id']);
            if (!$assessment || (int) $assessment->course_assignment_id !== (int) $assignment->id) return ['ERROR', 'Penilaian tidak sesuai penugasan.', null];
            if (!is_numeric($data['score']) || $data['score'] < 0 || $data['score'] > 100) return ['ERROR', 'Nilai harus 0 sampai 100.', null];
            if (strlen($data['notes'] ?? '') > 255) return ['ERROR', 'Catatan maksimum 255 karakter.', null];
            if (!ClassMember::where('student_id', $record->id)->where('class_id', $assignment->class_id)->where('semester_id', $assignment->semester_id)->where('status', 'Aktif')->exists()) return ['ERROR', 'Siswa bukan anggota aktif kelas/semester.', null];
            if ($this->auth->isCourseGradeLocked($assignment)) return ['ERROR', 'Nilai telah divalidasi dan dikunci.', null];
        } elseif ($module === 'attendance') {
            if (!in_array($data['status'], ['Hadir', 'Sakit', 'Izin', 'Alpa'], true)) return ['ERROR', 'Status absensi tidak valid.', null];
            if (strlen($data['notes'] ?? '') > 255) return ['ERROR', 'Keterangan maksimum 255 karakter.', null];
            $semester = \App\Models\Semester::find($context['semester_id']);
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date']) || !checkdate((int) substr($data['date'], 5, 2), (int) substr($data['date'], 8, 2), (int) substr($data['date'], 0, 4)) || $data['date'] < $semester->start_date->format('Y-m-d') || $data['date'] > $semester->end_date->format('Y-m-d')) return ['ERROR', 'Tanggal di luar semester.', null];
            if (!ClassMember::where('student_id', $record->id)->where('class_id', $context['class_id'])->where('semester_id', $context['semester_id'])->where('status', 'Aktif')->exists()) return ['ERROR', 'Siswa bukan anggota aktif kelas/semester.', null];
        }
        return ['WARNING', 'Data existing akan diperbarui setelah konfirmasi.', $record->id];
    }

    private function validateReference(string $module, array $data): array
    {
        $key = match ($module) { 'years', 'religions' => $data['name'] ?? '', 'semesters', 'rooms' => $data['id'] ?? '', default => $data['code'] ?? '' };
        if ($key === '') return ['ERROR', 'Identifier stabil wajib diisi.', null];
        $record = match ($module) {
            'classes' => SchoolClass::where('code', $key)->where('academic_year_id', $data['academic_year_id'] ?? 0)->first(),
            'subjects' => Subject::where('code', $key)->first(),
            'years' => AcademicYear::where('name', $key)->first(),
            'semesters' => Semester::find((int) $key),
            'rooms' => Room::find((int) $key),
            'religions' => Religion::where('name', $key)->first(),
            'extracurriculars' => Extracurricular::where('code', $key)->first(),
        };
        if (!$record) return ['ERROR', 'Data referensi tidak ditemukan. Import tidak membuat master data baru.', null];
        if ($module === 'rooms' && (($data['code'] ?? '') !== $record->code ||
            (($data['academic_year_id'] ?? '') !== '' && (int) $data['academic_year_id'] !== (int) $record->academic_year_id))) {
            return ['ERROR', 'Kode atau Tahun Pelajaran ID tidak sesuai Ruangan ID.', null];
        }
        if ($module === 'classes' && ($data['grade'] ?? '') !== '' && $record->grade !== $data['grade']) return ['ERROR', 'Tingkat kelas tidak boleh diubah lewat Excel.', null];
        if ($module === 'semesters' && ($data['academic_year_id'] ?? '') !== '' && (int) $record->academic_year_id !== (int) $data['academic_year_id']) return ['ERROR', 'Semester tidak sesuai Tahun Pelajaran ID.', null];
        if (in_array($module, ['years', 'semesters'], true) && ($data['status'] ?? '') !== '' && $record->status !== $data['status']) return ['ERROR', 'Status periode harus diubah melalui aksi aktivasi.', null];
        if (($data['name'] ?? '') !== '' && in_array($module, ['classes', 'subjects'], true) && $record->name !== $data['name']) {
            return ['ERROR', 'Nama berbeda dari Master Data. Ubah nama melalui formulir modul.', null];
        }
        foreach (['capacity', 'weekly_hours'] as $field) {
            if (($data[$field] ?? '') !== '' && (!ctype_digit((string) $data[$field]) || (int) $data[$field] < 0)) {
                return ['ERROR', "Kolom {$field} harus bilangan bulat tidak negatif.", null];
            }
        }
        $limit = match ($module) { 'classes' => 60, 'rooms' => 500, default => null };
        if ($limit && ($data['capacity'] ?? '') !== '' && ((int) $data['capacity'] < 1 || (int) $data['capacity'] > $limit)) return ['ERROR', "Kapasitas harus 1 sampai {$limit}.", null];
        if ($module === 'classes' && ($data['capacity'] ?? '') !== '') {
            $maximumMembers = ClassMember::where('class_id', $record->id)->where('status', 'Aktif')
                ->selectRaw('COUNT(*) as total')->groupBy('semester_id')->pluck('total')->max() ?? 0;
            if ($maximumMembers > (int) $data['capacity']) return ['ERROR', 'Kapasitas lebih kecil dari jumlah siswa aktif.', null];
        }
        if ($module === 'subjects' && ($data['weekly_hours'] ?? '') !== '' && ((int) $data['weekly_hours'] < 1 || (int) $data['weekly_hours'] > 20)) return ['ERROR', 'Jam per Minggu harus 1 sampai 20.', null];
        $lengths = match ($module) {
            'subjects' => ['group' => 50], 'rooms' => ['name' => 100, 'building' => 100, 'floor' => 50, 'room_type' => 50],
            'extracurriculars' => ['name' => 100], default => [],
        };
        foreach ($lengths as $field => $limit) {
            if (mb_strlen($data[$field] ?? '') > $limit) return ['ERROR', "Kolom {$field} maksimum {$limit} karakter.", null];
        }
        if ($module === 'rooms' && ($data['name'] ?? '') !== '' && Room::where('name', $data['name'])
            ->where('academic_year_id', $record->academic_year_id)->whereKeyNot($record->id)->exists()) {
            return ['ERROR', 'Nama ruangan sudah digunakan pada tahun pelajaran ini.', null];
        }
        if ($module === 'extracurriculars' && ($data['name'] ?? '') !== '' && Extracurricular::where('name', $data['name'])
            ->whereKeyNot($record->id)->exists()) return ['ERROR', 'Nama ekskul sudah digunakan.', null];
        if (($data['teacher_id'] ?? '') !== '' && !Teacher::whereKey($data['teacher_id'])->exists()) {
            return ['ERROR', 'Pembina ID tidak ditemukan.', null];
        }
        if (in_array($module, ['years', 'semesters'], true)) {
            $start = $data['start_date'] ?? '';
            $end = $data['end_date'] ?? '';
            if (!$this->validDate($start) || !$this->validDate($end) || $start > $end) {
                return ['ERROR', 'Tanggal mulai/selesai harus YYYY-MM-DD dan berurutan.', null];
            }
            if ($module === 'semesters') {
                $year = AcademicYear::find($record->academic_year_id);
                if (!$year || $start < $year->start_date->format('Y-m-d') || $end > $year->end_date->format('Y-m-d')) return ['ERROR', 'Tanggal semester harus berada dalam tahun pelajaran.', null];
            } else {
                $outside = Semester::where('academic_year_id', $record->id)->where(function (Builder $query) use ($start, $end) {
                    $query->whereDate('start_date', '<', $start)->orWhereDate('end_date', '>', $end);
                })->exists();
                if ($outside) return ['ERROR', 'Tanggal tahun pelajaran harus mencakup seluruh semester existing.', null];
            }
        }
        if (($data['status'] ?? '') !== '' && in_array($module, ['religions', 'extracurriculars'], true)
            && !in_array($data['status'], ['Aktif', 'Tidak Aktif'], true)) {
            return ['ERROR', 'Status harus Aktif atau Tidak Aktif.', null];
        }
        return ['WARNING', 'Record existing akan diperbarui setelah konfirmasi.', $record->id];
    }

    private function validDate(string $value): bool
    {
        return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)
            && checkdate((int) substr($value, 5, 2), (int) substr($value, 8, 2), (int) substr($value, 0, 4));
    }

    private function baseline(string $module, array $context, array $data, int $targetId): array
    {
        if ($module === 'scores') {
            $record = StudentScore::where('assessment_id', $data['assessment_id'])->where('student_id', $targetId)->first();
            return ['score' => $record?->raw_score, 'notes' => $record?->notes];
        }
        if ($module === 'journals') {
            $record = TeachingJournal::findOrFail($targetId);
            return array_combine($this->updateFields($module), array_map(fn ($field) => $record->{$field}, $this->updateFields($module)));
        }
        if ($module === 'participations') {
            $record = StudentExtracurricular::findOrFail($targetId);
            return array_combine($this->updateFields($module), array_map(fn ($field) => $record->{$field}, $this->updateFields($module)));
        }
        if ($module === 'competencies') {
            $record = CompetencyAchievement::where('final_course_grade_id', $targetId)->first();
            return ['highest_achievement' => $record?->highest_achievement, 'lowest_achievement' => $record?->lowest_achievement];
        }
        if ($module === 'attendance') {
            $record = StudentAttendanceEntry::where('student_id', $targetId)->where('semester_id', $context['semester_id'])
                ->where('attendance_date', $data['date'])->where('course_assignment_id', $context['course_assignment_id'] ?? 0)->first();
            return ['status' => $record?->status, 'notes' => $record?->notes];
        }
        $class = match ($module) {
            'students' => Student::class, 'teachers' => Teacher::class, 'classes' => SchoolClass::class,
            'subjects' => Subject::class, 'years' => AcademicYear::class, 'semesters' => Semester::class,
            'rooms' => Room::class, 'religions' => Religion::class, 'extracurriculars' => Extracurricular::class,
        };
        $record = $class::findOrFail($targetId);
        $fields = $this->updateFields($module);
        return array_combine($fields, array_map(static function ($field) use ($record) {
            $value = $record->{$field};
            return $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value;
        }, $fields));
    }

    private function updateFields(string $module): array
    {
        return match ($module) {
            'students' => ['name', 'gender', 'birth_place', 'birth_date', 'religion'], 'teachers' => ['name', 'email', 'subject'],
            'classes' => ['capacity'], 'subjects' => ['group', 'weekly_hours'],
            'years', 'semesters' => ['start_date', 'end_date'],
            'rooms' => ['name', 'building', 'floor', 'capacity', 'room_type'],
            'religions' => ['status'], 'extracurriculars' => ['name', 'teacher_id', 'status'],
            'scores' => ['score', 'notes'], 'attendance' => ['status', 'notes'],
            'journals' => ['material', 'activities', 'notes'], 'participations' => ['predicate', 'description'],
            'competencies' => ['highest_achievement', 'lowest_achievement'],
        };
    }

    private function noChange(string $module, array $data, array $baseline): bool
    {
        foreach ($this->updateFields($module) as $field) {
            if (($data[$field] ?? '') !== '' && (string) $data[$field] !== (string) ($baseline[$field] ?? '')) return false;
        }
        return true;
    }

    public function commit(string $module, User $user, array $context, array $rows, array $metadata = []): int
    {
        return DB::transaction(function () use ($module, $user, $context, $rows, $metadata) {
            $validated = $this->preview($module, $user, $context, array_merge([$this->headers($module)], array_map(function ($row) use ($module) {
                return array_map(fn ($field) => $row['data'][$field] ?? '', array_values(self::COLUMNS[$module]));
            }, $rows)));
            if ($validated['errors'] > 0 || $validated['total'] !== count($rows)) throw ValidationException::withMessages(['rows' => 'Data berubah sejak preview. Muat ulang dan periksa error.']);
            foreach ($validated['rows'] as $index => $row) {
                if ($row['target_id'] !== $rows[$index]['target_id'] || $row['baseline'] !== ($rows[$index]['baseline'] ?? null)
                    || ($row['enroll_class_id'] ?? null) !== ($rows[$index]['enroll_class_id'] ?? null)) {
                    throw ValidationException::withMessages(['rows' => 'Data database berubah setelah preview. Buat preview baru sebelum import.']);
                }
            }
            $scoreBatch = [];
            $competencyBatch = [];
            foreach ($validated['rows'] as $row) {
                $data = $row['data'];
                if ($module === 'students') {
                    if ($row['target_id']) {
                        $student = Student::whereKey($row['target_id'])->lockForUpdate()->firstOrFail();
                        foreach ($this->updateFields('students') as $field) {
                            if (($data[$field] ?? '') !== '') $student->{$field} = $data[$field];
                        }
                        if (($data['religion'] ?? '') !== '') $student->religion_id = Religion::where('name', $data['religion'])->value('id');
                        $student->save();
                    } else {
                        $values = array_filter([
                            'nisn' => $data['nisn'], 'nis' => $data['nis'], 'name' => $data['name'],
                            'gender' => $data['gender'], 'birth_place' => $data['birth_place'],
                            'birth_date' => $data['birth_date'], 'current_class_name' => $data['current_class_name'],
                            'accepted_class' => $data['current_class_name'], 'status' => $data['status'] ?? 'Aktif',
                            'religion' => $data['religion'] ?? null,
                        ], static fn ($value) => $value !== null && $value !== '');
                        if (($data['religion'] ?? '') !== '') $values['religion_id'] = Religion::where('name', $data['religion'])->value('id');
                        $student = Student::create($values);
                    }
                    if ($classId = ($row['enroll_class_id'] ?? null)) {
                        $schoolClass = SchoolClass::whereKey($classId)->lockForUpdate()->firstOrFail();
                        $semester = Semester::findOrFail($context['semester_id']);
                        if ((int) $schoolClass->academic_year_id !== (int) $semester->academic_year_id
                            || ClassMember::where('student_id', $student->id)->where('semester_id', $semester->id)
                                ->where('status', 'Aktif')->exists()
                            || ($schoolClass->capacity > 0 && ClassMember::where('class_id', $classId)
                                ->where('semester_id', $semester->id)->where('status', 'Aktif')->count() >= $schoolClass->capacity)) {
                            throw ValidationException::withMessages(['rows' => 'Konteks atau kapasitas rombel berubah setelah preview. Buat preview baru.']);
                        }
                        ClassMember::create(['academic_year_id' => $semester->academic_year_id,
                            'semester_id' => $semester->id, 'class_id' => $classId,
                            'student_id' => $student->id, 'status' => 'Aktif']);
                        $student->update(['current_class_name' => $schoolClass->name]);
                    }
                } elseif ($module === 'teachers') {
                    $teacher = Teacher::whereKey($row['target_id'])->lockForUpdate()->firstOrFail();
                    foreach (['name', 'email', 'subject'] as $field) if (($data[$field] ?? '') !== '') $teacher->{$field} = $data[$field];
                    $teacher->save();
                } elseif ($module === 'scores') {
                    $scoreBatch[] = ['assessment_id' => (int) $data['assessment_id'], 'student_id' => $row['target_id'],
                        'score' => (float) $data['score'], 'notes' => $data['notes'] ?? null];
                } elseif ($module === 'attendance') {
                    $courseId = (int) ($context['course_assignment_id'] ?? 0);
                    $key = ['student_id' => $row['target_id'], 'semester_id' => $context['semester_id'],
                        'attendance_date' => $data['date'], 'course_assignment_id' => $courseId];
                    $entry = StudentAttendanceEntry::where($key)->lockForUpdate()->first();
                    $oldStatus = $entry?->status;
                    $entry ??= new StudentAttendanceEntry($key);
                    $entry->class_id = $context['class_id'];
                    $entry->status = $data['status'];
                    $entry->notes = ($data['notes'] ?? '') ?: null;
                    $entry->save();
                    if ($courseId === 0 && $oldStatus !== $entry->status) {
                        $summary = StudentAttendance::firstOrNew(['student_id' => $row['target_id'], 'semester_id' => $context['semester_id']]);
                        $summary->class_id = $context['class_id'];
                        foreach (['Sakit' => 'sick', 'Izin' => 'permitted', 'Alpa' => 'absent'] as $status => $column) {
                            $summary->{$column} = max(0, (int) $summary->{$column} + (int) ($entry->status === $status) - (int) ($oldStatus === $status));
                        }
                        $summary->save();
                    }
                } elseif (in_array($module, self::REFERENCE_IMPORTS, true)) {
                    $class = match ($module) {
                        'classes' => SchoolClass::class, 'subjects' => Subject::class, 'years' => AcademicYear::class,
                        'semesters' => Semester::class, 'rooms' => Room::class, 'religions' => Religion::class,
                        'extracurriculars' => Extracurricular::class,
                    };
                    $record = $class::whereKey($row['target_id'])->lockForUpdate()->firstOrFail();
                    $fields = $this->updateFields($module);
                    foreach ($fields as $field) if (($data[$field] ?? '') !== '') $record->{$field} = $data[$field];
                    $record->save();
                } elseif ($module === 'journals' || $module === 'participations') {
                    $class = $module === 'journals' ? TeachingJournal::class : StudentExtracurricular::class;
                    $record = $class::whereKey($row['target_id'])->lockForUpdate()->firstOrFail();
                    foreach ($this->updateFields($module) as $field) if (($data[$field] ?? '') !== '') $record->{$field} = $data[$field];
                    $record->save();
                } elseif ($module === 'competencies') {
                    $grade = FinalCourseGrade::whereKey($row['target_id'])->lockForUpdate()->firstOrFail();
                    $item = ['student_id' => $grade->student_id];
                    foreach ($this->updateFields($module) as $field) if (($data[$field] ?? '') !== '') $item[$field] = $data[$field];
                    $competencyBatch[] = $item;
                }
            }
            if ($scoreBatch) app(AssessmentService::class)->saveBatchScores(CourseAssignment::findOrFail($context['course_assignment_id']), $scoreBatch, $user);
            if ($competencyBatch) app(AssessmentService::class)->updateCompetencyAchievements(CourseAssignment::findOrFail($context['course_assignment_id']), $competencyBatch, $user);
            \App\Models\AuditLog::create(['user_id' => $user->id, 'action' => 'excel.import.' . $module,
                'description' => json_encode(['count' => count($rows), 'warnings' => count(array_filter($rows, fn ($row) => $row['status'] === 'WARNING')),
                    'context' => $context, 'source' => $metadata['source'] ?? null, 'file' => $metadata['file'] ?? null,
                    'sheet' => $metadata['sheet'] ?? null], JSON_UNESCAPED_UNICODE),
                'ip_address' => request()->ip(), 'user_agent' => request()->userAgent(), 'created_at' => now()]);
            return count($rows);
        });
    }
}
