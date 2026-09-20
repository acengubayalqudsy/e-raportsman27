<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator Sistem',
                'description' => 'Akses penuh ke konfigurasi sistem, data pengguna, dan hak akses.',
            ],
            [
                'name' => 'guru',
                'display_name' => 'Guru Mata Pelajaran',
                'description' => 'Mengelola materi, kehadiran harian kelas, dan input nilai mata pelajaran yang diampu.',
            ],
            [
                'name' => 'walikelas',
                'display_name' => 'Wali Kelas',
                'description' => 'Memantau perkembangan siswa rombel, menginput catatan perkembangan, absensi rekap, dan cetak rapor.',
            ],
            [
                'name' => 'kepala_sekolah',
                'display_name' => 'Kepala Sekolah',
                'description' => 'Akses monitoring hasil akademik, statistik sekolah, dan pengesahan rapor.',
            ],
            [
                'name' => 'siswa',
                'display_name' => 'Siswa',
                'description' => 'Melihat jadwal, kehadiran mandiri, dan catatan rapor hasil belajar.',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(['name' => $roleData['name']], $roleData);
        }
    }
}
