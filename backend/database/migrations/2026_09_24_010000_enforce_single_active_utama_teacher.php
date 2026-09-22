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
        Schema::table('course_assignments', function (Blueprint $table) {
            // Virtual marker evaluates to 1 ONLY when active, not soft-deleted, and role is 'Utama'.
            // For 'Pendamping' or 'Pengganti', it evaluates to NULL.
            // In MariaDB/MySQL/SQLite unique indexes, NULL does not conflict, allowing multiple pendamping/pengganti.
            $table->boolean('utama_marker')->nullable()->virtualAs(
                "CASE WHEN deleted_at IS NULL AND status = 'Aktif' AND role = 'Utama' THEN 1 ELSE NULL END"
            );

            // Enforces at database level: maximum 1 active 'Utama' teacher per semester, class, and subject
            $table->unique(
                ['semester_id', 'class_id', 'subject_id', 'utama_marker'],
                'uk_single_active_utama_course_assignment'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_assignments', function (Blueprint $table) {
            $table->dropUnique('uk_single_active_utama_course_assignment');
            $table->dropColumn('utama_marker');
        });
    }
};
