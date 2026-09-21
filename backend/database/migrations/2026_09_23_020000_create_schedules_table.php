<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->restrictOnDelete();
            $table->foreignId('semester_id')
                ->constrained('semesters')
                ->restrictOnDelete();
            $table->foreignId('class_id')
                ->constrained('classes')
                ->restrictOnDelete();
            $table->foreignId('subject_id')
                ->constrained('subjects')
                ->restrictOnDelete();
            $table->foreignId('teacher_id')
                ->constrained('teachers')
                ->restrictOnDelete();
            $table->foreignId('room_id')
                ->constrained('rooms')
                ->restrictOnDelete();
            $table->foreignId('course_assignment_id')
                ->nullable()
                ->constrained('course_assignments')
                ->nullOnDelete();
            $table->enum('day_of_week', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']);
            $table->string('start_time', 10); // Format 'HH:mm'
            $table->string('end_time', 10);   // Format 'HH:mm'
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif');
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for fast conflict detection and lookups
            $table->index(['semester_id', 'day_of_week', 'status'], 'idx_sched_semester_day');
            $table->index(['teacher_id', 'semester_id', 'day_of_week', 'status'], 'idx_sched_teacher');
            $table->index(['room_id', 'semester_id', 'day_of_week', 'status'], 'idx_sched_room');
            $table->index(['class_id', 'semester_id', 'day_of_week', 'status'], 'idx_sched_class');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
