<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('customers', 'branch_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('branches')
                    ->nullOnDelete();
            });
        }

        // Assign existing customers to the first branch so they remain visible.
        $defaultBranchId = DB::table('branches')->orderBy('id')->value('id');

        if ($defaultBranchId) {
            DB::table('customers')
                ->whereNull('branch_id')
                ->update(['branch_id' => $defaultBranchId]);
        }

        // Phone uniqueness becomes per-branch.
        $this->dropUniqueIfExists('customers', 'customers_phone_unique');
        $this->dropUniqueIfExists('customers', 'customers_email_unique');

        $indexes = Schema::getIndexes('customers');

        $hasPhoneBranchUnique = collect($indexes)->contains(
            fn ($index) => $index['name'] === 'customers_branch_id_phone_unique'
        );

        if (! $hasPhoneBranchUnique) {
            Schema::table('customers', function (Blueprint $table) {
                $table->unique(
                    ['branch_id', 'phone'],
                    'customers_branch_id_phone_unique'
                );
            });
        }
    }

    public function down(): void
    {
        $indexes = Schema::getIndexes('customers');

        $hasPhoneBranchUnique = collect($indexes)->contains(
            fn ($index) => $index['name'] === 'customers_branch_id_phone_unique'
        );

        if ($hasPhoneBranchUnique) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropUnique('customers_branch_id_phone_unique');
            });
        }

        if (Schema::hasColumn('customers', 'branch_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }

        Schema::table('customers', function (Blueprint $table) {
            $table->unique('phone');
            $table->unique('email');
        });
    }

    private function dropUniqueIfExists(string $table, string $indexName): void
    {
        $indexes = Schema::getIndexes($table);

        $exists = collect($indexes)->contains(
            fn ($index) => $index['name'] === $indexName
        );

        if ($exists) {
            Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
                $blueprint->dropUnique($indexName);
            });
        }
    }
};
