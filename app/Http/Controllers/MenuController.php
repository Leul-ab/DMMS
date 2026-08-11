<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        return $this->renderMenu($request, 'menu/index');
    }

    public function customerMenu(Request $request)
    {
        return $this->renderMenu($request, 'customer-menu/index');
    }

    protected function renderMenu(Request $request, string $view)
    {
        // QR codes include the branch id so guests land on the correct branch.
        $requestedBranchId = $request->query('branch');
        if ($requestedBranchId && Branch::whereKey((int) $requestedBranchId)->exists()) {
            Branch::setCurrent((int) $requestedBranchId);
        }

        // The customer-menu page keeps its scanned table in dedicated session keys so it
        // never leaks into the /menu page, which always allows manual table selection.
        $isCustomerMenu = $view === 'customer-menu/index';
        $sessionKey = $isCustomerMenu ? 'customer_menu_table' : 'scanned_table';

        // Get the table number from the URL query parameter
        $tableNumber = $request->query('table');

        // If a table number is provided in the URL, store it in the session
        if ($tableNumber) {
            $table = RestaurantTable::where('table_number', $tableNumber)->first();

            if ($table) {
                session([$sessionKey . '_id' => $table->id]);
                session([$sessionKey . '_number' => $table->table_number]);
                Branch::setCurrent($table->branch_id);
            }
        }

        // Try to get table from session if not in URL
        if (!$tableNumber && session()->has($sessionKey . '_id')) {
            $table = RestaurantTable::find(session($sessionKey . '_id'));
            if ($table) {
                $tableNumber = $table->table_number;
                Branch::setCurrent($table->branch_id);
            }
        }

        // Find the restaurant table
        $table = null;
        if ($tableNumber) {
            $table = RestaurantTable::where('table_number', $tableNumber)->first();

            // If table was found but session doesn't have it, store it
            if ($table && !session()->has($sessionKey . '_id')) {
                session([$sessionKey . '_id' => $table->id]);
                session([$sessionKey . '_number' => $table->table_number]);
                Branch::setCurrent($table->branch_id);
            }
        }

        // Validate the table exists and is available
        $tableError = null;
        if ($tableNumber && !$table) {
            $tableError = 'The table you are looking for does not exist or is no longer available.';
        } elseif ($table && $table->status === 'awaiting_payment') {
            $tableError = 'This table is currently processing payment. Please wait or check with the staff.';
        }

        // Get active categories
        $categories = MenuCategory::active()
            ->ordered()
            ->get();

        // Get selected category
        $selectedCategory = $request->query('category');

        // Get menu items
        $menuItemsQuery = MenuItem::with(['category', 'discounts']);

        // Filter by category if selected
        if ($selectedCategory) {
            $menuItemsQuery->where('category_id', $selectedCategory);
        }

        $menuItems = $menuItemsQuery
            ->orderBy('name')
            ->get();

        // Determine customer membership for discount eligibility
        $customer = null;
        $customerCode = $request->query('customer_code');
        if ($customerCode) {
            $customer = Customer::where('customer_code', $customerCode)->first();
        }
        $isMember = $customer?->is_member ?? false;

        // Get available tables for manual selection.
        // The /menu page always offers free table selection via the dropdown.
        // The customer-menu page never lists tables - it only uses the scanned table.
        $availableTables = [];
        if (!$isCustomerMenu) {
            $availableTables = RestaurantTable::where('status', 'available')
                ->orderBy('table_number')
                ->get();
        }

        // Capture the order_id from the URL so the menu page can attach
        // new items to an existing pending order (or create a new order).
        $orderId = $request->query('order_id');

        return Inertia::render($view, [
            'categories' => $categories,
            'menuItems' => $menuItems,
            'selectedCategory' => $selectedCategory
                ? (int) $selectedCategory
                : null,
            'table' => $table,
            'tableError' => $tableError,
            'availableTables' => $availableTables,
            'order_id' => $orderId
                ? (int) $orderId
                : null,
            'isMember' => $isMember,

            'flash' => [
                'success' => session('success'),
                'order_number' => session('order_number'),
            ],
        ]);
    }

    public function myOrder(Request $request)
    {
        return $this->renderMyOrder($request, 'menu/my-order');
    }

    public function customerMyOrder(Request $request)
    {
        return $this->renderMyOrder($request, 'customer-my-order/index');
    }

    protected function renderMyOrder(Request $request, string $view)
    {
        $requestedBranchId = $request->query('branch');
        if ($requestedBranchId && Branch::whereKey((int) $requestedBranchId)->exists()) {
            Branch::setCurrent((int) $requestedBranchId);
        }

        $tableId = session('scanned_table_id') ?? session('customer_menu_table_id');
        $tableNumber = $request->query('table')
            ?? session('scanned_table_number')
            ?? session('customer_menu_table_number');

        if (!$tableNumber && !$tableId) {
            return redirect()
                ->route('menu.index')
                ->with('error', 'No table was selected.');
        }

        // If we have table number but not ID, find the table
        if ($tableNumber && !$tableId) {
            $table = RestaurantTable::where('table_number', $tableNumber)->first();
            if ($table) {
                $tableId = $table->id;
                Branch::setCurrent($table->branch_id);
            }
        }

        $table = $tableId ? RestaurantTable::find($tableId) : null;

        if (!$table) {
            return redirect()
                ->route('menu.index')
                ->with('error', 'The selected table was not found.');
        }

        Branch::setCurrent($table->branch_id);

        $ordersQuery = Order::with([
            'orderItems.menuItem',
            'payment.verifier',
            'receipt',
            'feedback.customer',
        ])
            ->where('table_id', $table->id)
            ->whereIn('status', [
                'pending',
                'received',
                'confirmed',
                'preparing',
                'ready',
                'served',
                'completed',
            ]);

        if ($request->session()->has('customer_code')) {
            $customerCode = $request->session()->get('customer_code');
            $customer = Customer::where('customer_code', $customerCode)->first();

            if ($customer) {
                $ordersQuery->where('customer_id', $customer->id);
            }
        }

        $orders = $ordersQuery->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // The "current" order is the most recent one.
        $order = $orders->first();

        return Inertia::render($view, [
            'table' => $table,
            'order' => $order,
            'orders' => $orders,
        ]);
    }
}
