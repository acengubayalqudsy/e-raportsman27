<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unique('user_id', 'uk_student_user');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->unique('user_id', 'uk_teacher_user');
        });

        Schema::table('semesters', function (Blueprint $table) {
            $table->unique(['id', 'academic_year_id'], 'uk_semester_year_pair');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->unique(['id', 'academic_year_id'], 'uk_class_year_pair');
        });

        Schema::table('class_members', function (Blueprint $table) {
            // Replace the legacy key so a historical soft-deleted membership does not block re-enrollment.
            // MariaDB currently uses the legacy key to support semester_id's foreign key.
            $table->index('semester_id', 'idx_class_members_semester_fk');
            $table->dropUnique('uk_student_class_semester');
            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL AND status = 'Aktif' THEN 1 ELSE NULL END"
            );
            $table->unique(['student_id', 'semester_id', 'active_marker'], 'uk_active_student_semester');
            $table->foreign(['semester_id', 'academic_year_id'], 'fk_member_semester_year')
                ->references(['id', 'academic_year_id'])->on('semesters')->restrictOnDelete();
            $table->foreign(['class_id', 'academic_year_id'], 'fk_member_class_year')
                ->references(['id', 'academic_year_id'])->on('classes')->restrictOnDelete();
        });

        Schema::table('homeroom_assignments', function (Blueprint $table) {
            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL AND status = 'Aktif' THEN 1 ELSE NULL END"
            );
            $table->unique(['class_id', 'semester_id', 'active_marker'], 'uk_active_homeroom_class');
            $table->unique(['teacher_id', 'semester_id', 'active_marker'], 'uk_active_homeroom_teacher');
            $table->foreign(['semester_id', 'academic_year_id'], 'fk_homeroom_semester_year')
                ->references(['id', 'academic_year_id'])->on('semesters')->restrictOnDelete();
            $table->foreign(['class_id', 'academic_year_id'], 'fk_homeroom_class_year')
                ->references(['id', 'academic_year_id'])->on('classes')->restrictOnDelete();
        });

        Schema::table('course_assignments', function (Blueprint $table) {
            $table->boolean('active_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL AND status = 'Aktif' THEN 1 ELSE NULL END"
            );
            $table->unique(
                ['semester_id', 'class_id', 'subject_id', 'teacher_id', 'role', 'active_marker'],
                'uk_active_course_assignment'
            );
            $table->foreign(['semester_id', 'academic_year_id'], 'fk_course_semester_year')
                ->references(['id', 'academic_year_id'])->on('semesters')->restrictOnDelete();
            $table->foreign(['class_id', 'academic_year_id'], 'fk_course_class_year')
                ->references(['id', 'academic_year_id'])->on('classes')->restrictOnDelete();
        });

        Schema::table('user_roles', function (Blueprint $table) {
            $table->boolean('primary_marker')->nullable()->virtualAs(
                'CASE WHEN is_primary = 1 THEN 1 ELSE NULL END'
            );
            $table->unique(['user_id', 'primary_marker'], 'uk_user_primary_role');
        });
    }

    public function down(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropUnique('uk_user_primary_role');
            $table->dropColumn('primary_marker');
        });

        Schema::table('course_assignments', function (Blueprint $table) {
            $table->dropForeign('fk_course_class_year');
            $table->dropForeign('fk_course_semester_year');
            $table->dropUnique('uk_active_course_assignment');
            $table->dropColumn('active_marker');
        });

        Schema::table('homeroom_assignments', function (Blueprint $table) {
            $table->dropForeign('fk_homeroom_class_year');
            $table->dropForeign('fk_homeroom_semester_year');
            $table->dropUnique('uk_active_homeroom_teacher');
            $table->dropUnique('uk_active_homeroom_class');
            $table->dropColumn('active_marker');
        });

        Schema::table('class_members', function (Blueprint $table) {
            $table->dropForeign('fk_member_class_year');
            $table->dropForeign('fk_member_semester_year');
            $table->dropUnique('uk_active_student_semester');
            $table->dropColumn('active_marker');
            $table->unique(['semester_id', 'class_id', 'student_id'], 'uk_student_class_semester');
            $table->dropIndex('idx_class_members_semester_fk');
        });

        Schema::table('classes', fn (Blueprint $table) => $table->dropUnique('uk_class_year_pair'));
        Schema::table('semesters', fn (Blueprint $table) => $table->dropUnique('uk_semester_year_pair'));
        Schema::table('teachers', fn (Blueprint $table) => $table->dropUnique('uk_teacher_user'));
        Schema::table('students', fn (Blueprint $table) => $table->dropUnique('uk_student_user'));
    }
};
