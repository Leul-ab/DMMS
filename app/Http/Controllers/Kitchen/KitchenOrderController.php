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
     * Show incoming and pending orders.
     *
     * New orders start with the "pending" status.
     * The kitchen staff can receive them first.
     */
    public function newOrders()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->whereIn('status', [
                'pending',
                'received',
            ])
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
     *
     * Workflow:
     *
     * pending -> received
     * received -> completed
     * pending -> cancelled
     * received -> cancelled
     */
    public function updateStatus(
        Request $request,
        Order $order
    ) {
        $validated = $request->validate([
    'status' => [
        'required',
        'in:pending,received,completed,cancelled',
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

            if (! $table) {
                return;
            }

            /*
             * When the order is completed or cancelled,
             * the table becomes available again.
             */
            if (
                $validated['status'] === 'completed' ||
                $validated['status'] === 'cancelled'
            ) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);

                return;
            }

            /*
             * Received orders keep the table occupied.
             */
            $table->update([
                'status' => 'occupied',
                'current_order_id' => $order->id,
            ]);
        });

        return back()->with(
            'success',
            'Order status updated successfully.'
        );
    }
    /**
 * Update an entire kitchen order.
 */
public function update(
    Request $request,
    Order $order
) {
    $validated = $request->validate([
        'table_id' => [
            'nullable',
            'exists:restaurant_tables,id',
        ],

        'status' => [
            'required',
            'in:pending,received,completed,cancelled',
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

        'items.*.special_preferences' => [
            'nullable',
            'array',
        ],

        'items.*.special_preferences.*' => [
            'string',
            'max:50',
        ],
    ]);

    DB::transaction(function () use (
        $order,
        $validated
    ) {
        $oldTable = $order->table()->first();

        // Update order
        $order->update([
            'table_id' => $validated['table_id'] ?? null,
            'status' => $validated['status'],
        ]);

        // Remove old order items
        $order->orderItems()->delete();

        // Create updated order items
        foreach ($validated['items'] as $item) {
            $order->orderItems()->create([
                'menu_item_id' => $item['menu_item_id'],
                'quantity' => $item['quantity'],
                'special_preferences' => ! empty($item['special_preferences'])
                    ? array_values($item['special_preferences'])
                    : [],
            ]);
        }

        // Make old table available if table changed
        if (
            $oldTable &&
            $oldTable->id != ($validated['table_id'] ?? null)
        ) {
            $oldTable->update([
                'status' => 'available',
                'current_order_id' => null,
            ]);
        }

        // Update new table status
        if ($validated['table_id']) {
            $newTable = $order->table()->first();

            if ($newTable) {
                if (
                    $validated['status'] === 'completed' ||
                    $validated['status'] === 'cancelled'
                ) {
                    $newTable->update([
                        'status' => 'available',
                        'current_order_id' => null,
                    ]);
                } else {
                    $newTable->update([
                        'status' => 'occupied',
                        'current_order_id' => $order->id,
                    ]);
                }
            }
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
public function destroy(Order $order)
{
    DB::transaction(function () use ($order) {
        $table = $order->table()->first();

        // Delete order items first
        $order->orderItems()->delete();

        // Make the table available
        if ($table) {
            $table->update([
                'status' => 'available',
                'current_order_id' => null,
            ]);
        }

        // Delete order
        $order->delete();
    });

    return back()->with(
        'success',
        'Order deleted successfully.'
    );
}
}