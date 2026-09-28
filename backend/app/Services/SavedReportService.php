<?php

namespace App\Services;

use App\Models\StudentAttendanceEntry;
use App\Models\SavedReport;

class SavedReportService
{
    public const TYPES = [
        'nilai' => 'Laporan Nilai',
        'absensi' => 'Laporan Absensi',
        'ekstrakurikuler' => 'Laporan Ekstrakurikuler',
        'kokurikuler' => 'Laporan Kokurikuler',
        'per-kelas' => 'Laporan Per Kelas',
        'per-siswa' => 'Laporan Per Siswa',
        'rekapitulasi-rapor' => 'Rekapitulasi Rapor',
    ];

    public function __construct(private AssessmentService $assessmentService) {}

    public function generate(SavedReport $report): array
    {
        $recap = $this->assessmentService->getClassRecap($report->class_id, $report->semester_id);
        $supplementary = $this->assessmentService->getSupplementaryData($report->class_id, $report->semester_id);
        $students = collect($supplementary['students'])->keyBy('student_id');
        $scores = collect($recap['students'])->keyBy('student_id');
        $className = $recap['class']['name'] ?? '-';
        $rows = [];
        $columns = [];

        switch ($report->type) {
            case 'nilai':
                $columns = ['NIS', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Nilai Akhir'];
                foreach ($recap['students'] as $student) {
                    foreach ($recap['subjects'] as $subject) {
                        $rows[] = [
                            $student['nis'] ?: '-', $student['name'], $className,
                            $subject['name'], $student['scores'][$subject['id']] ?? '-',
                        ];
                    }
                }
                break;
            case 'absensi':
                $columns = ['NIS', 'Nama Siswa', 'Kelas', 'Hadir Tercatat', 'Sakit', 'Izin', 'Alpa', 'Catatan'];
                $presentCounts = StudentAttendanceEntry::where('class_id', $report->class_id)
                    ->where('semester_id', $report->semester_id)
                    ->where('course_assignment_id', 0)
                    ->where('status', 'Hadir')
                    ->selectRaw('student_id, COUNT(*) as total')
                    ->groupBy('student_id')
                    ->pluck('total', 'student_id');
                foreach ($students as $student) {
                    $attendance = $student['attendance'];
                    $rows[] = [
                        $student['nis'] ?: '-', $student['name'], $className,
                        $presentCounts->get($student['student_id'], 0),
                        $attendance['sick'], $attendance['permitted'], $attendance['absent'],
                        $attendance['notes'] ?: '-',
                    ];
                }
                break;
            case 'ekstrakurikuler':
                $columns = ['NIS', 'Nama Siswa', 'Kelas', 'Ekstrakurikuler', 'Predikat', 'Deskripsi'];
                foreach ($students as $student) {
                    foreach ($student['extracurriculars'] as $activity) {
                        $rows[] = [
                            $student['nis'] ?: '-', $student['name'], $className,
                            $activity['name'] ?: '-', $activity['predicate'] ?: '-', $activity['description'] ?: '-',
                        ];
                    }
                }
                break;
            case 'kokurikuler':
                $columns = ['NIS', 'Nama Siswa', 'Kelas', 'Projek', 'Catatan'];
                foreach ($students as $student) {
                    foreach ($student['cocurriculars'] as $project) {
                        $rows[] = [
                            $student['nis'] ?: '-', $student['name'], $className,
                            $project['title'] ?: '-', $project['description'] ?: '-',
                        ];
                    }
                }
                break;
            case 'per-kelas':
                $columns = ['Kelas', 'Jumlah Siswa', 'Rata-rata Nilai Tercatat', 'Sakit', 'Izin', 'Alpa'];
                $scored = collect($recap['students'])->filter(fn ($student) => collect($student['scores'])->contains(fn ($score) => $score !== null));
                $rows[] = [
                    $className,
                    $students->count(),
                    $scored->count() ? round($scored->avg('average_score'), 2) : '-',
                    $students->sum(fn ($student) => (int) $student['attendance']['sick']),
                    $students->sum(fn ($student) => (int) $student['attendance']['permitted']),
                    $students->sum(fn ($student) => (int) $student['attendance']['absent']),
                ];
                break;
            case 'per-siswa':
                $columns = ['NIS', 'Nama Siswa', 'Kelas', 'Rata-rata Nilai Tercatat', 'Sakit', 'Izin', 'Alpa', 'Ekstrakurikuler', 'Catatan Wali Kelas'];
                $student = $students->get($report->student_id);
                if ($student) {
                    $score = $scores->get($report->student_id);
                    $rows[] = [
                        $student['nis'] ?: '-', $student['name'], $className,
                        $score && collect($score['scores'])->contains(fn ($value) => $value !== null) ? $score['average_score'] : '-',
                        $student['attendance']['sick'], $student['attendance']['permitted'], $student['attendance']['absent'],
                        collect($student['extracurriculars'])->pluck('name')->filter()->implode(', ') ?: '-',
                        $student['homeroom_note'] ?: '-',
                    ];
                }
                break;
            case 'rekapitulasi-rapor':
                $columns = ['NIS', 'Nama Siswa', 'Kelas', 'Status Rapor', 'Nilai Terkunci', 'Data Lengkap'];
                $page = 1;
                do {
                    $result = $this->assessmentService->getReportList($report->class_id, $report->semester_id, null, null, $page, 100);
                    foreach ($result['students'] as $student) {
                        $rows[] = [
                            $student['nis'] ?: '-', $student['name'], $className,
                            $student['report_status'], $student['is_locked'] ? 'Ya' : 'Belum',
                            $student['is_data_complete'] ? 'Ya' : 'Belum',
                        ];
                    }
                    $page++;
                } while ($page <= $result['pagination']['last_page']);
                break;
        }

        return [
            'columns' => $columns,
            'rows' => $rows,
            'row_count' => count($rows),
            'class_name' => $className,
            'semester_name' => $recap['semester']['name'] ?? '-',
            'academic_year_name' => $recap['semester']['academic_year'] ?? '-',
        ];
    }
}
