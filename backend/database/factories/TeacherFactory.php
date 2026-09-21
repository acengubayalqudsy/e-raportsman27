<?php

namespace Database\Factories;

use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Teacher>
 */
class TeacherFactory extends Factory
{
    protected $model = Teacher::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $gender = fake()->randomElement(['L', 'P']);
        $hasNip = fake()->boolean(80);
        $hasNuptk = fake()->boolean(85);

        return [
            'name' => fake()->name($gender === 'L' ? 'male' : 'female') . ', S.Pd.',
            'nip' => $hasNip ? fake()->unique()->numerify('198#0#1#200######') : null,
            'nuptk' => $hasNuptk ? fake()->unique()->numerify('################') : null,
            'gender' => $gender,
            'birth_place' => fake()->city(),
            'birth_date' => fake()->date('Y-m-d', '1995-12-31'),
            'phone' => fake()->numerify('0812########'),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->address(),
            'employment_status' => fake()->randomElement(['ASN', 'PPPK', 'Honorer']),
            'type' => 'Guru',
            'subject' => fake()->randomElement([
                'Matematika', 'Fisika', 'Kimia', 'Biologi',
                'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Pancasila',
                'Sejarah Indonesia', 'Seni Budaya', 'PJOK',
            ]),
            'status' => 'Aktif',
        ];
    }
}
