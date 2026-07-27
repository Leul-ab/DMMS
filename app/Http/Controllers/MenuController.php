<?php

namespace App\Http\Controllers;

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
        // Get the table number from the URL
        $tableNumber = $request->query('table');

        // Find the restaurant table
        $table = null;

        if ($tableNumber) {
            $table = RestaurantTable::where(
                'table_number',
                $tableNumber
            )->first();
        }

        // Get active categories
        $categories = MenuCategory::active()
            ->ordered()
            ->get();

        // Get selected category
        $selectedCategory = $request->query('category');

        // Get available menu items
        $menuItemsQuery = MenuItem::available();

        // Filter by category if selected
        if ($selectedCategory) {
            $menuItemsQuery->where(
                'category_id',
                $selectedCategory
            );
        }

        $menuItems = $menuItemsQuery
            ->orderBy('name')
            ->get();

        // Get available tables for manual selection
        $availableTables = RestaurantTable::where('status', 'available')
            ->orderBy('table_number')
            ->get();

        // Get active order count for this table
        $orderCount = 0;
        $orders = collect();
        if ($table) {
            $orderCount = Order::where('table_id', $table->id)
                ->whereIn('status', ['pending', 'received', 'preparing'])
                ->count();

            // Get all orders for this table to display in the menu page
            $orders = Order::with([
                'orderItems.menuItem',
            ])
                ->where('table_id', $table->id)
                ->whereIn('status', [
                    'pending',
                    'received',
                    'preparing',
                    'served',
                    'completed',
                    'cancelled',
                ])
                ->latest()
                ->get();
        }

        // Check if we're adding to an existing order
        $addToOrder = $request->query('add_to_order');
        if ($addToOrder) {
            $existingOrder = Order::find($addToOrder);
            if (!$existingOrder || $existingOrder->table_id !== ($table->id ?? null)) {
                $addToOrder = null;
            }
        }

        return Inertia::render('menu/index', [
            'categories' => $categories,
            'menuItems' => $menuItems,
            'selectedCategory' => $selectedCategory
                ? (int) $selectedCategory
                : null,
            'table' => $table,
            'availableTables' => $availableTables,
            'orderCount' => $orderCount,
            'orders' => $orders,
            'addToOrder' => $addToOrder ? (int) $addToOrder : null,

            'flash' => [
                'success' => session('success'),
                'order_number' => session('order_number'),
                'customer_registered' => session('customer_registered'),
                'customer_code' => session('customer_code'),
                'customer_name' => session('customer_name'),
            ],
        ]);
    }
    public function myOrder(Request $request)
{
    $tableNumber = $request->query('table');

    if (!$tableNumber) {
        return redirect()
            ->route('menu.index')
            ->with('error', 'No table was selected.');
    }

    $table = RestaurantTable::where(
        'table_number',
        $tableNumber
    )->firstOrFail();

    $orders = Order::with([
        'orderItems.menuItem',
    ])
        ->where('table_id', $table->id)
        ->whereIn('status', [
            'pending',
            'received',
            'preparing',
            'completed',
        ])
        ->latest()
        ->get();

    $order = $orders->first();

    // Get active order count for this table
    $orderCount = Order::where('table_id', $table->id)
        ->whereIn('status', ['pending', 'received', 'preparing'])
        ->count();

    return Inertia::render('menu/my-order', [
        'table' => $table,
        'order' => $order,
        'orders' => $orders,
        'orderCount' => $orderCount,
    ]);
}
}
