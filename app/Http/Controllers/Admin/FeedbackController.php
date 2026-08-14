<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\MenuItem;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FeedbackController extends Controller
{
    /**
     * Display the admin feedback management dashboard.
     */
    public function index(Request $request): Response
    {
        try {
            $query = $this->buildQuery($request);

            $sort = $request->query('sort', 'newest');
            $query = $this->applySort($query, $sort);

            $perPage = (int) $request->query('per_page', 10);
            if (! in_array($perPage, [10, 25, 50, 100])) {
                $perPage = 10;
            }

            $feedbacks = $query->paginate($perPage)
                ->withQueryString();

            // Analytics
            $analytics = $this->getAnalytics();
            $distribution = $this->getRatingDistribution();

            // Filter options
            $tables = RestaurantTable::orderBy('table_number')->get(['id', 'table_number']);
            $waiters = User::whereHas('roles', function ($q) {
                $q->where('slug', 'waiter');
            })->orderBy('name')->get(['id', 'name']);
            $menuItems = MenuItem::orderBy('name')->get(['id', 'name']);
        } catch (\Throwable $e) {
            // Never render a blank page: log the exception and return a safe fallback.
            logger()->error('Unable to load customer feedback in AdminFeedbackController@index.', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $feedbacks = new \Illuminate\Pagination\LengthAwarePaginator(
                [],
                0,
                $perPage ?? 10,
                1,
                ['path' => $request->url(), 'query' => $request->query()]
            );

            $analytics = [
                'totalReviews' => 0,
                'averageRating' => 0,
                'foodRating' => 0,
                'serviceRating' => 0,
                'speedRating' => 0,
                'cleanlinessRating' => 0,
                'overallRating' => 0,
                'positiveReviews' => 0,
                'negativeReviews' => 0,
                'todayReviews' => 0,
            ];
            $distribution = [];
            $tables = collect();
            $waiters = collect();
            $menuItems = collect();
            $error = 'Unable to load customer feedback. Please try again later.';
        }

        return Inertia::render('admin/feedback/index', [
            'feedbacks' => $feedbacks,
            'analytics' => $analytics,
            'distribution' => $distribution,
            'tables' => $tables,
            'waiters' => $waiters,
            'menuItems' => $menuItems,
            'filters' => $request->only([
                'search', 'rating', 'date', 'table', 'waiter', 'menu_item', 'sort', 'per_page',
            ]),
            'error' => $error ?? null,
        ]);
    }

    /**
     * Export feedback to CSV (respects current filters).
     */
    public function export(Request $request): StreamedResponse
    {
        $query = $this->buildQuery($request);
        $query = $this->applySort($query, $request->query('sort', 'newest'));

        $feedbacks = $query->with([
            'customer',
            'order.orderItems.menuItem',
            'order.table',
            'order.waiterAssignments.waiter',
        ])->get();

        $filename = 'feedback-report-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($feedbacks) {
            $handle = fopen('php://output', 'w');

             fputcsv($handle, [
                'Customer', 'Phone', 'Order ID', 'Table', 'Menu Items',
                'Overall Rating', 'Comment', 'Waiter', 'Date',
            ]);

            foreach ($feedbacks as $feedback) {
                $menuItems = $feedback->order->orderItems
                    ->pluck('menu_item.name')
                    ->unique()
                    ->implode(', ');

                $waiter = $feedback->order->waiterAssignments->first()?->waiter?->name ?? 'N/A';

                fputcsv($handle, [
                    $feedback->anonymous ? 'Anonymous Customer' : ($feedback->customer?->name ?? 'N/A'),
                    $feedback->customer?->phone ?? 'N/A',
                    $feedback->order->order_number ?? 'N/A',
                    $feedback->order->table?->table_number ?? 'N/A',
                    $menuItems,
                    $feedback->overall_rating,
                    $feedback->comment ?? '',
                    $waiter,
                    $feedback->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Build the feedback query with all filters applied.
     */
    protected function buildQuery(Request $request)
    {
        $query = Feedback::with([
            'customer',
            'order.orderItems.menuItem',
            'order.table',
            'order.waiterAssignments.waiter',
        ]);

        // Search by comment, customer name, customer phone, or order number
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('order', function ($oq) use ($search) {
                        $oq->where('order_number', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by minimum overall rating
        if ($rating = $request->query('rating')) {
            if ($rating !== 'all') {
                $query->where('overall_rating', '>=', (int) $rating);
            }
        }

        // Filter by date range
        if ($date = $request->query('date')) {
            if ($date === 'today') {
                $query->whereDate('created_at', today());
            } elseif ($date === 'week') {
                $query->where('created_at', '>=', now()->subWeek());
            } elseif ($date === 'month') {
                $query->where('created_at', '>=', now()->subMonth());
            }
        }

        // Filter by table
        if ($tableId = $request->query('table')) {
            if ($tableId !== 'all') {
                $query->whereHas('order', function ($oq) use ($tableId) {
                    $oq->where('table_id', (int) $tableId);
                });
            }
        }

        // Filter by waiter
        if ($waiterId = $request->query('waiter')) {
            if ($waiterId !== 'all') {
                $query->whereHas('order.waiterAssignments', function ($wq) use ($waiterId) {
                    $wq->where('waiter_id', (int) $waiterId);
                });
            }
        }

        // Filter by menu item
        if ($menuItemId = $request->query('menu_item')) {
            if ($menuItemId !== 'all') {
                $query->whereHas('order.orderItems', function ($mq) use ($menuItemId) {
                    $mq->where('menu_item_id', (int) $menuItemId);
                });
            }
        }

        return $query;
    }

    /**
     * Apply sorting to the query.
     */
    protected function applySort($query, string $sort)
    {
        return match ($sort) {
            'highest' => $query->orderByDesc('overall_rating')->latest(),
            'lowest' => $query->orderBy('overall_rating')->latest(),
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };
    }

    /**
     * Calculate analytics summary.
     */
    protected function getAnalytics(): array
    {
        $avg = Feedback::selectRaw(
            'AVG(overall_rating) as overall_rating'
        )->first();

        $totalReviews = Feedback::count();
        $positiveReviews = Feedback::where('overall_rating', '>=', 4)->count();
        $negativeReviews = Feedback::where('overall_rating', '<=', 2)->count();
        $todayReviews = Feedback::whereDate('created_at', today())->count();

        return [
            'totalReviews' => $totalReviews,
            'averageRating' => $avg->overall_rating ? round((float) $avg->overall_rating, 1) : 0,
            'overallRating' => $avg->overall_rating ? round((float) $avg->overall_rating, 1) : 0,
            'positiveReviews' => $positiveReviews,
            'negativeReviews' => $negativeReviews,
            'todayReviews' => $todayReviews,
        ];
    }

    /**
     * Get rating distribution (5-star through 1-star counts).
     */
    protected function getRatingDistribution(): array
    {
        $rows = Feedback::select('overall_rating', DB::raw('COUNT(*) as count'))
            ->groupBy('overall_rating')
            ->pluck('count', 'overall_rating');

        $total = Feedback::count();

        $distribution = [];
        for ($star = 5; $star >= 1; $star--) {
            $count = (int) ($rows[$star] ?? 0);
            $distribution[] = [
                'stars' => $star,
                'count' => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
            ];
        }

        return $distribution;
    }
}
