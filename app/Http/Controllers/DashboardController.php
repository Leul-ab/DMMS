<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $branchId = Branch::current()?->id;

        /*
        |--------------------------------------------------------------------------
        | Order Statistics
        |--------------------------------------------------------------------------
        */

        $totalOrders = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->count();

        $pendingOrders = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('status', 'pending')->count();

        $receivedOrders = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('status', 'received')->count();

        $completedOrders = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('status', 'completed')->count();

        $cancelledOrders = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('status', 'cancelled')->count();

        $totalRevenue = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('status', 'completed')
            ->sum('total_amount');

        /*
        |--------------------------------------------------------------------------
        | Customer Statistics
        |--------------------------------------------------------------------------
        */

        $totalCustomers = Customer::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->count();

        $memberCustomers = Customer::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('is_member', true)->count();

        $nonMemberCustomers = Customer::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where('is_member', false)->count();

        /*
        |--------------------------------------------------------------------------
        | Restaurant Table Statistics
        |--------------------------------------------------------------------------
        */

        $totalTables = RestaurantTable::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->count();

        $availableTables = RestaurantTable::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'status',
                'available'
            )->count();

        $occupiedTables = RestaurantTable::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'status',
                'occupied'
            )->count();

        $awaitingPaymentTables = RestaurantTable::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'status',
                'awaiting_payment'
            )->count();

        /*
        |--------------------------------------------------------------------------
        | Menu Statistics
        |--------------------------------------------------------------------------
        */

        $totalCategories = MenuCategory::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->count();

        $activeCategories = MenuCategory::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'is_active',
                true
            )->count();

        $totalMenuItems = MenuItem::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->count();

        $availableMenuItems = MenuItem::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'is_available',
                true
            )->count();

        $unavailableMenuItems = MenuItem::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'is_available',
                false
            )->count();

        $featuredMenuItems = MenuItem::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'featured',
                true
            )->count();

        /*
        |--------------------------------------------------------------------------
        | Recent Orders
        |--------------------------------------------------------------------------
        */

        $recentOrders = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
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

        $orderStatusOverview = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->select(
                'status',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('status')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Revenue Trend (Last 14 Days)
        |--------------------------------------------------------------------------
        */

        $revenueRowsByDate = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->where(
                'status',
                'completed'
            )
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
            ->groupBy('date')
            ->get()
            ->keyBy('date');

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
        | Sales By Category
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
            ->select(
                DB::raw(
                    "COALESCE(menu_categories.name, 'Uncategorized') as category"
                ),
                DB::raw(
                    'SUM(order_items.quantity * order_items.price) as sales'
                )
            )
            ->where('orders.status', 'completed')
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->groupBy('category')
            ->orderByDesc('sales')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Payment Status Overview
        |--------------------------------------------------------------------------
        */

        $paymentStatusOverview = Order::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->select(
                'payment_status',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_amount) as total')
            )
            ->groupBy('payment_status')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Customer Feedback Analytics
        |--------------------------------------------------------------------------
        */

        $feedbackAvg = \App\Models\Feedback::selectRaw(
            'AVG(overall_rating) as overall_rating'
        )->first();

        $totalReviews = \App\Models\Feedback::count();

        $feedbackAnalytics = [
            'totalReviews' => $totalReviews,
            'averageRating' => $feedbackAvg->overall_rating
                ? round((float) $feedbackAvg->overall_rating, 1)
                : 0,
            'overallRating' => $feedbackAvg->overall_rating
                ? round((float) $feedbackAvg->overall_rating, 1)
                : 0,
        ];

        /*
        |--------------------------------------------------------------------------
        | Recent Customer Reviews
        |--------------------------------------------------------------------------
        */

        $recentFeedback = \App\Models\Feedback::with(['customer', 'order'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($feedback) {
                return [
                    'id' => $feedback->id,
                    'order_id' => $feedback->order_id,
                    'customer_name' => $feedback->anonymous
                        ? 'Anonymous Customer'
                        : ($feedback->customer?->name ?? 'Customer'),
                    'order_number' => $feedback->order?->order_number ?? 'N/A',
                    'overall_rating' => $feedback->overall_rating,
                    'comment' => $feedback->comment,
                    'created_at' => $feedback->created_at,
                ];
            });

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
            ->select(
                'menu_items.id',
                'menu_items.name',
                DB::raw(
                    'SUM(order_items.quantity) as total_quantity'
                )
            )
            ->when($branchId, fn ($query) => $query->where('order_items.branch_id', $branchId))
            ->groupBy(
                'menu_items.id',
                'menu_items.name'
            )
            ->orderByDesc('total_quantity')
            ->take(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Recent Table Bookings
        |--------------------------------------------------------------------------
        */

        $recentBookings = TableBooking::when($branchId, fn ($query) => $query->where('branch_id', $branchId))
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

        /*
        |--------------------------------------------------------------------------
        | Return Dashboard
        |--------------------------------------------------------------------------
        */

        return Inertia::render('dashboard', [

            /*
            |--------------------------------------------------------------------------
            | Main Statistics
            |--------------------------------------------------------------------------
            */

            'stats' => [
                'totalOrders' => $totalOrders,
                'pendingOrders' => $pendingOrders,
                'receivedOrders' => $receivedOrders,
                'completedOrders' => $completedOrders,
                'cancelledOrders' => $cancelledOrders,

                'totalRevenue' => $totalRevenue,

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

            /*
            |--------------------------------------------------------------------------
            | Dashboard Sections
            |--------------------------------------------------------------------------
            */

            'recentOrders' => $recentOrders,

            'orderStatusOverview' => $orderStatusOverview,

            'popularMenuItems' => $popularMenuItems,

            'recentBookings' => $recentBookings,

            'revenueTrend' => $revenueTrend,

            'salesByCategory' => $salesByCategory,

            'paymentStatusOverview' => $paymentStatusOverview,

            'feedbackAnalytics' => $feedbackAnalytics,

            'recentFeedback' => $recentFeedback,
        ]);
    }
}
