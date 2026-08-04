<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'branch_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
            });
        }

        $simpleTables = [
            'menu_categories',
            'menu_items',
            'orders',
            'order_items',
            'customers',
            'payments',
            'receipts',
            'table_bookings',
            'waiter_table_assignments',
            'kitchen_assignments',
            'order_status_history',
        ];

        foreach ($simpleTables as $table) {
            if (Schema::hasColumn($table, 'branch_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('branch_id')->nullable()->after('id')->constrained()->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('restaurant_tables', 'branch_id')) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained()->nullOnDelete();
            });
        }

        if (! Schema::hasIndex('restaurant_tables', 'restaurant_tables_branch_id_table_number_unique')) {
            if (Schema::hasIndex('restaurant_tables', 'restaurant_tables_table_number_unique')) {
                Schema::table('restaurant_tables', function (Blueprint $table) {
                    $table->dropUnique('restaurant_tables_table_number_unique');
                });
            }

            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->unique(['branch_id', 'table_number']);
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'users',
            'menu_categories',
            'menu_items',
            'restaurant_tables',
            'orders',
            'order_items',
            'customers',
            'payments',
            'receipts',
            'table_bookings',
            'waiter_table_assignments',
            'kitchen_assignments',
            'order_status_history',
        ];

        foreach ($tables as $table) {
            if (! Schema::hasColumn($table, 'branch_id')) {
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

        if (! Schema::hasIndex('restaurant_tables', 'restaurant_tables_table_number_unique')) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->unique('table_number');
            });
        }
    }
};
