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
        if (Schema::hasColumn('menu_categories', 'slug')) {
            Schema::table('menu_categories', function (Blueprint $table) {
                $table->dropColumn('slug');
            });
        }

        if (Schema::hasColumn('menu_items', 'slug')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->dropColumn('slug');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable();
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable();
            $table->json('features')->nullable();
        });
    }
};
