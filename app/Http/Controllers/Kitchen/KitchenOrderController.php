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
     * Show the kitchen dashboard.
     */
    public function dashboard()
    {
        $stats = [
            'newOrders' => Order::where(
                'status',
                'confirmed'
            )->count(),

            'preparingOrders' => Order::where(
                'status',
                'preparing'
            )->count(),

            'readyOrders' => Order::where(
                'status',
                'ready'
            )->count(),

            'historyOrders' => Order::whereIn(
                'status',
                [
                    'completed',
                    'cancelled',
                ]
            )->count(),
        ];

        return Inertia::render(
            'kitchen/dashboard',
            [
                'stats' => $stats,
            ]
        );
    }

    /**
     * Show new orders waiting to be prepared.
     */
    public function newOrders()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->where('status', 'confirmed')
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
     * Show orders currently being prepared.
     */
    public function preparing()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->where('status', 'preparing')
            ->latest()
            ->get();

        return Inertia::render(
            'kitchen/orders/preparing',
            [
                'orders' => $orders,
            ]
        );
    }

    /**
     * Show orders that are ready.
     */
    public function ready()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->where('status', 'ready')
            ->latest()
            ->get();

        return Inertia::render(
            'kitchen/orders/ready',
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
     */
    public function updateStatus(
        Request $request,
        Order $order
    ) {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:confirmed,preparing,ready,completed,cancelled',
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

            if ($table) {
                if (
                    $validated['status'] === 'completed' ||
                    $validated['status'] === 'cancelled'
                ) {
                    $table->update([
                        'status' => 'available',
                        'current_order_id' => null,
                    ]);
                } else {
                    $table->update([
                        'status' => 'occupied',
                        'current_order_id' => $order->id,
                    ]);
                }
            }
        });

        return back()->with(
            'success',
            'Order status updated successfully.'
        );
    }
}