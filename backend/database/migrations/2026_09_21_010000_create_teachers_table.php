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
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nip', 30)->nullable()->unique();
            $table->string('nuptk', 30)->nullable()->unique();
            $table->string('name', 120);
            $table->char('gender', 1); // 'L' (Laki-laki) or 'P' (Perempuan)
            $table->string('birth_place', 100)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('phone', 25)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->string('employment_status', 30)->default('ASN'); // 'ASN', 'PPPK', 'Honorer'
            $table->string('type', 30)->default('Guru'); // 'Guru', 'Tenaga Kependidikan'
            $table->string('subject', 100)->nullable(); // Bidang studi keahlian informatif (profil)
            $table->string('status', 20)->default('Aktif'); // 'Aktif', 'Tidak Aktif'
            $table->timestamps();
            $table->softDeletes();

            // Indexes for fast filtering & search
            $table->index('status');
            $table->index('employment_status');
            $table->index('gender');
            $table->index('type');
            $table->index('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
