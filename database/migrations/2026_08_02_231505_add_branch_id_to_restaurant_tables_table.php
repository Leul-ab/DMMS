<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('restaurant_tables', 'branch_id')) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('branches')
                    ->nullOnDelete();
            });
        }

        // Make table numbers unique within each branch.
        // This allows different branches to have tables with the same number.
        $indexes = Schema::getIndexes('restaurant_tables');

        $hasOldUniqueIndex = collect($indexes)->contains(
            fn ($index) => $index['name'] === 'restaurant_tables_table_number_unique'
        );

        if ($hasOldUniqueIndex) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->dropUnique('restaurant_tables_table_number_unique');
            });
        }

        $indexes = Schema::getIndexes('restaurant_tables');

        $hasBranchTableUniqueIndex = collect($indexes)->contains(
            fn ($index) => $index['name'] === 'restaurant_tables_branch_id_table_number_unique'
        );

        if (!$hasBranchTableUniqueIndex) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->unique(
                    ['branch_id', 'table_number'],
                    'restaurant_tables_branch_id_table_number_unique'
                );
            });
        }
    }

    public function down(): void
    {
        $indexes = Schema::getIndexes('restaurant_tables');

        $hasBranchTableUniqueIndex = collect($indexes)->contains(
            fn ($index) => $index['name'] === 'restaurant_tables_branch_id_table_number_unique'
        );

        if ($hasBranchTableUniqueIndex) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->dropUnique(
                    'restaurant_tables_branch_id_table_number_unique'
                );
            });
        }

        if (Schema::hasColumn('restaurant_tables', 'branch_id')) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }
    }
};