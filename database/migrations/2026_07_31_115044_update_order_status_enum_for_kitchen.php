<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert old statuses to the new workflow.
        DB::table('orders')
            ->whereIn('status', ['confirmed', 'preparing', 'ready', 'served'])
            ->update([
                'status' => 'pending',
            ]);

        // Change the column to a string.
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('orders')
            ->whereIn('status', ['received', 'completed', 'cancelled'])
            ->update([
                'status' => 'pending',
            ]);

        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }
};
