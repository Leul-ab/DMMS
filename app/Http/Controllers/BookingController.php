<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\BookingPayment;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $phone = trim($validated['phone']);

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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'table_ids' => ['required', 'array', 'min:1'],
            'table_ids.*' => ['exists:restaurant_tables,id'],
            'source' => ['nullable', 'string', 'in:booking,customer-booking'],
            'booking_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $bookedTables = TableBooking::whereIn('status', ['pending_payment', 'active'])
            ->whereHas('tables', function ($query) use ($validated) {
                $query->whereIn('restaurant_tables.id', $validated['table_ids']);
            })
            ->exists();

        if ($bookedTables) {
            return back()->withErrors(['tables' => 'Some of the selected tables are already booked.']);
        }

        $unavailableTables = RestaurantTable::whereIn('id', $validated['table_ids'])
            ->whereIn('status', ['occupied', 'awaiting_payment'])
            ->exists();

        if ($unavailableTables) {
            return back()->withErrors(['tables' => 'Some of the selected tables are currently occupied.']);
        }

        $paymentExpiresAt = Carbon::now()->addMinutes(self::PAYMENT_WINDOW_MINUTES);

        $bookingAmount = $validated['booking_amount'] ?? $this->calculateDefaultBookingAmount($validated['table_ids']);

        DB::transaction(function () use ($validated, $paymentExpiresAt, $bookingAmount) {
            $booking = TableBooking::create([
                'customer_id' => $validated['customer_id'],
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'booking_amount' => $bookingAmount,
                'booked_at' => Carbon::now(),
                'expires_at' => $paymentExpiresAt,
            ]);

            $booking->tables()->attach($validated['table_ids']);

            RestaurantTable::whereIn('id', $validated['table_ids'])->update(['status' => 'reserved']);

            session(['active_booking_id' => $booking->id]);
        });

        $customer = Customer::find($validated['customer_id']);
        $selectedTableIds = $validated['table_ids'];
        $tablesList = RestaurantTable::whereIn('id', $selectedTableIds)->pluck('table_number')->toArray();
        $menuRoute = $validated['source'] === 'customer-booking' ? 'menu.customer' : 'menu.index';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'booking' => [
                    'id' => session('active_booking_id'),
                    'customer_name' => $customer?->name ?? 'Unknown',
                    'customer_phone' => $customer?->phone ?? '',
                    'tables' => $tablesList,
                    'booked_at' => now()->toIso8601String(),
                    'expires_at' => $paymentExpiresAt->toIso8601String(),
                    'expires_in_seconds' => self::PAYMENT_WINDOW_MINUTES * 60,
                    'payment_status' => 'pending',
                    'booking_amount' => $bookingAmount,
                    'status' => 'pending_payment',
                ],
                'redirect_url' => route($menuRoute),
            ]);
        }

        return redirect()
            ->route($menuRoute)
            ->with([
                'booking_success' => true,
                'booking_data' => [
                    'id' => session('active_booking_id'),
                    'customer_name' => $customer?->name ?? 'Unknown',
                    'customer_phone' => $customer?->phone ?? '',
                    'tables' => $tablesList,
                    'booked_at' => now()->toIso8601String(),
                    'expires_at' => $paymentExpiresAt->toIso8601String(),
                    'expires_in_seconds' => self::PAYMENT_WINDOW_MINUTES * 60,
                    'payment_status' => 'pending',
                    'booking_amount' => $bookingAmount,
                    'status' => 'pending_payment',
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
        if (!$booking->canBeCancelled()) {
            return back()->withErrors(['booking' => 'This booking cannot be cancelled.']);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
        ]);

        $tableIds = $booking->tables()->pluck('restaurant_tables.id');
        RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

        session()->forget('active_booking_id');

        return redirect()->route('menu.index')->with('success', 'Booking cancelled successfully.');
    }

    public function getActiveBooking(): JsonResponse
    {
        $bookingId = session('active_booking_id');

        if (!$bookingId) {
            return response()->json(['booking' => null]);
        }

        $booking = TableBooking::with(['customer', 'tables', 'payments'])
            ->where('id', $bookingId)
            ->first();

        if (!$booking) {
            session()->forget('active_booking_id');
            return response()->json(['booking' => null]);
        }

        $this->checkAndExpireBooking($booking);

        if ($booking->wasChanged() && $booking->status === 'expired') {
            session()->forget('active_booking_id');
            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

            return response()->json(['booking' => null, 'expired' => true]);
        }

        $timeRemaining = $booking->time_remaining;

        $pendingOriginalPayment = $booking->payments()
            ->where('payment_type', 'original')
            ->where('payment_status', 'pending')
            ->first();

        $pendingExtensionPayment = $booking->payments()
            ->where('payment_type', 'extension')
            ->where('payment_status', 'pending')
            ->first();

        $isNearExpiry = false;
        if ($booking->isActive() && $timeRemaining !== null && $timeRemaining <= 300) {
            $isNearExpiry = true;
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
                'extension_payment_status' => $booking->extension_payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'original_expires_at' => $booking->original_expires_at,
                'extension_expires_at' => $booking->extension_expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'time_remaining_seconds' => $timeRemaining,
                'is_expired' => false,
                'is_near_expiry' => $isNearExpiry,
                'booking_amount' => $booking->booking_amount,
                'extension_amount' => $booking->extension_amount,
                'extension_fee' => $booking->extension_fee,
                'pending_payment' => $pendingOriginalPayment ? [
                    'id' => $pendingOriginalPayment->id,
                    'payment_method' => $pendingOriginalPayment->payment_method,
                    'amount' => $pendingOriginalPayment->amount,
                    'payment_status' => $pendingOriginalPayment->payment_status,
                ] : null,
                'pending_extension_payment' => $pendingExtensionPayment ? [
                    'id' => $pendingExtensionPayment->id,
                    'payment_method' => $pendingExtensionPayment->payment_method,
                    'amount' => $pendingExtensionPayment->amount,
                    'payment_status' => $pendingExtensionPayment->payment_status,
                ] : null,
                'can_extend' => $booking->canBeExtended(),
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
                ];
            });

        return response()->json([
            'bookings' => $bookings,
            'total' => $bookings->count(),
            'active_count' => $bookings->where('status', 'active')->where('is_expired', false)->count(),
        ]);
    }

    public function lookupByCustomerCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $phone = trim($validated['phone']);

        $customer = Customer::where('phone', $phone)->first();

        if (!$customer) {
            return response()->json([
                'found' => false,
                'message' => 'No customer found with that phone number.',
            ]);
        }

        $booking = TableBooking::with(['customer', 'tables', 'payments'])
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$booking) {
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

        $timeRemaining = $booking->time_remaining;
        $isExpired = $booking->status === 'expired';

        $pendingOriginalPayment = $booking->payments()
            ->where('payment_type', 'original')
            ->where('payment_status', 'pending')
            ->first();

        $pendingExtensionPayment = $booking->payments()
            ->where('payment_type', 'extension')
            ->where('payment_status', 'pending')
            ->first();

        $isNearExpiry = false;
        if ($booking->isActive() && $timeRemaining !== null && $timeRemaining <= 300) {
            $isNearExpiry = true;
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
                'extension_payment_status' => $booking->extension_payment_status,
                'booked_at' => $booking->booked_at,
                'expires_at' => $booking->expires_at,
                'original_expires_at' => $booking->original_expires_at,
                'extension_expires_at' => $booking->extension_expires_at,
                'cancelled_at' => $booking->cancelled_at,
                'paid_at' => $booking->paid_at,
                'time_remaining_seconds' => $timeRemaining,
                'is_expired' => $isExpired,
                'is_near_expiry' => $isNearExpiry,
                'booking_amount' => $booking->booking_amount,
                'extension_amount' => $booking->extension_amount,
                'extension_fee' => $booking->extension_fee,
                'pending_payment' => $pendingOriginalPayment ? [
                    'id' => $pendingOriginalPayment->id,
                    'payment_method' => $pendingOriginalPayment->payment_method,
                    'amount' => $pendingOriginalPayment->amount,
                    'payment_status' => $pendingOriginalPayment->payment_status,
                ] : null,
                'pending_extension_payment' => $pendingExtensionPayment ? [
                    'id' => $pendingExtensionPayment->id,
                    'payment_method' => $pendingExtensionPayment->payment_method,
                    'amount' => $pendingExtensionPayment->amount,
                    'payment_status' => $pendingExtensionPayment->payment_status,
                ] : null,
                'can_extend' => $booking->canBeExtended(),
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
                'tables' => $booking->tables->map(fn($t) => ['id' => $t->id, 'table_number' => $t->table_number]),
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
                'payments' => $booking->payments->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'payment_method' => $p->payment_method,
                        'payment_type' => $p->payment_type,
                        'amount' => $p->amount,
                        'payment_status' => $p->payment_status,
                        'paid_at' => $p->paid_at,
                        'verified_at' => $p->verified_at,
                        'transaction_number' => $p->transaction_number,
                    ];
                }),
            ],
        ]);
    }

    private function calculateDefaultBookingAmount(array $tableIds): float
    {
        $tableCount = count($tableIds);
        $defaultFeePerTable = (float) config('booking.default_fee_per_table', 500);

        return $tableCount * $defaultFeePerTable;
    }

    private function checkAndExpireBooking(TableBooking $booking): void
    {
        if ($booking->status === 'pending_payment' && $booking->expires_at && Carbon::now()->greaterThan($booking->expires_at)) {
            $booking->update([
                'status' => 'expired',
                'payment_status' => 'expired',
                'cancelled_at' => Carbon::now(),
            ]);

            $payment = $booking->payments()
                ->where('payment_type', 'original')
                ->where('payment_status', 'pending')
                ->first();

            if ($payment) {
                $payment->update(['payment_status' => 'expired']);
            }

            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);
        }

        if ($booking->status === 'active' && $booking->expires_at && Carbon::now()->greaterThan($booking->expires_at)) {
            $booking->update([
                'status' => 'expired',
                'cancelled_at' => Carbon::now(),
            ]);

            $tableIds = $booking->tables()->pluck('restaurant_tables.id');
            RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);
        }
    }

    private function getPaymentBlockedMessage(TableBooking $booking): string
    {
        if ($booking->status === 'expired' || $booking->payment_status === 'expired') {
            return 'Payment time expired. This booking has been cancelled.';
        }

        if ($booking->payment_status === 'paid') {
            return 'This booking has already been paid.';
        }

        if ($booking->status !== 'pending_payment') {
            return 'This booking is not in a payable state.';
        }

        if ($booking->isPaymentExpired()) {
            return 'The 5-minute payment window has expired.';
        }

        return 'Payment is not available for this booking.';
    }
}
