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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')
                ->nullable()
                ->constrained('academic_years')
                ->nullOnDelete();
            $table->string('code', 50);
            $table->string('name', 100);
            $table->string('building', 100)->nullable();
            $table->string('floor', 50)->nullable();
            $table->unsignedInteger('capacity')->default(36);
            $table->string('room_type', 50)->default('Kelas');
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif');
            $table->string('notes', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['academic_year_id', 'status'], 'idx_rooms_academic_year_status');
            $table->index(['code', 'status'], 'idx_rooms_code_status');
            $table->index('room_type', 'idx_rooms_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
