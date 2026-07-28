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
            'status' => 'completed',
        ]);

        // Release the table when payment is verified
        $table = $order->table;
        if ($table && $table->current_order_id === $order->id) {
            $table->update([
                'status' => 'available',
                'current_order_id' => null,
            ]);
        }

        return back()->with(
            'success',
            'Payment verified successfully. Table released.'
        );
    }
}
