<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('branch_user')) {
            Schema::create('branch_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')
                    ->constrained('branches')
                    ->cascadeOnDelete();
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['branch_id', 'user_id']);
            });
        }

        // Backfill from existing users.branch_id assignments.
        $users = DB::table('users')
            ->whereNotNull('branch_id')
            ->select('id', 'branch_id')
            ->get();

        $now = now();

        foreach ($users as $user) {
            $exists = DB::table('branch_user')
                ->where('user_id', $user->id)
                ->where('branch_id', $user->branch_id)
                ->exists();

            if (! $exists) {
                DB::table('branch_user')->insert([
                    'user_id' => $user->id,
                    'branch_id' => $user->branch_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_user');
    }
};
