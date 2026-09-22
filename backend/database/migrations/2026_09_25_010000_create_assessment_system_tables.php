<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for the Assessment System (Kurikulum Merdeka).
     */
    public function up(): void
    {
        // 1. Learning Objectives (Tujuan Pembelajaran / TP)
        Schema::create('learning_objectives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->string('grade', 10); // 'X', 'XI', 'XII'
            $table->string('code', 30); // 'TP-01', 'TP-02'
            $table->text('description');
            $table->foreignId('created_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('status', 20)->default('Aktif'); // 'Aktif', 'Tidak Aktif'
            $table->timestamps();
            $table->softDeletes();

            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL AND status = 'Aktif' THEN 1 ELSE NULL END"
            );
            $table->unique(
                ['subject_id', 'semester_id', 'grade', 'code', 'active_marker'],
                'uk_active_tp_code'
            );
            $table->index(['subject_id', 'semester_id', 'grade'], 'idx_tp_subject_semester_grade');
        });

        // 2. Assessments (Definisi Instrumen Asesmen)
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_assignment_id')->constrained('course_assignments')->restrictOnDelete();
            $table->foreignId('learning_objective_id')->nullable()->constrained('learning_objectives')->nullOnDelete();
            $table->string('type', 50); // 'Formatif', 'Sumatif Lingkup Materi', 'Sumatif Akhir Semester'
            $table->string('title', 100);
            $table->decimal('weight', 5, 2)->default(1.00);
            $table->decimal('max_score', 5, 2)->default(100.00);
            $table->decimal('passing_grade', 5, 2)->default(75.00); // KKTP
            $table->date('assessment_date')->nullable();
            $table->string('status', 20)->default('Aktif'); // 'Draft', 'Aktif', 'Terkunci'
            $table->timestamps();
            $table->softDeletes();

            $table->index(['course_assignment_id', 'type', 'status'], 'idx_assessment_course_type');
        });

        // 3. Student Scores (Nilai Siswa per Instrumen Asesmen)
        Schema::create('student_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('assessments')->restrictOnDelete();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->decimal('raw_score', 5, 2)->nullable();
            $table->boolean('is_remedial')->default(false);
            $table->decimal('remedial_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END"
            );
            $table->unique(
                ['assessment_id', 'student_id', 'active_marker'],
                'uk_student_assessment_active'
            );
            $table->index(['student_id', 'assessment_id'], 'idx_score_student_assessment');
        });

        // 4. Final Course Grades (Nilai Akhir Rapor Mata Pelajaran)
        Schema::create('final_course_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->restrictOnDelete();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->foreignId('course_assignment_id')->constrained('course_assignments')->restrictOnDelete();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('status', 30)->default('Draft'); // 'Draft', 'Siap Validasi', 'Tervalidasi', 'Terkunci'
            $table->foreignId('validated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END"
            );
            // Menjamin 1 siswa hanya memiliki 1 baris nilai akhir aktif per mapel per semester
            $table->unique(
                ['semester_id', 'subject_id', 'student_id', 'active_marker'],
                'uk_student_subject_semester_final_active'
            );
            $table->index(['class_id', 'semester_id', 'subject_id'], 'idx_final_grade_class_sem_subj');
        });

        // 5. Competency Achievements (Deskripsi Capaian Kompetensi Rapor)
        Schema::create('competency_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('final_course_grade_id')->constrained('final_course_grades')->restrictOnDelete();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->text('highest_achievement')->nullable();
            $table->text('lowest_achievement')->nullable();
            $table->boolean('is_customized')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END"
            );
            $table->unique(
                ['final_course_grade_id', 'active_marker'],
                'uk_achievement_final_grade_active'
            );
            $table->index(['student_id'], 'idx_achievement_student');
        });

        // 6. Assessment Configs (Konfigurasi Bobot & Formula Fleksibel)
        Schema::create('assessment_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->restrictOnDelete();
            $table->decimal('passing_grade_default', 5, 2)->default(75.00);
            $table->decimal('weight_sumatif_materi', 5, 2)->default(60.00);
            $table->decimal('weight_sumatif_akhir', 5, 2)->default(40.00);
            $table->boolean('include_formatif_in_final')->default(false);
            $table->string('calculation_formula', 50)->default('weighted_average');
            $table->timestamps();

            $table->index(['semester_id', 'subject_id'], 'idx_config_semester_subject');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_configs');
        Schema::dropIfExists('competency_achievements');
        Schema::dropIfExists('final_course_grades');
        Schema::dropIfExists('student_scores');
        Schema::dropIfExists('assessments');
        Schema::dropIfExists('learning_objectives');
    }
};
