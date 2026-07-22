<?php

namespace App\Http\Controllers\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;

class KitchenDashboardController extends Controller
{
    public function index()
    {
        $newOrders = Order::where('status', 'confirmed')->count();

        $preparingOrders = Order::where('status', 'preparing')->count();

        $readyOrders = Order::where('status', 'ready')->count();

        $historyOrders = Order::whereIn('status', [
            'completed',
            'cancelled',
        ])->count();

        return Inertia::render('kitchen/dashboard', [
            'stats' => [
                'newOrders' => $newOrders,
                'preparingOrders' => $preparingOrders,
                'readyOrders' => $readyOrders,
                'historyOrders' => $historyOrders,
            ],
        ]);
    }
}