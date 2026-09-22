<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create master religions table
        Schema::create('religions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });

        // 2. Add foreign key religion_id to students table
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('religion_id')
                ->nullable()
                ->after('religion')
                ->constrained('religions')
                ->restrictOnDelete();
        });

        // 3. Backfill initial official standard religions
        $initialReligions = [
            'Islam',
            'Kristen Protestan',
            'Katolik',
            'Hindu',
            'Buddha',
            'Konghucu',
        ];

        $now = now();
        foreach ($initialReligions as $name) {
            DB::table('religions')->updateOrInsert(
                ['name' => $name],
                ['status' => 'Aktif', 'created_at' => $now, 'updated_at' => $now]
            );
        }

        // 4. Backfill existing students to link religion_id safely
        $allReligions = DB::table('religions')->pluck('id', 'name')->toArray();
        foreach ($allReligions as $name => $id) {
            DB::table('students')
                ->where('religion', $name)
                ->whereNull('religion_id')
                ->update(['religion_id' => $id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['religion_id']);
            $table->dropColumn('religion_id');
        });

        Schema::dropIfExists('religions');
    }
};
