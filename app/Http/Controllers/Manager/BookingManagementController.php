<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BookingManagementController extends Controller
{
    /**
     * Display the booking management page.
     */
    public function index(Request $request)
    {
        $query = TableBooking::with(['customer', 'tables']);

        // Search filter
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('tables', function ($tq) use ($search) {
                        $tq->where('table_number', 'like', "%{$search}%");
                    });
            });
        }

        // Status filter
        if ($status = $request->get('status')) {
            if ($status === 'expired') {
                $query->where('status', 'active')
                    ->where('expires_at', '<', Carbon::now());
            } elseif ($status === 'active') {
                $query->where('status', 'active')
                    ->where('expires_at', '>', Carbon::now());
            } else {
                $query->where('status', $status);
            }
        }

        $bookings = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($booking) {
                $isExpired = false;
                if ($booking->status === 'active' && $booking->expires_at) {
                    $isExpired = Carbon::now()->greaterThan($booking->expires_at);
                }

                return (object) [
                    'id' => $booking->id,
                    'customer_name' => $booking->customer?->name ?? 'Unknown',
                    'customer_phone' => $booking->customer?->phone ?? 'N/A',
                    'customer_email' => $booking->customer?->email ?? null,
                    'tables' => $booking->tables->map(fn ($t) => [
                        'id' => $t->id,
                        'table_number' => $t->table_number,
                    ]),
                    'status' => $booking->status,
                    'booked_at' => $booking->booked_at,
                    'expires_at' => $booking->expires_at,
                    'cancelled_at' => $booking->cancelled_at,
                    'is_expired' => $isExpired,
                    'time_remaining_seconds' => ! $isExpired && $booking->status === 'active' && $booking->expires_at
                        ? max(0, Carbon::now()->diffInSeconds($booking->expires_at, false))
                        : null,
                ];
            });

        // Dashboard statistics
        $totalBookings = TableBooking::count();
        $activeBookings = TableBooking::where('status', 'active')
            ->where('expires_at', '>', Carbon::now())
            ->count();
        $expiredBookings = TableBooking::where('status', 'active')
            ->where('expires_at', '<', Carbon::now())
            ->count();
        $availableTables = RestaurantTable::where('status', 'available')->count();
        $reservedTables = RestaurantTable::where('status', 'reserved')->count();

        return inertia('admin/bookings/index', [
            'bookings' => $bookings,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total_bookings' => $totalBookings,
                'active_bookings' => $activeBookings,
                'expired_bookings' => $expiredBookings,
                'available_tables' => $availableTables,
                'reserved_tables' => $reservedTables,
            ],
        ]);
    }

    /**
     * Cancel a booking.
     */
    public function cancel(TableBooking $booking): RedirectResponse
    {
        if ($booking->status !== 'active') {
            return back()->withErrors(['booking' => 'This booking is already '.$booking->status.'.']);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
        ]);

        // Release tables
        $tableIds = $booking->tables()->pluck('restaurant_tables.id');
        RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

        return back()->with('success', 'Booking cancelled successfully.');
    }

    /**
     * Mark a booking as completed.
     */
    public function complete(TableBooking $booking): RedirectResponse
    {
        if ($booking->status !== 'active') {
            return back()->withErrors(['booking' => 'This booking cannot be completed.']);
        }

        $booking->update([
            'status' => 'completed',
        ]);

        // Release tables
        $tableIds = $booking->tables()->pluck('restaurant_tables.id');
        RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

        return back()->with('success', 'Booking marked as completed.');
    }

    /**
     * Delete an expired booking.
     */
    public function destroy(TableBooking $booking): RedirectResponse
    {
        if ($booking->status === 'active' && $booking->expires_at > Carbon::now()) {
            return back()->withErrors(['booking' => 'Cannot delete an active booking.']);
        }

        // Release tables if still reserved
        $tableIds = $booking->tables()->pluck('restaurant_tables.id');
        RestaurantTable::whereIn('id', $tableIds)->where('status', 'reserved')->update(['status' => 'available']);

        $booking->tables()->detach();
        $booking->delete();

        return back()->with('success', 'Booking deleted successfully.');
    }

    /**
     * Get booking details for the view modal (API).
     */
    public function show(TableBooking $booking): JsonResponse
    {
        $booking->load(['customer', 'tables']);

        $isExpired = false;
        if ($booking->status === 'active' && $booking->expires_at) {
            $isExpired = Carbon::now()->greaterThan($booking->expires_at);
        }

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'customer_name' => $booking->customer?->name ?? 'Unknown',
                'customer_phone' => $booking->customer?->phone ?? 'N/A',
                'customer_email' => $booking->customer?->email ?? 'N/A',
                'tables' => $booking->tables->map(fn ($t) => ['id' => $t->id, 'table_number' => $t->table_number]),
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'extension_payment_status' => $booking->extension_payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'original_expires_at' => $booking->original_expires_at,
                'extension_expires_at' => $booking->extension_expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'is_expired' => $isExpired,
                'booking_amount' => $booking->booking_amount,
                'extension_amount' => $booking->extension_amount,
                'extension_fee' => $booking->extension_fee,
            ],
        ]);
    }
}
