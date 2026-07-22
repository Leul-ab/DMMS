<?php

namespace App\Http\Controllers\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class KitchenOrderController extends Controller
{
    /**
     * Show incoming and pending orders.
     *
     * New orders start with the "pending" status.
     * The kitchen staff can receive them first.
     */
    public function newOrders()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->whereIn('status', [
                'pending',
                'received',
            ])
            ->latest()
            ->get();

        return Inertia::render(
            'kitchen/orders/new',
            [
                'orders' => $orders,
            ]
        );
    }

    /**
     * Show completed and cancelled orders.
     */
    public function history()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->whereIn('status', [
                'completed',
                'cancelled',
            ])
            ->latest()
            ->get();

        return Inertia::render(
            'kitchen/orders/history',
            [
                'orders' => $orders,
            ]
        );
    }

    /**
     * Update the kitchen order status.
     *
     * Workflow:
     *
     * pending -> received
     * received -> completed
     * pending -> cancelled
     * received -> cancelled
     */
    public function updateStatus(
        Request $request,
        Order $order
    ) {
        $validated = $request->validate([
    'status' => [
        'required',
        'in:pending,received,completed,cancelled',
    ],
]);

        DB::transaction(function () use (
            $order,
            $validated
        ) {
            $order->update([
                'status' => $validated['status'],
            ]);

            $table = $order->table()->first();

            if (! $table) {
                return;
            }

            /*
             * When the order is completed or cancelled,
             * the table becomes available again.
             */
            if (
                $validated['status'] === 'completed' ||
                $validated['status'] === 'cancelled'
            ) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);

                return;
            }

            /*
             * Received orders keep the table occupied.
             */
            $table->update([
                'status' => 'occupied',
                'current_order_id' => $order->id,
            ]);
        });

        return back()->with(
            'success',
            'Order status updated successfully.'
        );
    }
}