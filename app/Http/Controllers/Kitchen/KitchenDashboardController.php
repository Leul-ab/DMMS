<?php

namespace App\Http\Controllers\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KitchenDashboardController extends Controller
{
    /**
     * Display kitchen orders for the currently selected branch.
     */
    public function index(Request $request): Response
    {
        $branchId = $request->session()->get('current_branch_id');

        /*
        |--------------------------------------------------------------------------
        | No Branch Selected
        |--------------------------------------------------------------------------
        */

        if (!$branchId) {
            return Inertia::render('kitchen/dashboard', [
                'newOrders' => [],
                'preparingOrders' => [],
                'readyOrders' => [],
                'completedOrders' => [],
                'stats' => [
                    'new_orders' => 0,
                    'preparing' => 0,
                    'ready' => 0,
                    'completed' => 0,
                    'total' => 0,
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Get Orders Only From Current Branch
        |--------------------------------------------------------------------------
        */

        $orders = Order::with([
            'table',
            'orderItems.menuItem',
            'customer',
        ])
            ->where('branch_id', $branchId)
            ->whereIn('status', [
                'pending',
                'preparing',
                'ready',
                'completed',
            ])
            ->latest()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Separate Orders By Status
        |--------------------------------------------------------------------------
        */

        $newOrders = $orders
            ->where('status', 'pending')
            ->values();

        $preparingOrders = $orders
            ->where('status', 'preparing')
            ->values();

        $readyOrders = $orders
            ->where('status', 'ready')
            ->values();

        $completedOrders = $orders
            ->where('status', 'completed')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Dashboard Statistics
        |--------------------------------------------------------------------------
        */

        $stats = [
            'new_orders' => $newOrders->count(),
            'preparing' => $preparingOrders->count(),
            'ready' => $readyOrders->count(),
            'completed' => $completedOrders->count(),
            'total' => $orders->count(),
        ];

        return Inertia::render('kitchen/dashboard', [
            'newOrders' => $newOrders,
            'preparingOrders' => $preparingOrders,
            'readyOrders' => $readyOrders,
            'completedOrders' => $completedOrders,
            'stats' => $stats,
        ]);
    }

    /**
     * Accept a pending order.
     */
    public function acceptOrder(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

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
        | Prevent Access To Another Branch's Order
        |--------------------------------------------------------------------------
        */

        if ((int) $order->branch_id !== (int) $branchId) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Check Order Status
        |--------------------------------------------------------------------------
        */

        if ($order->status !== 'pending') {
            return back()->with(
                'error',
                'Order cannot be accepted.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Accept Order
        |--------------------------------------------------------------------------
        */

        $order->update([
            'status' => 'preparing',
            'preparation_status' => 'waiting',
        ]);

        return back()->with(
            'success',
            'Order accepted. Set preparation time to start cooking.'
        );
    }

    /**
     * Update estimated preparation time.
     *
     * This time is shown to the customer before
     * the preparation timer actually starts.
     */
    public function updateEstimatedTime(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

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

        if ((int) $order->branch_id !== (int) $branchId) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Check Order Status
        |--------------------------------------------------------------------------
        */

        if ($order->status !== 'preparing') {
            return back()->with(
                'error',
                'Order is not in preparing status.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Estimated Time
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'estimated_minutes' => [
                'required',
                'integer',
                'min:5',
                'max:60',
                'multiple_of:5',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Update Estimated Time
        |--------------------------------------------------------------------------
        */

        $order->update([
            'estimated_minutes' =>
                $validated['estimated_minutes'],
        ]);

        return back()->with(
            'success',
            'Estimated time updated.'
        );
    }

    /**
     * Start order preparation.
     */
    public function startPreparation(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

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

        if ((int) $order->branch_id !== (int) $branchId) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Check Order Status
        |--------------------------------------------------------------------------
        */

        if ($order->status !== 'preparing') {
            return back()->with(
                'error',
                'Order is not in preparing status.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Preparation Time
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'preparation_time' => [
                'required',
                'integer',
                'min:5',
                'max:60',
                'multiple_of:5',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Start Preparation Timer
        |--------------------------------------------------------------------------
        */

        $order->update([
            'preparation_time' =>
                $validated['preparation_time'],

            'preparation_started_at' => now(),

            'preparation_status' =>
                'preparing',

            /*
             * Keep customer's estimated time
             * synchronized with kitchen time.
             */
            'estimated_minutes' =>
                $validated['preparation_time'],
        ]);

        return back()->with(
            'success',
            'Preparation started. Timer is now running.'
        );
    }

    /**
     * Add additional preparation time.
     */
    public function addTime(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

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

        if ((int) $order->branch_id !== (int) $branchId) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Check Order Status
        |--------------------------------------------------------------------------
        */

        if ($order->status !== 'preparing') {
            return back()->with(
                'error',
                'Order is not in preparing status.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Additional Time
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'additional_minutes' => [
                'required',
                'integer',
                'min:1',
                'max:120',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Calculate New Preparation Time
        |--------------------------------------------------------------------------
        */

        $newTotal =
            ($order->preparation_time ?? 0)
            + $validated['additional_minutes'];

        /*
        |--------------------------------------------------------------------------
        | Update Order
        |--------------------------------------------------------------------------
        */

        $order->update([
            'preparation_time' => $newTotal,
            'estimated_minutes' => $newTotal,
        ]);

        return back()->with(
            'success',
            'Additional preparation time added successfully.'
        );
    }

    /**
     * Mark an order as ready.
     */
    public function markReady(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

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

        if ((int) $order->branch_id !== (int) $branchId) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Check Order Status
        |--------------------------------------------------------------------------
        */

        if ($order->status !== 'preparing') {
            return back()->with(
                'error',
                'Order cannot be marked as ready.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Calculate Elapsed Preparation Time
        |--------------------------------------------------------------------------
        */

        $elapsedMinutes = 0;

        if ($order->preparation_started_at) {
            $elapsedSeconds = max(
                0,
                now()->getTimestamp()
                - $order->preparation_started_at->getTimestamp()
            );

            $elapsedMinutes = max(
                1,
                ceil($elapsedSeconds / 60)
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Mark Order Ready
        |--------------------------------------------------------------------------
        */

        $order->update([
            'status' => 'ready',

            'preparation_status' => 'ready',

            'preparation_completed_at' => now(),

            /*
             * Complete the customer's progress bar.
             */
            'preparation_time' => $elapsedMinutes,
        ]);

        return back()->with(
            'success',
            'Order marked as ready to serve.'
        );
    }

    /**
     * Complete a ready order.
     */
    public function completeOrder(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

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

        if ((int) $order->branch_id !== (int) $branchId) {
            abort(
                403,
                'You cannot modify an order from another branch.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Check Order Status
        |--------------------------------------------------------------------------
        */

        if ($order->status !== 'ready') {
            return back()->with(
                'error',
                'Order cannot be completed.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Complete Order
        |--------------------------------------------------------------------------
        */

        $order->update([
            'status' => 'completed',
            'preparation_status' => 'completed',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Make Table Available
        |--------------------------------------------------------------------------
        */

        $table = $order->table;

        if (
            $table &&
            $table->current_order_id === $order->id
        ) {
            $table->update([
                'status' => 'available',
                'current_order_id' => null,
            ]);
        }

        return back()->with(
            'success',
            'Order completed successfully.'
        );
    }
}