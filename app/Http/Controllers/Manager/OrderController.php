<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display all customer orders.
     *
     * Managers can view orders but cannot change
     * the order status.
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
}