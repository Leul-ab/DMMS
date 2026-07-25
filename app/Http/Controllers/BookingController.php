<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Show the booking page with available tables.
     */
    public function index()
    {
        $availableTables = RestaurantTable::where('status', 'available')
            ->orderBy('table_number')
            ->get(['id', 'table_number', 'status']);

        return inertia('booking/index', [
            'availableTables' => $availableTables,
        ]);
    }

    /**
     * Verify customer and return customer data.
     */
    public function verifyCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_code' => ['required', 'string', 'max:20'],
        ]);

        $code = trim($validated['customer_code']);

        $customer = Customer::where('customer_code', $code)->first();

        if (!$customer) {
            return response()->json([
                'found' => false,
                'message' => 'Customer code not found. Please register or check your code.',
            ]);
        }

        return response()->json([
            'found' => true,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'customer_code' => $customer->customer_code,
                'is_member' => $customer->is_member,
            ],
        ]);
    }

    /**
     * Store a new booking.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'table_ids' => ['required', 'array', 'min:1'],
            'table_ids.*' => ['exists:restaurant_tables,id'],
        ]);

        // Check if any of the selected tables are already booked
        $bookedTables = TableBooking::whereIn('status', ['active'])
            ->whereHas('tables', function ($query) use ($validated) {
                $query->whereIn('restaurant_tables.id', $validated['table_ids']);
            })
            ->exists();

        if ($bookedTables) {
            return back()->withErrors(['tables' => 'Some of the selected tables are already booked.']);
        }

        // Check if any tables are already assigned to waiters or occupied
        $unavailableTables = RestaurantTable::whereIn('id', $validated['table_ids'])
            ->whereIn('status', ['occupied', 'awaiting_payment'])
            ->exists();

        if ($unavailableTables) {
            return back()->withErrors(['tables' => 'Some of the selected tables are currently occupied.']);
        }

        // Start booking session - store in session
        $expiresAt = Carbon::now()->addMinutes(10);

        $booking = TableBooking::create([
            'customer_id' => $validated['customer_id'],
            'status' => 'active',
            'booked_at' => Carbon::now(),
            'expires_at' => $expiresAt,
        ]);

        // Attach tables
        $booking->tables()->attach($validated['table_ids']);

        // Update table statuses to 'booked'
        RestaurantTable::whereIn('id', $validated['table_ids'])->update(['status' => 'booked']);

        // Store booking ID in session
        session(['active_booking_id' => $booking->id]);

        return redirect()->route('booking.show', $booking->id);
    }

    /**
     * Show a specific booking.
     */
    public function show(TableBooking $booking)
    {
        $booking->load(['customer', 'tables']);

        return inertia('booking/show', [
            'booking' => $booking,
        ]);
    }

    /**
     * Cancel a booking.
     */
    public function cancel(TableBooking $booking): RedirectResponse
    {
        if ($booking->status !== 'active') {
            return back()->withErrors(['booking' => 'This booking is already ' . $booking->status . '.']);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
        ]);

        // Release tables
        $tableIds = $booking->tables()->pluck('restaurant_tables.id');
        RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

        session()->forget('active_booking_id');

        return redirect()->route('menu.index')->with('success', 'Booking cancelled successfully.');
    }

    /**
     * Get the customer's active booking (API endpoint for the booking sidebar).
     */
    public function getActiveBooking(): JsonResponse
    {
        $bookingId = session('active_booking_id');

        if (!$bookingId) {
            return response()->json(['booking' => null]);
        }

        $booking = TableBooking::with(['customer', 'tables'])
            ->where('id', $bookingId)
            ->where('status', 'active')
            ->first();

        if (!$booking) {
            session()->forget('active_booking_id');
            return response()->json(['booking' => null]);
        }

        // Check if expired
        if (Carbon::now()->greaterThan($booking->expires_at)) {
            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => Carbon::now(),
            ]);

            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

            session()->forget('active_booking_id');

            return response()->json(['booking' => null, 'expired' => true]);
        }

        $timeRemaining = Carbon::now()->diffInSeconds($booking->expires_at, false);

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'customer_name' => $booking->customer->name,
                'tables' => $booking->tables->map(function ($table) {
                    return [
                        'id' => $table->id,
                        'table_number' => $table->table_number,
                    ];
                }),
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'time_remaining_seconds' => max(0, $timeRemaining),
            ],
        ]);
    }

    /**
     * Get all bookings with details (API endpoint for the all-bookings sidebar).
     */
    public function getAllBookings(): JsonResponse
    {
        $bookings = TableBooking::with(['customer', 'tables'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($booking) {
                $timeRemaining = null;
                $isExpired = false;

                if ($booking->status === 'active' && $booking->expires_at) {
                    $timeRemaining = max(0, Carbon::now()->diffInSeconds($booking->expires_at, false));
                    if (Carbon::now()->greaterThan($booking->expires_at)) {
                        $isExpired = true;
                    }
                }

                return [
                    'id' => $booking->id,
                    'customer_name' => $booking->customer?->name ?? 'Unknown',
                    'customer_phone' => $booking->customer?->phone ?? 'N/A',
                    'tables' => $booking->tables->map(function ($table) {
                        return [
                            'id' => $table->id,
                            'table_number' => $table->table_number,
                        ];
                    }),
                    'status' => $booking->status,
                    'booked_at' => $booking->booked_at,
                    'expires_at' => $booking->expires_at,
                    'cancelled_at' => $booking->cancelled_at,
                    'time_remaining_seconds' => $timeRemaining,
                    'is_expired' => $isExpired,
                ];
            });

        return response()->json([
            'bookings' => $bookings,
            'total' => $bookings->count(),
            'active_count' => $bookings->where('status', 'active')->where('is_expired', false)->count(),
        ]);
    }

    /**
     * Get details for a single booking (API endpoint).
     */
    public function getBookingDetails(TableBooking $booking): JsonResponse
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
                'tables' => $booking->tables->map(fn($t) => ['id' => $t->id, 'table_number' => $t->table_number]),
                'status' => $booking->status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'is_expired' => $isExpired,
            ],
        ]);
    }
}
