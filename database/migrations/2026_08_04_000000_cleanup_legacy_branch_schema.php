<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Removes the manually-created (unmigrated) branch schema that predates the
 * official branch migrations. Safe to run on a clean database (all no-ops).
 */
return new class extends Migration
{
    public function up(): void
    {
        $branchColumnTables = [
            'customers',
            'menu_categories',
            'menu_items',
            'orders',
            'payments',
            'restaurant_tables',
            'table_bookings',
            'users',
        ];

        foreach ($branchColumnTables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'branch_id')) {
                continue;
            }

            $foreignKeys = Schema::getForeignKeys($table);
            $branchIdFk = collect($foreignKeys)->firstWhere('columns', ['branch_id']);

            if ($branchIdFk !== null) {
                Schema::table($table, function (Blueprint $blueprint) use ($branchIdFk) {
                    $blueprint->dropForeign($branchIdFk['name']);
                });
            }

            $branchIndexes = collect(Schema::getIndexes($table))
                ->filter(fn (array $index) => $index['name'] !== 'PRIMARY'
                    && in_array('branch_id', $index['columns'], true))
                ->map(fn (array $index) => $index['name'])
                ->values();

            if ($branchIndexes->isNotEmpty()) {
                Schema::table($table, function (Blueprint $blueprint) use ($branchIndexes) {
                    foreach ($branchIndexes as $indexName) {
                        $blueprint->dropIndex($indexName);
                    }
                });
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropColumn('branch_id');
            });
        }

        if (Schema::hasTable('branch_user')) {
            Schema::drop('branch_user');
        }

        if (Schema::hasTable('branches')) {
            Schema::drop('branches');
        }
    }

    public function down(): void
    {
        // Intentionally unreversed: the legacy schema was created outside migrations.
    }
};
