<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->string('slug')->unique()->after('name');
            $table->unsignedSmallInteger('preparation_time')->nullable()->after('image')->comment('Preparation time in minutes');
            $table->boolean('featured')->default(false)->after('is_available');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['slug', 'preparation_time', 'featured']);
        });
    }
};
