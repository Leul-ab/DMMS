<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        DB::transaction(function () use (
            $order,
            $validated
        ) {
            // Update the order status
            $order->update([
                'status' => $validated['status'],
            ]);

            // Get the table connected to this order
            $table = $order->table;

            // If the order is completed,
            // make the table available
            if ($validated['status'] === 'completed') {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }

            // If the order is cancelled,
            // make the table available
            elseif ($validated['status'] === 'cancelled') {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }

            // For active orders,
            // keep the table occupied
            else {
                $table->update([
                    'status' => 'occupied',
                    'current_order_id' => $order->id,
                ]);
            }
        });

        return back()->with(
            'success',
            'Order status and table status updated successfully.'
        );
    }
}
