<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_verification_notifications', function (Blueprint $table) {
            $table->foreign('booking_id')->references('id')->on('table_bookings')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();
            $table->foreign('verified_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('rejected_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('booking_verification_notifications', function (Blueprint $table) {
            $table->dropForeign(['rejected_by']);
            $table->dropForeign(['verified_by']);
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['booking_id']);
        });
    }
};
