<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->foreignId('table_section_id')->nullable()->constrained()->nullOnDelete()->after('branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->dropForeign(['table_section_id']);
            $table->dropColumn('table_section_id');
        });
    }
};
