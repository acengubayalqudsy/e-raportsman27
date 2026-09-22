<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        if ($this->container->environment(['local', 'testing'])) {
            $this->call([
                UserSeeder::class,
                StudentSeeder::class,
                TeacherSeeder::class,
                AcademicSeeder::class,
                AcademicAssignmentSeeder::class,
                RoomSeeder::class,
                ScheduleSeeder::class,
            ]);
        }
    }
}
