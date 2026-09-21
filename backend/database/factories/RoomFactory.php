<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Room>
 */
class RoomFactory extends Factory
{
    protected $model = Room::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = 'R-' . fake()->unique()->numerify('###');
        return [
            'academic_year_id' => AcademicYear::inRandomOrder()->first()?->id ?? AcademicYear::factory(),
            'code' => $code,
            'name' => 'Ruang ' . $code,
            'building' => fake()->randomElement(['Gedung A', 'Gedung B', 'Gedung C']),
            'floor' => fake()->randomElement(['1', '2', '3']),
            'capacity' => fake()->randomElement([32, 36, 40]),
            'room_type' => fake()->randomElement(['Kelas', 'Laboratorium', 'Perpustakaan', 'Aula']),
            'status' => 'Aktif',
            'notes' => fake()->sentence(),
        ];
    }
}
