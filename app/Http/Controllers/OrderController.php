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

            // Update table status to occupied
            $table->update(['status' => 'occupied']);

            return $order;
        });

       return redirect()
          ->route('menu.index', [
        'table' => $table->table_number,
         ])
        ->with('success', 'Order placed successfully!')
        ->with('order_number', $order->order_number);
    }

    /**
     * Add more items to an existing order.
     */
    public function addItems(Request $request, Order $order)
    {
        // Only allow adding items to active orders
        if (!in_array($order->status, ['pending', 'received', 'preparing'])) {
            return back()->with(
                'error',
                'Cannot add items to an order that is completed or cancelled.'
            );
        }

        $validated = $request->validate([
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

        DB::transaction(function () use ($validated, $order) {
            $additionalAmount = 0;
            $estimatedMinutes = $order->estimated_minutes ?? 0;

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['id']);
                $quantity = $item['quantity'];
                $itemTotal = (float) $menuItem->price * $quantity;
                $additionalAmount += $itemTotal;

                if ($menuItem->preparation_time) {
                    $estimatedMinutes = max(
                        $estimatedMinutes,
                        $menuItem->preparation_time
                    );
                }

                // Check if item already exists in order, if so update quantity
                $existingItem = OrderItem::where('order_id', $order->id)
                    ->where('menu_item_id', $menuItem->id)
                    ->first();

                if ($existingItem) {
                    $existingItem->update([
                        'quantity' => $existingItem->quantity + $quantity,
                    ]);
                } else {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_item_id' => $menuItem->id,
                        'quantity' => $quantity,
                        'price' => $menuItem->price,
                        'status' => 'pending',
                    ]);
                }
            }

            $order->update([
                'total_amount' => (float) $order->total_amount + $additionalAmount,
                'estimated_minutes' => $estimatedMinutes ?: null,
            ]);
        });

        return redirect()
            ->route('menu.my-order', [
                'table' => $order->table->table_number,
            ])
            ->with('success', 'Items added to your order successfully!');
    }

    /**
     * Release table - set status back to available.
     */
    public function releaseTable(Order $order)
    {
        $table = $order->table;

        if ($table) {
            $table->update(['status' => 'available']);
        }

        return back()->with('success', 'Table has been released.');
    }

    /**
     * Get order count for the current customer's table.
     */
    public function getOrderCount(Request $request)
    {
        $tableNumber = $request->query('table');

        if (!$tableNumber) {
            return response()->json(['count' => 0]);
        }

        $table = RestaurantTable::where('table_number', $tableNumber)->first();

        if (!$table) {
            return response()->json(['count' => 0]);
        }

        $count = Order::where('table_id', $table->id)
            ->whereIn('status', ['pending', 'received', 'preparing'])
            ->count();

        return response()->json(['count' => $count]);
    }
}
