<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropColumn(['food_rating', 'service_rating', 'speed_rating', 'cleanliness_rating']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->unsignedTinyInteger('food_rating')->nullable()->after('customer_id');
            $table->unsignedTinyInteger('service_rating')->nullable()->after('food_rating');
            $table->unsignedTinyInteger('speed_rating')->nullable()->after('service_rating');
            $table->unsignedTinyInteger('cleanliness_rating')->nullable()->after('speed_rating');
        });
    }
};
