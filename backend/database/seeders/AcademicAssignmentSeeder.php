<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassMember;
use App\Models\CourseAssignment;
use App\Models\HomeroomAssignment;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Seeder;

class AcademicAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::where('name', 'like', '%2024/2025%')->first();
        if (!$year) return;

        $semester = Semester::where('academic_year_id', $year->id)->where('name', 'Ganjil')->first();
        if (!$semester) return;

        // Set status to Aktif in seed environment
        if ($year->status !== 'Aktif') {
            AcademicYear::where('id', '!=', $year->id)->update(['status' => 'Tidak Aktif']);
            $year->update(['status' => 'Aktif']);
        }
        if ($semester->status !== 'Aktif') {
            Semester::where('academic_year_id', $year->id)->where('id', '!=', $semester->id)->update(['status' => 'Tidak Aktif']);
            $semester->update(['status' => 'Aktif']);
        }

        $classes = SchoolClass::where('academic_year_id', $year->id)->get();
        $students = Student::orderBy('id')->get();
        $teachers = Teacher::orderBy('id')->get();
        $subjects = Subject::get();

        if ($classes->isEmpty() || $teachers->isEmpty()) return;

        // 1. Keanggotaan Rombel
        $classX1 = $classes->firstWhere('code', 'X-M-1') ?: $classes->firstWhere('code', 'X-1') ?: $classes->first();
        $classX2 = $classes->firstWhere('code', 'X-M-2') ?: $classes->firstWhere('code', 'X-2') ?: $classes->skip(1)->first();

        if ($classX1 && $students->count() >= 10) {
            foreach ($students->slice(0, 10) as $student) {
                ClassMember::firstOrCreate(
                    [
                        'semester_id' => $semester->id,
                        'class_id' => $classX1->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'academic_year_id' => $year->id,
                        'status' => 'Aktif',
                        'join_date' => '2024-07-15',
                        'notes' => 'Pendaftaran Rombel Baru',
                    ]
                );
            }
        }

        if ($classX2 && $students->count() >= 18) {
            foreach ($students->slice(10, 8) as $student) {
                ClassMember::firstOrCreate(
                    [
                        'semester_id' => $semester->id,
                        'class_id' => $classX2->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'academic_year_id' => $year->id,
                        'status' => 'Aktif',
                        'join_date' => '2024-07-15',
                        'notes' => 'Pendaftaran Rombel Baru',
                    ]
                );
            }
        }

        // 2. Penugasan Wali Kelas
        foreach ($classes->take(4) as $idx => $cls) {
            $tch = $teachers->get($idx);
            if ($cls && $tch) {
                HomeroomAssignment::firstOrCreate(
                    [
                        'academic_year_id' => $year->id,
                        'semester_id' => $semester->id,
                        'class_id' => $cls->id,
                    ],
                    [
                        'teacher_id' => $tch->id,
                        'assignment_date' => '2024-07-15',
                        'status' => 'Aktif',
                        'sk_number' => 'SK/2024/WALI/' . sprintf('%03d', $idx + 1),
                        'notes' => "Wali Kelas {$cls->name}",
                    ]
                );
            }
        }

        // 3. Penugasan Mengajar Guru
        $mat = $subjects->firstWhere('code', 'MAT');
        $fis = $subjects->firstWhere('code', 'FIS');
        $ind = $subjects->firstWhere('code', 'IND');
        $ing = $subjects->firstWhere('code', 'ING');

        $sampleAssignments = [
            ['class' => $classX1, 'subject' => $mat, 'teacher_idx' => 0, 'hours' => 4, 'role' => 'Utama'],
            ['class' => $classX1, 'subject' => $fis, 'teacher_idx' => 1, 'hours' => 3, 'role' => 'Utama'],
            ['class' => $classX1, 'subject' => $ind, 'teacher_idx' => 2, 'hours' => 3, 'role' => 'Utama'],
            ['class' => $classX1, 'subject' => $ing, 'teacher_idx' => 3, 'hours' => 2, 'role' => 'Utama'],
            ['class' => $classX2, 'subject' => $mat, 'teacher_idx' => 0, 'hours' => 4, 'role' => 'Utama'],
            ['class' => $classX2, 'subject' => $ind, 'teacher_idx' => 2, 'hours' => 3, 'role' => 'Utama'],
        ];

        foreach ($sampleAssignments as $item) {
            if ($item['class'] && $item['subject']) {
                $tch = $teachers->get($item['teacher_idx']);
                if ($tch) {
                    CourseAssignment::firstOrCreate(
                        [
                            'academic_year_id' => $year->id,
                            'semester_id' => $semester->id,
                            'class_id' => $item['class']->id,
                            'subject_id' => $item['subject']->id,
                        ],
                        [
                            'teacher_id' => $tch->id,
                            'weekly_hours' => $item['hours'],
                            'role' => $item['role'],
                            'status' => 'Aktif',
                            'notes' => 'Penugasan Mengajar Semester Ganjil 2024/2025',
                        ]
                    );
                }
            }
        }
    }
}
