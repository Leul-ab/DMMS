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
        // Update the orders status enum to include 'received' properly
        DB::statement("
            ALTER TABLE orders
            MODIFY status ENUM(
                'pending',
                'received',
                'preparing',
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
