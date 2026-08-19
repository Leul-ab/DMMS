<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_verification_notifications', function (Blueprint $table) {
            $table->string('payment_account')->nullable()->after('amount');
            $table->string('payment_attempt_reference')->nullable()->unique()->after('payment_account');
            $table->timestamp('copied_at')->nullable()->after('payment_attempt_reference');
            $table->timestamp('expired_at')->nullable()->after('copied_at');
        });
    }

    public function down(): void
    {
        Schema::table('booking_verification_notifications', function (Blueprint $table) {
            $table->dropUnique(['payment_attempt_reference']);
            $table->dropColumn(['payment_account', 'payment_attempt_reference', 'copied_at', 'expired_at']);
        });
    }
};
