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
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('food_rating');
            $table->unsignedTinyInteger('service_rating');
            $table->unsignedTinyInteger('speed_rating');
            $table->unsignedTinyInteger('cleanliness_rating');
            $table->unsignedTinyInteger('overall_rating');
            $table->text('comment')->nullable();
            $table->boolean('anonymous')->default(false);
            $table->timestamps();

            // Prevent duplicate reviews for the same order
            $table->unique('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
