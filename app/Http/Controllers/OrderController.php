<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_id' => [
                'required',
                'exists:restaurant_tables,id',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.id' => [
                'required',
                'exists:menu_items,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $table = RestaurantTable::findOrFail(
            $validated['table_id']
        );

        $order = DB::transaction(function () use (
            $validated,
            $table
        ) {
            $totalAmount = 0;
            $estimatedMinutes = 0;

            $order = Order::create([
                'table_id' => $table->id,
                'order_number' => 'ORD-' . strtoupper(
                    Str::random(8)
                ),
                'status' => 'pending',
                'total_amount' => 0,
            ]);

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail(
                    $item['id']
                );

                $quantity = $item['quantity'];

                $itemTotal =
                    (float) $menuItem->price *
                    $quantity;

                $totalAmount += $itemTotal;

                if ($menuItem->preparation_time) {
                    $estimatedMinutes = max(
                        $estimatedMinutes,
                        $menuItem->preparation_time
                    );
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'price' => $menuItem->price,
                    'status' => 'pending',
                ]);
            }

            $order->update([
                'total_amount' => $totalAmount,
                'estimated_minutes' =>
                    $estimatedMinutes ?: null,
            ]);

            return $order;
        });

       return redirect()
          ->route('menu.index', [
        'table' => $table->table_number,
         ])
        ->with('success', 'Order placed successfully!')
        ->with('order_number', $order->order_number);
    }
}