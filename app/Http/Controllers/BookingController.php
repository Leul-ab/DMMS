<?php

namespace App\Http\Controllers;

use App\Models\BookingVerificationNotification;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use App\Models\TableSection;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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

        $sections = TableSection::ordered()
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
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $phone = trim($validated['phone']);

        $customer = Customer::where('phone', $phone)->first();

        if (! $customer) {
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
            return back()->withErrors(['booking' => 'This booking is already '.$booking->status.'.']);
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

        if (! $bookingId) {
            return response()->json(['booking' => null]);
        }

        $booking = TableBooking::with(['customer', 'tables'])
            ->where('id', $bookingId)
            ->first();

        if (! $booking) {
            session()->forget('active_booking_id');

            return response()->json(['booking' => null]);
        }

        $isExpired = false;
        if ($booking->status === 'active' && $booking->expires_at && Carbon::now()->greaterThan($booking->expires_at)) {
            $booking->update([
                'status' => 'expired',
            ]);

            $isExpired = true;
        }

        $timeRemaining = null;
        if ($booking->status === 'active' && $booking->expires_at && ! $isExpired) {
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
                'extension_payment_status' => $booking->extension_payment_status,
                'booking_amount' => $booking->booking_amount,
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
                'message' => 'This booking is already '.$booking->status.'.',
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
            'expires_at' => Carbon::now()->addHours(2),
            'booking_amount' => $booking->booking_amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment confirmed successfully.',
            'booking' => [
                'id' => $booking->id,
                'payment_status' => $booking->payment_status,
                'paid_at' => $booking->paid_at,
                'expires_at' => $booking->expires_at,
            ],
        ]);
    }

    /**
     * Submit payment verification with transaction number and payment method.
     */
    public function submitPaymentVerification(Request $request, TableBooking $booking): JsonResponse
    {
        if ($booking->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This booking is already '.$booking->status.'.',
            ], 422);
        }

        if ($booking->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This booking has already been paid.',
            ], 422);
        }

        $expiresAt = $booking->created_at->copy()->addMinutes(5);
        if (Carbon::now()->greaterThanOrEqualTo($expiresAt)) {
            return response()->json([
                'success' => false,
                'message' => 'The 5-minute payment window has expired.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:telebirr,cbe_birr'],
            'transaction_number' => ['required', 'string', 'max:255'],
        ]);

        Payment::create([
            'branch_id' => $booking->branch_id,
            'booking_id' => $booking->id,
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'pending',
            'payment_type' => 'booking',
            'amount' => $booking->booking_amount,
            'transaction_reference' => $validated['transaction_number'],
            'transaction_number' => $validated['transaction_number'],
        ]);

        $booking->update([
            'payment_method' => $validated['payment_method'],
            'transaction_reference' => $validated['transaction_number'],
            'payment_status' => 'pending',
            'expires_at' => Carbon::now()->addHours(2),
            'booking_amount' => $booking->booking_amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment submitted for verification.',
            'booking' => [
                'id' => $booking->id,
                'payment_status' => $booking->payment_status,
                'payment_method' => $booking->payment_method,
                'transaction_reference' => $booking->transaction_reference,
                'paid_at' => $booking->paid_at,
                'expires_at' => $booking->expires_at,
            ],
        ]);
    }

    /**
     * Request a booking time extension.
     */
    public function requestExtension(Request $request, TableBooking $booking): JsonResponse
    {
        if ($booking->status !== 'active' && $booking->status !== 'expired') {
            return response()->json([
                'success' => false,
                'message' => 'This booking cannot be extended.',
            ], 422);
        }

        if ($booking->payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'The original booking payment is not paid.',
            ], 422);
        }

        if ($booking->extension_payment_status === 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'An extension payment is already pending.',
            ], 422);
        }

        if ($booking->extension_payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This booking has already been extended.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:telebirr,cbe_birr'],
        ]);

        $extensionPeriodHours = config('booking_extension.extension_period_hours', 2);
        $extensionFeePercentage = config('booking_extension.extension_fee_percentage', 50);

        $originalAmount = (float) ($booking->booking_amount ?: 0);
        $extensionAmount = $originalAmount * ($extensionFeePercentage / 100);

        if ($extensionAmount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to calculate extension amount. Please contact support.',
            ], 422);
        }

        $payment = Payment::create([
            'branch_id' => $booking->branch_id,
            'order_id' => null,
            'user_id' => auth()->id(),
            'table_id' => $booking->tables->first()?->id,
            'booking_id' => $booking->id,
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'pending',
            'payment_type' => 'extension',
            'amount' => $extensionAmount,
            'transaction_reference' => 'EXT-'.strtoupper(uniqid()),
            'extension_period_hours' => $extensionPeriodHours,
        ]);

        $booking->update([
            'extension_payment_status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Extension payment request created.',
            'payment' => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'payment_method' => $payment->payment_method,
                'payment_status' => $payment->payment_status,
                'payment_type' => $payment->payment_type,
                'extension_period_hours' => $extensionPeriodHours,
            ],
            'booking' => [
                'id' => $booking->id,
                'extension_payment_status' => $booking->extension_payment_status,
            ],
        ]);
    }

    /**
     * Apply a booking extension after payment verification.
     */
    public function extendBooking(Request $request, TableBooking $booking): JsonResponse
    {
        if ($booking->extension_payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Extension payment has not been verified.',
            ], 422);
        }

        $extensionPeriodHours = config('booking_extension.extension_period_hours', 2);

        $booking->update([
            'status' => 'active',
            'expires_at' => Carbon::now()->addHours($extensionPeriodHours),
            'last_extended_at' => Carbon::now(),
            'extension_applied_at' => $booking->extension_applied_at ?: Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking extended successfully.',
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'expires_at' => $booking->expires_at,
                'extension_payment_status' => $booking->extension_payment_status,
            ],
        ]);
    }

    /**
     * Check extension payment status.
     */
    public function checkExtensionStatus(TableBooking $booking): JsonResponse
    {
        $extensionPayment = $booking->extensionPayment()->first();

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'expires_at' => $booking->expires_at,
                'extension_payment_status' => $booking->extension_payment_status,
                'extension_applied_at' => $booking->extension_applied_at,
                'last_extended_at' => $booking->last_extended_at,
            ],
            'extension_payment' => $extensionPayment ? [
                'id' => $extensionPayment->id,
                'amount' => $extensionPayment->amount,
                'payment_method' => $extensionPayment->payment_method,
                'payment_status' => $extensionPayment->payment_status,
                'verified_at' => $extensionPayment->verified_at,
            ] : null,
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
                    'extension_payment_status' => $booking->extension_payment_status,
                    'booking_amount' => $booking->booking_amount,
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
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $phone = trim($validated['phone']);

        $customer = Customer::where('phone', $phone)->first();

        if (! $customer) {
            return response()->json([
                'found' => false,
                'message' => 'No customer found with that phone number.',
            ]);
        }

        $booking = TableBooking::with(['customer', 'tables'])
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $booking) {
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
        if ($booking->status === 'active' && $booking->expires_at && ! $isExpired) {
            $timeRemaining = max(0, Carbon::now()->diffInSeconds($booking->expires_at, false));
        }

        return response()->json([
            'found' => true,
            'booking' => [
                'id' => $booking->id,
                'customer_name' => $booking->customer?->name ?? 'Unknown',
                'customer_phone' => $booking->customer?->phone ?? 'N/A',
                'customer_id' => $booking->customer?->id,
                'tables' => $booking->tables->map(fn ($t) => ['id' => $t->id, 'table_number' => $t->table_number]),
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'time_remaining_seconds' => $timeRemaining,
                'is_expired' => $isExpired,
                'extension_payment_status' => $booking->extension_payment_status,
                'booking_amount' => $booking->booking_amount,
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
                'tables' => $booking->tables->map(fn ($t) => ['id' => $t->id, 'table_number' => $t->table_number]),
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'is_expired' => $isExpired,
                'extension_payment_status' => $booking->extension_payment_status,
                'booking_amount' => $booking->booking_amount,
            ],
        ]);
    }

    /**
     * Copy account number and create booking payment notification.
     */
    public function copyAccount(Request $request, TableBooking $booking): JsonResponse
    {
        if ($booking->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This booking is no longer active.',
            ], 422);
        }

        if ($booking->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This booking has already been paid.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:telebirr,cbe_birr'],
        ]);

        $existingNotification = BookingVerificationNotification::where('booking_id', $booking->id)
            ->whereIn('status', ['pending', 'read'])
            ->exists();

        if ($existingNotification) {
            return response()->json([
                'success' => true,
                'message' => 'Notification already created for this booking.',
                'already_exists' => true,
            ]);
        }

        $notification = BookingVerificationNotification::create([
            'branch_id' => $booking->branch_id,
            'booking_id' => $booking->id,
            'customer_id' => $booking->customer_id,
            'payment_method' => $validated['payment_method'],
            'amount' => $booking->booking_amount,
            'notification_type' => 'booking_payment',
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking payment notification created.',
            'notification' => [
                'id' => $notification->id,
                'booking_id' => $notification->booking_id,
                'payment_method' => $notification->payment_method,
                'amount' => $notification->amount,
                'status' => $notification->status,
                'created_at' => $notification->created_at,
            ],
        ]);
    }
}
