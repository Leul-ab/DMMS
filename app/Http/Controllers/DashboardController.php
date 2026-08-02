<?php

namespace App\Http\Controllers;

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
        /*
        |--------------------------------------------------------------------------
        | Order Statistics
        |--------------------------------------------------------------------------
        */

        $totalOrders = Order::count();

        $pendingOrders = Order::where('status', 'pending')->count();

        $receivedOrders = Order::where('status', 'received')->count();

        $completedOrders = Order::where('status', 'completed')->count();

        $cancelledOrders = Order::where('status', 'cancelled')->count();

        $totalRevenue = Order::where('status', 'completed')
            ->sum('total_amount');


        /*
        |--------------------------------------------------------------------------
        | Customer Statistics
        |--------------------------------------------------------------------------
        */

        $totalCustomers = Customer::count();

        $memberCustomers = Customer::where('is_member', true)->count();

        $nonMemberCustomers = Customer::where('is_member', false)->count();


        /*
        |--------------------------------------------------------------------------
        | Restaurant Table Statistics
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

        $awaitingPaymentTables = RestaurantTable::where(
            'status',
            'awaiting_payment'
        )->count();


        /*
        |--------------------------------------------------------------------------
        | Menu Statistics
        |--------------------------------------------------------------------------
        */

        $totalCategories = MenuCategory::count();

        $activeCategories = MenuCategory::where(
            'is_active',
            true
        )->count();

        $totalMenuItems = MenuItem::count();

        $availableMenuItems = MenuItem::where(
            'is_available',
            true
        )->count();

        $unavailableMenuItems = MenuItem::where(
            'is_available',
            false
        )->count();

        $featuredMenuItems = MenuItem::where(
            'featured',
            true
        )->count();


        /*
        |--------------------------------------------------------------------------
        | Recent Orders
        |--------------------------------------------------------------------------
        */

        $recentOrders = Order::with('table')
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

        $orderStatusOverview = Order::select(
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

        $revenueRowsByDate = Order::where(
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
            ->groupBy('category')
            ->orderByDesc('sales')
            ->get();


        /*
        |--------------------------------------------------------------------------
        | Payment Status Overview
        |--------------------------------------------------------------------------
        */

        $paymentStatusOverview = Order::select(
            'payment_status',
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(total_amount) as total')
        )
            ->groupBy('payment_status')
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
            ->select(
                'menu_items.id',
                'menu_items.name',
                DB::raw(
                    'SUM(order_items.quantity) as total_quantity'
                )
            )
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

      $recentBookings = TableBooking::with(['customer', 'tables'])
    ->latest()
    ->take(5)
    ->get()
            ->map(function ($booking) {
                return (object) [
                    'id' => $booking->id,
                    'customer_name' => $booking->customer?->name ?? 'Unknown',
                    'customer_phone' => $booking->customer?->phone ?? 'N/A',
                    'tables' => $booking->tables->map(fn($t) => [
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
        ]);
    }
}

