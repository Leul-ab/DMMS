<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('discount_percentage');
        });

        Schema::create('discount_menu_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discount_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['discount_id', 'menu_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_menu_item');

        Schema::table('menu_items', function (Blueprint $table) {
            $table->decimal('discount_percentage', 5, 2)->nullable()->default(0)->after('featured');
        });
    }
};
