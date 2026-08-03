<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Resolve the currently selected branch ID.
     */
    private function currentBranchId(Request $request): ?int
    {
        $user = $request->user();

        $branchId = $request->session()->get('current_branch_id')
            ?? $user?->branch_id;

        if (! $branchId) {
            return null;
        }

        // Non-admins may only use assigned branches.
        if (
            $user &&
            $user->role?->slug !== 'super_admin' &&
            ! $user->canAccessBranch((int) $branchId)
        ) {
            return null;
        }

        return (int) $branchId;
    }

    public function index(Request $request): Response
    {
        $branchId = $this->currentBranchId($request);

        if (! $branchId) {
            return Inertia::render('dashboard', [
                'stats' => [
                    'totalOrders' => 0,
                    'todayOrders' => 0,
                    'pendingOrders' => 0,
                    'receivedOrders' => 0,
                    'completedOrders' => 0,
                    'cancelledOrders' => 0,
                    'totalRevenue' => 0,
                    'todayRevenue' => 0,
                    'totalCustomers' => 0,
                    'memberCustomers' => 0,
                    'nonMemberCustomers' => 0,
                    'totalTables' => 0,
                    'availableTables' => 0,
                    'occupiedTables' => 0,
                    'awaitingPaymentTables' => 0,
                    'totalCategories' => 0,
                    'activeCategories' => 0,
                    'totalMenuItems' => 0,
                    'availableMenuItems' => 0,
                    'unavailableMenuItems' => 0,
                    'featuredMenuItems' => 0,
                ],
                'recentOrders' => [],
                'orderStatusOverview' => [],
                'popularMenuItems' => [],
                'recentBookings' => [],
                'revenueTrend' => [],
                'salesByCategory' => [],
                'paymentStatusOverview' => [],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Order Statistics (current branch only)
        |--------------------------------------------------------------------------
        */

        $orders = Order::query()->where('branch_id', $branchId);

        $totalOrders = (clone $orders)->count();

        $todayOrders = (clone $orders)
            ->whereDate('created_at', today())
            ->count();

        $pendingOrders = (clone $orders)
            ->where('status', 'pending')
            ->count();

        $receivedOrders = (clone $orders)
            ->where('status', 'received')
            ->count();

        $completedOrders = (clone $orders)
            ->where('status', 'completed')
            ->count();

        $cancelledOrders = (clone $orders)
            ->where('status', 'cancelled')
            ->count();

        $totalRevenue = (clone $orders)
            ->where('status', 'completed')
            ->sum('total_amount');

        $todayRevenue = (clone $orders)
            ->where('status', 'completed')
            ->whereDate('created_at', today())
            ->sum('total_amount');

        /*
        |--------------------------------------------------------------------------
        | Customer Statistics
        |--------------------------------------------------------------------------
        */

        $customers = Customer::query()->where('branch_id', $branchId);

        $totalCustomers = (clone $customers)->count();

        $memberCustomers = (clone $customers)
            ->where('is_member', true)
            ->count();

        $nonMemberCustomers = (clone $customers)
            ->where('is_member', false)
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Restaurant Table Statistics
        |--------------------------------------------------------------------------
        */

        $tables = RestaurantTable::query()->where('branch_id', $branchId);

        $totalTables = (clone $tables)->count();

        $availableTables = (clone $tables)
            ->where('status', 'available')
            ->count();

        $occupiedTables = (clone $tables)
            ->where('status', 'occupied')
            ->count();

        $awaitingPaymentTables = (clone $tables)
            ->where('status', 'awaiting_payment')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Menu Statistics
        |--------------------------------------------------------------------------
        */

        $categories = MenuCategory::query()->where('branch_id', $branchId);

        $totalCategories = (clone $categories)->count();

        $activeCategories = (clone $categories)
            ->where('is_active', true)
            ->count();

        $menuItems = MenuItem::query()->where('branch_id', $branchId);

        $totalMenuItems = (clone $menuItems)->count();

        $availableMenuItems = (clone $menuItems)
            ->where('is_available', true)
            ->count();

        $unavailableMenuItems = (clone $menuItems)
            ->where('is_available', false)
            ->count();

        $featuredMenuItems = (clone $menuItems)
            ->where('featured', true)
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Recent Orders
        |--------------------------------------------------------------------------
        */

        $recentOrders = Order::query()
            ->where('branch_id', $branchId)
            ->with('table')
            ->latest()
            ->take(5)
            ->get([
                'id',
                'order_number',
                'status',
                'payment_status',
                'total_amount',
                'customer_name',
                'customer_phone',
                'table_id',
                'created_at',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Order Status Overview
        |--------------------------------------------------------------------------
        */

        $orderStatusOverview = Order::query()
            ->where('branch_id', $branchId)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Popular Menu Items
        |--------------------------------------------------------------------------
        */

        $popularMenuItems = DB::table('order_items')
            ->join(
                'menu_items',
                'order_items.menu_item_id',
                '=',
                'menu_items.id'
            )
            ->join(
                'orders',
                'order_items.order_id',
                '=',
                'orders.id'
            )
            ->where('menu_items.branch_id', $branchId)
            ->where('orders.branch_id', $branchId)
            ->select(
                'menu_items.id',
                'menu_items.name',
                DB::raw('SUM(order_items.quantity) as total_quantity')
            )
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('total_quantity')
            ->take(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Revenue Trend (Last 14 Days) — current branch only
        |--------------------------------------------------------------------------
        */

        $revenueRowsByDate = Order::query()
            ->where('branch_id', $branchId)
            ->where('status', 'completed')
            ->where(
                'created_at',
                '>=',
                Carbon::now()->subDays(13)->startOfDay()
            )
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->get()
            ->keyBy(fn ($row) => (string) $row->date);

        $revenueTrend = collect(range(13, 0))->map(
            function ($daysAgo) use ($revenueRowsByDate) {
                $date = Carbon::now()->subDays($daysAgo);

                $row = $revenueRowsByDate->get(
                    $date->toDateString()
                );

                return [
                    'date' => $date->toDateString(),
                    'label' => $date->format('M j'),
                    'revenue' => (float) ($row->revenue ?? 0),
                    'orders' => (int) ($row->orders ?? 0),
                ];
            }
        )->values();

        /*
        |--------------------------------------------------------------------------
        | Sales By Category — current branch only
        |--------------------------------------------------------------------------
        */

        $salesByCategory = DB::table('order_items')
            ->join(
                'orders',
                'order_items.order_id',
                '=',
                'orders.id'
            )
            ->join(
                'menu_items',
                'order_items.menu_item_id',
                '=',
                'menu_items.id'
            )
            ->leftJoin(
                'menu_categories',
                'menu_items.category_id',
                '=',
                'menu_categories.id'
            )
            ->where('orders.branch_id', $branchId)
            ->where('menu_items.branch_id', $branchId)
            ->where('orders.status', 'completed')
            ->select(
                DB::raw(
                    "COALESCE(menu_categories.name, 'Uncategorized') as category"
                ),
                DB::raw(
                    'SUM(order_items.quantity * order_items.price) as sales'
                )
            )
            ->groupBy('category')
            ->orderByDesc('sales')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Payment Status Overview — current branch only
        |--------------------------------------------------------------------------
        */

        $paymentStatusOverview = Order::query()
            ->where('branch_id', $branchId)
            ->select(
                'payment_status',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_amount) as total')
            )
            ->groupBy('payment_status')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Recent Table Bookings
        |--------------------------------------------------------------------------
        */

        $recentBookings = TableBooking::query()
            ->where('branch_id', $branchId)
            ->with(['customer', 'tables'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($booking) {
                return (object) [
                    'id' => $booking->id,
                    'customer_name' => $booking->customer?->name ?? 'Unknown',
                    'customer_phone' => $booking->customer?->phone ?? 'N/A',
                    'tables' => $booking->tables->map(fn ($t) => [
                        'id' => $t->id,
                        'table_number' => $t->table_number,
                    ]),
                    'status' => $booking->status,
                    'booked_at' => $booking->booked_at,
                    'expires_at' => $booking->expires_at,
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'totalOrders' => $totalOrders,
                'todayOrders' => $todayOrders,
                'pendingOrders' => $pendingOrders,
                'receivedOrders' => $receivedOrders,
                'completedOrders' => $completedOrders,
                'cancelledOrders' => $cancelledOrders,
                'totalRevenue' => $totalRevenue,
                'todayRevenue' => $todayRevenue,
                'totalCustomers' => $totalCustomers,
                'memberCustomers' => $memberCustomers,
                'nonMemberCustomers' => $nonMemberCustomers,
                'totalTables' => $totalTables,
                'availableTables' => $availableTables,
                'occupiedTables' => $occupiedTables,
                'awaitingPaymentTables' => $awaitingPaymentTables,
                'totalCategories' => $totalCategories,
                'activeCategories' => $activeCategories,
                'totalMenuItems' => $totalMenuItems,
                'availableMenuItems' => $availableMenuItems,
                'unavailableMenuItems' => $unavailableMenuItems,
                'featuredMenuItems' => $featuredMenuItems,
            ],
            'recentOrders' => $recentOrders,
            'orderStatusOverview' => $orderStatusOverview,
            'popularMenuItems' => $popularMenuItems,
            'recentBookings' => $recentBookings,
            'revenueTrend' => $revenueTrend,
            'salesByCategory' => $salesByCategory,
            'paymentStatusOverview' => $paymentStatusOverview,
        ]);
    }
}
