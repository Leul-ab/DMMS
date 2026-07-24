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
        Schema::create('table_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('status')->default('active'); // active, completed, cancelled
            $table->timestamp('booked_at')->nullable();
            $table->timestamp('expires_at')->nullable(); // 10 minutes from booking
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('booking_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('table_bookings')->cascadeOnDelete();
            $table->foreignId('table_id')->constrained('restaurant_tables')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_tables');
        Schema::dropIfExists('table_bookings');
    }
};
