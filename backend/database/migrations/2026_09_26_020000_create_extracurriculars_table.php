<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create canonical master extracurriculars table
        Schema::create('extracurriculars', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100)->unique();
            $table->foreignId('teacher_id')
                ->nullable()
                ->constrained('teachers')
                ->nullOnDelete();
            $table->text('description')->nullable();
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('teacher_id');
        });

        // 2. Add foreign key extracurricular_id to student_extracurriculars table
        Schema::table('student_extracurriculars', function (Blueprint $table) {
            $table->foreignId('extracurricular_id')
                ->nullable()
                ->after('semester_id')
                ->constrained('extracurriculars')
                ->restrictOnDelete();
        });

        // 3. Backfill initial school extracurricular activities
        $now = now();
        $initialActivities = [
            [
                'code' => 'EKS-PMR',
                'name' => 'PMR (Palang Merah Remaja)',
                'description' => 'Kegiatan kepalangmerahan, pertolongan pertama, dan aksi kemanusiaan siswa.',
            ],
            [
                'code' => 'EKS-PRA',
                'name' => 'Pramuka',
                'description' => 'Gerakan kepanduan dan pembentukan karakter kepemimpinan disiplin.',
            ],
            [
                'code' => 'EKS-PAS',
                'name' => 'Paskibra',
                'description' => 'Pasukan Pengibar Bendera Pusaka dan baris-berbaris sekolah.',
            ],
            [
                'code' => 'EKS-FUT',
                'name' => 'Futsal',
                'description' => 'Klub olahraga futsal dan kebugaran jasmani putra dan putri.',
            ],
            [
                'code' => 'EKS-ROH',
                'name' => 'Rohis',
                'description' => 'Rohani Islam pendalaman nilai keagamaan dan dakwah sekolah.',
            ],
            [
                'code' => 'EKS-TAR',
                'name' => 'Seni Tari',
                'description' => 'Pelestarian dan kreativitas tari tradisional nusantara serta modern.',
            ],
            [
                'code' => 'EKS-KOD',
                'name' => 'Klub Coding',
                'description' => 'Klub teknologi informasi, pemrograman web, dan rekayasa perangkat lunak.',
            ],
        ];

        foreach ($initialActivities as $act) {
            DB::table('extracurriculars')->updateOrInsert(
                ['code' => $act['code']],
                [
                    'name' => $act['name'],
                    'description' => $act['description'],
                    'status' => 'Aktif',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // 4. Backfill existing student_extracurriculars to link extracurricular_id
        $allEkskul = DB::table('extracurriculars')->pluck('id', 'name')->toArray();
        foreach ($allEkskul as $name => $id) {
            DB::table('student_extracurriculars')
                ->where('activity_name', $name)
                ->whereNull('extracurricular_id')
                ->update(['extracurricular_id' => $id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_extracurriculars', function (Blueprint $table) {
            $table->dropForeign(['extracurricular_id']);
            $table->dropColumn('extracurricular_id');
        });

        Schema::dropIfExists('extracurriculars');
    }
};
