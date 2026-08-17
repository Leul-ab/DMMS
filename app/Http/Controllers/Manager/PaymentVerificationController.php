<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\BookingVerificationNotification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentVerificationController extends Controller
{
    /**
     * Display all orders that require payment verification.
     */
    public function index(Request $request): Response
    {
        $query = Order::with([
            'table',
            'customer',
            'payment.cashier',
            'payment.verifier',
            'receipt',
            'orderItems.menuItem',
        ])->whereHas('payment');

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                   ->orWhereHas('customer', function ($cq) use ($search) {
                       $cq->where('phone', 'like', "%{$search}%")
                          ->orWhere('name', 'like', "%{$search}%");
                   })
                  ->orWhereHas('payment', function ($pq) use ($search) {
                      $pq->where('transaction_number', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by payment status (pending verification, verified, rejected)
        if ($status = $request->query('payment_status')) {
            if ($status !== 'all') {
                $query->where('payment_status', $status);
            }
        } else {
            $query->whereIn('payment_status', ['pending', 'paid', 'cancelled']);
        }

        // Filter by payment method
        if ($paymentMethod = $request->query('payment_method')) {
            if ($paymentMethod !== 'all') {
                $query->whereHas('payment', function ($pq) use ($paymentMethod) {
                    $pq->where('payment_method', $paymentMethod);
                });
            }
        }

        $orders = $query->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'pending' => Order::where('payment_status', 'pending')
                ->whereHas('payment')
                ->count(),
            'verified' => Order::where('payment_status', 'paid')
                ->whereHas('payment')
                ->count(),
            'rejected' => Order::where('payment_status', 'cancelled')
                ->whereHas('payment')
                ->count(),
        ];

        return Inertia::render('manager/payment-verification/index', [
            'orders' => $orders,
            'stats' => $stats,
            'filters' => $request->only([
                'search', 'payment_status', 'payment_method',
            ]),
        ]);
    }

    /**
     * Verify a payment by entering the transaction number.
     */
    public function verify(Request $request, Order $order): RedirectResponse
    {
        // Only pending payments can be verified.
        if ($order->payment_status !== 'pending') {
            return back()->with(
                'error',
                'This payment cannot be verified.'
            );
        }

        // Transaction number is required.
        $validated = $request->validate([
            'transaction_number' => ['required', 'string', 'max:255'],
        ]);

        try {
            DB::transaction(function () use ($validated, $order) {
                $payment = $order->payment;

                if (! $payment) {
                    throw new \Exception(
                        'No payment record found for this order.'
                    );
                }

                // Update payment record with verification details.
                $payment->update([
                    'transaction_number' => $validated['transaction_number'],
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                ]);

                // Update the order payment status and complete it.
                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'completed',
                ]);

                // Generate a receipt for the verified payment.
                $this->generateReceipt($order, $payment);

                // Release the table once payment is verified.
                $table = $order->table;

                if (
                    $table &&
                    $table->current_order_id === $order->id
                ) {
                    $table->update([
                        'status' => 'available',
                        'current_order_id' => null,
                    ]);
                }
            });
        } catch (\Exception $e) {
            return back()->with(
                'error',
                $e->getMessage()
            );
        }

        return back()->with(
            'success',
            'Payment verified successfully.'
        );
    }

    /**
     * Verify a booking extension payment.
     */
    public function verifyExtension(Request $request, Payment $payment): RedirectResponse
    {
        if ($payment->payment_type !== 'extension') {
            return back()->with(
                'error',
                'This payment is not a booking extension.'
            );
        }

        if ($payment->payment_status !== 'pending') {
            return back()->with(
                'error',
                'This payment cannot be verified.'
            );
        }

        $validated = $request->validate([
            'transaction_number' => ['required', 'string', 'max:255'],
        ]);

        try {
            DB::transaction(function () use ($validated, $payment) {
                $booking = $payment->booking;

                if (! $booking) {
                    throw new \Exception(
                        'No booking found for this extension payment.'
                    );
                }

                $payment->update([
                    'transaction_number' => $validated['transaction_number'],
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                ]);

                $extensionPeriodHours = $payment->extension_period_hours ?: config('booking_extension.extension_period_hours', 2);

                $booking->update([
                    'status' => 'active',
                    'expires_at' => now()->addHours($extensionPeriodHours),
                    'extension_payment_status' => 'paid',
                    'last_extended_at' => now(),
                    'extension_applied_at' => $booking->extension_applied_at ?: now(),
                ]);
            });
        } catch (\Exception $e) {
            return back()->with(
                'error',
                $e->getMessage()
            );
        }

        return back()->with(
            'success',
            'Booking extension payment verified successfully.'
        );
    }

    /**
     * Reject a booking extension payment.
     */
    public function rejectExtension(Request $request, Payment $payment): RedirectResponse
    {
        if ($payment->payment_type !== 'extension') {
            return back()->with(
                'error',
                'This payment is not a booking extension.'
            );
        }

        if ($payment->payment_status !== 'pending') {
            return back()->with(
                'error',
                'This payment cannot be rejected.'
            );
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($validated, $payment) {
            $payment->update([
                'payment_status' => 'cancelled',
                'notes' => $validated['reason']
                    ? ($payment->notes
                        ? $payment->notes."\nRejected: ".$validated['reason']
                        : 'Rejected: '.$validated['reason'])
                    : $payment->notes,
            ]);

            $booking = $payment->booking;

            if ($booking) {
                $booking->update([
                    'extension_payment_status' => 'rejected',
                ]);
            }
        });

        return back()->with(
            'success',
            'Booking extension payment rejected successfully.'
        );
    }

    /**
     * Display pending booking payment notifications.
     */
    public function bookingPayment(Request $request): Response
    {
        $query = BookingVerificationNotification::with([
            'booking.customer',
            'booking.tables.section',
            'customer',
        ])->where('notification_type', 'booking_payment');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhereHas('booking', function ($bq) use ($search) {
                        $bq->where('id', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($cq) use ($search) {
                                $cq->where('name', 'like', "%{$search}%")
                                    ->orWhere('phone', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        } else {
            $query->whereIn('status', ['pending', 'read']);
        }

        $notifications = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function ($notification) {
                return (object) [
                    'id' => $notification->id,
                    'booking_id' => $notification->booking_id,
                    'customer_name' => $notification->customer?->name ?? 'Unknown',
                    'customer_phone' => $notification->customer?->phone ?? 'N/A',
                    'tables' => $notification->booking->tables->map(fn ($t) => [
                        'id' => $t->id,
                        'table_number' => $t->table_number,
                        'section' => $t->section?->name ?? null,
                    ]),
                    'payment_method' => $notification->payment_method,
                    'amount' => $notification->amount,
                    'status' => $notification->status,
                    'notification_type' => $notification->notification_type,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                    'booking' => $notification->booking ? [
                        'id' => $notification->booking->id,
                        'status' => $notification->booking->status,
                        'payment_status' => $notification->booking->payment_status,
                        'booked_at' => $notification->booking->booked_at,
                        'expires_at' => $notification->booking->expires_at,
                    ] : null,
                ];
            });

        $stats = [
            'pending' => BookingVerificationNotification::where('status', 'pending')->count(),
            'read' => BookingVerificationNotification::where('status', 'read')->count(),
            'verified' => BookingVerificationNotification::where('status', 'verified')->count(),
            'rejected' => BookingVerificationNotification::where('status', 'rejected')->count(),
        ];

        return Inertia::render('manager/verification/booking-payment', [
            'notifications' => $notifications,
            'stats' => $stats,
            'filters' => $request->only([
                'search', 'status',
            ]),
        ]);
    }

    /**
     * Show a single booking payment notification.
     */
    public function showBookingPayment(BookingVerificationNotification $notification): Response
    {
        $notification->load([
            'booking.customer',
            'booking.tables.section',
            'customer',
        ]);

        return Inertia::render('manager/verification/booking-payment-show', [
            'notification' => (object) [
                'id' => $notification->id,
                'booking_id' => $notification->booking_id,
                'customer_name' => $notification->customer?->name ?? 'Unknown',
                'customer_phone' => $notification->customer?->phone ?? 'N/A',
                'tables' => $notification->booking->tables->map(fn ($t) => [
                    'id' => $t->id,
                    'table_number' => $t->table_number,
                    'section' => $t->section?->name ?? null,
                ]),
                'payment_method' => $notification->payment_method,
                'amount' => $notification->amount,
                'status' => $notification->status,
                'notification_type' => $notification->notification_type,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
                'booking' => $notification->booking ? [
                    'id' => $notification->booking->id,
                    'status' => $notification->booking->status,
                    'payment_status' => $notification->booking->payment_status,
                    'booked_at' => $notification->booking->booked_at,
                    'expires_at' => $notification->booking->expires_at,
                    'cancelled_at' => $notification->booking->cancelled_at,
                    'paid_at' => $notification->booking->paid_at,
                ] : null,
            ],
        ]);
    }

    /**
     * Approve a booking payment notification.
     */
    public function approveBookingPayment(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        if ($notification->status === 'verified') {
            return back()->with('error', 'This booking payment has already been approved.');
        }

        if ($notification->status === 'rejected') {
            return back()->with('error', 'This booking payment has already been rejected.');
        }

        $validated = $request->validate([
            'transaction_number' => ['nullable', 'string', 'max:255'],
        ]);

        $booking = $notification->booking;

        if (! $booking) {
            return back()->with('error', 'No booking found for this notification.');
        }

        if ($booking->payment_status === 'paid') {
            return back()->with('error', 'This booking has already been paid.');
        }

        if ($booking->status === 'cancelled') {
            return back()->with('error', 'This booking has been cancelled.');
        }

        try {
            DB::transaction(function () use ($validated, $notification, $booking) {
                $booking->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                    'status' => 'active',
                    'transaction_reference' => $validated['transaction_number'] ?? $booking->transaction_reference,
                ]);

                $tableIds = $booking->tables()->pluck('restaurant_tables.id');
                RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'reserved']);

                $notification->update([
                    'status' => 'verified',
                    'verified_at' => now(),
                    'verified_by' => auth()->id(),
                    'read_at' => $notification->read_at ?: now(),
                ]);

                Payment::create([
                    'branch_id' => $booking->branch_id,
                    'booking_id' => $booking->id,
                    'payment_method' => $notification->payment_method,
                    'payment_status' => 'paid',
                    'payment_type' => 'booking',
                    'amount' => $notification->amount,
                    'transaction_reference' => $validated['transaction_number'] ?? $notification->payment_method.'-'.now()->format('YmdHis'),
                    'transaction_number' => $validated['transaction_number'] ?? $notification->payment_method.'-'.now()->format('YmdHis'),
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                    'paid_at' => now(),
                ]);
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Booking payment approved successfully.');
    }

    /**
     * Reject a booking payment notification.
     */
    public function rejectBookingPayment(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        if ($notification->status === 'verified') {
            return back()->with('error', 'This booking payment has already been approved.');
        }

        if ($notification->status === 'rejected') {
            return back()->with('error', 'This booking payment has already been rejected.');
        }

        $validated = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = $notification->booking;

        if (! $booking) {
            return back()->with('error', 'No booking found for this notification.');
        }

        try {
            DB::transaction(function () use ($validated, $notification, $booking) {
                $booking->update([
                    'payment_status' => 'cancelled',
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

                $tableIds = $booking->tables()->pluck('restaurant_tables.id');
                RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

                $notification->update([
                    'status' => 'rejected',
                    'rejected_at' => now(),
                    'rejected_by' => auth()->id(),
                    'rejection_reason' => $validated['rejection_reason'],
                    'read_at' => $notification->read_at ?: now(),
                ]);
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Booking payment rejected.');
    }

    /**
     * Mark a booking payment notification as read.
     */
    public function markNotificationRead(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        if ($notification->status === 'verified' || $notification->status === 'rejected') {
            return back()->with('error', 'This notification cannot be marked as read.');
        }

        $notification->update([
            'status' => 'read',
            'read_at' => now(),
        ]);

        return back()->with('success', 'Notification marked as read.');
    }

    /**
     * Generate a unique receipt number in the format REC-YYYYMMDD-XXXX.
     */
    protected function generateReceiptNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "REC-{$date}-";

        $lastReceipt = Receipt::where('receipt_number', 'like', "{$prefix}%")
            ->orderByDesc('receipt_number')
            ->first();

        $nextNumber = $lastReceipt
            ? ((int) substr($lastReceipt->receipt_number, -4)) + 1
            : 1;

        return $prefix.str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create a receipt record for a verified payment.
     */
    protected function generateReceipt(Order $order, $payment): void
    {
        // Only generate once per order.
        if ($order->receipt) {
            return;
        }

        Receipt::create([
            'order_id' => $order->id,
            'receipt_number' => $this->generateReceiptNumber(),
            'transaction_number' => $payment->transaction_number,
            'payment_method' => $payment->payment_method,
            'amount' => $payment->amount ?? $order->total_amount,
            'subtotal' => $payment->subtotal ?? $order->total_amount,
            'tax' => $payment->tax ?? 0,
            'service_charge' => $payment->service_charge ?? 0,
            'discount' => $payment->discount ?? 0,
            'generated_at' => now(),
        ]);
    }

    /**
     * Reject a pending payment.
     */
    public function reject(Request $request, Order $order): RedirectResponse
    {
        // Only pending payments can be rejected.
        if ($order->payment_status !== 'pending') {
            return back()->with(
                'error',
                'This payment cannot be rejected.'
            );
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($validated, $order) {
            $payment = $order->payment;

            if ($payment) {
                $payment->update([
                    'payment_status' => 'cancelled',
                    'notes' => $validated['reason']
                        ? ($payment->notes
                            ? $payment->notes."\nRejected: ".$validated['reason']
                            : 'Rejected: '.$validated['reason'])
                        : $payment->notes,
                ]);
            }

            $order->update([
                'payment_status' => 'cancelled',
            ]);
        });

        return back()->with(
            'success',
            'Payment rejected successfully.'
        );
    }
}
