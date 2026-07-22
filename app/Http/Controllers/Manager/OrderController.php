<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
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

    public function updateStatus(
        Request $request,
        Order $order
    ) {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:pending,confirmed,preparing,ready,served,completed,cancelled',
            ],
        ]);

        $order->update([
            'status' => $validated['status'],
        ]);

        return back()->with(
            'success',
            'Order status updated successfully.'
        );
    }
}