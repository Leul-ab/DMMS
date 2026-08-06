<?php

namespace App\Http\Controllers\Serve;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ServeController extends Controller
{
    /**
     * Show orders that are ready to be served.
     *
     * Kitchen marks orders as "ready"; servers pick them up from here
     * and complete them once the food has been delivered to the table.
     */
    public function index()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
            'customer',
        ])
            ->where('status', 'ready')
            ->latest()
            ->get();

        return Inertia::render('serve/index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Show orders that have been served by the current user.
     */
    public function history()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
            'customer',
        ])
            ->where('status', 'completed')
            ->where('served_by', auth()->id())
            ->latest()
            ->paginate(10);

        return Inertia::render('serve/history', [
            'orders' => $orders,
        ]);
    }

    /**
     * Mark a ready order as completed once it has been served.
     */
    public function completeOrder(Order $order)
    {
        if ($order->status !== 'ready') {
            return back()->with('error', 'Order cannot be completed.');
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'status' => 'completed',
                'preparation_status' => 'completed',
                'served_by' => auth()->id(),
            ]);

            $table = $order->table;
            if ($table && $table->current_order_id === $order->id) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }
        });

        return back()->with('success', 'Order served successfully.');
    }
}
