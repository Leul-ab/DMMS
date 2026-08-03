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
    /**
     * Resolve which branch's menu should be displayed.
     *
     * Managers/admins use the session branch (branch switcher).
     * Customers use the scanned table's branch when available.
     */
    private function resolveBranchId(Request $request, ?RestaurantTable $table): ?int
    {
        $user = $request->user();

        if (
            $user &&
            in_array($user->role?->slug, ['super_admin', 'manager'], true)
        ) {
            $branchId = $request->session()->get('current_branch_id')
                ?? $user->branch_id;

            return $branchId ? (int) $branchId : null;
        }

        if ($table?->branch_id) {
            return (int) $table->branch_id;
        }

        $branchId = $request->session()->get('current_branch_id')
            ?? $user?->branch_id;

        return $branchId ? (int) $branchId : null;
    }

    /**
     * Find a restaurant table, optionally scoped to a branch.
     */
    private function findTable(
        ?string $tableNumber,
        ?int $branchId
    ): ?RestaurantTable {
        if ($tableNumber) {
            $query = RestaurantTable::where(
                'table_number',
                $tableNumber
            );

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            return $query->first();
        }

        if (! session()->has('scanned_table_id')) {
            return null;
        }

        $table = RestaurantTable::find(
            session('scanned_table_id')
        );

        if (
            $table &&
            $branchId &&
            (int) $table->branch_id !== $branchId
        ) {
            return null;
        }

        return $table;
    }

    public function index(Request $request)
    {
        $tableNumber = $request->query('table');

        // Resolve branch early so table lookups can be branch-scoped.
        $branchId = $this->resolveBranchId($request, null);

        if ($tableNumber) {
            $table = $this->findTable($tableNumber, $branchId);

            if ($table) {
                session([
                    'scanned_table_id' => $table->id,
                    'scanned_table_number' => $table->table_number,
                ]);
            }
        }

        if (! $tableNumber && session()->has('scanned_table_id')) {
            $table = $this->findTable(null, $branchId);

            if ($table) {
                $tableNumber = (string) $table->table_number;
            }
        }

        $table = null;

        if ($tableNumber) {
            $table = $this->findTable($tableNumber, $branchId);

            if ($table && ! session()->has('scanned_table_id')) {
                session([
                    'scanned_table_id' => $table->id,
                    'scanned_table_number' => $table->table_number,
                ]);
            }
        } elseif (session()->has('scanned_table_id')) {
            $table = $this->findTable(null, $branchId);
        }

        // Re-resolve branch now that we may have a table (for customers).
        $branchId = $this->resolveBranchId($request, $table);

        $tableError = null;

        if ($tableNumber && ! $table) {
            $tableError = 'The table you are looking for does not exist or is no longer available.';
        } elseif ($table && $table->status === 'awaiting_payment') {
            $tableError = 'This table is currently processing payment. Please wait or check with the staff.';
        }

        $categories = collect();

        if ($branchId) {
            $categories = MenuCategory::query()
                ->where('branch_id', $branchId)
                ->active()
                ->ordered()
                ->get();
        }

        $selectedCategory = $request->query('category');

        // Drop category filter if it does not belong to the current branch.
        if ($selectedCategory && $branchId) {
            $categoryIsValid = $categories->contains(
                'id',
                (int) $selectedCategory
            );

            if (! $categoryIsValid) {
                $selectedCategory = null;
            }
        }

        $menuItemsQuery = MenuItem::with('category');

        if ($branchId) {
            $menuItemsQuery->where('branch_id', $branchId);
        } else {
            $menuItemsQuery->whereRaw('1 = 0');
        }

        if ($selectedCategory) {
            $menuItemsQuery->where(
                'category_id',
                $selectedCategory
            );
        }

        $menuItems = $menuItemsQuery
            ->orderBy('name')
            ->get();

        $availableTables = [];

        if (! $table && $branchId) {
            $availableTables = RestaurantTable::query()
                ->where('branch_id', $branchId)
                ->where('status', 'available')
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

        if (! $tableNumber && ! $tableId) {
            return redirect()
                ->route('menu.index')
                ->with('error', 'No table was selected.');
        }

        if ($tableNumber && ! $tableId) {
            $table = RestaurantTable::where(
                'table_number',
                $tableNumber
            )->first();

            if ($table) {
                $tableId = $table->id;
            }
        }

        $table = $tableId ? RestaurantTable::find($tableId) : null;

        if (! $table) {
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
