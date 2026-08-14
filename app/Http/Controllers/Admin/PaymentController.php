<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with([
            'table',
            'customer',
            'orderItems.menuItem',
            'payment.cashier',
        ]);

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                   ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('phone', 'like', "%{$search}%")
                         ->orWhere('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by payment status
        if ($paymentStatus = $request->query('payment_status')) {
            if ($paymentStatus === 'all') {
                // No filter
            } elseif ($paymentStatus === 'pending') {
                $query->where(function ($q) {
                    $q->where('payment_status', 'pending')
                      ->orWhereNull('payment_status');
                });
            } else {
                $query->where('payment_status', $paymentStatus);
            }
        }

        // Filter by order status
        if ($orderStatus = $request->query('order_status')) {
            if ($orderStatus !== 'all') {
                $query->where('status', $orderStatus);
            }
        }

        // Filter by table
        if ($tableId = $request->query('table_id')) {
            if ($tableId !== 'all') {
                $query->where('table_id', $tableId);
            }
        }

        // Filter by payment method
        if ($paymentMethod = $request->query('payment_method')) {
            if ($paymentMethod !== 'all') {
                $query->whereHas('payment', function ($pq) use ($paymentMethod) {
                    $pq->where('payment_method', $paymentMethod);
                });
            }
        }

        // Date range
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $orders = $query->latest()
            ->paginate(15)
            ->withQueryString();

        // Stats
        $stats = [
            'total_orders' => Order::count(),
            'pending_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'pending')
                  ->orWhereNull('payment_status');
            })->count(),
            'paid_orders' => Order::where('payment_status', 'paid')->count(),
            'unpaid_orders' => Order::where('payment_status', 'unpaid')->count(),
            'cancelled_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'cancelled')
                  ->orWhere('status', 'cancelled');
            })->count(),
            'today_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->whereDate('created_at', today())
                ->sum('total_amount'),
            'total_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->sum('total_amount'),
        ];

        $tables = RestaurantTable::orderBy('table_number')
            ->get(['id', 'table_number']);

        return Inertia::render('admin/payments/index', [
            'orders' => $orders,
            'stats' => $stats,
            'tables' => $tables,
            'filters' => $request->only([
                'search', 'payment_status', 'order_status',
                'table_id', 'payment_method', 'date_from', 'date_to',
            ]),
        ]);
    }

    public function orders(Request $request)
    {
        $query = Order::with([
            'table',
            'customer',
            'orderItems.menuItem',
            'payment.cashier',
        ]);

        // Filter by payment status
        if ($paymentStatus = $request->query('payment_status')) {
            if ($paymentStatus === 'pending') {
                $query->where(function ($q) {
                    $q->where('payment_status', 'pending')
                      ->orWhereNull('payment_status');
                });
            } else {
                $query->where('payment_status', $paymentStatus);
            }
        }

        // Filter by order status
        if ($orderStatus = $request->query('order_status')) {
            $query->where('status', $orderStatus);
        }

        // Date range (for today's revenue)
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $orders = $query->latest()->paginate(15)->withQueryString();

        $stats = [
            'total_orders' => Order::count(),
            'pending_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'pending')->orWhereNull('payment_status');
            })->count(),
            'paid_orders' => Order::where('payment_status', 'paid')->count(),
            'unpaid_orders' => Order::where('payment_status', 'unpaid')->count(),
            'cancelled_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'cancelled')->orWhere('status', 'cancelled');
            })->count(),
            'today_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->whereDate('created_at', today())
                ->sum('total_amount'),
            'total_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->sum('total_amount'),
        ];

        $tables = RestaurantTable::orderBy('table_number')->get(['id', 'table_number']);

        return Inertia::render('admin/payments/orders', [
            'orders' => $orders,
            'stats' => $stats,
            'tables' => $tables,
            'filters' => $request->only([
                'payment_status', 'order_status', 'date_from', 'date_to',
            ]),
        ]);
    }

    public function orderDetail(Order $order)
    {
        $order->load([
            'table',
            'customer',
            'orderItems.menuItem',
            'payment.cashier',
        ]);

        return Inertia::render('admin/payments/order-detail', [
            'order' => $order,
        ]);
    }

    public function todayRevenue()
    {
        $query = Order::with([
            'table',
            'customer',
            'orderItems.menuItem',
            'payment.cashier',
        ])->where('payment_status', 'paid')
          ->where('status', 'completed')
          ->whereDate('created_at', today());

        $orders = $query->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total_orders' => Order::count(),
            'pending_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'pending')
                  ->orWhereNull('payment_status');
            })->count(),
            'paid_orders' => Order::where('payment_status', 'paid')->count(),
            'unpaid_orders' => Order::where('payment_status', 'unpaid')->count(),
            'cancelled_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'cancelled')
                  ->orWhere('status', 'cancelled');
            })->count(),
            'today_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->whereDate('created_at', today())
                ->sum('total_amount'),
            'total_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->sum('total_amount'),
        ];

        $tables = RestaurantTable::orderBy('table_number')
            ->get(['id', 'table_number']);

        return Inertia::render('admin/payments/index', [
            'orders' => $orders,
            'stats' => $stats,
            'tables' => $tables,
            'filters' => [
                'payment_status' => 'paid',
                'order_status' => 'completed',
                'date_from' => today()->toDateString(),
                'date_to' => today()->toDateString(),
            ],
        ]);
    }

    public function revenue()
    {
        $query = Order::with([
            'table',
            'customer',
            'orderItems.menuItem',
            'payment.cashier',
        ])->where('payment_status', 'paid')
          ->where('status', 'completed');

        $orders = $query->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total_orders' => Order::count(),
            'pending_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'pending')
                  ->orWhereNull('payment_status');
            })->count(),
            'paid_orders' => Order::where('payment_status', 'paid')->count(),
            'unpaid_orders' => Order::where('payment_status', 'unpaid')->count(),
            'cancelled_payments' => Order::where(function ($q) {
                $q->where('payment_status', 'cancelled')
                  ->orWhere('status', 'cancelled');
            })->count(),
            'today_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->whereDate('created_at', today())
                ->sum('total_amount'),
            'total_revenue' => Order::where('payment_status', 'paid')
                ->where('status', 'completed')
                ->sum('total_amount'),
        ];

        $tables = RestaurantTable::orderBy('table_number')
            ->get(['id', 'table_number']);

        return Inertia::render('admin/payments/index', [
            'orders' => $orders,
            'stats' => $stats,
            'tables' => $tables,
            'filters' => [
                'payment_status' => 'paid',
                'order_status' => 'completed',
            ],
        ]);
    }

    public function show(Order $order)
    {
        $order->load([
            'table',
            'customer',
            'orderItems.menuItem',
            'payment.cashier',
        ]);

        return Inertia::render('admin/payments/show', [
            'order' => $order,
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'payment_status' => ['required', 'string', 'in:pending,paid,unpaid,refunded,cancelled'],
            'payment_method' => ['nullable', 'string', 'in:cash,telebirr,cbe_birr,bank_transfer,card'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($validated, $order, $request) {
            $payment = $order->payment;

            if (!$payment) {
                $payment = new Payment();
                $payment->order_id = $order->id;
                $payment->table_id = $order->table_id;
                $payment->subtotal = $order->total_amount;
                $payment->amount = $order->total_amount;
            }

            $payment->user_id = auth()->id();
            $payment->payment_status = $validated['payment_status'];

            if (!empty($validated['payment_method'])) {
                $payment->payment_method = $validated['payment_method'];
            }

            if (!empty($validated['transaction_reference'])) {
                $payment->transaction_reference = $validated['transaction_reference'];
            }

            if (!empty($validated['notes'])) {
                $payment->notes = $validated['notes'];
            }

            if ($validated['payment_status'] === 'paid' && !$payment->paid_at) {
                $payment->paid_at = now();
            }

            if ($validated['payment_status'] !== 'paid') {
                $payment->paid_at = null;
            }

            $payment->save();

            // Update order payment status
            $order->update([
                'payment_status' => $validated['payment_status'],
                'payment_submitted_at' => $validated['payment_status'] === 'paid' ? now() : null,
            ]);
        });

        return back();
    }

    public function printReceipt(Order $order)
    {
        $order->load([
            'table',
            'customer',
            'orderItems.menuItem',
            'payment.cashier',
        ]);

        return Inertia::render('admin/payments/receipt', [
            'order' => $order,
        ]);
    }
}
