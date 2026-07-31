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
        // Get the table number from the URL query parameter
        $tableNumber = $request->query('table');

        // If a table number is provided in the URL, store it in the session
        if ($tableNumber) {
            $table = RestaurantTable::where('table_number', $tableNumber)->first();

            if ($table) {
                // Store the table ID in session so it persists across requests
                session(['scanned_table_id' => $table->id]);
                session(['scanned_table_number' => $table->table_number]);
            }
        }

        // Try to get table from session if not in URL
        if (!$tableNumber && session()->has('scanned_table_id')) {
            $table = RestaurantTable::find(session('scanned_table_id'));
            if ($table) {
                $tableNumber = $table->table_number;
            }
        }

        // Find the restaurant table
        $table = null;
        if ($tableNumber) {
            $table = RestaurantTable::where('table_number', $tableNumber)->first();

            // If table was found but session doesn't have it, store it
            if ($table && !session()->has('scanned_table_id')) {
                session(['scanned_table_id' => $table->id]);
                session(['scanned_table_number' => $table->table_number]);
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
        $menuItemsQuery = MenuItem::with('category');

        // Filter by category if selected
        if ($selectedCategory) {
            $menuItemsQuery->where('category_id', $selectedCategory);
        }

        $menuItems = $menuItemsQuery
            ->orderBy('name')
            ->get();

        // Get available tables for manual selection (only if no table is scanned)
        $availableTables = [];
        if (!$table) {
            $availableTables = RestaurantTable::where('status', 'available')
                ->orderBy('table_number')
                ->get();
        }

        return Inertia::render('menu/index', [
            'categories' => $categories,
            'menuItems' => $menuItems,
            'selectedCategory' => $selectedCategory
                ? (int) $selectedCategory
                : null,
            'table' => $table,
            'tableError' => $tableError,
            'availableTables' => $availableTables,

            'flash' => [
                'success' => session('success'),
                'order_number' => session('order_number'),
            ],
        ]);
    }

    public function myOrder(Request $request)
    {
        $tableId = session('scanned_table_id');
        $tableNumber = $request->query('table') ?? session('scanned_table_number');

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
            }
        }

        $table = $tableId ? RestaurantTable::find($tableId) : null;

        if (!$table) {
            return redirect()
                ->route('menu.index')
                ->with('error', 'The selected table was not found.');
        }

        $order = Order::with(['orderItems.menuItem'])
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
