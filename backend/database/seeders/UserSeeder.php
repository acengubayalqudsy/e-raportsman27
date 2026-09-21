<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds for development testing only.
     */
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            $this->command?->warn('Development users were not seeded outside local/testing.');
            return;
        }

        $adminPassword = env('DEV_ADMIN_PASSWORD');
        $guruPassword = env('DEV_GURU_PASSWORD');
        $inactivePassword = env('DEV_INACTIVE_PASSWORD');

        if (!$adminPassword || !$guruPassword || !$inactivePassword) {
            $this->command?->warn('Development users skipped. Set DEV_ADMIN_PASSWORD, DEV_GURU_PASSWORD, and DEV_INACTIVE_PASSWORD.');
            return;
        }

        // 1. Development Administrator Account
        $admin = User::firstOrCreate(
            ['username' => 'dev_admin'],
            [
                'name' => 'Dev Administrator (Testing)',
                'email' => 'dev_admin@sman27garut.local',
                'password' => Hash::make($adminPassword),
                'phone' => '081200000001',
                'is_active' => true,
            ]
        );
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole && !$admin->roles()->where('role_id', $adminRole->id)->exists()) {
            $admin->roles()->attach($adminRole->id, ['is_primary' => true]);
        }

        // 2. Development Multi-Role Guru + Wali Kelas Account
        $guruWali = User::firstOrCreate(
            ['username' => 'dev_guru_walikelas'],
            [
                'name' => 'Dev Guru & Wali Kelas (Testing)',
                'email' => 'dev_guru@sman27garut.local',
                'password' => Hash::make($guruPassword),
                'phone' => '081200000002',
                'is_active' => true,
            ]
        );
        $guruRole = Role::where('name', 'guru')->first();
        $waliRole = Role::where('name', 'walikelas')->first();
        if ($guruRole && !$guruWali->roles()->where('role_id', $guruRole->id)->exists()) {
            $guruWali->roles()->attach($guruRole->id, ['is_primary' => true]);
        }
        if ($waliRole && !$guruWali->roles()->where('role_id', $waliRole->id)->exists()) {
            $guruWali->roles()->attach($waliRole->id, ['is_primary' => false]);
        }

        // 3. Development Inactive Account (to test login rejection)
        $inactive = User::firstOrCreate(
            ['username' => 'dev_nonaktif'],
            [
                'name' => 'Dev Akun Nonaktif (Testing)',
                'email' => 'dev_nonaktif@sman27garut.local',
                'password' => Hash::make($inactivePassword),
                'phone' => '081200000003',
                'is_active' => false,
            ]
        );
        if ($guruRole && !$inactive->roles()->where('role_id', $guruRole->id)->exists()) {
            $inactive->roles()->attach($guruRole->id, ['is_primary' => true]);
        }
    }
}
