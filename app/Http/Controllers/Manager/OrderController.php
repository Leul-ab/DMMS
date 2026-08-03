<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Display all customer orders.
     */
    public function index(): Response
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
                'tables' => RestaurantTable::orderBy('table_number')->get(),
                'menuItems' => MenuItem::where('is_available', true)
                    ->orderBy('name')
                    ->get([
                        'id',
                        'name',
                        'price',
                    ]),
            ]
        );
    }

    /**
     * Update an existing order.
     */
    public function update(
        Request $request,
        Order $order
    ): RedirectResponse {
        $validated = $request->validate([
            'table_id' => [
                'required',
                'exists:restaurant_tables,id',
            ],

            'customer_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'customer_phone' => [
                'nullable',
                'string',
                'max:255',
            ],

            'estimated_minutes' => [
                'nullable',
                'integer',
                'min:0',
                'max:1440',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.menu_item_id' => [
                'required',
                'exists:menu_items,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        DB::transaction(function () use (
            $order,
            $validated
        ) {
            $oldTable = $order->table;

            $newTable = RestaurantTable::find(
                $validated['table_id']
            );

            /*
             * Update order information.
             */
            $order->update([
                'table_id' => $validated['table_id'],
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'estimated_minutes' =>
                    $validated['estimated_minutes'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            /*
             * Delete existing order items.
             */
            $order->orderItems()->delete();

            /*
             * Add the updated order items.
             */
            $totalAmount = 0;

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail(
                    $item['menu_item_id']
                );

                $price = (float) $menuItem->price;
                $quantity = (int) $item['quantity'];

                $totalAmount += $price * $quantity;

                $order->orderItems()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'status' => 'pending',
                ]);
            }

            /*
             * Update total amount.
             */
            $order->update([
                'total_amount' => $totalAmount,
            ]);

            /*
             * If the order was moved to another table,
             * release the old table.
             */
            if (
                $oldTable &&
                $oldTable->id !== $newTable->id &&
                $oldTable->current_order_id === $order->id
            ) {
                $oldTable->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }

            /*
             * Keep the new table connected to this order.
             */
            if (
                $order->status !== 'completed' &&
                $order->status !== 'cancelled'
            ) {
                $newTable->update([
                    'status' => 'occupied',
                    'current_order_id' => $order->id,
                ]);
            }
        });

        return back()->with(
            'success',
            'Order updated successfully.'
        );
    }

    /**
     * Delete an order.
     */
    public function destroy(
        Order $order
    ): RedirectResponse {
        DB::transaction(function () use ($order) {
            $table = $order->table;

            /*
             * Release the table if this order
             * is currently using it.
             */
            if (
                $table &&
                $table->current_order_id === $order->id
            ) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }

            /*
             * Delete the order.
             * Order items are deleted automatically
             * because of cascadeOnDelete().
             */
            $order->delete();
        });

        return back()->with(
            'success',
            'Order deleted successfully.'
        );
    }

}
