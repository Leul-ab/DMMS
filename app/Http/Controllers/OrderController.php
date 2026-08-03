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
    /**
     * Create a new customer order.
     *
     * The branch is automatically determined
     * from the selected restaurant table.
     */
    public function store(Request $request)
    {
        // Use table_id from request or the table saved
        // when the customer scanned the QR code.
        $tableId = $request->input('table_id')
            ?? session('scanned_table_id');

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

        /*
        |--------------------------------------------------------------------------
        | Validate Table
        |--------------------------------------------------------------------------
        */

        if (!$tableId) {
            return back()->withErrors([
                'table' => 'No table selected. Please scan the QR code on your table.',
            ])->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Get Table
        |--------------------------------------------------------------------------
        */

        $table = RestaurantTable::findOrFail($tableId);

        /*
        |--------------------------------------------------------------------------
        | Get Branch From Table
        |--------------------------------------------------------------------------
        */

        $branchId = $table->branch_id;

        if (!$branchId) {
            return back()->withErrors([
                'table' => 'This table is not assigned to a branch.',
            ])->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Check Active Order
        |--------------------------------------------------------------------------
        */

        $activeOrderExists = Order::where('table_id', $table->id)
            ->where('branch_id', $branchId)
            ->whereIn('status', [
                'pending',
                'received',
                'confirmed',
                'preparing',
                'ready',
                'served',
            ])
            ->exists();

        if ($activeOrderExists) {
            return back()->withErrors([
                'table' => 'This table already has an active order.',
            ])->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Menu Items Belong To Same Branch
        |--------------------------------------------------------------------------
        */

        $menuItemIds = collect($validated['items'])
            ->pluck('id')
            ->unique()
            ->values();

        $validMenuItemCount = MenuItem::whereIn(
            'id',
            $menuItemIds
        )
            ->where('branch_id', $branchId)
            ->count();

        if ($validMenuItemCount !== $menuItemIds->count()) {
            return back()->withErrors([
                'items' => 'One or more selected menu items do not belong to this branch.',
            ])->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Create Order
        |--------------------------------------------------------------------------
        */

        $order = DB::transaction(function () use (
            $validated,
            $table,
            $branchId
        ) {
            $totalAmount = 0;
            $estimatedMinutes = 0;

            /*
            |--------------------------------------------------------------------------
            | Find Customer
            |--------------------------------------------------------------------------
            */

            $customerId = null;

            if (!empty($validated['customer_code'])) {
                $customer = Customer::where(
                    'customer_code',
                    $validated['customer_code']
                )->first();

                $customerId = $customer?->id;
            }

            /*
            |--------------------------------------------------------------------------
            | Create Order
            |--------------------------------------------------------------------------
            */

            $order = Order::create([
                'branch_id' => $branchId,
                'table_id' => $table->id,
                'customer_id' => $customerId,
                'order_number' => 'ORD-' . strtoupper(
                    Str::random(8)
                ),
                'status' => 'pending',
                'total_amount' => 0,
                'special_instructions' =>
                    !empty($validated['special_instructions'])
                        ? trim($validated['special_instructions'])
                        : null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Create Order Items
            |--------------------------------------------------------------------------
            */

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::where(
                    'id',
                    $item['id']
                )
                    ->where(
                        'branch_id',
                        $branchId
                    )
                    ->firstOrFail();

                $quantity = (int) $item['quantity'];

                $itemTotal =
                    (float) $menuItem->price * $quantity;

                $totalAmount += $itemTotal;

                /*
                |--------------------------------------------------------------------------
                | Calculate Preparation Time
                |--------------------------------------------------------------------------
                */

                if ($menuItem->preparation_time) {
                    $estimatedMinutes = max(
                        $estimatedMinutes,
                        $menuItem->preparation_time
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Create Order Item
                |--------------------------------------------------------------------------
                */

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'price' => $menuItem->price,
                    'status' => 'pending',
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Update Order Total
            |--------------------------------------------------------------------------
            */

            $order->update([
                'total_amount' => $totalAmount,
                'estimated_minutes' =>
                    $estimatedMinutes ?: null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Occupy Table
            |--------------------------------------------------------------------------
            */

            $table->update([
                'status' => 'occupied',
                'current_order_id' => $order->id,
            ]);

            return $order;
        });

        /*
        |--------------------------------------------------------------------------
        | Redirect To Menu
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route('menu.index', [
                'table' => $table->table_number,
            ])
            ->with('success', 'Order placed successfully!')
            ->with('order_number', $order->order_number);
    }

    /**
     * Get active order count.
     */
    public function getOrderCount(Request $request)
    {
        $validated = $request->validate([
            'table_id' => [
                'nullable',
                'exists:restaurant_tables,id',
            ],

            'customer_code' => [
                'nullable',
                'string',
                'exists:customers,customer_code',
            ],
        ]);

        $query = Order::whereIn('status', [
            'pending',
            'received',
            'confirmed',
            'preparing',
            'ready',
            'served',
        ]);

        if (!empty($validated['customer_code'])) {
            $customer = Customer::where(
                'customer_code',
                $validated['customer_code']
            )->first();

            if (!$customer) {
                return response()->json([
                    'count' => 0,
                ]);
            }

            $query->where(
                'customer_id',
                $customer->id
            );
        } elseif (!empty($validated['table_id'])) {
            $table = RestaurantTable::find(
                $validated['table_id']
            );

            if (!$table) {
                return response()->json([
                    'count' => 0,
                ]);
            }

            $query
                ->where('table_id', $table->id)
                ->where('branch_id', $table->branch_id);
        } else {
            return response()->json([
                'count' => 0,
            ]);
        }

        return response()->json([
            'count' => $query->count(),
        ]);
    }

    /**
     * Add items to an existing order.
     */
    public function addItems(
        Request $request,
        Order $order
    ) {
        $branchId = $order->branch_id;

        if (!in_array($order->status, [
            'pending',
            'received',
            'confirmed',
        ])) {
            return response()->json([
                'error' =>
                    'Cannot add items to an order that is already being prepared or completed.',
            ], 422);
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

        /*
        |--------------------------------------------------------------------------
        | Verify Items Belong To Same Branch
        |--------------------------------------------------------------------------
        */

        $menuItemIds = collect($validated['items'])
            ->pluck('id')
            ->unique()
            ->values();

        $validMenuItemCount = MenuItem::whereIn(
            'id',
            $menuItemIds
        )
            ->where('branch_id', $branchId)
            ->count();

        if ($validMenuItemCount !== $menuItemIds->count()) {
            return response()->json([
                'error' =>
                    'One or more menu items do not belong to this order branch.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Add Items
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use (
            $validated,
            $order,
            $branchId
        ) {
            $additionalTotal = 0;

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::where(
                    'id',
                    $item['id']
                )
                    ->where(
                        'branch_id',
                        $branchId
                    )
                    ->firstOrFail();

                $quantity = (int) $item['quantity'];

                $itemTotal =
                    (float) $menuItem->price * $quantity;

                $additionalTotal += $itemTotal;

                $existingItem = OrderItem::where(
                    'order_id',
                    $order->id
                )
                    ->where(
                        'menu_item_id',
                        $menuItem->id
                    )
                    ->where(
                        'status',
                        'pending'
                    )
                    ->first();

                if ($existingItem) {
                    $existingItem->increment(
                        'quantity',
                        $quantity
                    );

                    $existingItem->increment(
                        'price',
                        $itemTotal
                    );
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

            $order->increment(
                'total_amount',
                $additionalTotal
            );
        });

        if (
            $request->expectsJson() ||
            $request->wantsJson()
        ) {
            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'redirect' => route(
                    'menu.my-order',
                    [
                        'table' =>
                            $order->table->table_number,
                    ]
                ),
            ]);
        }

        return redirect()
            ->route(
                'menu.index',
                [
                    'table' =>
                        $order->table->table_number,
                    'order_id' =>
                        $order->id,
                ]
            )
            ->with(
                'success',
                'Items added to your order successfully!'
            );
    }

    /**
     * Release table.
     */
    public function releaseTable(
        Order $order
    ) {
        if (!in_array(
            $order->status,
            [
                'completed',
                'cancelled',
            ]
        )) {
            return back()->withErrors([
                'order' =>
                    'Table can only be released for completed or cancelled orders.',
            ]);
        }

        $table = $order->table;

        if ($table) {
            $table->update([
                'status' => 'available',
                'current_order_id' => null,
            ]);
        }

        return back()->with(
            'success',
            'Table has been released successfully.'
        );
    }

    /**
     * Cancel order and release table.
     */
    public function cancel(
        Order $order
    ) {
        if (in_array(
            $order->status,
            [
                'completed',
                'cancelled',
            ]
        )) {
            return back()->withErrors([
                'order' =>
                    'This order cannot be cancelled.',
            ]);
        }

        DB::transaction(function () use (
            $order
        ) {
            $order->update([
                'status' => 'cancelled',
            ]);

            $table = $order->table;

            if ($table) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }
        });

        return redirect()
            ->route('menu.index')
            ->with(
                'success',
                'Order cancelled successfully.'
            );
    }
}

