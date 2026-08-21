<?php

namespace App\Http\Controllers;

use App\Models\BookingVerificationNotification;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\BookingPayment;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    private const PAYMENT_WINDOW_MINUTES = 5;
    private const BOOKING_DURATION_HOURS = 2;
    private const EXTENSION_DURATION_HOURS = 2;
    private const EXTENSION_PERCENTAGE = 0.5;

    public function index(Request $request)
    {
        return $this->renderBooking($request, 'booking/index');
    }

    public function customerBooking(Request $request)
    {
        return $this->renderBooking($request, 'customer-booking/index');
    }

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

    public function verifyCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:' . PhoneHelper::PATTERN],
        ], [
            'phone.regex' => 'The phone number must be in the format +251 followed by 9 digits starting with 9 (e.g. +251912345678).',
        ]);

        $phone = PhoneHelper::normalize($validated['phone']);

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
            'booking_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Check if any of the selected tables are already booked
        $bookedTables = TableBooking::whereIn('status', ['active'])
            ->whereHas('tables', function ($query) use ($validated) {
                $query->whereIn('restaurant_tables.id', $validated['table_ids']);
            })
            ->exists();

        if ($bookedTables) {
            return response()->json([
                'success' => false,
                'message' => 'Some of the selected tables are already booked.',
            ], 422);
        }

        $unavailableTables = RestaurantTable::whereIn('id', $validated['table_ids'])
            ->whereIn('status', ['occupied', 'awaiting_payment'])
            ->exists();

        if ($unavailableTables) {
            return response()->json([
                'success' => false,
                'message' => 'Some of the selected tables are currently occupied.',
            ], 422);
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

    public function submitPayment(Request $request, TableBooking $booking): JsonResponse
    {
        if (!$booking->canBePaid()) {
            return response()->json([
                'success' => false,
                'message' => $this->getPaymentBlockedMessage($booking),
            ], 422);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:cbe_birr,telebirr'],
            'transaction_number' => ['required', 'string', 'max:100'],
            'transaction_reference' => ['nullable', 'string', 'max:100'],
            'payer_name' => ['required', 'string', 'max:255'],
            'payer_phone' => ['required', 'string', 'max:20'],
        ]);

        $existingPendingPayment = $booking->payments()
            ->where('payment_type', 'original')
            ->where('payment_status', 'pending')
            ->first();

        if ($existingPendingPayment) {
            return response()->json([
                'success' => false,
                'message' => 'A payment is already pending for this booking.',
            ], 422);
        }

        $payment = BookingPayment::create([
            'branch_id' => $booking->branch_id,
            'booking_id' => $booking->id,
            'payment_method' => $validated['payment_method'],
            'payment_type' => 'original',
            'amount' => $booking->booking_amount,
            'transaction_number' => $validated['transaction_number'],
            'transaction_reference' => $validated['transaction_reference'],
            'payment_status' => 'pending',
            'notes' => 'Payer: ' . $validated['payer_name'] . ' (' . $validated['payer_phone'] . ')',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment submitted successfully. Please wait for verification.',
            'payment' => [
                'id' => $payment->id,
                'payment_method' => $payment->payment_method,
                'amount' => $payment->amount,
                'payment_status' => $payment->payment_status,
                'created_at' => $payment->created_at,
            ],
        ]);
    }

    public function verifyPayment(Request $request, BookingPayment $payment): JsonResponse
    {
        $payment->load('booking');

        if ($payment->payment_type !== 'original') {
            return response()->json([
                'success' => false,
                'message' => 'Only original booking payments can be verified here.',
            ], 422);
        }

        if ($payment->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'This payment has already been verified.',
            ], 422);
        }

        if ($payment->isFailed()) {
            return response()->json([
                'success' => false,
                'message' => 'This payment has already been ' . $payment->payment_status . '.',
            ], 422);
        }

        $booking = $payment->booking;

        if ($booking->isExpired() || $booking->isPaymentExpired()) {
            $booking->update([
                'status' => 'expired',
                'payment_status' => 'expired',
                'cancelled_at' => Carbon::now(),
            ]);
            $payment->update(['payment_status' => 'expired']);

            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

            return response()->json([
                'success' => false,
                'message' => 'The booking has expired. Payment cannot be verified.',
            ], 422);
        }

        $user = $request->user();

        DB::transaction(function () use ($payment, $user) {
            $payment->update([
                'payment_status' => 'paid',
                'paid_at' => Carbon::now(),
                'verified_by' => $user?->id,
                'verified_at' => Carbon::now(),
            ]);

            $booking = $payment->booking;
            $bookingExpiresAt = Carbon::now()->addHours(self::BOOKING_DURATION_HOURS);

            $booking->update([
                'status' => 'active',
                'payment_status' => 'paid',
                'paid_at' => Carbon::now(),
                'expires_at' => $bookingExpiresAt,
                'original_expires_at' => $bookingExpiresAt,
            ]);

            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'occupied']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully. Booking is now active.',
            'booking' => [
                'id' => $payment->booking_id,
                'status' => 'active',
                'payment_status' => 'paid',
                'expires_at' => $payment->booking->expires_at,
                'paid_at' => $payment->paid_at,
            ],
        ]);
    }

    public function rejectPayment(Request $request, BookingPayment $payment): JsonResponse
    {
        $payment->load('booking');

        if ($payment->payment_type !== 'original') {
            return response()->json([
                'success' => false,
                'message' => 'Only original booking payments can be rejected here.',
            ], 422);
        }

        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending payments can be rejected.',
            ], 422);
        }

        $payment->update([
            'payment_status' => 'rejected',
            'notes' => ($payment->notes ?? '') . ' | Rejected by: ' . ($request->user()?->name ?? 'system'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment rejected. Customer can retry.',
        ]);
    }

    public function requestExtension(TableBooking $booking): JsonResponse
    {
        if (!$booking->canBeExtended()) {
            return response()->json([
                'success' => false,
                'message' => 'This booking cannot be extended at this time.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'extension_fee' => $booking->extension_fee,
            'original_amount' => $booking->booking_amount,
            'extension_percentage' => self::EXTENSION_PERCENTAGE * 100,
        ]);
    }

    public function submitExtensionPayment(Request $request, TableBooking $booking): JsonResponse
    {
        if (!$booking->canBeExtended()) {
            return response()->json([
                'success' => false,
                'message' => 'This booking cannot be extended at this time.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:cbe_birr,telebirr'],
            'transaction_number' => ['required', 'string', 'max:100'],
            'transaction_reference' => ['nullable', 'string', 'max:100'],
            'payer_name' => ['required', 'string', 'max:255'],
            'payer_phone' => ['required', 'string', 'max:20'],
        ]);

        $existingPendingExtension = $booking->payments()
            ->where('payment_type', 'extension')
            ->where('payment_status', 'pending')
            ->first();

        if ($existingPendingExtension) {
            return response()->json([
                'success' => false,
                'message' => 'An extension payment is already pending.',
            ], 422);
        }

        $extensionFee = $booking->extension_fee;

        $payment = BookingPayment::create([
            'branch_id' => $booking->branch_id,
            'booking_id' => $booking->id,
            'payment_method' => $validated['payment_method'],
            'payment_type' => 'extension',
            'amount' => $extensionFee,
            'original_amount' => $booking->booking_amount,
            'extension_amount' => $extensionFee,
            'transaction_number' => $validated['transaction_number'],
            'transaction_reference' => $validated['transaction_reference'],
            'payment_status' => 'pending',
            'notes' => 'Extension payer: ' . $validated['payer_name'] . ' (' . $validated['payer_phone'] . ')',
        ]);

        $booking->update([
            'extension_amount' => $extensionFee,
            'extension_payment_status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Extension payment submitted. Please wait for verification.',
            'payment' => [
                'id' => $payment->id,
                'payment_method' => $payment->payment_method,
                'amount' => $payment->amount,
                'payment_status' => $payment->payment_status,
                'created_at' => $payment->created_at,
            ],
        ]);
    }

    public function verifyExtensionPayment(Request $request, BookingPayment $payment): JsonResponse
    {
        $payment->load('booking');

        if ($payment->payment_type !== 'extension') {
            return response()->json([
                'success' => false,
                'message' => 'Only extension payments can be verified here.',
            ], 422);
        }

        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'This payment has already been processed.',
            ], 422);
        }

        DB::transaction(function () use ($payment) {
            $payment->update([
                'payment_status' => 'paid',
                'paid_at' => Carbon::now(),
                'verified_by' => $request->user()?->id,
                'verified_at' => Carbon::now(),
            ]);

            $booking = $payment->booking;
            $newExpiresAt = Carbon::now()->addHours(self::EXTENSION_DURATION_HOURS);

            $booking->update([
                'status' => 'extended',
                'payment_status' => 'paid',
                'extension_payment_status' => 'paid',
                'extension_paid_at' => Carbon::now(),
                'extension_expires_at' => $newExpiresAt,
                'expires_at' => $newExpiresAt,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Extension verified successfully. Booking has been extended.',
            'booking' => [
                'id' => $payment->booking_id,
                'status' => 'extended',
                'payment_status' => 'paid',
                'extension_payment_status' => 'paid',
                'expires_at' => $payment->booking->expires_at,
                'extension_expires_at' => $payment->booking->extension_expires_at,
            ],
        ]);
    }

    public function rejectExtensionPayment(Request $request, BookingPayment $payment): JsonResponse
    {
        $payment->load('booking');

        if ($payment->payment_type !== 'extension') {
            return response()->json([
                'success' => false,
                'message' => 'Only extension payments can be rejected here.',
            ], 422);
        }

        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending payments can be rejected.',
            ], 422);
        }

        $payment->update([
            'payment_status' => 'rejected',
            'notes' => ($payment->notes ?? '') . ' | Rejected by: ' . ($request->user()?->name ?? 'system'),
        ]);

        $payment->booking->update([
            'extension_payment_status' => 'rejected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Extension payment rejected.',
        ]);
    }

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

        $tableIds = $booking->tables()->pluck('restaurant_tables.id');
        RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

        // Cancel any pending booking payment verification notifications
        BookingVerificationNotification::where('booking_id', $booking->id)
            ->whereIn('status', ['pending', 'read'])
            ->update([
                'status' => 'cancelled',
                'expired_at' => now(),
            ]);

        session()->forget('active_booking_id');

        return redirect()->route('menu.index')->with('success', 'Booking cancelled successfully.');
    }

    public function getActiveBooking(): JsonResponse
    {
        $bookingId = session('active_booking_id');

        if (! $bookingId) {
            return response()->json(['booking' => null]);
        }

        $booking = TableBooking::with(['customer', 'tables', 'payments'])
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

        $latestNotification = BookingVerificationNotification::where('booking_id', $booking->id)
            ->latest()
            ->first();

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
                'extension_payment_status' => $booking->extension_payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'original_expires_at' => $booking->original_expires_at,
                'extension_expires_at' => $booking->extension_expires_at,
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
                    $isExpired = Carbon::now()->greaterThan($booking->expires_at);
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
                    'extension_payment_status' => $booking->extension_payment_status,
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
     * Process payment for a booking within the 5-minute window.
     */
    public function pay(Request $request, TableBooking $booking): JsonResponse
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

        $customerPhone = session('customer_phone');
        if (! $customerPhone || ! $booking->customer || $booking->customer->phone !== $customerPhone) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: This booking does not belong to the current customer.',
            ], 403);
        }

        $paymentMethod = $request->input('payment_method', $booking->payment_method ?: 'cbe_birr');

        try {
            DB::transaction(function () use ($booking, $paymentMethod) {
                $booking->update([
                    'payment_status' => 'pending_verification',
                    'expires_at' => Carbon::now()->addHours(2),
                    'payment_method' => $paymentMethod,
                ]);

                $this->createBookingVerificationNotification($booking, $paymentMethod);
            });
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Payment verification creation failed', [
                'booking_id' => $booking->id,
                'customer_id' => $booking->customer_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to create the payment notification. Please refresh the booking and try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment verification request submitted. Please wait for manager approval.',
            'booking' => [
                'id' => $booking->id,
                'payment_status' => 'pending_verification',
                'paid_at' => $booking->paid_at,
                'expires_at' => $booking->expires_at,
                'status' => $booking->status,
            ],
        ]);
    }

    /**
     * Submit payment verification with screenshot and payment method.
     */
    public function submitPaymentVerification(Request $request, TableBooking $booking): JsonResponse
    {
        if ($booking->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This booking is already '.$booking->status.'.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:telebirr,cbe_birr'],
            'payment_screenshot' => ['required', 'image', 'max:5120'],
        ]);

        $screenshotPath = null;
        if ($request->hasFile('payment_screenshot')) {
            $screenshotPath = $request->file('payment_screenshot')
                ->store('payment_screenshots', 'public');
        }

        if ($booking->payment_status !== 'pending_verification' && $booking->payment_status !== 'paid') {
            $booking->update([
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending_verification',
                'expires_at' => now()->addHours(2),
            ]);
        }

        $notification = BookingVerificationNotification::where('booking_id', $booking->id)
            ->whereIn('status', ['pending', 'read'])
            ->latest()
            ->first();

        if ($notification) {
            $notification->update([
                'payment_screenshot' => $screenshotPath,
                'payment_method' => $validated['payment_method'],
                'status' => 'pending',
            ]);
        } else {
            $this->createBookingVerificationNotification($booking, $validated['payment_method'], $screenshotPath);
        }

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

    public function lookupByCustomerCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:' . PhoneHelper::PATTERN],
        ], [
            'phone.regex' => 'The phone number must be in the format +251 followed by 9 digits starting with 9 (e.g. +251912345678).',
        ]);

        $phone = PhoneHelper::normalize($validated['phone']);

        $customer = Customer::where('phone', $phone)->first();

        if (! $customer) {
            return response()->json([
                'found' => false,
                'message' => 'No customer found with that phone number.',
            ]);
        }

        session(['customer_phone' => $customer->phone]);

        $booking = TableBooking::with(['customer', 'tables', 'payments'])
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $booking) {
            return response()->json([
                'found' => false,
                'message' => 'No booking found for this customer.',
            ]);
        }

        $this->checkAndExpireBooking($booking);

        if ($booking->status === 'expired') {
            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);
        }

        $timeRemaining = null;
        if ($booking->status === 'active' && $booking->expires_at && !$isExpired) {
            $timeRemaining = max(0, Carbon::now()->diffInSeconds($booking->expires_at, false));
        }

        // Load any rejection notification message for the customer
        $latestNotification = BookingVerificationNotification::where('booking_id', $booking->id)
            ->latest()
            ->first();

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
                'extension_payment_status' => $booking->extension_payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'original_expires_at' => $booking->original_expires_at,
                'extension_expires_at' => $booking->extension_expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'time_remaining_seconds' => $timeRemaining,
                'is_expired' => $isExpired,
            ],
        ]);
    }

    public function getBookingDetails(TableBooking $booking): JsonResponse
    {
        $booking->load(['customer', 'tables', 'payments']);

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
                'paid_at' => $booking->paid_at,
                'booking_amount' => $booking->booking_amount,
                'extension_amount' => $booking->extension_amount,
                'is_expired' => $isExpired,
            ],
        ]);
    }
}
