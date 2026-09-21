<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Fase 5B:
     * - class_members (Keanggotaan Rombel per Semester)
     * - homeroom_assignments (Penugasan Wali Kelas per Semester)
     * - course_assignments (Penugasan Mengajar Guru per Mapel, Rombel, & Semester)
     */
    public function up(): void
    {
        // 1. Keanggotaan Rombel per Semester
        Schema::create('class_members', function (Blueprint $table) {
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
            $table->foreignId('student_id')
                ->constrained('students')
                ->restrictOnDelete();
            $table->enum('status', ['Aktif', 'Pindah Rombel', 'Keluar'])->default('Aktif');
            $table->date('join_date')->nullable();
            $table->date('leave_date')->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexing & Integrity
            $table->index(['class_id', 'semester_id', 'status'], 'idx_class_members_lookup');
            $table->index(['student_id', 'semester_id'], 'idx_student_semester_lookup');
            $table->unique(['semester_id', 'class_id', 'student_id'], 'uk_student_class_semester');
        });

        // 2. Penugasan Wali Kelas per Semester
        Schema::create('homeroom_assignments', function (Blueprint $table) {
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
            $table->foreignId('teacher_id')
                ->constrained('teachers')
                ->restrictOnDelete();
            $table->date('assignment_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['Aktif', 'Nonaktif', 'Digantikan'])->default('Aktif');
            $table->string('sk_number', 100)->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexing & Integrity
            $table->index(['class_id', 'semester_id', 'status'], 'idx_homeroom_class');
            $table->index(['teacher_id', 'semester_id', 'status'], 'idx_homeroom_teacher');
        });

        // 3. Penugasan Guru Mengajar per Semester
        Schema::create('course_assignments', function (Blueprint $table) {
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
            $table->unsignedTinyInteger('weekly_hours')->default(2);
            $table->enum('role', ['Utama', 'Pendamping', 'Pengganti'])->default('Utama');
            $table->enum('status', ['Aktif', 'Nonaktif', 'Selesai'])->default('Aktif');
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexing & Integrity
            $table->index(['class_id', 'semester_id', 'subject_id'], 'idx_course_class_subj');
            $table->index(['teacher_id', 'semester_id', 'status'], 'idx_course_teacher');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_assignments');
        Schema::dropIfExists('homeroom_assignments');
        Schema::dropIfExists('class_members');
    }
};
