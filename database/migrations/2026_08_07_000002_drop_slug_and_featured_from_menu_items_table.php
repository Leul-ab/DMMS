<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            if (Schema::hasColumn('menu_items', 'slug')) {
                $table->dropColumn('slug');
            }

            if (Schema::hasColumn('menu_items', 'featured')) {
                $table->dropColumn('featured');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            if (! Schema::hasColumn('menu_items', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('name');
            }

            if (! Schema::hasColumn('menu_items', 'featured')) {
                $table->boolean('featured')->default(false)->after('is_available');
            }
        });
    }
};
