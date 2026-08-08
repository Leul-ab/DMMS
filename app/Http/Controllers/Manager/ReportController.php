<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $tab = $request->input('tab', 'revenue');
        $period = $request->input('period', 'daily');
        $branch = $request->input('branch');

        $allowedTabs = [
            'revenue',
            'orders',
            'top-tables',
            'top-foods',
            'sales',
            'user-performance',
        ];

        $allowedPeriods = [
            'daily',
            'weekly',
            'monthly',
            'annual',
        ];

        if (! in_array($tab, $allowedTabs)) {
            $tab = 'revenue';
        }

        if (! in_array($period, $allowedPeriods)) {
            $period = 'daily';
        }

        $branchId = $branch ?: Branch::current()?->id;

        $reportData = match ($tab) {
            'revenue' => $this->revenueReport($period, $branchId),
            'orders' => $this->ordersReport($period, $branchId),
            'top-tables' => $this->topTablesReport($period, $branchId),
            'top-foods' => $this->topFoodsReport($period, $branchId),
            'sales' => $this->salesReport($period, $branchId),
            'user-performance' => $this->userPerformanceReport($period, $branchId),
        };

        return Inertia::render('manager/reports/index', [
            'activeTab' => $tab,
            'period' => $period,
            'branch' => $branch,
            'reportData' => $reportData,
        ]);
    }

    private function getDateFormat(string $period): string
    {
        return match ($period) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-%u',
            'monthly' => '%Y-%m',
            'annual' => '%Y',
        };
    }

    private function revenueReport(string $period, ?int $branchId)
    {
        $dateFormat = $this->getDateFormat($period);

        return Order::query()
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->select(
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as revenue')
            )
            ->groupBy('period')
            ->orderByDesc('period')
            ->get();
    }

    private function ordersReport(string $period, ?int $branchId)
    {
        $dateFormat = $this->getDateFormat($period);

        return Order::query()
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->select(
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
                DB::raw('COUNT(*) as total_orders'),
                DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending"),
                DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
            )
            ->groupBy('period')
            ->orderByDesc('period')
            ->get();
    }

    private function topTablesReport(string $period, ?int $branchId)
    {
        $dateFormat = $this->getDateFormat($period);

        return Order::query()
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->join(
                'restaurant_tables',
                'orders.table_id',
                '=',
                'restaurant_tables.id'
            )
            ->select(
                'restaurant_tables.table_number',
                DB::raw('COUNT(orders.id) as times_used'),
                DB::raw('SUM(orders.total_amount) as revenue'),
                DB::raw("DATE_FORMAT(orders.created_at, '{$dateFormat}') as period")
            )
            ->groupBy(
                'restaurant_tables.table_number',
                'period'
            )
            ->orderByDesc('times_used')
            ->get();
    }

    private function topFoodsReport(string $period, ?int $branchId)
    {
        $dateFormat = $this->getDateFormat($period);

        return OrderItem::query()
            ->when($branchId, fn ($query) => $query->where('order_items.branch_id', $branchId))
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
            ->select(
                'menu_items.name as food',
                'menu_categories.name as category',
                DB::raw('SUM(order_items.quantity) as quantity_ordered'),
                DB::raw('SUM(order_items.quantity * order_items.price) as revenue'),
                DB::raw("DATE_FORMAT(orders.created_at, '{$dateFormat}') as period")
            )
            ->groupBy(
                'menu_items.name',
                'menu_categories.name',
                'period'
            )
            ->orderByDesc('quantity_ordered')
            ->get();
    }

    private function salesReport(string $period, ?int $branchId)
    {
        $dateFormat = $this->getDateFormat($period);

        return OrderItem::query()
            ->when($branchId, fn ($query) => $query->where('order_items.branch_id', $branchId))
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
            ->select(
                'menu_items.name as food',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('AVG(order_items.price) as unit_price'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_sales'),
                DB::raw("DATE_FORMAT(orders.created_at, '{$dateFormat}') as period")
            )
            ->groupBy(
                'menu_items.name',
                'period'
            )
            ->orderByDesc('total_sales')
            ->get();
    }

    private function userPerformanceReport(string $period, ?int $branchId)
    {
        $query = User::query()
            ->when($branchId, fn ($query) => $query->where('users.branch_id', $branchId))
            ->join('orders', 'orders.served_by', '=', 'users.id')
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->leftJoin('branches', 'users.branch_id', '=', 'branches.id')
            ->select(
                'users.name',
                DB::raw('roles.name as role'),
                DB::raw('branches.name as branch'),
                DB::raw('COUNT(orders.id) as total_orders'),
                DB::raw("SUM(CASE WHEN orders.status = 'completed' THEN 1 ELSE 0 END) as completed_orders"),
                DB::raw("SUM(CASE WHEN orders.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders"),
                DB::raw('SUM(orders.total_amount) as revenue')
            )
            ->groupBy('users.id', 'users.name', 'roles.name', 'branches.name')
            ->orderByDesc('revenue');

        $now = now();

        $query->when(
            $period === 'daily',
            fn ($q) => $q->whereDate('orders.created_at', $now->toDateString())
        )->when(
            $period === 'weekly',
            fn ($q) => $q->whereBetween('orders.created_at', [$now->startOfWeek(), $now->endOfWeek()])
        )->when(
            $period === 'monthly',
            fn ($q) => $q->whereBetween('orders.created_at', [$now->startOfMonth(), $now->endOfMonth()])
        )->when(
            $period === 'annual',
            fn ($q) => $q->whereBetween('orders.created_at', [$now->startOfYear(), $now->endOfYear()])
        );

        return $query->get();
    }
}
