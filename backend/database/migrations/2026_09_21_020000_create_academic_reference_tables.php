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
        // 1. Academic Years
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 20)->default('Akan Datang'); // 'Aktif', 'Tidak Aktif', 'Selesai', 'Akan Datang'
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });

        // 2. Semesters (Restricted delete on academic_years: an academic year with semesters cannot be wiped without clean procedure)
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->string('name', 20); // 'Ganjil' or 'Genap'
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 20)->default('Akan Datang'); // 'Aktif', 'Tidak Aktif', 'Selesai', 'Akan Datang'
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['academic_year_id', 'name']);
            $table->index('status');
            $table->index('academic_year_id');
        });

        // 3. Classes (Scoped to an academic year, code unique within the same academic year but reusable across different years)
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->string('code', 30);
            $table->string('name', 50);
            $table->string('grade', 10); // 'X', 'XI', 'XII'
            $table->unsignedSmallInteger('capacity')->default(36);
            $table->string('status', 20)->default('Aktif'); // 'Aktif', 'Tidak Aktif'
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['academic_year_id', 'code']);
            $table->index('grade');
            $table->index('status');
            $table->index('academic_year_id');
        });

        // 4. Subjects (Master identity for courses)
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100);
            $table->string('group', 50)->default('Umum'); // 'Umum', 'IPA', 'IPS', 'Muatan Lokal', 'Layanan'
            $table->string('grades', 50)->nullable()->default('X, XI, XII');
            $table->unsignedSmallInteger('weekly_hours')->default(2);
            $table->string('status', 20)->default('Aktif'); // 'Aktif', 'Tidak Aktif'
            $table->timestamps();
            $table->softDeletes();

            $table->index('group');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('academic_years');
    }
};
