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
    public function store(Request $request)
    {
        // Use the table_id from the request, or fall back to the session-scanned table
        $tableId = $request->input('table_id') ?? session('scanned_table_id');

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

            'customer_code' => [
                'nullable',
                'string',
                'exists:customers,customer_code',
            ],

            'special_instructions' => [
                'nullable',
                'string',
                'max:500',
            ],
        ]);

        // If no table_id in request, use the session-scanned table
        if (!$tableId) {
            return back()->withErrors([
                'table' => 'No table selected. Please scan the QR code on your table.',
            ])->withInput();
        }

        $table = RestaurantTable::findOrFail($tableId);

        // Check if table already has an active order
        $activeOrderExists = Order::where('table_id', $table->id)
            ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
            ->exists();

        if ($activeOrderExists) {
            return back()->withErrors([
                'table' => 'This table already has an active order.',
            ])->withInput();
        }

        $order = DB::transaction(function () use (
            $validated,
            $table
        ) {
            $totalAmount = 0;
            $estimatedMinutes = 0;

            // Find customer by customer_code if provided
            $customerId = null;
            if (!empty($validated['customer_code'])) {
                $customer = Customer::where('customer_code', $validated['customer_code'])->first();
                $customerId = $customer?->id;
            }

            $order = Order::create([
                'table_id' => $table->id,
                'customer_id' => $customerId,
                'order_number' => 'ORD-' . strtoupper(
                    Str::random(8)
                ),
                'status' => 'pending',
                'total_amount' => 0,
                'special_instructions' => !empty($validated['special_instructions'])
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

            // Set table status to occupied
            $table->update([
                'status' => 'occupied',
                'current_order_id' => $order->id,
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

    /**
     * Get the active order count for a customer (by customer_code or session).
     */
    public function getOrderCount(Request $request)
    {
        $validated = $request->validate([
            'table_id' => ['nullable', 'exists:restaurant_tables,id'],
            'customer_code' => ['nullable', 'string', 'exists:customers,customer_code'],
        ]);

        $query = Order::whereIn('status', [
            'pending', 'received', 'confirmed', 'preparing', 'ready', 'served'
        ]);

        // If customer code provided, count orders for that customer
        if (!empty($validated['customer_code'])) {
            $customer = Customer::where('customer_code', $validated['customer_code'])->first();
            if ($customer) {
                $query->where('customer_id', $customer->id);
            } else {
                return response()->json(['count' => 0]);
            }
        } elseif (!empty($validated['table_id'])) {
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
        if (!in_array($order->status, ['pending', 'received', 'confirmed'])) {
            return response()->json([
                'error' => 'Cannot add items to an order that is already being prepared or completed.',
            ], 422);
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

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
                        'status' => 'pending',
                    ]);
                }
            }

            $order->increment('total_amount', $additionalTotal);
        });

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
        if (!in_array($order->status, ['completed', 'cancelled'])) {
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
