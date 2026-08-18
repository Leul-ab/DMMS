<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use App\Support\PhoneHelper;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    /**
     * Show the booking page with available tables.
     */
    public function index(Request $request)
    {
        return $this->renderBooking($request, 'booking/index');
    }

    /**
     * Show the customer booking page with available tables.
     */
    public function customerBooking(Request $request)
    {
        return $this->renderBooking($request, 'customer-booking/index');
    }

    /**
     * Render the booking page with available tables.
     */
    protected function renderBooking(Request $request, string $view)
    {
        $requestedBranchId = $request->query('branch');
        if ($requestedBranchId && Branch::whereKey((int) $requestedBranchId)->exists()) {
            Branch::setCurrent((int) $requestedBranchId);
        }

        $availableTables = RestaurantTable::where('status', 'available')
            ->orderBy('table_number')
            ->get(['id', 'table_number', 'status']);

        $sections = \App\Models\TableSection::ordered()
            ->get(['id', 'name', 'description', 'sort_order']);

        $sections = $sections->map(function ($section) {
            $availableInSection = RestaurantTable::where('table_section_id', $section->id)
                ->where('status', 'available')
                ->orderBy('table_number')
                ->get(['id', 'table_number', 'status']);

            return [
                'id' => $section->id,
                'name' => $section->name,
                'description' => $section->description,
                'sort_order' => $section->sort_order,
                'available_tables' => $availableInSection,
            ];
        })->values()->all();

        // Get the scanned table from session if available
        $scannedTable = null;
        if (session()->has('scanned_table_id')) {
            $scannedTable = RestaurantTable::find(session('scanned_table_id'));
        } elseif (session()->has('customer_menu_table_id')) {
            $scannedTable = RestaurantTable::find(session('customer_menu_table_id'));
        }

        if ($scannedTable) {
            Branch::setCurrent($scannedTable->branch_id);
        }

        return inertia($view, [
            'availableTables' => $availableTables,
            'sections' => $sections,
            'scannedTable' => $scannedTable,
        ]);
    }

    /**
     * Verify customer and return customer data.
     */
    public function verifyCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:' . PhoneHelper::PATTERN],
        ], [
            'phone.regex' => 'The phone number must be in the format +251 followed by 9 digits starting with 9 (e.g. +251912345678).',
        ]);

        $phone = PhoneHelper::normalize($validated['phone']);

        $customer = Customer::where('phone', $phone)->first();

        if (!$customer) {
            return response()->json([
                'found' => false,
                'message' => 'Customer not found. Please register or check your phone number.',
            ]);
        }

        return response()->json([
            'found' => true,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
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
            'source' => ['nullable', 'string', 'in:booking,customer-booking'],
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
        $expiresAt = Carbon::now()->addMinutes(5);

        $booking = TableBooking::create([
            'customer_id' => $validated['customer_id'],
            'status' => 'active',
            'payment_status' => 'unpaid',
            'booked_at' => Carbon::now(),
            'expires_at' => $expiresAt,
        ]);

        // Attach tables
        $booking->tables()->attach($validated['table_ids']);

        // Update table statuses to 'reserved'
        RestaurantTable::whereIn('id', $validated['table_ids'])->update(['status' => 'reserved']);

        // Store booking ID in session
        session(['active_booking_id' => $booking->id]);

        // Build booking data for the success dialog
        $customer = $booking->customer;
        $tablesList = $booking->tables->pluck('table_number')->toArray();

        return redirect()
            ->route($validated['source'] === 'customer-booking' ? 'menu.customer' : 'menu.index')
            ->with([
                'booking_success' => true,
                'booking_data' => [
                    'id' => $booking->id,
                    'customer_name' => $customer?->name ?? 'Unknown',
                    'customer_phone' => $customer?->phone ?? '',
                    'tables' => $tablesList,
                    'booked_at' => $booking->booked_at,
                    'expires_at' => $booking->expires_at,
                    'expires_in_seconds' => $booking->expires_at ? Carbon::now()->diffInSeconds($booking->expires_at, false) : 300,
                    'payment_status' => $booking->payment_status,
                ],
                'customer_phone' => $customer?->phone ?? '',
            ]);
    }

    /**
     * Show a specific booking.
     */
    public function show(TableBooking $booking)
    {
        return redirect()->route('menu.index');
    }

    /**
     * Cancel a booking.
     */
    public function cancel(TableBooking $booking): RedirectResponse
    {
        if ($booking->status !== 'active') {
            return back()->withErrors(['booking' => 'This booking is already ' . $booking->status . '.']);
        }

        if ($booking->expires_at && Carbon::now()->greaterThan($booking->expires_at)) {
            return back()->withErrors(['booking' => 'The 5-minute cancellation window has expired.']);
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
     * Get the customer's active booking (API endpoint for the booking sidebar / My Booking).
     */
    public function getActiveBooking(): JsonResponse
    {
        $bookingId = session('active_booking_id');

        if (!$bookingId) {
            return response()->json(['booking' => null]);
        }

        $booking = TableBooking::with(['customer', 'tables'])
            ->where('id', $bookingId)
            ->first();

        if (!$booking) {
            session()->forget('active_booking_id');
            return response()->json(['booking' => null]);
        }

        $isExpired = false;
        if ($booking->status === 'active' && $booking->expires_at && Carbon::now()->greaterThan($booking->expires_at)) {
            $booking->update([
                'status' => 'expired',
                'payment_status' => 'expired',
                'cancelled_at' => Carbon::now(),
            ]);

            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

            session()->forget('active_booking_id');

            return response()->json(['booking' => null, 'expired' => true]);
        }

        $timeRemaining = null;
        if ($booking->status === 'active' && $booking->expires_at) {
            $timeRemaining = max(0, Carbon::now()->diffInSeconds($booking->expires_at, false));
        }

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'customer_name' => $booking->customer?->name ?? 'Unknown',
                'customer_phone' => $booking->customer?->phone ?? 'N/A',
                'customer_id' => $booking->customer?->id,
                'tables' => $booking->tables->map(function ($table) {
                    return [
                        'id' => $table->id,
                        'table_number' => $table->table_number,
                    ];
                }),
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'time_remaining_seconds' => $timeRemaining,
                'is_expired' => $isExpired,
            ],
        ]);
    }

    /**
     * Process payment for a booking within the 5-minute window.
     */
    public function pay(TableBooking $booking): JsonResponse
    {
        if ($booking->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This booking is already ' . $booking->status . '.',
            ], 422);
        }

        if ($booking->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This booking has already been paid.',
            ], 422);
        }

        if ($booking->expires_at && Carbon::now()->greaterThan($booking->expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'The 5-minute payment window has expired.',
            ], 422);
        }

        $booking->update([
            'payment_status' => 'paid',
            'paid_at' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment confirmed successfully.',
            'booking' => [
                'id' => $booking->id,
                'payment_status' => $booking->payment_status,
                'paid_at' => $booking->paid_at,
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
                    'payment_status' => $booking->payment_status,
                    'booked_at' => $booking->booked_at,
                    'expires_at' => $booking->expires_at,
                    'cancelled_at' => $booking->cancelled_at,
                    'paid_at' => $booking->paid_at,
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
     * Look up booking by customer phone (API endpoint for My Booking).
     */
    public function lookupByCustomerCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:' . PhoneHelper::PATTERN],
        ], [
            'phone.regex' => 'The phone number must be in the format +251 followed by 9 digits starting with 9 (e.g. +251912345678).',
        ]);

        $phone = PhoneHelper::normalize($validated['phone']);

        $customer = Customer::where('phone', $phone)->first();

        if (!$customer) {
            return response()->json([
                'found' => false,
                'message' => 'No customer found with that phone number.',
            ]);
        }

        $booking = TableBooking::with(['customer', 'tables'])
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$booking) {
            return response()->json([
                'found' => false,
                'message' => 'No booking found for this customer.',
            ]);
        }

        $isExpired = false;
        if ($booking->status === 'active' && $booking->expires_at) {
            $isExpired = Carbon::now()->greaterThan($booking->expires_at);
        }

        $timeRemaining = null;
        if ($booking->status === 'active' && $booking->expires_at && !$isExpired) {
            $timeRemaining = max(0, Carbon::now()->diffInSeconds($booking->expires_at, false));
        }

        return response()->json([
            'found' => true,
            'booking' => [
                'id' => $booking->id,
                'customer_name' => $booking->customer?->name ?? 'Unknown',
                'customer_phone' => $booking->customer?->phone ?? 'N/A',
                'customer_id' => $booking->customer?->id,
                'tables' => $booking->tables->map(fn($t) => ['id' => $t->id, 'table_number' => $t->table_number]),
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'time_remaining_seconds' => $timeRemaining,
                'is_expired' => $isExpired,
            ],
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
                'payment_status' => $booking->payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'is_expired' => $isExpired,
            ],
        ]);
    }
}
