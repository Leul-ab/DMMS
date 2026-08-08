import { Head, router } from '@inertiajs/react';
import {
    Search,
    Star,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    Download,
    Filter,
    Clock,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { StarRating } from '@/components/star-rating';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type FeedbackItem = {
    id: number;
    overall_rating: number;
    comment: string | null;
    anonymous: boolean;
    created_at: string;
    customer: { id: number; name: string } | null;
    order: {
        id: number;
        order_number: string;
        table: { id: number; table_number: number } | null;
        order_items: {
            id: number;
            quantity: number;
            menu_item: { id: number; name: string };
        }[];
        waiter_assignments: {
            id: number;
            waiter: { id: number; name: string } | null;
        }[];
    };
};

type Analytics = {
    totalReviews: number;
    averageRating: number;
    overallRating: number;
    positiveReviews: number;
    negativeReviews: number;
};

type DistributionItem = {
    stars: number;
    count: number;
};

type RecentFeedback = {
    id: number;
    overall_rating: number;
    comment: string | null;
    created_at: string;
    customer_name: string;
};

type Props = {
    feedbacks: {
        data: FeedbackItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    analytics: Analytics;
    distribution: DistributionItem[];
    recentFeedback: RecentFeedback[];
    menuItems: { id: number; name: string }[];
    waiters: { id: number; name: string }[];
    filters: {
        search?: string;
        rating?: string;
        date?: string;
        customer?: string;
        order_id?: string;
        waiter?: string;
        menu_item?: string;
        sort?: string;
    };
};

const ratingCards = [
    { key: 'overallRating', label: 'Overall Satisfaction' },
] as const;

export default function FeedbackIndex({
    feedbacks,
    analytics,
    distribution,
    recentFeedback,
    menuItems,
    waiters,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [rating, setRating] = useState(filters.rating ?? 'all');
    const [date, setDate] = useState(filters.date ?? 'all');
    const [customer, setCustomer] = useState(filters.customer ?? '');
    const [orderId, setOrderId] = useState(filters.order_id ?? '');
    const [waiter, setWaiter] = useState(filters.waiter ?? 'all');
    const [menuItem, setMenuItem] = useState(filters.menu_item ?? 'all');
    const [sort, setSort] = useState(filters.sort ?? 'newest');

    const getQueryParams = () => ({
        search,
        rating,
        date,
        customer,
        order_id: orderId,
        waiter,
        menu_item: menuItem,
        sort,
    });

    const applyFilters = () => {
        router.get('/manager/feedback', getQueryParams(), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        Object.entries(getQueryParams()).forEach(([key, value]) => {
            if (value && value !== 'all') {
params.append(key, value);
}
        });
        window.open(`/manager/feedback/export?${params.toString()}`, '_blank');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getCustomerName = (feedback: FeedbackItem) => {
        if (feedback.anonymous) {
return 'Anonymous Customer';
}

        return feedback.customer?.name ?? 'Customer';
    };

    const getWaiterName = (feedback: FeedbackItem) => {
        return feedback.order.waiter_assignments?.[0]?.waiter?.name ?? 'N/A';
    };

    const primaryItems = (feedback: FeedbackItem) =>
        feedback.order.order_items
            .slice(0, 2)
            .map((item) => item.menu_item.name)
            .join(', ');

    const totalDistribution = distribution.reduce((sum, item) => sum + item.count, 0);
    const maxDistribution = Math.max(...distribution.map((item) => item.count), 1);

    return (
        <>
            <Head title="Feedback Report" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Customer Feedback Report"
                        description="View customer reviews and satisfaction analytics."
                        icon={MessageSquare}
                    />

                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>

                {/* ================= STATISTICS CARDS ================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/30 pb-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <Star className="h-4 w-4 text-amber-500" />
                                Average Rating
                            </p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-2 p-4">
                            <StarRating
                                value={Math.round(analytics.averageRating)}
                                readOnly
                                size="sm"
                            />
                            <p className="text-3xl font-black">
                                {analytics.averageRating.toFixed(1)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/30 pb-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                Total Reviews
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-3xl font-black">
                                {analytics.totalReviews}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">Reviews</p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/30 pb-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Positive Reviews
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-3xl font-black text-green-600">
                                {analytics.positiveReviews}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                4+ star ratings
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/30 pb-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                Negative Reviews
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-3xl font-black text-red-600">
                                {analytics.negativeReviews}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                2- star ratings
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= AVERAGE CATEGORY RATINGS ================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {ratingCards.map((card) => (
                        <Card key={card.key} className="overflow-hidden">
                            <CardHeader className="border-b bg-muted/30 pb-3">
                                <p className="text-sm font-semibold text-muted-foreground">
                                    {card.label}
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-2 p-4">
                                <StarRating
                                    value={Math.round(analytics[card.key])}
                                    readOnly
                                    size="sm"
                                />
                                <p className="text-2xl font-black">
                                    {analytics[card.key].toFixed(1)}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ================= RATING DISTRIBUTION ================= */}
                <Card>
                    <CardHeader className="border-b">
                        <h2 className="text-lg font-bold">Rating Distribution</h2>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5">
                        {distribution.map((item) => (
                            <div key={item.stars} className="flex items-center gap-3">
                                <div className="flex w-24 items-center gap-1">
                                    <span className="text-sm font-bold">{item.stars}</span>
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                </div>
                                <div className="h-6 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                                        style={{
                                            width: `${totalDistribution > 0 ? (item.count / totalDistribution) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                                <span className="w-12 text-right text-sm font-bold">
                                    {item.count}
                                </span>
                            </div>
                        ))}
                        {totalDistribution === 0 && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No rating data available yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ================= FILTERS ================= */}
                <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Filters</h3>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Search comment, customer, order..."
                                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <input
                            type="text"
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Customer name"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />

                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Order ID"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />

                        <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="3">3+ Stars</option>
                            <option value="2">2+ Stars</option>
                            <option value="1">1+ Stars</option>
                        </select>

                        <select
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>

                        <select
                            value={waiter}
                            onChange={(e) => setWaiter(e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Waiters</option>
                            {waiters.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={menuItem}
                            onChange={(e) => setMenuItem(e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Menu Items</option>
                            {menuItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                        </select>

                        <button
                            type="button"
                            onClick={applyFilters}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* ================= FEEDBACK TABLE ================= */}
                {feedbacks.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
                                ⭐
                            </div>
                            <h3 className="mt-5 text-lg font-semibold">
                                No customer feedback has been submitted yet.
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Customer feedback will appear here once completed orders are rated.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Customer</th>
                                        <th className="px-4 py-3 font-semibold">Order ID</th>
                                        <th className="px-4 py-3 font-semibold">Menu Items</th>
                                        <th className="px-4 py-3 font-semibold">Overall</th>
                                        <th className="px-4 py-3 font-semibold">Comment</th>
                                        <th className="px-4 py-3 font-semibold">Waiter</th>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {feedbacks.data.map((feedback) => (
                                        <tr key={feedback.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">
                                                {getCustomerName(feedback)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">
                                                    {feedback.order.order_number}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {feedback.order.order_items.length > 0
                                                    ? `${primaryItems(feedback)}${feedback.order.order_items.length > 2 ? ` +${feedback.order.order_items.length - 2}` : ''}`
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StarRating value={feedback.overall_rating} readOnly size="sm" />
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-muted-foreground">
                                                <span className="line-clamp-2">
                                                    {feedback.comment ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {getWaiterName(feedback)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(feedback.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* ================= PAGINATION ================= */}
                {feedbacks.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {feedbacks.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                } ${!link.url ? 'opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {/* ================= RECENT FEEDBACK ================= */}
                {recentFeedback.length > 0 && (
                    <div>
                        <div className="mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-bold">Recent Feedback</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {recentFeedback.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="p-5">
                                        <StarRating value={item.overall_rating} readOnly size="sm" />
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            "{item.comment ?? 'No comment provided.'}"
                                        </p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <p className="text-sm font-semibold">
                                                — {item.customer_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.created_at}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

FeedbackIndex.layout = {
    breadcrumbs: [
        {
            title: 'Feedback Report',
            href: '/manager/feedback',
        },
    ],
};
