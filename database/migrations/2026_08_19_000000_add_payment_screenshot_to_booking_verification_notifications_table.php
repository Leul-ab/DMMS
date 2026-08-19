<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_verification_notifications', function (Blueprint $table) {
            $table->string('payment_screenshot')->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('booking_verification_notifications', function (Blueprint $table) {
            $table->dropColumn(['payment_screenshot']);
        });
    }
};
