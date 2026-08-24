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
        // Step 1: Migrate old 'awaiting_payment' → 'unavailable'
        DB::table('restaurant_tables')
            ->where('status', 'awaiting_payment')
            ->update(['status' => 'unavailable']);

        // Step 2: Reset any other unknown values to 'available'
        DB::table('restaurant_tables')
            ->whereNotIn('status', ['available', 'occupied', 'reserved', 'unavailable'])
            ->update(['status' => 'available']);

        // Step 3: Apply column type and constraint
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE restaurant_tables ALTER COLUMN status TYPE VARCHAR(32)");
            DB::statement("ALTER TABLE restaurant_tables ALTER COLUMN status SET DEFAULT 'available'");
            DB::statement("ALTER TABLE restaurant_tables ALTER COLUMN status SET NOT NULL");
            DB::statement("ALTER TABLE restaurant_tables ADD CONSTRAINT restaurant_tables_status_check CHECK (status IN ('available','occupied','reserved','unavailable'))");
        } else {
            DB::statement("ALTER TABLE restaurant_tables MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'available'");
            DB::statement("ALTER TABLE restaurant_tables MODIFY COLUMN status ENUM('available','occupied','reserved','unavailable') NOT NULL DEFAULT 'available'");
        }
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

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE restaurant_tables DROP CONSTRAINT IF EXISTS restaurant_tables_status_check");
            DB::statement("ALTER TABLE restaurant_tables ALTER COLUMN status TYPE VARCHAR(32)");
            DB::statement("ALTER TABLE restaurant_tables ALTER COLUMN status SET DEFAULT 'available'");
            DB::statement("ALTER TABLE restaurant_tables ADD CONSTRAINT restaurant_tables_status_check CHECK (status IN ('available','occupied','awaiting_payment'))");
        } else {
            DB::statement("ALTER TABLE restaurant_tables MODIFY COLUMN status ENUM('available','occupied','awaiting_payment') NOT NULL DEFAULT 'available'");
        }
    }
};
