<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First convert old statuses to the new workflow.
        DB::statement("
            UPDATE orders
            SET status = 'pending'
            WHERE status IN ('confirmed', 'preparing', 'ready', 'served')
        ");

        // Update the status enum.
        DB::statement("
            ALTER TABLE orders
            MODIFY status ENUM(
                'pending',
                'received',
                'completed',
                'cancelled'
            ) NOT NULL DEFAULT 'pending'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert new statuses back to the old workflow.
        DB::statement("
            UPDATE orders
            SET status = 'pending'
            WHERE status IN ('received', 'completed', 'cancelled')
        ");

        // Restore the previous status enum.
        DB::statement("
            ALTER TABLE orders
            MODIFY status ENUM(
                'pending',
                'confirmed',
                'preparing',
                'ready',
                'served',
                'completed',
                'cancelled'
            ) NOT NULL DEFAULT 'pending'
        ");
    }
};