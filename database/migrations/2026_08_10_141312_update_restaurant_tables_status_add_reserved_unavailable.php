<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * New statuses:
     *   available   – Table is open and ready for customers
     *   occupied    – Table has an active order
     *   reserved    – Table has been booked via a table booking
     *   unavailable – Table is closed / not in service
     */
    public function up(): void
    {
        // Step 1: Widen to string so any existing value is kept during transition
        DB::statement("ALTER TABLE restaurant_tables MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'available'");

        // Step 2: Migrate old 'awaiting_payment' → 'unavailable'
        DB::table('restaurant_tables')
            ->where('status', 'awaiting_payment')
            ->update(['status' => 'unavailable']);

        // Step 3: Reset any other unknown values to 'available' to avoid enum truncation errors
        DB::table('restaurant_tables')
            ->whereNotIn('status', ['available', 'occupied', 'reserved', 'unavailable'])
            ->update(['status' => 'available']);

        // Step 4: Apply the strict ENUM now that all rows have valid values
        DB::statement("
            ALTER TABLE restaurant_tables
            MODIFY COLUMN status
            ENUM('available','occupied','reserved','unavailable')
            NOT NULL DEFAULT 'available'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('restaurant_tables')
            ->where('status', 'unavailable')
            ->update(['status' => 'awaiting_payment']);

        DB::table('restaurant_tables')
            ->where('status', 'reserved')
            ->update(['status' => 'available']);

        DB::statement("
            ALTER TABLE restaurant_tables
            MODIFY COLUMN status
            ENUM('available','occupied','awaiting_payment')
            NOT NULL DEFAULT 'available'
        ");
    }
};
