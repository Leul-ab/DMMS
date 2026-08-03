<?php

namespace App\Http\Controllers\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class KitchenOrderController extends Controller
{
    /**
     * Show incoming and pending orders
     * for the currently selected branch.
     */
    public function newOrders(
        Request $request
    ): Response {
        $branchId = $request->session()->get(
            'current_branch_id'
        );

        /*
        |--------------------------------------------------------------------------
        | No Branch Selected
        |--------------------------------------------------------------------------
        */

        if (!$branchId) {
            return Inertia::render(
                'kitchen/orders/new',
                [
                    'orders' => [],
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Get Orders Only From Current Branch
        |--------------------------------------------------------------------------
        */

        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->where(
                'branch_id',
                $branchId
            )
            ->whereIn(
                'status',
                [
                    'pending',
                    'received',
                ]
            )
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
     * Show completed and cancelled orders
     * for the currently selected branch.
     */
    public function history(
        Request $request
    ): Response {
        $branchId = $request->session()->get(
            'current_branch_id'
        );

        /*
        |--------------------------------------------------------------------------
        | No Branch Selected
        |--------------------------------------------------------------------------
        */

        if (!$branchId) {
            return Inertia::render(
                'kitchen/orders/history',
                [
                    'orders' => [],
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Get History Only From Current Branch
        |--------------------------------------------------------------------------
        */

        $orders = Order::with([
            'table',
            'orderItems.menuItem',
        ])
            ->where(
                'branch_id',
                $branchId
            )
            ->whereIn(
                'status',
                [
                    'completed',
                    'cancelled',
                ]
            )
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
     * Update kitchen order status.
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
    ): RedirectResponse {
        $branchId = $request->session()->get(
            'current_branch_id'
        );

        /*
        |--------------------------------------------------------------------------
        | Check Current Branch
        |--------------------------------------------------------------------------
        */

        if (!$branchId) {
            return back()->with(
                'error',
                'Please select a branch first.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Cross-Branch Access
        |--------------------------------------------------------------------------
        */

        if (
            (int) $order->branch_id
            !== (int) $branchId
        ) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Status
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'status' => [
                'required',
                'in:pending,received,completed,cancelled',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Update Order And Table
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $order,
                $validated
            ) {
                $order->update([
                    'status' =>
                        $validated['status'],
                ]);

                $table = $order
                    ->table()
                    ->first();

                if (!$table) {
                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | Completed Or Cancelled
                |--------------------------------------------------------------------------
                */

                if (
                    $validated['status']
                    === 'completed'
                    ||
                    $validated['status']
                    === 'cancelled'
                ) {
                    $table->update([
                        'status' => 'available',
                        'current_order_id' => null,
                    ]);

                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | Pending Or Received
                |--------------------------------------------------------------------------
                */

                $table->update([
                    'status' => 'occupied',
                    'current_order_id' =>
                        $order->id,
                ]);
            }
        );

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
    ): RedirectResponse {
        $branchId = $request->session()->get(
            'current_branch_id'
        );

        /*
        |--------------------------------------------------------------------------
        | Check Current Branch
        |--------------------------------------------------------------------------
        */

        if (!$branchId) {
            return back()->with(
                'error',
                'Please select a branch first.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Cross-Branch Access
        |--------------------------------------------------------------------------
        */

        if (
            (int) $order->branch_id
            !== (int) $branchId
        ) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Order
        |--------------------------------------------------------------------------
        */

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
        ]);

        /*
        |--------------------------------------------------------------------------
        | Update Order
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $order,
                $validated,
                $branchId
            ) {
                $oldTable = $order
                    ->table()
                    ->first();

                /*
                |--------------------------------------------------------------------------
                | Verify New Table Belongs To Current Branch
                |--------------------------------------------------------------------------
                */

                if (
                    !empty($validated['table_id'])
                ) {
                    $validTable = DB::table(
                        'restaurant_tables'
                    )
                        ->where(
                            'id',
                            $validated['table_id']
                        )
                        ->where(
                            'branch_id',
                            $branchId
                        )
                        ->exists();

                    if (!$validTable) {
                        abort(
                            403,
                            'The selected table does not belong to the current branch.'
                        );
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Verify Menu Items Belong To Current Branch
                |--------------------------------------------------------------------------
                */

                $menuItemIds = collect(
                    $validated['items']
                )
                    ->pluck('menu_item_id')
                    ->unique();

                $validMenuItems = DB::table(
                    'menu_items'
                )
                    ->whereIn(
                        'id',
                        $menuItemIds
                    )
                    ->where(
                        'branch_id',
                        $branchId
                    )
                    ->count();

                if (
                    $validMenuItems
                    !== $menuItemIds->count()
                ) {
                    abort(
                        403,
                        'One or more menu items do not belong to the current branch.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Update Order
                |--------------------------------------------------------------------------
                */

                $order->update([
                    'table_id' =>
                        $validated['table_id']
                        ?? null,

                    'status' =>
                        $validated['status'],
                ]);

                /*
                |--------------------------------------------------------------------------
                | Remove Existing Items
                |--------------------------------------------------------------------------
                */

                $order
                    ->orderItems()
                    ->delete();

                /*
                |--------------------------------------------------------------------------
                | Create Updated Items
                |--------------------------------------------------------------------------
                */

                foreach (
                    $validated['items']
                    as $item
                ) {
                    $order
                        ->orderItems()
                        ->create([
                            'menu_item_id' =>
                                $item['menu_item_id'],

                            'quantity' =>
                                $item['quantity'],
                        ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Make Old Table Available
                |--------------------------------------------------------------------------
                */

                if (
                    $oldTable &&
                    $oldTable->id
                    != (
                        $validated['table_id']
                        ?? null
                    )
                ) {
                    $oldTable->update([
                        'status' =>
                            'available',

                        'current_order_id' =>
                            null,
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Update New Table
                |--------------------------------------------------------------------------
                */

                if (
                    !empty(
                        $validated['table_id']
                    )
                ) {
                    $newTable = $order
                        ->table()
                        ->first();

                    if ($newTable) {
                        /*
                        |--------------------------------------------------------------------------
                        | Completed Or Cancelled
                        |--------------------------------------------------------------------------
                        */

                        if (
                            $validated['status']
                            === 'completed'
                            ||
                            $validated['status']
                            === 'cancelled'
                        ) {
                            $newTable->update([
                                'status' =>
                                    'available',

                                'current_order_id' =>
                                    null,
                            ]);
                        } else {
                            /*
                            |--------------------------------------------------------------------------
                            | Active Order
                            |--------------------------------------------------------------------------
                            */

                            $newTable->update([
                                'status' =>
                                    'occupied',

                                'current_order_id' =>
                                    $order->id,
                            ]);
                        }
                    }
                }
            }
        );

        return back()->with(
            'success',
            'Order updated successfully.'
        );
    }

    /**
     * Delete an order.
     */
    public function destroy(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get(
            'current_branch_id'
        );

        /*
        |--------------------------------------------------------------------------
        | Check Current Branch
        |--------------------------------------------------------------------------
        */

        if (!$branchId) {
            return back()->with(
                'error',
                'Please select a branch first.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Cross-Branch Access
        |--------------------------------------------------------------------------
        */

        if (
            (int) $order->branch_id
            !== (int) $branchId
        ) {
            abort(
                403,
                'You cannot delete an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Delete Order
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use ($order) {
                $table = $order
                    ->table()
                    ->first();

                /*
                |--------------------------------------------------------------------------
                | Delete Order Items
                |--------------------------------------------------------------------------
                */

                $order
                    ->orderItems()
                    ->delete();

                /*
                |--------------------------------------------------------------------------
                | Make Table Available
                |--------------------------------------------------------------------------
                */

                if ($table) {
                    $table->update([
                        'status' =>
                            'available',

                        'current_order_id' =>
                            null,
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Delete Order
                |--------------------------------------------------------------------------
                */

                $order->delete();
            }
        );

        return back()->with(
            'success',
            'Order deleted successfully.'
        );
    }
}