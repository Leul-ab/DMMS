<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Remove the old global unique constraint
            $table->dropUnique('menu_items_slug_unique');

            // Make slug unique within each branch
            $table->unique(
                ['branch_id', 'slug'],
                'menu_items_branch_id_slug_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Remove branch-specific unique constraint
            $table->dropUnique('menu_items_branch_id_slug_unique');

            // Restore global slug uniqueness
            $table->unique(
                'slug',
                'menu_items_slug_unique'
            );
        });
    }
};