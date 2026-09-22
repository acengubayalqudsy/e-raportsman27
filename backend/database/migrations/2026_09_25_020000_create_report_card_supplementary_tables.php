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
        // 1. Rekap Ketidakhadiran / Absensi Rapor
        Schema::create('student_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->unsignedSmallInteger('sick')->default(0);
            $table->unsignedSmallInteger('permitted')->default(0);
            $table->unsignedSmallInteger('absent')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END"
            );
            $table->unique(
                ['semester_id', 'student_id', 'active_marker'],
                'uk_student_attendance_active'
            );
            $table->index(['class_id', 'semester_id'], 'idx_attendance_class_sem');
        });

        // 2. Ekstrakurikuler Siswa (Tidak dibatasi 4 kolom)
        Schema::create('student_extracurriculars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->string('activity_name', 100);
            $table->string('predicate', 20)->default('Baik'); // Sangat Baik, Baik, Cukup
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['student_id', 'semester_id'], 'idx_student_ekskul');
        });

        // 3. Catatan Kokurikuler / P5 Siswa
        Schema::create('student_cocurriculars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->string('title', 150);
            $table->text('description');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['student_id', 'semester_id'], 'idx_student_kokurikuler');
        });

        // 4. Catatan Wali Kelas
        Schema::create('homeroom_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->foreignId('homeroom_assignment_id')->nullable()->constrained('homeroom_assignments')->restrictOnDelete();
            $table->text('note');
            $table->timestamps();
            $table->softDeletes();

            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END"
            );
            $table->unique(
                ['semester_id', 'student_id', 'active_marker'],
                'uk_student_homeroom_note_active'
            );
            $table->index(['class_id', 'semester_id'], 'idx_homeroom_note_class_sem');
        });

        // 5. Audit Log Perubahan Nilai & Pembukaan Kunci (Unlock)
        Schema::create('grade_modification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('course_assignment_id')->constrained('course_assignments')->restrictOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->restrictOnDelete();
            $table->string('action', 50); // UNLOCK_COURSE, MODIFY_SCORE, MANUAL_OVERRIDE
            $table->json('previous_data')->nullable();
            $table->json('new_data')->nullable();
            $table->text('reason');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['course_assignment_id', 'action'], 'idx_grade_mod_assignment');
        });

        // 6. Update assessment_configs untuk School Approval Status
        Schema::table('assessment_configs', function (Blueprint $table) {
            $table->boolean('is_approved_by_school')->default(false)->after('calculation_formula');
            $table->string('approval_reference', 100)->nullable()->after('is_approved_by_school');
            $table->timestamp('approved_at')->nullable()->after('approval_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_configs', function (Blueprint $table) {
            $table->dropColumn(['approved_at', 'approval_reference', 'is_approved_by_school']);
        });
        Schema::dropIfExists('grade_modification_logs');
        Schema::dropIfExists('homeroom_notes');
        Schema::dropIfExists('student_cocurriculars');
        Schema::dropIfExists('student_extracurriculars');
        Schema::dropIfExists('student_attendances');
    }
};
