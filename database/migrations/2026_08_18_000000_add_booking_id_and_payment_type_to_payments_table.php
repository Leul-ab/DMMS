<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('booking_id')
                ->nullable()
                ->after('order_id')
                ->constrained('table_bookings')
                ->nullOnDelete();
            $table->string('payment_type')
                ->default('order')
                ->after('booking_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
            $table->dropColumn(['booking_id', 'payment_type']);
        });
    }
};
