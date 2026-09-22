<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teaching_journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->restrictOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->restrictOnDelete();
            $table->foreignId('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
            $table->date('date');
            $table->unsignedInteger('meeting');
            $table->text('material')->nullable();
            $table->string('chapter', 255)->nullable();
            $table->text('activities')->nullable();
            $table->string('method', 100)->nullable();
            $table->string('media', 255)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('attendance_present')->default(0);
            $table->unsignedInteger('attendance_total')->default(0);
            $table->string('status', 50)->default('Belum Lengkap');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['teacher_id', 'semester_id', 'date'], 'idx_journal_teacher_context');
            $table->index(['class_id', 'subject_id', 'semester_id'], 'idx_journal_course_context');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teaching_journals');
    }
};
