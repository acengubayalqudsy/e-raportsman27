<?php

namespace Database\Seeders;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
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

        // Check if dev_guru_walikelas user exists to link profile optionally
        $guruUser = User::where('username', 'dev_guru_walikelas')->first();

        $teachers = [
            [
                'name' => 'Budi Santoso, M.Pd.',
                'user_id' => $guruUser?->id,
                'nip' => '197905102003121003',
                'nuptk' => '8435757659200023',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '1979-05-10',
                'phone' => '081234567892',
                'email' => 'budi.santoso@sman27garut.local',
                'address' => 'Perum Cempaka Indah Blok D-14, Garut',
                'employment_status' => 'ASN',
                'type' => 'Guru',
                'subject' => 'Matematika',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Rina Marlina, S.Pd.',
                'user_id' => null,
                'nip' => '198207222006042001',
                'nuptk' => '5138760662210032',
                'gender' => 'P',
                'birth_place' => 'Bandung',
                'birth_date' => '1982-07-22',
                'phone' => '081234567891',
                'email' => 'rina.marlina@sman27garut.local',
                'address' => 'Jl. Patriot No. 45, Tarogong Kidul, Garut',
                'employment_status' => 'ASN',
                'type' => 'Guru',
                'subject' => 'Bahasa Indonesia',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Deden Kurnia, S.Pd.',
                'user_id' => null,
                'nip' => '198003152005011002',
                'nuptk' => '3245758659130043',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '1980-03-15',
                'phone' => '081234567890',
                'email' => 'deden.kurnia@sman27garut.local',
                'address' => 'Jl. Terusan Pahlawan No. 8, Garut Kota',
                'employment_status' => 'ASN',
                'type' => 'Guru',
                'subject' => 'Fisika',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Siti Nurhaliza, S.Pd.',
                'user_id' => null,
                'nip' => '198706182010012004',
                'nuptk' => '9542765666210052',
                'gender' => 'P',
                'birth_place' => 'Tasikmalaya',
                'birth_date' => '1987-06-18',
                'phone' => '081234567893',
                'email' => 'siti.nurhaliza@sman27garut.local',
                'address' => 'Jl. Bratayuda No. 88, Garut',
                'employment_status' => 'ASN',
                'type' => 'Guru',
                'subject' => 'Kimia',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Asep Hidayat, S.Pd.',
                'user_id' => null,
                'nip' => '198106052006041005',
                'nuptk' => '2345759660120011',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '1981-06-05',
                'phone' => '081234567894',
                'email' => 'asep.hidayat@sman27garut.local',
                'address' => 'Kp. Babakan Abid No. 12, Tarogong Kaler',
                'employment_status' => 'PPPK',
                'type' => 'Guru',
                'subject' => 'Sejarah Indonesia',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Neni Herawati, S.Pd.',
                'user_id' => null,
                'nip' => '198504122011012006',
                'nuptk' => '7435763664210082',
                'gender' => 'P',
                'birth_place' => 'Garut',
                'birth_date' => '1985-04-12',
                'phone' => '081234567895',
                'email' => 'neni.herawati@sman27garut.local',
                'address' => 'Jl. Samarang No. 25, Garut',
                'employment_status' => 'ASN',
                'type' => 'Guru',
                'subject' => 'Biologi',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Yusuf Maulana, S.Pd.',
                'user_id' => null,
                'nip' => '198908202014031007',
                'nuptk' => '4342767668130091',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '1989-08-20',
                'phone' => '081234567896',
                'email' => 'yusuf.maulana@sman27garut.local',
                'address' => 'Jl. Pembangunan No. 67, Tarogong Kidul',
                'employment_status' => 'PPPK',
                'type' => 'Guru',
                'subject' => 'PJOK',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Dewi Lestari, S.Pd.',
                'user_id' => null,
                'nip' => '198411032009022008',
                'nuptk' => '6543762663210072',
                'gender' => 'P',
                'birth_place' => 'Bandung',
                'birth_date' => '1984-11-03',
                'phone' => '081234567897',
                'email' => 'dewi.lestari@sman27garut.local',
                'address' => 'Jl. Cimanuk No. 120, Garut Kota',
                'employment_status' => 'ASN',
                'type' => 'Guru',
                'subject' => 'Bahasa Inggris',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Iwan Hermawan, S.Pd.',
                'user_id' => null,
                'nip' => '198602142012011009',
                'nuptk' => '1245764665120021',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '1986-02-14',
                'phone' => '081234567898',
                'email' => 'iwan.hermawan@sman27garut.local',
                'address' => 'Jl. Merdeka No. 40, Tarogong Kidul',
                'employment_status' => 'PPPK',
                'type' => 'Guru',
                'subject' => 'Pendidikan Pancasila',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Farid Hidayat, S.Kom.',
                'user_id' => null,
                'nip' => '199105252019021010',
                'nuptk' => '8765769670130031',
                'gender' => 'L',
                'birth_place' => 'Garut',
                'birth_date' => '1991-05-25',
                'phone' => '081234567899',
                'email' => 'farid.hidayat@sman27garut.local',
                'address' => 'Jl. Papandayan No. 15, Garut',
                'employment_status' => 'PPPK',
                'type' => 'Guru',
                'subject' => 'Informatika',
                'status' => 'Aktif',
            ],
            // Teachers without NIP (Honorer / GTT)
            [
                'name' => 'Lilis Suryani, S.Pd.',
                'user_id' => null,
                'nip' => null,
                'nuptk' => '9876771672210042',
                'gender' => 'P',
                'birth_place' => 'Garut',
                'birth_date' => '1993-09-15',
                'phone' => '081234567810',
                'email' => 'lilis.suryani@sman27garut.local',
                'address' => 'Jl. Bank No. 4, Garut Kota',
                'employment_status' => 'Honorer',
                'type' => 'Guru',
                'subject' => 'Seni Budaya',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Tuti Alawiyah, S.Pd.',
                'user_id' => null,
                'nip' => null,
                'nuptk' => '3456773674210052',
                'gender' => 'P',
                'birth_place' => 'Garut',
                'birth_date' => '1995-12-01',
                'phone' => '081234567811',
                'email' => 'tuti.alawiyah@sman27garut.local',
                'address' => 'Kp. Sindang Reret No. 22, Tarogong Kaler',
                'employment_status' => 'Honorer',
                'type' => 'Guru',
                'subject' => 'Sosiologi',
                'status' => 'Aktif',
            ],
            [
                'name' => 'Bambang Pratama, S.E.',
                'user_id' => null,
                'nip' => null,
                'nuptk' => '4567772673130061',
                'gender' => 'L',
                'birth_place' => 'Bandung',
                'birth_date' => '1994-03-28',
                'phone' => '081234567812',
                'email' => 'bambang.pratama@sman27garut.local',
                'address' => 'Jl. Pasundan No. 33, Garut',
                'employment_status' => 'Honorer',
                'type' => 'Guru',
                'subject' => 'Ekonomi',
                'status' => 'Aktif',
            ],
            // Teacher without NIP & without NUPTK
            [
                'name' => 'Endah Sulistiawati, S.Pd.',
                'user_id' => null,
                'nip' => null,
                'nuptk' => null,
                'gender' => 'P',
                'birth_place' => 'Garut',
                'birth_date' => '1997-07-14',
                'phone' => '081234567813',
                'email' => 'endah.sulistiawati@sman27garut.local',
                'address' => 'Jl. Terusan Pahlawan No. 90, Garut',
                'employment_status' => 'Honorer',
                'type' => 'Guru',
                'subject' => 'Geografi',
                'status' => 'Aktif',
            ],
            // Inactive Teacher for filter/stats testing
            [
                'name' => 'Hendro Santoso, S.Pd.',
                'user_id' => null,
                'nip' => '197501102000031001',
                'nuptk' => '1234753655120011',
                'gender' => 'L',
                'birth_place' => 'Solo',
                'birth_date' => '1975-01-10',
                'phone' => '081234567814',
                'email' => 'hendro.santoso@sman27garut.local',
                'address' => 'Jl. Otista No. 10, Garut',
                'employment_status' => 'ASN',
                'type' => 'Guru',
                'subject' => 'Bimbingan Konseling',
                'status' => 'Tidak Aktif',
            ],
        ];

        foreach ($teachers as $teacherData) {
            // Check withTrashed() using NIP, NUPTK, or Name to ensure complete idempotency
            $exists = false;

            if (!empty($teacherData['nip'])) {
                $exists = Teacher::withTrashed()->where('nip', $teacherData['nip'])->exists();
            }

            if (!$exists && !empty($teacherData['nuptk'])) {
                $exists = Teacher::withTrashed()->where('nuptk', $teacherData['nuptk'])->exists();
            }

            if (!$exists && empty($teacherData['nip']) && empty($teacherData['nuptk'])) {
                $exists = Teacher::withTrashed()->where('name', $teacherData['name'])->exists();
            }

            if (!$exists) {
                Teacher::create($teacherData);
            }
        }
    }
}
