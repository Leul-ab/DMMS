<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Permanently remove the retired Pizza and Burgers menu data.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $categoryIds = DB::table('menu_categories')
                ->whereIn('name', ['Pizza', 'Burgers'])
                ->pluck('id');

            if ($categoryIds->isEmpty()) {
                return;
            }

            $menuItemIds = DB::table('menu_items')
                ->whereIn('category_id', $categoryIds)
                ->pluck('id');

            if ($menuItemIds->isNotEmpty()) {
                // order_items has a restrictive menu_item_id foreign key, so it
                // must be removed before the corresponding menu items.
                DB::table('order_items')
                    ->whereIn('menu_item_id', $menuItemIds)
                    ->delete();

                // Links in discount_menu_item cascade on menu item deletion.
                DB::table('menu_items')
                    ->whereIn('id', $menuItemIds)
                    ->delete();
            }

            DB::table('menu_categories')
                ->whereIn('id', $categoryIds)
                ->delete();
        });
    }

    /**
     * Removed menu data is intentionally not restored on rollback.
     */
    public function down(): void
    {
        // This destructive data migration cannot be safely reversed.
    }
};
