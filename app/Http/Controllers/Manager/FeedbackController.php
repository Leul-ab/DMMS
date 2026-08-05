<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FeedbackController extends Controller
{
    /**
     * Display the feedback report with analytics.
     */
    public function index(Request $request): Response
    {
        $query = $this->buildQuery($request);

        $sort = $request->query('sort', 'newest');
        $query = $this->applySort($query, $sort);

        $feedbacks = $query->paginate(15)
            ->withQueryString();

        // Analytics (respect filters where applicable)
        $analytics = $this->getAnalytics($request);
        $distribution = $this->getRatingDistribution($request);
        $recentFeedback = $this->getRecentFeedback();

        $menuItems = MenuItem::orderBy('name')->get(['id', 'name']);
        $waiters = User::whereHas('roles', function ($q) {
            $q->where('slug', 'waiter');
        })->orderBy('name')->get(['id', 'name']);

        return Inertia::render('manager/feedback/index', [
            'feedbacks' => $feedbacks,
            'analytics' => $analytics,
            'distribution' => $distribution,
            'recentFeedback' => $recentFeedback,
            'menuItems' => $menuItems,
            'waiters' => $waiters,
            'filters' => $request->only([
                'search', 'rating', 'date', 'customer', 'order_id', 'waiter', 'menu_item', 'sort',
            ]),
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

            // CSV headers
            fputcsv($handle, [
                'Customer', 'Order ID', 'Menu Items',
                'Overall Rating', 'Comment', 'Date', 'Waiter',
            ]);

            foreach ($feedbacks as $feedback) {
                $menuItems = $feedback->order->orderItems
                    ->pluck('menu_item.name')
                    ->unique()
                    ->implode(', ');

                $waiter = $feedback->order->waiterAssignments->first()?->waiter?->name ?? 'N/A';

                fputcsv($handle, [
                    $feedback->anonymous ? 'Anonymous Customer' : ($feedback->customer?->name ?? 'N/A'),
                    $feedback->order->order_number ?? 'N/A',
                    $menuItems,
                    $feedback->overall_rating,
                    $feedback->comment ?? '',
                    $feedback->created_at->format('Y-m-d H:i:s'),
                    $waiter,
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

        // Search by comment, customer name, or order number
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
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

        // Filter by customer name
        if ($customer = $request->query('customer')) {
            $query->whereHas('customer', function ($cq) use ($customer) {
                $cq->where('name', 'like', "%{$customer}%");
            });
        }

        // Filter by order ID
        if ($orderId = $request->query('order_id')) {
            $query->whereHas('order', function ($oq) use ($orderId) {
                $oq->where('order_number', 'like', "%{$orderId}%");
            });
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
     * Calculate analytics (respecting active filters when rating filter applied).
     */
    protected function getAnalytics(Request $request): array
    {
        // For overall analytics, only respect the date filter, not narrow filters
        $analyticsQuery = Feedback::query();

        if ($date = $request->query('date')) {
            if ($date === 'today') {
                $analyticsQuery->whereDate('created_at', today());
            } elseif ($date === 'week') {
                $analyticsQuery->where('created_at', '>=', now()->subWeek());
            } elseif ($date === 'month') {
                $analyticsQuery->where('created_at', '>=', now()->subMonth());
            }
        }

        $avg = (clone $analyticsQuery)->selectRaw(
            'AVG(overall_rating) as overall_rating'
        )->first();

        $totalReviews = (clone $analyticsQuery)->count();

        // Positive = overall >= 4, Negative = overall <= 2, Neutral = 3
        $positiveReviews = (clone $analyticsQuery)->where('overall_rating', '>=', 4)->count();
        $negativeReviews = (clone $analyticsQuery)->where('overall_rating', '<=', 2)->count();

        return [
            'totalReviews' => $totalReviews,
            'averageRating' => $avg->overall_rating ? round((float) $avg->overall_rating, 1) : 0,
            'overallRating' => $avg->overall_rating ? round((float) $avg->overall_rating, 1) : 0,
            'positiveReviews' => $positiveReviews,
            'negativeReviews' => $negativeReviews,
        ];
    }

    /**
     * Get rating distribution (5-star through 1-star counts).
     */
    protected function getRatingDistribution(Request $request): array
    {
        $query = Feedback::query();

        if ($date = $request->query('date')) {
            if ($date === 'today') {
                $query->whereDate('created_at', today());
            } elseif ($date === 'week') {
                $query->where('created_at', '>=', now()->subWeek());
            } elseif ($date === 'month') {
                $query->where('created_at', '>=', now()->subMonth());
            }
        }

        $rows = (clone $query)
            ->select('overall_rating', DB::raw('COUNT(*) as count'))
            ->groupBy('overall_rating')
            ->pluck('count', 'overall_rating');

        $distribution = [];
        for ($star = 5; $star >= 1; $star--) {
            $distribution[] = [
                'stars' => $star,
                'count' => (int) ($rows[$star] ?? 0),
            ];
        }

        return $distribution;
    }

    /**
     * Get the 5 most recent feedback entries.
     */
    protected function getRecentFeedback(): array
    {
        return Feedback::with([
            'customer',
            'order.orderItems.menuItem',
        ])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($feedback) {
                return [
                    'id' => $feedback->id,
                    'overall_rating' => $feedback->overall_rating,
                    'comment' => $feedback->comment,
                    'created_at' => $feedback->created_at->diffForHumans(),
                    'customer_name' => $feedback->anonymous
                        ? 'Anonymous Customer'
                        : ($feedback->customer?->name ?? 'Customer'),
                ];
            })
            ->toArray();
    }
}
