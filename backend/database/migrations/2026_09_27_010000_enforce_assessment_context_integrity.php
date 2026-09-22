<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_assignments', function (Blueprint $table) {
            $table->unique(
                ['id', 'academic_year_id', 'semester_id', 'class_id', 'subject_id'],
                'uk_course_assignment_context'
            );
        });

        Schema::table('final_course_grades', function (Blueprint $table) {
            $table->foreign(
                ['course_assignment_id', 'academic_year_id', 'semester_id', 'class_id', 'subject_id'],
                'fk_final_grade_assignment_context'
            )->references(
                ['id', 'academic_year_id', 'semester_id', 'class_id', 'subject_id']
            )->on('course_assignments')->restrictOnDelete();

            $table->index(
                ['student_id', 'academic_year_id', 'semester_id', 'class_id', 'subject_id'],
                'idx_final_grade_student_context'
            );
        });
    }

    public function down(): void
    {
        Schema::table('final_course_grades', function (Blueprint $table) {
            $table->dropForeign('fk_final_grade_assignment_context');
            $table->dropIndex('idx_final_grade_student_context');
        });

        Schema::table('course_assignments', function (Blueprint $table) {
            $table->dropUnique('uk_course_assignment_context');
        });
    }
};
