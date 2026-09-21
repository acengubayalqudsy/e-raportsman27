<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing', 'development'])) {
            return;
        }

        $activeYear = AcademicYear::where('status', 'Aktif')->first() ?? AcademicYear::first();
        $yearId = $activeYear ? $activeYear->id : null;

        $rooms = [
            ['code' => 'R-X-1', 'name' => 'Ruang Kelas X-1', 'capacity' => 36, 'room_type' => 'Kelas', 'building' => 'Gedung A', 'floor' => 'Lantai 1', 'status' => 'Aktif'],
            ['code' => 'R-X-2', 'name' => 'Ruang Kelas X-2', 'capacity' => 36, 'room_type' => 'Kelas', 'building' => 'Gedung A', 'floor' => 'Lantai 1', 'status' => 'Aktif'],
            ['code' => 'R-XI-1', 'name' => 'Ruang Kelas XI-1', 'capacity' => 36, 'room_type' => 'Kelas', 'building' => 'Gedung A', 'floor' => 'Lantai 2', 'status' => 'Aktif'],
            ['code' => 'R-XII-1', 'name' => 'Ruang Kelas XII-1', 'capacity' => 36, 'room_type' => 'Kelas', 'building' => 'Gedung A', 'floor' => 'Lantai 3', 'status' => 'Aktif'],
            ['code' => 'LAB-KOMP', 'name' => 'Laboratorium Komputer', 'capacity' => 40, 'room_type' => 'Laboratorium', 'building' => 'Gedung B', 'floor' => 'Lantai 1', 'status' => 'Aktif'],
            ['code' => 'LAB-IPA', 'name' => 'Laboratorium IPA & Biologi', 'capacity' => 40, 'room_type' => 'Laboratorium', 'building' => 'Gedung B', 'floor' => 'Lantai 2', 'status' => 'Aktif'],
            ['code' => 'PERPUS', 'name' => 'Perpustakaan Utama', 'capacity' => 60, 'room_type' => 'Perpustakaan', 'building' => 'Gedung Utama', 'floor' => 'Lantai 1', 'status' => 'Aktif'],
            ['code' => 'AULA', 'name' => 'Aula Serbaguna', 'capacity' => 200, 'room_type' => 'Aula', 'building' => 'Gedung Utama', 'floor' => 'Lantai 2', 'status' => 'Aktif'],
        ];

        foreach ($rooms as $data) {
            Room::firstOrCreate(
                ['code' => $data['code']],
                array_merge($data, ['academic_year_id' => $yearId])
            );
        }
    }
}
