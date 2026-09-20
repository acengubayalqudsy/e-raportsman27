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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nis', 20)->unique();
            $table->string('nisn', 20)->unique();
            $table->string('name', 150);
            $table->enum('gender', ['L', 'P']);
            $table->string('birth_place', 100);
            $table->date('birth_date');
            $table->string('religion', 30)->nullable()->default('Islam');
            $table->text('address')->nullable();
            $table->string('phone', 25)->nullable();
            $table->string('previous_school', 150)->nullable();
            $table->string('accepted_class', 50)->nullable();
            $table->date('admission_date')->nullable();
            $table->string('father_name', 150)->nullable();
            $table->string('mother_name', 150)->nullable();
            $table->string('father_occupation', 100)->nullable();
            $table->string('mother_occupation', 100)->nullable();
            $table->string('parent_phone', 25)->nullable();
            $table->string('guardian_name', 150)->nullable();
            $table->text('guardian_address')->nullable();
            $table->string('guardian_phone', 25)->nullable();
            $table->enum('status', ['Aktif', 'Alumni', 'Mutasi', 'Nonaktif'])->default('Aktif');
            $table->string('current_class_name', 50)->nullable()->comment('Transitional class assignment until Phase 4');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status', 'idx_students_status');
            $table->index('current_class_name', 'idx_students_class');
            $table->index('name', 'idx_students_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
