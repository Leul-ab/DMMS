<?php

namespace Tests\Unit;

use App\Http\Controllers\DashboardController;
use App\Models\TableBooking;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Tests\TestCase;

class TableBookingRelationshipTest extends TestCase
{
    public function test_table_booking_exposes_tables_relationship(): void
    {
        $booking = new TableBooking;

        $this->assertTrue(method_exists($booking, 'tables'));
        $this->assertInstanceOf(BelongsToMany::class, $booking->tables());
    }

    public function test_dashboard_controller_uses_the_existing_tables_relationship(): void
    {
        $controller = new DashboardController;
        $source = file_get_contents((new \ReflectionClass($controller))->getFileName());

        $this->assertStringContainsString("TableBooking::with('tables')", $source);
    }
}
