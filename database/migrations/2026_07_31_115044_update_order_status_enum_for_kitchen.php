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
        // Update the status enum to include 'preparing' and 'ready' for the kitchen dashboard.
        DB::statement("
            ALTER TABLE orders
            MODIFY status ENUM(
                'pending',
                'received',
                'preparing',
                'ready',
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
        // Convert new statuses back to the previous workflow.
        DB::statement("
            UPDATE orders
            SET status = 'pending'
            WHERE status IN ('preparing', 'ready')
        ");

        // Restore the previous status enum.
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
};
