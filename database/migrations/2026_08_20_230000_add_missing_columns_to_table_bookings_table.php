<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('table_bookings', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('payment_status')->default('cbe_birr');
            $table->string('transaction_reference')->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('table_bookings', function (Blueprint $table) {
            $table->dropColumn(['transaction_reference', 'payment_method']);
        });
    }
};
