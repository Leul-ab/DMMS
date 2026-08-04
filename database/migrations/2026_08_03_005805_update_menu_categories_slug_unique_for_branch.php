<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropUnique('menu_categories_slug_unique');

            $table->unique(
                ['branch_id', 'slug'],
                'menu_categories_branch_id_slug_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropUnique('menu_categories_branch_id_slug_unique');

            $table->unique(
                'slug',
                'menu_categories_slug_unique'
            );
        });
    }
};