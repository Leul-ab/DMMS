<?php

namespace App\Http\Controllers\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;

class KitchenDashboardController extends Controller
{
    public function index()
    {
        $newOrders = Order::whereIn('status', [
            'pending',
            'received',
        ])->count();

        $historyOrders = Order::whereIn('status', [
            'completed',
            'cancelled',
        ])->count();

        return Inertia::render('kitchen/dashboard', [
            'stats' => [
                'newOrders' => $newOrders,
                'historyOrders' => $historyOrders,
            ],
        ]);
    }
}