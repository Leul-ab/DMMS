<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add restaurant_id to branches
        Schema::table('branches', function (Blueprint $table) {
            $table->foreignId('restaurant_id')
                ->nullable()
                ->after('id')
                ->constrained('restaurants')
                ->nullOnDelete();
        });

        // 2. Add restaurant_id to users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('restaurant_id')
                ->nullable()
                ->after('branch_id')
                ->constrained('restaurants')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Restaurant::class);
            $table->dropColumn('restaurant_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Restaurant::class);
            $table->dropColumn('restaurant_id');
        });
    }
};
