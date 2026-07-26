<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display all customer orders.
     */
    public function index()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->latest()
            ->get();

        return Inertia::render(
            'manager/orders/index',
            [
                'orders' => $orders,
            ]
        );
    }

    /**
     * Verify customer's payment.
     */
    public function verifyPayment(Order $order)
    {
        // Only pending payments can be verified.
        if ($order->payment_status !== 'pending') {
            return back()->with(
                'error',
                'This payment cannot be verified.'
            );
        }

        $order->update([
            'payment_status' => 'paid',
        ]);

        return back()->with(
            'success',
            'Payment verified successfully.'
        );
    }
}