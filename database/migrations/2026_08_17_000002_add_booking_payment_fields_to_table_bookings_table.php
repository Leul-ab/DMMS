<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('table_bookings', function (Blueprint $table) {
            $table->decimal('booking_amount', 10, 2)->nullable()->after('payment_status');
            $table->decimal('extension_amount', 10, 2)->nullable()->after('booking_amount');
            $table->string('extension_payment_status')->nullable()->after('extension_amount');
            $table->timestamp('extension_paid_at')->nullable()->after('extension_payment_status');
            $table->timestamp('extension_expires_at')->nullable()->after('extension_paid_at');
            $table->timestamp('original_expires_at')->nullable()->after('extension_expires_at');

            // Add pending_payment to status enum if using MySQL strict mode
            // For SQLite/MySQL, we need to handle the enum constraint carefully
            $table->string('status', 50)->default('pending_payment')->change();
            $table->string('payment_status', 50)->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('table_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'booking_amount',
                'extension_amount',
                'extension_payment_status',
                'extension_paid_at',
                'extension_expires_at',
                'original_expires_at',
            ]);

            $table->string('status', 50)->default('active')->change();
            $table->string('payment_status', 50)->default('unpaid')->change();
        });
    }
};
