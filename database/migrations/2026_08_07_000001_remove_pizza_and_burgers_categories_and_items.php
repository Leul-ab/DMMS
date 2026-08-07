<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $categoryIds = DB::table('menu_categories')
                ->where(function ($query): void {
                    $query->whereIn('name', ['Pizza', 'Burgers', 'pizza', 'burgers'])
                        ->orWhereIn('slug', ['pizza', 'burgers']);
                })
                ->pluck('id');

            if ($categoryIds->isEmpty()) {
                return;
            }

            $itemIds = DB::table('menu_items')
                ->whereIn('category_id', $categoryIds)
                ->pluck('id');

            if ($itemIds->isNotEmpty()) {
                DB::table('discount_menu_item')
                    ->whereIn('menu_item_id', $itemIds)
                    ->delete();

                DB::table('order_items')
                    ->whereIn('menu_item_id', $itemIds)
                    ->delete();

                DB::table('menu_items')
                    ->whereIn('id', $itemIds)
                    ->delete();
            }

            DB::table('menu_categories')
                ->whereIn('id', $categoryIds)
                ->delete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally left blank because this is a data cleanup migration.
    }
};
