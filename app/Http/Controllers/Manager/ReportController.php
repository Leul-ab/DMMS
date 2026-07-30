<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantTable;
use Carbon\Carbon;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Display the restaurant reports dashboard.
     */
    public function index()
    {
        /*
        |--------------------------------------------------------------------------
        | Revenue
        |--------------------------------------------------------------------------
        | Revenue is calculated only from orders that are:
        | - completed
        | - paid
        |
        | The order's created_at date is used for the report period.
        |--------------------------------------------------------------------------
        */

        $todayRevenue = $this->revenueForPeriod(
            Carbon::today(),
            Carbon::today()->endOfDay()
        );

        $weekRevenue = $this->revenueForPeriod(
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        );

        $monthRevenue = $this->revenueForPeriod(
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth()
        );

        $yearRevenue = $this->revenueForPeriod(
            Carbon::now()->startOfYear(),
            Carbon::now()->endOfYear()
        );

        $revenue = [
            'daily' => $todayRevenue['revenue'],
            'weekly' => $weekRevenue['revenue'],
            'monthly' => $monthRevenue['revenue'],
            'annual' => $yearRevenue['revenue'],
        ];

        $revenueDetails = [
            'today' => $todayRevenue,
            'this_week' => $weekRevenue,
            'this_month' => $monthRevenue,
            'this_year' => $yearRevenue,
        ];

        /*
        |--------------------------------------------------------------------------
        | Order Statistics
        |--------------------------------------------------------------------------
        */

        $todayOrders = Order::query()
            ->whereDate('created_at', Carbon::today());

        $weekOrders = Order::query()
            ->whereBetween('created_at', [
                Carbon::now()->startOfWeek(),
                Carbon::now()->endOfWeek(),
            ]);

        $orderStatistics = [
            'today' => [
                'total' => (clone $todayOrders)->count(),

                'completed' => (clone $todayOrders)
                    ->where('status', 'completed')
                    ->count(),

                'pending' => (clone $todayOrders)
                    ->where('status', 'pending')
                    ->count(),

                'cancelled' => (clone $todayOrders)
                    ->where('status', 'cancelled')
                    ->count(),
            ],

            'this_week' => [
                'total' => (clone $weekOrders)->count(),

                'completed' => (clone $weekOrders)
                    ->where('status', 'completed')
                    ->count(),

                'pending' => (clone $weekOrders)
                    ->where('status', 'pending')
                    ->count(),

                'cancelled' => (clone $weekOrders)
                    ->where('status', 'cancelled')
                    ->count(),
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Popular Menu Items
        |--------------------------------------------------------------------------
        | Uses real order_items data.
        | Only completed and paid orders are counted as sales.
        |--------------------------------------------------------------------------
        */

        $popularMenuItems = OrderItem::query()
            ->selectRaw(
                'menu_item_id, SUM(order_items.quantity) as quantity'
            )
            ->whereHas('order', function ($query) {
                $query
                    ->where('status', 'completed')
                    ->where('payment_status', 'paid');
            })
            ->with('menuItem:id,name')
            ->groupBy('menu_item_id')
            ->orderByDesc('quantity')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'menu_item_id' => $item->menu_item_id,
                    'name' => $item->menuItem?->name ?? 'Unknown Item',
                    'quantity' => (int) $item->quantity,
                ];
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Table Performance
        |--------------------------------------------------------------------------
        */

        $totalTables = RestaurantTable::count();

        $availableTables = RestaurantTable::where(
            'status',
            'available'
        )->count();

        $occupiedTables = RestaurantTable::where(
            'status',
            'occupied'
        )->count();

        $usageRate = $totalTables > 0
            ? round(($occupiedTables / $totalTables) * 100, 2)
            : 0;

        /*
        |--------------------------------------------------------------------------
        | Most Used Tables
        |--------------------------------------------------------------------------
        | Counts completed and paid orders for each table.
        |--------------------------------------------------------------------------
        */

        $mostUsedTables = RestaurantTable::query()
            ->select('restaurant_tables.table_number')
            ->selectRaw(
                'COUNT(orders.id) as orders'
            )
            ->leftJoin(
                'orders',
                'restaurant_tables.id',
                '=',
                'orders.table_id'
            )
            ->where(function ($query) {
                $query
                    ->where('orders.status', 'completed')
                    ->where('orders.payment_status', 'paid')
                    ->orWhereNull('orders.id');
            })
            ->groupBy(
                'restaurant_tables.id',
                'restaurant_tables.table_number'
            )
            ->orderByDesc('orders')
            ->limit(10)
            ->get()
            ->map(function ($table) {
                return [
                    'table_number' => (int) $table->table_number,
                    'orders' => (int) $table->orders,
                ];
            })
            ->values();

        $tablePerformance = [
            'total' => $totalTables,
            'available' => $availableTables,
            'occupied' => $occupiedTables,
            'usageRate' => $usageRate,
            'mostUsed' => $mostUsedTables,
        ];

        /*
        |--------------------------------------------------------------------------
        | Send Data To Inertia
        |--------------------------------------------------------------------------
        */

        return Inertia::render('manager/reports/index', [
            'revenue' => $revenue,
            'revenueDetails' => $revenueDetails,
            'orderStatistics' => $orderStatistics,
            'popularMenuItems' => $popularMenuItems,
            'tablePerformance' => $tablePerformance,
        ]);
    }

    /**
     * Calculate revenue for a specific period.
     */
    private function revenueForPeriod(
        Carbon $start,
        Carbon $end
    ): array {
        $orders = Order::query()
            ->where('status', 'completed')
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [
                $start,
                $end,
            ]);

        return [
            'revenue' => (float) $orders->sum('total_amount'),
            'orders' => $orders->count(),
        ];
    }
}
