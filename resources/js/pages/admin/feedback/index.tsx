import { Head, router } from '@inertiajs/react';
import {
    Search,
    Star,
    MessageSquare,
    Download,
    Filter,
    Eye,
    Calendar,
    User,
    Phone,
    UtensilsCrossed,
    Table2,
    Wallet,
    Clock,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { StarRating } from '@/components/star-rating';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type FeedbackItem = {
    id: number;
    overall_rating: number;
    comment: string | null;
    anonymous: boolean;
    created_at: string;
    customer: {
        id: number;
        name: string;
        customer_code: string;
        phone: string | null;
    } | null;
    order: {
        id: number;
        order_number: string;
        total_amount: string;
        payment_status: string;
        table: { id: number; table_number: number } | null;
        order_items: {
            id: number;
            quantity: number;
            special_preferences?: string[];
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
    todayReviews: number;
};

type DistributionItem = {
    stars: number;
    count: number;
    percentage: number;
};

type Props = {
    feedbacks: {
        data: FeedbackItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    analytics: Analytics;
    distribution: DistributionItem[];
    tables: { id: number; table_number: number }[];
    waiters: { id: number; name: string }[];
    menuItems: { id: number; name: string }[];
    filters: {
        search?: string;
        rating?: string;
        date?: string;
        table?: string;
        waiter?: string;
        menu_item?: string;
        sort?: string;
        per_page?: string;
    };
    error?: string | null;
};

export default function AdminFeedbackIndex({
    feedbacks,
    analytics,
    distribution,
    tables,
    waiters,
    menuItems,
    filters,
    error = null,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [rating, setRating] = useState(filters.rating ?? 'all');
    const [date, setDate] = useState(filters.date ?? 'all');
    const [table, setTable] = useState(filters.table ?? 'all');
    const [waiter, setWaiter] = useState(filters.waiter ?? 'all');
    const [menuItem, setMenuItem] = useState(filters.menu_item ?? 'all');
    const [sort, setSort] = useState(filters.sort ?? 'newest');
    const [perPage, setPerPage] = useState(filters.per_page ?? '10');
    const [selectedFeedback, setSelectedFeedback] =
        useState<FeedbackItem | null>(null);
    const [loading, setLoading] = useState(false);

    const getQueryParams = () => ({
        search,
        rating,
        date,
        table,
        waiter,
        menu_item: menuItem,
        sort,
        per_page: perPage,
    });

    const applyFilters = () => {
        setLoading(true);
        router.get('/admin/feedback', getQueryParams(), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        Object.entries(getQueryParams()).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.append(key, value);
            }
        });
        window.open(`/admin/feedback/export?${params.toString()}`, '_blank');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const timeAgo = (dateString: string) => {
        const seconds = Math.floor(
            (Date.now() - new Date(dateString).getTime()) / 1000,
        );

        if (seconds < 60) {
            return 'just now';
        }

        const minutes = Math.floor(seconds / 60);

        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }

        const hours = Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }

        const days = Math.floor(hours / 24);

        if (days < 7) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }

        return formatDate(dateString);
    };

    const getCustomerName = (feedback: FeedbackItem) => {
        if (feedback.anonymous) {
            return 'Anonymous Customer';
        }

        return feedback.customer?.name ?? 'Customer';
    };

    const getCustomerCode = (feedback: FeedbackItem) => {
        if (feedback.anonymous) {
            return '—';
        }

        return feedback.customer?.customer_code ?? '—';
    };

    const getWaiterName = (feedback: FeedbackItem) => {
        return feedback.order.waiter_assignments?.[0]?.waiter?.name ?? 'N/A';
    };

    const primaryItems = (feedback: FeedbackItem) =>
        feedback.order.order_items
            .slice(0, 2)
            .map((item) => item.menu_item.name)
            .join(', ');

    const totalDistribution = distribution.reduce(
        (sum, item) => sum + item.count,
        0,
    );
    const fiveStarReviews =
        distribution.find((item) => item.stars === 5)?.count ?? 0;

    return (
        <>
            <Head title="Feedback Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Customer Feedback Management"
                        description="View, search, filter, and analyze all customer feedback."
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

                {/* ================= ERROR BANNER ================= */}
                {error && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <span className="text-xl" aria-hidden="true">
                            ⚠️
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-red-700">
                                Something went wrong
                            </p>
                            <p className="mt-1 text-sm text-red-600">{error}</p>
                        </div>
                    </div>
                )}

                {/* ================= STATISTICS CARDS ================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                            <p className="mt-1 text-sm text-muted-foreground">
                                Reviews
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/30 pb-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <Star className="h-4 w-4 text-red-500" />
                                Avg Overall Rating
                            </p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-2 p-4">
                            <StarRating
                                value={Math.round(analytics.overallRating)}
                                readOnly
                                size="sm"
                            />
                            <p className="text-3xl font-black">
                                {analytics.overallRating.toFixed(1)} / 5
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/30 pb-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <Star className="h-4 w-4 text-yellow-500" />
                                5-Star Reviews
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-3xl font-black text-yellow-600">
                                {fiveStarReviews}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Perfect ratings
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/30 pb-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                Today's Reviews
                            </p>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-3xl font-black text-purple-600">
                                {analytics.todayReviews}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Submitted today
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= RATING DISTRIBUTION ================= */}
                <Card>
                    <CardHeader className="border-b">
                        <h2 className="text-lg font-bold">
                            Rating Distribution
                        </h2>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5">
                        {distribution.map((item) => (
                            <div
                                key={item.stars}
                                className="flex items-center gap-3"
                            >
                                <div className="flex w-24 items-center gap-1">
                                    <span className="text-sm font-bold">
                                        {item.stars}
                                    </span>
                                    <Star className="h-4 w-4 fill-red-400 text-red-400" />
                                </div>
                                <div className="h-6 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                                <span className="w-16 text-right text-sm font-bold">
                                    {item.count}
                                </span>
                                <span className="w-14 text-right text-xs text-muted-foreground">
                                    {item.percentage}%
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
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && applyFilters()
                                }
                                placeholder="Search customer, code, order, comment..."
                                className="w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

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
                            value={table}
                            onChange={(e) => setTable(e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Tables</option>
                            {tables.map((t) => (
                                <option key={t.id} value={t.id}>
                                    Table {t.table_number}
                                </option>
                            ))}
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

                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="10">10 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                            <option value="100">100 per page</option>
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
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                ) : feedbacks.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
                                ⭐
                            </div>
                            <h3 className="mt-5 text-lg font-semibold">
                                No Customer Feedback Yet
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Customer reviews will appear here after
                                completed orders are rated.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Code
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Order ID
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Table
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Items
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Overall
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Comment
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {feedbacks.data.map((feedback) => (
                                        <tr
                                            key={feedback.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {getCustomerName(feedback)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {getCustomerCode(feedback)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">
                                                    {
                                                        feedback.order
                                                            .order_number
                                                    }
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {feedback.order.table
                                                    ? `Table ${feedback.order.table.table_number}`
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {feedback.order.order_items
                                                    .length > 0
                                                    ? `${primaryItems(feedback)}${feedback.order.order_items.length > 2 ? ` +${feedback.order.order_items.length - 2}` : ''}`
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StarRating
                                                    value={
                                                        feedback.overall_rating
                                                    }
                                                    readOnly
                                                    size="sm"
                                                />
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-muted-foreground">
                                                <span className="line-clamp-2">
                                                    {feedback.comment ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(
                                                    feedback.created_at,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFeedback(
                                                            feedback,
                                                        )
                                                    }
                                                    className="rounded-md p-2 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
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
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
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

                {/* ================= FEEDBACK DETAIL DRAWER ================= */}
                <Dialog
                    open={!!selectedFeedback}
                    onOpenChange={(open) => !open && setSelectedFeedback(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                        {selectedFeedback && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black">
                                        Feedback Details
                                    </DialogTitle>
                                    <DialogDescription>
                                        Submitted{' '}
                                        {formatDateTime(
                                            selectedFeedback.created_at,
                                        )}{' '}
                                        ({timeAgo(selectedFeedback.created_at)})
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-5 py-4">
                                    {/* Customer Info */}
                                    <div className="rounded-xl border bg-muted/30 p-4">
                                        <h3 className="mb-3 text-sm font-bold text-muted-foreground">
                                            Customer Information
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">
                                                    {getCustomerName(
                                                        selectedFeedback,
                                                    )}
                                                </span>
                                            </p>
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="outline">
                                                    {getCustomerCode(
                                                        selectedFeedback,
                                                    )}
                                                </Badge>
                                            </p>
                                            {selectedFeedback.customer
                                                ?.phone && (
                                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Phone className="h-4 w-4" />
                                                    {
                                                        selectedFeedback
                                                            .customer.phone
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Info */}
                                    <div className="rounded-xl border bg-muted/30 p-4">
                                        <h3 className="mb-3 text-sm font-bold text-muted-foreground">
                                            Order Information
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="flex items-center gap-2 text-sm">
                                                <Badge variant="secondary">
                                                    {
                                                        selectedFeedback.order
                                                            .order_number
                                                    }
                                                </Badge>
                                            </p>
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Table2 className="h-4 w-4" />
                                                Table{' '}
                                                {selectedFeedback.order.table
                                                    ?.table_number ?? 'N/A'}
                                            </p>
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Wallet className="h-4 w-4" />
                                                {Number(
                                                    selectedFeedback.order
                                                        .total_amount,
                                                ).toFixed(2)}{' '}
                                                ETB
                                                <Badge
                                                    variant="outline"
                                                    className="ml-2 capitalize"
                                                >
                                                    {
                                                        selectedFeedback.order
                                                            .payment_status
                                                    }
                                                </Badge>
                                            </p>
                                            <div className="mt-2">
                                                <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                                    <UtensilsCrossed className="h-3.5 w-3.5" />
                                                    Ordered Items
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedFeedback.order.order_items.map(
                                                        (item) => (
                                                            <Badge
                                                                key={item.id}
                                                                variant="outline"
                                                            >
                                                                {item.quantity}{' '}
                                                                ×{' '}
                                                                {
                                                                    item
                                                                        .menu_item
                                                                        .name
                                                                }
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                Waiter:{' '}
                                                {getWaiterName(
                                                    selectedFeedback,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="rounded-xl border bg-muted/30 p-4">
                                        <h3 className="mb-3 text-sm font-bold text-muted-foreground">
                                            Rating
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">
                                                Overall Rating
                                            </span>
                                            <StarRating
                                                value={
                                                    selectedFeedback.overall_rating
                                                }
                                                readOnly
                                                size="sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Review */}
                                    {selectedFeedback.comment && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                            <h3 className="mb-2 text-sm font-bold text-red-800">
                                                Customer Review
                                            </h3>
                                            <p className="text-sm text-red-900">
                                                "{selectedFeedback.comment}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Submission Time */}
                                    <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        Submitted{' '}
                                        {timeAgo(selectedFeedback.created_at)}
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminFeedbackIndex.layout = {
    breadcrumbs: [
        {
            title: 'Feedback Management',
            href: '/admin/feedback',
        },
    ],
};
