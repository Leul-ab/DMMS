<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Receipt;
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
                      $cq->where('customer_code', 'like', "%{$search}%")
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
