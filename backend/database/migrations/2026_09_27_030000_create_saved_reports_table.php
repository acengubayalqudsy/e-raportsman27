<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_reports', function (Blueprint $table) {
            $table->id();
            $table->string('type', 40);
            $table->string('title', 200);
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->restrictOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->json('snapshot');
            $table->timestamp('generated_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['semester_id', 'class_id', 'type'], 'idx_saved_reports_context');
            $table->index(['created_by', 'created_at'], 'idx_saved_reports_owner');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_reports');
    }
};
