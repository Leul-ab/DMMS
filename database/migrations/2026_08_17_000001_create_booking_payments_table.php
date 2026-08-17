<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('table_bookings')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->enum('payment_method', ['cbe_birr', 'telebirr'])->nullable();
            $table->enum('payment_type', ['original', 'extension'])->default('original');
            $table->decimal('amount', 10, 2)->nullable();
            $table->decimal('original_amount', 10, 2)->nullable();
            $table->decimal('extension_amount', 10, 2)->nullable();
            $table->string('transaction_reference')->nullable();
            $table->string('transaction_number')->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'rejected', 'expired'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'payment_type', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_payments');
    }
};
