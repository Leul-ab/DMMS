<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class OrderApiController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $order = Order::with([
            'orderItems.menuItem',
            'table',
        ])->findOrFail($id);

        return response()->json([
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'total_amount' => $order->total_amount,
            'estimated_minutes' => $order->estimated_minutes,
            'created_at' => $order->created_at,
            'notes' => $order->notes ?? null,
            'table' => $order->table ? [
                'id' => $order->table->id,
                'table_number' => $order->table->table_number,
            ] : null,
            'order_items' => $order->orderItems->map(function ($item) {
                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'status' => $item->status,
                    'notes' => $item->notes ?? null,
                    'menu_item' => [
                        'id' => $item->menuItem->id,
                        'name' => $item->menuItem->name,
                        'image' => $item->menuItem->image,
                    ],
                ];
            }),
        ]);
    }
}
