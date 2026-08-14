<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique(['branch_id', 'name']);
        });

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

        Schema::dropIfExists('table_sections');
    }
};
