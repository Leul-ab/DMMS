<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    private const ALLOWED_SPECIAL_PREFERENCES = [
        'No Onion',
        'No Garlic',
        'No Spicy',
        'Extra Spicy',
        'Extra Cheese',
        'Less Salt',
        'No Sauce',
    ];

    public function store(Request $request)
    {
        $tableId = $request->input('table_id')
            ?? session('scanned_table_id')
            ?? session('customer_menu_table_id');

        $validated = $request->validate([
            'table_id' => [
                'nullable',
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

            'items.*.special_preferences' => [
                'nullable',
                'array',
            ],

            'items.*.special_preferences.*' => [
                'string',
                'max:50',
                'in:' . implode(',', self::ALLOWED_SPECIAL_PREFERENCES),
            ],

            'customer_phone' => [
                'nullable',
                'string',
                'max:20',
                'exists:customers,phone',
            ],

            'special_instructions' => [
                'nullable',
                'string',
                'max:500',
            ],

            'source' => [
                'nullable',
                'string',
                'in:menu,customer-menu',
            ],

            'order_id' => [
                'nullable',
                'exists:orders,id',
            ],
        ]);

        // If no table_id in request, use the session-scanned table
        if (! $tableId) {
            return back()->withErrors([
                'table' => 'No table selected. Please scan the QR code on your table.',
            ])->withInput();
        }

        $table = RestaurantTable::findOrFail($tableId);

        // Determine the redirect route
        $redirectRoute = $request->input('source') === 'customer-menu'
            ? 'menu.customer'
            : 'menu.index';

        // If an order_id is provided, try to add items to that specific order
        // Only allowed if the order is still pending/confirmed (not preparing yet)
        if (! empty($validated['order_id'])) {
            $existingOrder = Order::find($validated['order_id']);

            if ($existingOrder && in_array($existingOrder->status, ['pending', 'received', 'confirmed'])) {
                $this->addItemsToOrder($validated, $existingOrder);

                return redirect()
                    ->route($redirectRoute, [
                        'table' => $table->table_number,
                    ])
                    ->with('success', 'Items added to your order successfully!')
                    ->with('order_number', $existingOrder->order_number);
            }
        }

        // Check if there's a pending order for this table that we should add to
        // Only pending/confirmed orders can accept more items.
        // If the order is preparing/ready/completed, a new order must be created.
        $pendingOrder = Order::where('table_id', $table->id)
            ->whereIn('status', ['pending', 'received', 'confirmed'])
            ->latest()
            ->first();

        if ($pendingOrder) {
            $this->addItemsToOrder($validated, $pendingOrder);

            return redirect()
                ->route($redirectRoute, [
                    'table' => $table->table_number,
                ])
                ->with('success', 'Items added to your order successfully!')
                ->with('order_number', $pendingOrder->order_number);
        }

        // No pending order exists — create a completely new order.
        // This handles the case where the previous order is preparing, ready,
        // or completed. The new order gets its own order number and status.
        $order = DB::transaction(function () use (
            $validated,
            $table
        ) {
            $totalAmount = 0;
            $estimatedMinutes = 0;

            // Find customer by phone if provided
            $customerId = null;
            if (! empty($validated['customer_phone'])) {
                $customer = Customer::where('phone', $validated['customer_phone'])->first();
                $customerId = $customer?->id;
            }

            $order = Order::create([
                'table_id' => $table->id,
                'customer_id' => $customerId,
                'order_number' => 'ORD-'.strtoupper(
                    Str::random(8)
                ),
                'status' => 'pending',
                'total_amount' => 0,
                'special_instructions' => ! empty($validated['special_instructions'])
                    ? trim($validated['special_instructions'])
                    : null,
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
                    $estimatedMinutes +=
                        $menuItem->preparation_time *
                        $quantity;
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'price' => $menuItem->price,
                    'special_preferences' => !empty($item['special_preferences'])
                        ? array_values(array_unique($item['special_preferences']))
                        : [],
                    'status' => 'pending',
                ]);
            }

            $order->update([
                'total_amount' => $totalAmount,
                'estimated_minutes' => $estimatedMinutes ?: null,
            ]);

            // Set table status to occupied
            $table->update([
                'status' => 'occupied',
                'current_order_id' => $order->id,
            ]);

            return $order;
        });

        return redirect()
            ->route($redirectRoute, [
                'table' => $table->table_number,
            ])
            ->with('success', 'Order placed successfully!')
            ->with('order_number', $order->order_number);
    }

    /**
     * Add items to an existing order (shared logic between store and addItems).
     */
    private function addItemsToOrder(array $validated, Order $order): void
    {
        DB::transaction(function () use ($validated, $order) {
            $additionalTotal = 0;

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['id']);
                $quantity = $item['quantity'];
                $itemTotal = (float) $menuItem->price * $quantity;
                $additionalTotal += $itemTotal;

                // Check if the same menu item already exists in the order, and if so, increment quantity
                $existingItem = OrderItem::where('order_id', $order->id)
                    ->where('menu_item_id', $menuItem->id)
                    ->where('status', 'pending')
                    ->first();

                if ($existingItem) {
                    $existingItem->increment('quantity', $quantity);
                    $existingItem->increment('price', $itemTotal);
                } else {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_item_id' => $menuItem->id,
                        'quantity' => $quantity,
                        'price' => $menuItem->price,
                        'special_preferences' => !empty($item['special_preferences'])
                            ? array_values(array_unique($item['special_preferences']))
                            : [],
                        'status' => 'pending',
                    ]);
                }
            }

            $order->increment('total_amount', $additionalTotal);

            // Recalculate estimated_minutes from all current order items
            $estimatedMinutes = 0;
            $orderItems = $order->fresh()->orderItems()->with('menuItem')->get();
            foreach ($orderItems as $orderItem) {
                if ($orderItem->menuItem && $orderItem->menuItem->preparation_time) {
                    $estimatedMinutes += $orderItem->menuItem->preparation_time * $orderItem->quantity;
                }
            }

            $order->update([
                'estimated_minutes' => $estimatedMinutes ?: null,
            ]);
        });
    }

    /**
     * Get the active order count for a customer (by phone or session).
     */
    public function getOrderCount(Request $request)
    {
        $validated = $request->validate([
            'table_id' => ['nullable', 'exists:restaurant_tables,id'],
            'customer_phone' => ['nullable', 'string', 'max:20', 'exists:customers,phone'],
        ]);

        $query = Order::whereIn('status', [
            'pending', 'received', 'confirmed', 'preparing', 'ready', 'served',
        ]);

        // If customer phone provided, count orders for that customer
        if (! empty($validated['customer_phone'])) {
            $customer = Customer::where('phone', $validated['customer_phone'])->first();
            if ($customer) {
                $query->where('customer_id', $customer->id);
            } else {
                return response()->json(['count' => 0]);
            }
        } elseif (! empty($validated['table_id'])) {
            // Fallback to table-based counting
            $query->where('table_id', $validated['table_id']);
        } else {
            return response()->json(['count' => 0]);
        }

        $count = $query->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Add items to an existing order.
     */
    public function addItems(Request $request, Order $order)
    {
        // Only allow adding to pending/confirmed orders
        if (! in_array($order->status, ['pending', 'received', 'confirmed'])) {
            return response()->json([
                'error' => 'Cannot add items to an order that is already being prepared or completed.',
            ], 422);
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.special_preferences' => ['nullable', 'array'],
            'items.*.special_preferences.*' => ['string', 'max:50', 'in:' . implode(',', self::ALLOWED_SPECIAL_PREFERENCES)],
        ]);

        $this->addItemsToOrder($validated, $order);

        // If request expects JSON (from API), return JSON
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'redirect' => route('menu.my-order', ['table' => $order->table->table_number]),
            ]);
        }

        // Otherwise redirect back to menu with the table and order context
        return redirect()->route('menu.index', [
            'table' => $order->table->table_number,
            'order_id' => $order->id,
        ])->with('success', 'Items added to your order successfully!');
    }

    /**
     * Release a table when an order is completed or cancelled.
     */
    public function releaseTable(Order $order)
    {
        if (! in_array($order->status, ['completed', 'cancelled'])) {
            return back()->withErrors([
                'order' => 'Table can only be released for completed or cancelled orders.',
            ]);
        }

        $table = $order->table;
        if ($table) {
            $table->update([
                'status' => 'available',
                'current_order_id' => null,
            ]);
        }

        return back()->with('success', 'Table has been released successfully.');
    }

    /**
     * Cancel an order and release the table.
     */
    public function cancel(Order $order)
    {
        if (in_array($order->status, ['completed', 'cancelled'])) {
            return back()->withErrors([
                'order' => 'This order cannot be cancelled.',
            ]);
        }

        DB::transaction(function () use ($order) {
            $order->update(['status' => 'cancelled']);

            // Release the table
            $table = $order->table;
            if ($table) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }
        });

        return redirect()->route('menu.index')
            ->with('success', 'Order cancelled successfully.');
    }
}
