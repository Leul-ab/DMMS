<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            if (Schema::hasColumn('menu_categories', 'slug')) {
                $table->dropColumn('slug');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            if (! Schema::hasColumn('menu_categories', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('name');
            }
        });
    }
};
