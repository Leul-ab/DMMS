<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantTable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Display reports for the currently selected branch.
     */
    public function index(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Get Current Branch
        |--------------------------------------------------------------------------
        |
        | The selected branch is stored in the session by
        | BranchContextController.
        |
        */
        $branchId = $request->session()->get('current_branch_id');

        $tab = $request->input('tab', 'revenue');
        $period = $request->input('period', 'daily');

        $allowedTabs = [
            'revenue',
            'orders',
            'top-tables',
            'top-foods',
            'sales',
        ];

        $allowedPeriods = [
            'daily',
            'weekly',
            'monthly',
            'annual',
        ];

        /*
        |--------------------------------------------------------------------------
        | Validate Tab
        |--------------------------------------------------------------------------
        */

        if (!in_array($tab, $allowedTabs)) {
            $tab = 'revenue';
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Period
        |--------------------------------------------------------------------------
        */

        if (!in_array($period, $allowedPeriods)) {
            $period = 'daily';
        }

        /*
        |--------------------------------------------------------------------------
        | No Branch Selected
        |--------------------------------------------------------------------------
        |
        | Never show combined data from all branches.
        | The user must select a branch first.
        |
        */

        if (!$branchId) {
            return Inertia::render('manager/reports/index', [
                'activeTab' => $tab,
                'period' => $period,
                'reportData' => [],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Generate Report
        |--------------------------------------------------------------------------
        */

        $reportData = match ($tab) {
            'revenue' => $this->revenueReport($period, $branchId),

            'orders' => $this->ordersReport($period, $branchId),

            'top-tables' => $this->topTablesReport(
                $period,
                $branchId
            ),

            'top-foods' => $this->topFoodsReport(
                $period,
                $branchId
            ),

            'sales' => $this->salesReport(
                $period,
                $branchId
            ),
        };

        return Inertia::render('manager/reports/index', [
            'activeTab' => $tab,
            'period' => $period,
            'reportData' => $reportData,
        ]);
    }

    /**
     * Get the correct date format based on the selected period.
     */
    private function getDateFormat(string $period): string
    {
        return match ($period) {
            'daily' => '%Y-%m-%d',

            'weekly' => '%Y-%u',

            'monthly' => '%Y-%m',

            'annual' => '%Y',

            default => '%Y-%m-%d',
        };
    }

    /**
     * Revenue Report
     *
     * Shows revenue and order count
     * only for the current branch.
     */
    private function revenueReport(
        string $period,
        int $branchId
    ) {
        $dateFormat = $this->getDateFormat($period);

        return Order::query()
            ->where('orders.branch_id', $branchId)
            ->select(
                DB::raw(
                    "DATE_FORMAT(orders.created_at, '{$dateFormat}') as period"
                ),
                DB::raw(
                    'COUNT(*) as total_orders'
                ),
                DB::raw(
                    'SUM(orders.total_amount) as revenue'
                )
            )
            ->groupBy('period')
            ->orderByDesc('period')
            ->get();
    }

    /**
     * Order Statistics Report
     *
     * Shows order statistics
     * only for the current branch.
     */
    private function ordersReport(
        string $period,
        int $branchId
    ) {
        $dateFormat = $this->getDateFormat($period);

        return Order::query()
            ->where('orders.branch_id', $branchId)
            ->select(
                DB::raw(
                    "DATE_FORMAT(orders.created_at, '{$dateFormat}') as period"
                ),
                DB::raw(
                    'COUNT(*) as total_orders'
                ),
                DB::raw(
                    "SUM(
                        CASE
                            WHEN orders.status = 'completed'
                            THEN 1
                            ELSE 0
                        END
                    ) as completed"
                ),
                DB::raw(
                    "SUM(
                        CASE
                            WHEN orders.status = 'pending'
                            THEN 1
                            ELSE 0
                        END
                    ) as pending"
                ),
                DB::raw(
                    "SUM(
                        CASE
                            WHEN orders.status = 'cancelled'
                            THEN 1
                            ELSE 0
                        END
                    ) as cancelled"
                )
            )
            ->groupBy('period')
            ->orderByDesc('period')
            ->get();
    }

    /**
     * Top Tables Report
     *
     * Shows the most frequently used tables
     * only for the current branch.
     */
    private function topTablesReport(
        string $period,
        int $branchId
    ) {
        $dateFormat = $this->getDateFormat($period);

        return Order::query()
            ->join(
                'restaurant_tables',
                'orders.table_id',
                '=',
                'restaurant_tables.id'
            )
            ->where(
                'orders.branch_id',
                $branchId
            )
            ->where(
                'restaurant_tables.branch_id',
                $branchId
            )
            ->select(
                'restaurant_tables.table_number',

                DB::raw(
                    'COUNT(orders.id) as times_used'
                ),

                DB::raw(
                    'SUM(orders.total_amount) as revenue'
                ),

                DB::raw(
                    "DATE_FORMAT(
                        orders.created_at,
                        '{$dateFormat}'
                    ) as period"
                )
            )
            ->groupBy(
                'restaurant_tables.table_number',
                'period'
            )
            ->orderByDesc('times_used')
            ->get();
    }

    /**
     * Top Foods Report
     *
     * Shows the most ordered menu items
     * only for the current branch.
     */
    private function topFoodsReport(
        string $period,
        int $branchId
    ) {
        $dateFormat = $this->getDateFormat($period);

        return OrderItem::query()
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
            ->where(
                'orders.branch_id',
                $branchId
            )
            ->where(
                'menu_items.branch_id',
                $branchId
            )
            ->select(
                'menu_items.name as food',

                'menu_categories.name as category',

                DB::raw(
                    'SUM(order_items.quantity) as quantity_ordered'
                ),

                DB::raw(
                    'SUM(
                        order_items.quantity * order_items.price
                    ) as revenue'
                ),

                DB::raw(
                    "DATE_FORMAT(
                        orders.created_at,
                        '{$dateFormat}'
                    ) as period"
                )
            )
            ->groupBy(
                'menu_items.name',
                'menu_categories.name',
                'period'
            )
            ->orderByDesc('quantity_ordered')
            ->get();
    }

    /**
     * Sales Report
     *
     * Shows sales by food item
     * only for the current branch.
     */
    private function salesReport(
        string $period,
        int $branchId
    ) {
        $dateFormat = $this->getDateFormat($period);

        return OrderItem::query()
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
            ->where(
                'orders.branch_id',
                $branchId
            )
            ->where(
                'menu_items.branch_id',
                $branchId
            )
            ->select(
                'menu_items.name as food',

                DB::raw(
                    'SUM(order_items.quantity) as quantity_sold'
                ),

                DB::raw(
                    'AVG(order_items.price) as unit_price'
                ),

                DB::raw(
                    'SUM(
                        order_items.quantity * order_items.price
                    ) as total_sales'
                ),

                DB::raw(
                    "DATE_FORMAT(
                        orders.created_at,
                        '{$dateFormat}'
                    ) as period"
                )
            )
            ->groupBy(
                'menu_items.name',
                'period'
            )
            ->orderByDesc('total_sales')
            ->get();
    }
}
