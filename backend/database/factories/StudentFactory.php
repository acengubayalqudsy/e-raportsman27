<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $gender = fake()->randomElement(['L', 'P']);

        return [
            'name' => fake()->name($gender === 'L' ? 'male' : 'female'),
            'nis' => fake()->unique()->numerify('242510####'),
            'nisn' => fake()->unique()->numerify('008123####'),
            'gender' => $gender,
            'birth_place' => fake()->city(),
            'birth_date' => fake()->date('Y-m-d', '2008-12-31'),
            'religion' => 'Islam',
            'address' => fake()->address(),
            'phone' => fake()->numerify('0812########'),
            'previous_school' => 'SMPN 1 Garut',
            'accepted_class' => 'X Merdeka 1',
            'admission_date' => '2024-07-15',
            'father_name' => fake()->name('male'),
            'mother_name' => fake()->name('female'),
            'father_occupation' => fake()->randomElement(['PNS', 'Wiraswasta', 'Karyawan Swasta']),
            'mother_occupation' => fake()->randomElement(['Ibu Rumah Tangga', 'Guru', 'Wiraswasta']),
            'parent_phone' => fake()->numerify('0812########'),
            'status' => 'Aktif',
            'current_class_name' => fake()->randomElement(['X Merdeka 1', 'X Merdeka 2', 'XI F1', 'XI F2', 'XII MIPA 1', 'XII IPS 1']),
        ];
    }
}
