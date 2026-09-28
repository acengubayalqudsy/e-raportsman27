<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_attendance_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->unsignedBigInteger('course_assignment_id')->default(0);
            $table->date('attendance_date');
            $table->enum('status', ['Hadir', 'Sakit', 'Izin', 'Alpa']);
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'semester_id', 'attendance_date', 'course_assignment_id'],
                'uk_student_attendance_entry'
            );
            $table->index(['class_id', 'semester_id', 'attendance_date'], 'idx_attendance_entry_context');
            $table->index(['course_assignment_id', 'attendance_date'], 'idx_attendance_entry_course');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_attendance_entries');
    }
};
