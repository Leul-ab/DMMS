<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\RestaurantTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Display orders for the currently selected branch.
     */
    public function index(Request $request): Response
    {
        $branchId = $request->session()->get('current_branch_id');

        if (!$branchId) {
            abort(403, 'No branch has been selected.');
        }

        $orders = Order::with([
            'table',
            'orderItems.menuItem',
            'payment',
        ])
            ->where('branch_id', $branchId)
            ->latest()
            ->get();

        $tables = RestaurantTable::where('branch_id', $branchId)
            ->orderBy('table_number')
            ->get();

        $menuItems = MenuItem::where('branch_id', $branchId)
            ->where('is_available', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'price',
            ]);

        return Inertia::render('manager/orders/index', [
            'orders' => $orders,
            'tables' => $tables,
            'menuItems' => $menuItems,
            'currentBranchId' => $branchId,
        ]);
    }

    /**
     * Update an existing order.
     */
    public function update(
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

        if (
            !$branchId ||
            (int) $order->branch_id !== (int) $branchId
        ) {
            abort(404);
        }

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

        /*
        |--------------------------------------------------------------------------
        | Verify New Table Belongs To Current Branch
        |--------------------------------------------------------------------------
        */

        $newTable = RestaurantTable::where('id', $validated['table_id'])
            ->where('branch_id', $branchId)
            ->first();

        if (!$newTable) {
            return back()
                ->withErrors([
                    'table_id' => 'The selected table does not belong to the current branch.',
                ])
                ->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Menu Items Belong To Current Branch
        |--------------------------------------------------------------------------
        */

        $menuItemIds = collect($validated['items'])
            ->pluck('menu_item_id')
            ->unique();

        $validMenuItemCount = MenuItem::whereIn('id', $menuItemIds)
            ->where('branch_id', $branchId)
            ->count();

        if ($validMenuItemCount !== $menuItemIds->count()) {
            return back()
                ->withErrors([
                    'items' => 'One or more menu items do not belong to the current branch.',
                ])
                ->withInput();
        }

        DB::transaction(function () use (
            $order,
            $validated,
            $newTable,
            $branchId
        ) {
            /*
            |--------------------------------------------------------------------------
            | Save Old Table ID Before Updating Order
            |--------------------------------------------------------------------------
            */

            $oldTableId = $order->table_id;

            /*
            |--------------------------------------------------------------------------
            | Update Order Information
            |--------------------------------------------------------------------------
            */

            $order->update([
                'table_id' => $validated['table_id'],
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'estimated_minutes' => $validated['estimated_minutes'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Delete Existing Order Items
            |--------------------------------------------------------------------------
            */

            $order->orderItems()->delete();

            /*
            |--------------------------------------------------------------------------
            | Create Updated Order Items
            |--------------------------------------------------------------------------
            */

            $totalAmount = 0;

            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::where('id', $item['menu_item_id'])
                    ->where('branch_id', $branchId)
                    ->firstOrFail();

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
            |--------------------------------------------------------------------------
            | Update Order Total
            |--------------------------------------------------------------------------
            */

            $order->update([
                'total_amount' => $totalAmount,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Update Existing Payment Amount
            |--------------------------------------------------------------------------
            */

            $payment = Payment::where('order_id', $order->id)
                ->where('branch_id', $branchId)
                ->first();

            if ($payment) {
                $payment->update([
                    'amount' => $totalAmount,
                    'subtotal' => $totalAmount,
                    'table_id' => $newTable->id,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Release Old Table
            |--------------------------------------------------------------------------
            */

            if (
                $oldTableId &&
                (int) $oldTableId !== (int) $newTable->id
            ) {
                $oldTable = RestaurantTable::where('id', $oldTableId)
                    ->where('branch_id', $branchId)
                    ->first();

                if (
                    $oldTable &&
                    (int) $oldTable->current_order_id === (int) $order->id
                ) {
                    $oldTable->update([
                        'status' => 'available',
                        'current_order_id' => null,
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Occupy New Table
            |--------------------------------------------------------------------------
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
        Request $request,
        Order $order
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

        if (
            !$branchId ||
            (int) $order->branch_id !== (int) $branchId
        ) {
            abort(404);
        }

        DB::transaction(function () use (
            $order,
            $branchId
        ) {
            /*
            |--------------------------------------------------------------------------
            | Find Order Table Explicitly
            |--------------------------------------------------------------------------
            */

            $table = RestaurantTable::where('id', $order->table_id)
                ->where('branch_id', $branchId)
                ->first();

            /*
            |--------------------------------------------------------------------------
            | Release Table
            |--------------------------------------------------------------------------
            */

            if (
                $table &&
                (int) $table->current_order_id === (int) $order->id
            ) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Delete Order
            |--------------------------------------------------------------------------
            */

            $order->delete();
        });

        return back()->with(
            'success',
            'Order deleted successfully.'
        );
    }

    /**
     * Verify customer's payment.
     */
    public function verifyPayment(
        Request $request,
        Order $order
    ): RedirectResponse {
        /*
        |--------------------------------------------------------------------------
        | Get Current Branch
        |--------------------------------------------------------------------------
        */

        $branchId = $request->session()->get('current_branch_id');

        if (!$branchId) {
            abort(403, 'No branch has been selected.');
        }

        /*
        |--------------------------------------------------------------------------
        | Make Sure Order Belongs To Current Branch
        |--------------------------------------------------------------------------
        */

        if (
            (int) $order->branch_id !== (int) $branchId
        ) {
            abort(404);
        }

        /*
        |--------------------------------------------------------------------------
        | Only Pending Payments Can Be Verified
        |--------------------------------------------------------------------------
        */

        if ($order->payment_status !== 'pending') {
            return back()->with(
                'error',
                'This payment cannot be verified.'
            );
        }

        DB::transaction(function () use (
            $order,
            $branchId
        ) {
            /*
            |--------------------------------------------------------------------------
            | Find Payment For This Branch And Order
            |--------------------------------------------------------------------------
            */

            $payment = Payment::where('order_id', $order->id)
                ->where('branch_id', $branchId)
                ->first();

            /*
            |--------------------------------------------------------------------------
            | Create Payment If It Does Not Exist
            |--------------------------------------------------------------------------
            */

            if (!$payment) {
                $payment = new Payment();

                $payment->order_id = $order->id;
                $payment->branch_id = $branchId;
                $payment->table_id = $order->table_id;
                $payment->amount = $order->total_amount;
                $payment->subtotal = $order->total_amount;
                $payment->tax = 0;
                $payment->service_charge = 0;
                $payment->discount = 0;
                $payment->payment_method = 'cash';
            }

            /*
            |--------------------------------------------------------------------------
            | Mark Payment As Paid
            |--------------------------------------------------------------------------
            */

            $payment->user_id = auth()->id();
            $payment->payment_status = 'paid';
            $payment->paid_at = now();

            $payment->save();

            /*
            |--------------------------------------------------------------------------
            | Update Order Payment Status
            |--------------------------------------------------------------------------
            */

            $order->update([
                'payment_status' => 'paid',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Release Restaurant Table
            |--------------------------------------------------------------------------
            */

            $table = RestaurantTable::where('id', $order->table_id)
                ->where('branch_id', $branchId)
                ->first();

            if (
                $table &&
                (int) $table->current_order_id === (int) $order->id
            ) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }
        });

        return back()->with(
            'success',
            'Payment verified successfully. Table released.'
        );
    }
}
