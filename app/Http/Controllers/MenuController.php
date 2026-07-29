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

        // Get menu items
        $menuItemsQuery = MenuItem::with('category');

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

        return Inertia::render('menu/index', [
            'categories' => $categories,
            'menuItems' => $menuItems,
            'selectedCategory' => $selectedCategory
                ? (int) $selectedCategory
                : null,
            'table' => $table,
            'availableTables' => $availableTables,

            'flash' => [
                'success' => session('success'),
                'order_number' => session('order_number'),
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

    $order = Order::with([
        'orderItems.menuItem',
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
        ])
        ->latest()
        ->first();

    return Inertia::render('menu/my-order', [
        'table' => $table,
        'order' => $order,
    ]);
}
}
