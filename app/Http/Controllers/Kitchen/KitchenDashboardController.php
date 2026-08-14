<?php

namespace App\Http\Controllers\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KitchenDashboardController extends Controller
{
    public function index()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
            'customer',
        ])
            ->whereIn('status', ['pending', 'preparing', 'ready', 'completed'])
            ->latest()
            ->get();

        $newOrders = $orders->whereIn('status', ['pending'])->values();
        $preparingOrders = $orders->where('status', 'preparing')->values();
        $readyOrders = $orders->where('status', 'ready')->values();
        $completedOrders = $orders->where('status', 'completed')->values();

        $stats = [
            'new_orders' => $newOrders->count(),
            'preparing' => $preparingOrders->count(),
            'ready' => $readyOrders->count(),
            'completed' => $completedOrders->count(),
            'total' => $orders->count(),
        ];

        return Inertia::render('kitchen/dashboard', [
            'newOrders' => $newOrders,
            'preparingOrders' => $preparingOrders,
            'readyOrders' => $readyOrders,
            'completedOrders' => $completedOrders,
            'stats' => $stats,
        ]);
    }

    public function acceptOrder(Order $order)
    {
        if ($order->status !== 'pending') {
            return back()->with('error', 'Order cannot be accepted.');
        }

        $order->update([
            'status' => 'preparing',
            'preparation_status' => 'waiting',
        ]);

        return back()->with('success', 'Order accepted. Set preparation time to start cooking.');
    }

    public function startPreparation(Request $request, Order $order)
    {
        if ($order->status !== 'preparing') {
            return back()->with('error', 'Order is not in preparing status.');
        }

        $validated = $request->validate([
            'preparation_time' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        $order->update([
            'preparation_time' => $validated['preparation_time'],
            'preparation_started_at' => now(),
            'preparation_status' => 'preparing',
            // Also sync the estimated_minutes so the customer sees the correct time
            'estimated_minutes' => $validated['preparation_time'],
        ]);

        return back()->with('success', 'Preparation started. Timer is now running.');
    }

    public function markReady(Order $order)
    {
        if ($order->status !== 'preparing') {
            return back()->with('error', 'Order cannot be marked as ready.');
        }

        // The customer's progress bar is driven by elapsed_time / total_time.
        // When the chef marks the order ready early, the customer view detects
        // status === 'ready' and instantly completes the progress bar (100%)
        // while stopping the countdown. We intentionally keep preparation_time
        // at the full estimated total so the displayed estimate and the
        // expected-ready-time calculation remain accurate.
        $order->update([
            'status' => 'ready',
            'preparation_status' => 'ready',
            'preparation_completed_at' => now(),
        ]);

        return back()->with('success', 'Order marked as ready to serve.');
    }
}
