<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class AcademicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Enforce execution only on explicitly permitted local and testing environments
        if (!app()->environment(['local', 'testing', 'development'])) {
            return;
        }

        // 1. Academic Years (All initially 'Tidak Aktif' - not assuming active period)
        $yearsData = [
            [
                'name' => '[TEST] 2023/2024',
                'start_date' => '2023-07-17',
                'end_date' => '2024-06-28',
                'status' => 'Tidak Aktif',
            ],
            [
                'name' => '[TEST] 2024/2025',
                'start_date' => '2024-07-15',
                'end_date' => '2025-06-27',
                'status' => 'Tidak Aktif',
            ],
        ];

        $yearModels = [];
        foreach ($yearsData as $y) {
            $existing = AcademicYear::withTrashed()->where('name', $y['name'])->first();
            if (!$existing) {
                $yearModels[$y['name']] = AcademicYear::create($y);
            } else {
                $yearModels[$y['name']] = $existing;
            }
        }

        // 2. Semesters (Bound to academic years, initially 'Tidak Aktif')
        $semestersData = [
            // 2023/2024
            [
                'year' => '[TEST] 2023/2024',
                'name' => 'Ganjil',
                'start_date' => '2023-07-17',
                'end_date' => '2023-12-22',
                'status' => 'Tidak Aktif',
            ],
            [
                'year' => '[TEST] 2023/2024',
                'name' => 'Genap',
                'start_date' => '2024-01-08',
                'end_date' => '2024-06-28',
                'status' => 'Tidak Aktif',
            ],
            // 2024/2025
            [
                'year' => '[TEST] 2024/2025',
                'name' => 'Ganjil',
                'start_date' => '2024-07-15',
                'end_date' => '2024-12-20',
                'status' => 'Tidak Aktif',
            ],
            [
                'year' => '[TEST] 2024/2025',
                'name' => 'Genap',
                'start_date' => '2025-01-06',
                'end_date' => '2025-06-27',
                'status' => 'Tidak Aktif',
            ],
        ];

        foreach ($semestersData as $s) {
            $yearModel = $yearModels[$s['year']] ?? null;
            if (!$yearModel) continue;

            $existing = Semester::withTrashed()
                ->where('academic_year_id', $yearModel->id)
                ->where('name', $s['name'])
                ->first();

            if (!$existing) {
                Semester::create([
                    'academic_year_id' => $yearModel->id,
                    'name' => $s['name'],
                    'start_date' => $s['start_date'],
                    'end_date' => $s['end_date'],
                    'status' => $s['status'],
                ]);
            }
        }

        // 3. Classes (Scoped to [TEST] 2024/2025)
        $targetYear = $yearModels['[TEST] 2024/2025'] ?? null;
        if ($targetYear) {
            $classesData = [
                ['code' => 'X-M-1', 'name' => 'X Merdeka 1', 'grade' => 'X', 'capacity' => 36],
                ['code' => 'X-M-2', 'name' => 'X Merdeka 2', 'grade' => 'X', 'capacity' => 36],
                ['code' => 'X-M-3', 'name' => 'X Merdeka 3', 'grade' => 'X', 'capacity' => 36],
                ['code' => 'XI-F-1', 'name' => 'XI F1', 'grade' => 'XI', 'capacity' => 36],
                ['code' => 'XI-F-2', 'name' => 'XI F2', 'grade' => 'XI', 'capacity' => 36],
                ['code' => 'XII-MIPA-1', 'name' => 'XII MIPA 1', 'grade' => 'XII', 'capacity' => 36],
                ['code' => 'XII-IPS-1', 'name' => 'XII IPS 1', 'grade' => 'XII', 'capacity' => 36],
            ];

            foreach ($classesData as $c) {
                $existing = SchoolClass::withTrashed()
                    ->where('academic_year_id', $targetYear->id)
                    ->where('code', $c['code'])
                    ->first();

                if (!$existing) {
                    SchoolClass::create([
                        'academic_year_id' => $targetYear->id,
                        'code' => $c['code'],
                        'name' => $c['name'],
                        'grade' => $c['grade'],
                        'capacity' => $c['capacity'],
                        'status' => 'Aktif',
                    ]);
                }
            }
        }

        // 4. Subjects
        $subjectsData = [
            ['code' => 'PABP', 'name' => 'Pendidikan Agama dan Budi Pekerti', 'group' => 'Umum', 'weekly_hours' => 3],
            ['code' => 'PPKN', 'name' => 'Pendidikan Pancasila', 'group' => 'Umum', 'weekly_hours' => 2],
            ['code' => 'BIN', 'name' => 'Bahasa Indonesia', 'group' => 'Umum', 'weekly_hours' => 4],
            ['code' => 'MTK', 'name' => 'Matematika', 'group' => 'Umum', 'weekly_hours' => 4],
            ['code' => 'FIS', 'name' => 'Fisika', 'group' => 'IPA', 'weekly_hours' => 3],
            ['code' => 'KIM', 'name' => 'Kimia', 'group' => 'IPA', 'weekly_hours' => 3],
            ['code' => 'BIO', 'name' => 'Biologi', 'group' => 'IPA', 'weekly_hours' => 3],
            ['code' => 'SEJ', 'name' => 'Sejarah Indonesia', 'group' => 'Umum', 'weekly_hours' => 2],
            ['code' => 'BING', 'name' => 'Bahasa Inggris', 'group' => 'Umum', 'weekly_hours' => 3],
            ['code' => 'PJOK', 'name' => 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'group' => 'Umum', 'weekly_hours' => 3],
            ['code' => 'INF', 'name' => 'Informatika', 'group' => 'Umum', 'weekly_hours' => 2],
            ['code' => 'SENI', 'name' => 'Seni Budaya', 'group' => 'Umum', 'weekly_hours' => 2],
            ['code' => 'SOS', 'name' => 'Sosiologi', 'group' => 'IPS', 'weekly_hours' => 3],
            ['code' => 'EKO', 'name' => 'Ekonomi', 'group' => 'IPS', 'weekly_hours' => 3],
            ['code' => 'GEO', 'name' => 'Geografi', 'group' => 'IPS', 'weekly_hours' => 3],
            ['code' => 'BK', 'name' => 'Bimbingan dan Konseling', 'group' => 'Layanan', 'weekly_hours' => 1],
        ];

        foreach ($subjectsData as $sub) {
            $existing = Subject::withTrashed()->where('code', $sub['code'])->first();
            if (!$existing) {
                Subject::create([
                    'code' => $sub['code'],
                    'name' => $sub['name'],
                    'group' => $sub['group'],
                    'grades' => 'X, XI, XII',
                    'weekly_hours' => $sub['weekly_hours'],
                    'status' => 'Aktif',
                ]);
            }
        }
    }
}
