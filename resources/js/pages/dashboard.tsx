import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BellRing,
    CheckCircle2,
    ChefHat,
    ClipboardList,
    Clock,
    DollarSign,
    Star,
    Table2,
    TrendingUp,
    Users,
    Utensils,
    UserCheck,
    Wallet,
    XCircle,
    PieChart as PieChartIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import StatCard from '@/components/dashboard/stat-card';
import { FinanceAreaChart } from '@/components/dashboard/finance-area-chart';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { Reveal } from '@/components/dashboard/reveal';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';

type DashboardStats = {
    totalOrders: number;
    pendingOrders: number;
    receivedOrders: number;
    completedOrders: number;
    cancelledOrders: number;

    totalRevenue: number | string;

    totalCustomers: number;
    memberCustomers: number;
    nonMemberCustomers: number;

    totalTables: number;
    availableTables: number;
    occupiedTables: number;
    awaitingPaymentTables: number;

    totalCategories: number;
    activeCategories: number;

    totalMenuItems: number;
    availableMenuItems: number;
    unavailableMenuItems: number;
    featuredMenuItems: number;
};

type OrderStatusOverview = {
    status: string;
    count: number;
};

type PopularMenuItem = {
    id: number;
    name: string;
    total_quantity: number;
};

type RevenueTrendPoint = {
    date: string;
    label: string;
    revenue: number;
    orders: number;
};

type SalesByCategoryItem = {
    category: string;
    sales: number;
};

type PaymentStatusItem = {
    payment_status: string;
    count: number;
    total: number;
};

type FeedbackAnalytics = {
    totalReviews: number;
    averageRating: number;
    overallRating: number;
};

type RecentFeedbackItem = {
    id: number;
    order_id: number;
    customer_name: string;
    order_number: string;
    overall_rating: number;
    comment: string | null;
    created_at: string;
};

type Props = {
    stats: DashboardStats;
    orderStatusOverview: OrderStatusOverview[];
    popularMenuItems: PopularMenuItem[];
    revenueTrend: RevenueTrendPoint[];
    salesByCategory: SalesByCategoryItem[];
    paymentStatusOverview: PaymentStatusItem[];
    feedbackAnalytics: FeedbackAnalytics;
    recentFeedback: RecentFeedbackItem[];
};

const CATEGORY_COLORS = [
    '#f97316',
    '#fb923c',
    '#fbbf24',
    '#a3e635',
    '#22c55e',
    '#38bdf8',
    '#818cf8',
    '#e879f9',
    '#f472b6',
];

const PAYMENT_COLORS: Record<string, string> = {
    paid: '#10b981',
    pending: '#f59e0b',
    unpaid: '#ef4444',
};

const ORDER_STATUS_STYLES: Record<
    string,
    { icon: LucideIcon; color: string; bg: string }
> = {
    completed: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
    },
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    received: {
        icon: TrendingUp,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
    },
    confirmed: {
        icon: CheckCircle2,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
    },
    preparing: {
        icon: ChefHat,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
    },
    ready: { icon: BellRing, color: 'text-amber-600', bg: 'bg-amber-50' },
    served: {
        icon: Utensils,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
    },
};

export default function Dashboard({
    stats,
    orderStatusOverview,
    popularMenuItems,
    revenueTrend,
    salesByCategory,
    paymentStatusOverview,
    feedbackAnalytics,
    recentFeedback,
}: Props) {
    /*
    |--------------------------------------------------------------------------
    | Helper Functions
    |--------------------------------------------------------------------------
    */

    const formatCurrency = (amount: number | string) => {
        return `ETB ${Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    /*
    |--------------------------------------------------------------------------
    | Chart Derived Data
    |--------------------------------------------------------------------------
    */

    const categoryDonutData = salesByCategory.map((item) => ({
        name: item.category,
        value: Number(item.sales),
    }));

    const totalCategorySales = categoryDonutData.reduce(
        (sum, item) => sum + item.value,
        0
    );

    const paymentDonutData = paymentStatusOverview.map((item) => ({
        name: item.payment_status,
        value: Number(item.count),
    }));

    const totalPayments = paymentDonutData.reduce(
        (sum, item) => sum + item.value,
        0
    );

    const paymentDonutColors = paymentStatusOverview.map(
        (item) => PAYMENT_COLORS[item.payment_status] ?? '#a8a29e'
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/30 to-white text-stone-800 selection:bg-orange-200 selection:text-orange-900">
                {/* ================= DECORATIVE BACKGROUND ================= */}
                <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-orange-200 opacity-30 blur-3xl mix-blend-multiply" />
                <div
                    className="pointer-events-none absolute top-1/3 -left-40 h-96 w-96 animate-pulse rounded-full bg-amber-200 opacity-30 blur-3xl mix-blend-multiply"
                    style={{ animationDelay: '1s' }}
                />
                <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 animate-pulse rounded-full bg-orange-100 opacity-40 blur-3xl mix-blend-multiply" />

                <div className="relative flex flex-col gap-8 p-5 lg:p-8">
                    {/* ================================================= */}
                    {/* HEADER */}
                    {/* ================================================= */}

                    <Reveal>
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                                    Restaurant Management
                                </div>

                                <h1 className="mt-4 text-3xl font-black tracking-tight text-stone-900 sm:text-4xl">
                                    Dashboard
                                </h1>

                                <p className="mt-1 text-amber-600/90">
                                    Overview of your restaurant's performance
                                    and finances.
                                </p>
                            </div>
                        </div>
                    </Reveal>

                    {/* ================================================= */}
                    {/* TOP STATISTICS */}
                    {/* ================================================= */}

                    <Reveal>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Orders"
                                value={stats.totalOrders}
                                icon={ClipboardList}
                                iconClassName="text-blue-600"
                                iconBgClassName="bg-blue-50"
                                href="/manager/orders"
                            />

                            <StatCard
                                title="Pending Orders"
                                value={stats.pendingOrders}
                                icon={Clock}
                                iconClassName="text-yellow-600"
                                iconBgClassName="bg-yellow-50"
                                href="/manager/orders"
                            />

                            <StatCard
                                title="Completed Orders"
                                value={stats.completedOrders}
                                icon={CheckCircle2}
                                iconClassName="text-green-600"
                                iconBgClassName="bg-green-50"
                                href="/manager/orders"
                            />

                            <StatCard
                                featured
                                title="Total Revenue"
                                value={formatCurrency(stats.totalRevenue)}
                                icon={Wallet}
                                href="/manager/orders"
                            />
                        </div>
                    </Reveal>

                    {/* ================================================= */}
                    {/* SECOND STATISTICS */}
                    {/* ================================================= */}

                    <Reveal delay={100}>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                title="Total Customers"
                                value={stats.totalCustomers}
                                icon={Users}
                                iconClassName="text-purple-600"
                                iconBgClassName="bg-purple-50"
                                href="/manager/customers"
                            />

                            <StatCard
                                title="Available Tables"
                                value={stats.availableTables}
                                icon={Table2}
                                iconClassName="text-green-600"
                                iconBgClassName="bg-green-50"
                                href="/manager/tables"
                            />

                            <StatCard
                                title="Occupied Tables"
                                value={stats.occupiedTables}
                                icon={Utensils}
                                iconClassName="text-red-600"
                                iconBgClassName="bg-red-50"
                                href="/manager/tables"
                            />
                        </div>
                    </Reveal>

                    {/* ================================================= */}
                    {/* FINANCE CHARTS */}
                    {/* ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Revenue Trend */}

                        <Reveal className="lg:col-span-2">
                            <div className="h-full rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-800">
                                            Revenue Trend
                                        </h2>

                                        <p className="text-sm text-amber-600">
                                            Daily revenue for the last 14 days
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            {formatCurrency(
                                                revenueTrend.reduce(
                                                    (sum, point) =>
                                                        sum + point.revenue,
                                                    0
                                                )
                                            )}
                                        </span>

                                        <div className="rounded-xl bg-orange-50 p-2.5">
                                            <Wallet className="h-5 w-5 text-orange-600" />
                                        </div>
                                    </div>
                                </div>

                                <FinanceAreaChart data={revenueTrend} />
                            </div>
                        </Reveal>

                        {/* Sales by Category Donut */}

                        <Reveal delay={100}>
                            <div className="h-full rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-800">
                                            Sales by Category
                                        </h2>

                                        <p className="text-sm text-amber-600">
                                            Completed order sales
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-orange-50 p-2.5">
                                        <PieChartIcon className="h-5 w-5 text-orange-600" />
                                    </div>
                                </div>

                                {categoryDonutData.length > 0 ? (
                                    <DonutChart
                                        data={categoryDonutData}
                                        colors={CATEGORY_COLORS}
                                        centerLabel="Total Sales"
                                        centerValue={formatCurrency(
                                            totalCategorySales
                                        )}
                                    />
                                ) : (
                                    <div className="flex h-72 items-center justify-center text-sm text-amber-600">
                                        No sales data available.
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </div>

                    {/* ================================================= */}
                    {/* PAYMENT + ORDER STATUS + POPULAR ITEMS */}
                    {/* ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Payment Status Donut */}

                        <Reveal>
                            <div className="h-full rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-800">
                                            Payment Status
                                        </h2>

                                        <p className="text-sm text-amber-600">
                                            Orders by payment status
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-orange-50 p-2.5">
                                        <DollarSign className="h-5 w-5 text-orange-600" />
                                    </div>
                                </div>

                                {paymentDonutData.length > 0 ? (
                                    <DonutChart
                                        data={paymentDonutData}
                                        colors={paymentDonutColors}
                                        centerLabel="Total Orders"
                                        centerValue={String(totalPayments)}
                                        formatValue={(value) =>
                                            `${value} order${
                                                value === 1 ? '' : 's'
                                            }`
                                        }
                                    />
                                ) : (
                                    <div className="flex h-72 items-center justify-center text-sm text-amber-600">
                                        No payment data available.
                                    </div>
                                )}
                            </div>
                        </Reveal>

                        {/* Order Status */}

                        <Reveal delay={100}>
                            <div className="h-full rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-800">
                                            Order Status
                                        </h2>

                                        <p className="text-sm text-amber-600">
                                            Live breakdown by status
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-orange-50 p-2.5">
                                        <ClipboardList className="h-5 w-5 text-orange-600" />
                                    </div>
                                </div>

                                {orderStatusOverview.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-amber-600">
                                        No order data available.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {orderStatusOverview.map((item) => {
                                            const style =
                                                ORDER_STATUS_STYLES[
                                                    item.status
                                                ] ?? {
                                                    icon: ClipboardList,
                                                    color: 'text-amber-600',
                                                    bg: 'bg-amber-50',
                                                };

                                            const Icon = style.icon;

                                            return (
                                                <div
                                                    key={item.status}
                                                    className="flex items-center justify-between rounded-xl border border-orange-100/80 p-4 transition hover:border-orange-300 hover:shadow-md hover:shadow-orange-100"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.bg}`}
                                                        >
                                                            <Icon
                                                                className={`h-5 w-5 ${style.color}`}
                                                            />
                                                        </div>

                                                        <span className="text-sm font-bold capitalize text-stone-700">
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    <Badge
                                                        className="rounded-full bg-orange-50 px-3 py-1 font-bold text-orange-700"
                                                        variant="secondary"
                                                    >
                                                        {item.count}
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Reveal>

                        {/* Popular Menu Items */}

                        <Reveal delay={200}>
                            <div className="h-full rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-800">
                                            Popular Menu Items
                                        </h2>

                                        <p className="text-sm text-amber-600">
                                            Top sellers right now
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-orange-50 p-2.5">
                                        <Star className="h-5 w-5 text-orange-600" />
                                    </div>
                                </div>

                                {popularMenuItems.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-amber-600">
                                        No menu item data available.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {popularMenuItems.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="group flex items-center justify-between rounded-xl border border-orange-100/80 p-4 transition hover:border-orange-300 hover:shadow-md hover:shadow-orange-100"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                                                            index === 0
                                                                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                                                : 'bg-orange-50 text-orange-600'
                                                        }`}
                                                    >
                                                        {index + 1}
                                                    </div>

                                                    <span className="text-sm font-bold text-stone-700">
                                                        {item.name}
                                                    </span>
                                                </div>

                                                <Badge
                                                    className="rounded-full bg-orange-50 px-3 py-1 font-bold text-orange-700"
                                                    variant="secondary"
                                                >
                                                    {item.total_quantity} sold
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </div>

                    {/* ================================================= */}
                    {/* TABLES + CUSTOMER/MENU OVERVIEW */}
                    {/* ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Restaurant Tables */}

                        <Reveal>
                            <div className="h-full rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-800">
                                            Restaurant Tables
                                        </h2>

                                        <p className="text-sm text-amber-600">
                                            Current table availability
                                        </p>
                                    </div>

                                    <Button asChild variant="ghost" size="sm">
                                        <Link href="/manager/tables">
                                            Manage
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-orange-100/80 p-5 text-center transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-200/30"
                                    >
                                        <p className="text-sm font-semibold text-amber-600">
                                            Total
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-stone-800">
                                            {stats.totalTables}
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-green-100 bg-green-50/40 p-5 text-center transition hover:-translate-y-1 hover:shadow-lg hover:shadow-green-200/30"
                                    >
                                        <p className="text-sm font-semibold text-amber-600">
                                            Available
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-green-600">
                                            {stats.availableTables}
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-red-100 bg-red-50/40 p-5 text-center transition hover:-translate-y-1 hover:shadow-lg hover:shadow-red-200/30"
                                    >
                                        <p className="text-sm font-semibold text-amber-600">
                                            Occupied
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-red-600">
                                            {stats.occupiedTables}
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-yellow-100 bg-yellow-50/40 p-5 text-center transition hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-200/30"
                                    >
                                        <p className="text-sm font-semibold text-amber-600">
                                            Awaiting Payment
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-yellow-600">
                                            {stats.awaitingPaymentTables}
                                        </p>
                                    </Link>
                                </div>
                            </div>
                        </Reveal>

                        {/* Customer + Menu Overview */}

                        <Reveal delay={100}>
                            <div className="h-full rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black text-stone-800">
                                            Customers &amp; Menu
                                        </h2>

                                        <p className="text-sm text-amber-600">
                                            Quick overview of your data
                                        </p>
                                    </div>

                                    <Button asChild variant="ghost" size="sm">
                                        <Link href="/manager/customers">
                                            View Customers
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Link
                                        href="/manager/customers"
                                        className="rounded-2xl border border-orange-100/80 p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-200/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-xl bg-purple-50 p-2.5">
                                                <Users className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-amber-600">
                                                    Total Customers
                                                </p>
                                                <p className="mt-1 text-2xl font-black text-stone-800">
                                                    {stats.totalCustomers}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/manager/customers"
                                        className="rounded-2xl border border-green-100 bg-green-50/30 p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-green-200/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-xl bg-green-50 p-2.5">
                                                <UserCheck className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-amber-600">
                                                    Members
                                                </p>
                                                <p className="mt-1 text-2xl font-black text-green-600">
                                                    {stats.memberCustomers}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/manager/items"
                                        className="rounded-2xl border border-orange-100/80 p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-200/30"
                                    >
                                        <p className="text-sm font-semibold text-amber-600">
                                            Menu Items
                                        </p>
                                        <p className="mt-1 text-3xl font-black text-stone-800">
                                            {stats.totalMenuItems}
                                        </p>
                                        <p className="mt-2 text-xs font-bold text-green-600">
                                            {stats.availableMenuItems} available
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/categories"
                                        className="rounded-2xl border border-orange-100/80 p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-200/30"
                                    >
                                        <p className="text-sm font-semibold text-amber-600">
                                            Categories
                                        </p>
                                        <p className="mt-1 text-3xl font-black text-stone-800">
                                            {stats.totalCategories}
                                        </p>
                                        <p className="mt-2 text-xs font-semibold text-stone-500">
                                            {stats.activeCategories} active
                                        </p>
                                    </Link>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* ================= CUSTOMER FEEDBACK ANALYTICS ================= */}
                    <Reveal>
                        <div className="rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                            <div className="mb-6">
                                <h2 className="text-lg font-black text-stone-800">
                                    Customer Feedback Analytics
                                </h2>
                                <p className="text-sm text-amber-600">
                                    Average ratings from customer reviews
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="rounded-2xl border border-green-100 bg-green-50/40 p-5 text-center">
                                    <p className="text-sm font-semibold text-amber-600">Overall Service Rating</p>
                                    <p className="mt-2 text-3xl font-black text-green-600">{feedbackAnalytics.overallRating.toFixed(1)}</p>
                                    <p className="mt-1 text-xs font-semibold text-stone-400">avg rating</p>
                                </div>
                                <div className="rounded-2xl border border-orange-100/80 p-5 text-center">
                                    <p className="text-sm font-semibold text-amber-600">Average Rating</p>
                                    <p className="mt-2 text-3xl font-black text-stone-800">{feedbackAnalytics.averageRating.toFixed(1)}</p>
                                    <p className="mt-1 text-xs font-semibold text-stone-400">avg rating</p>
                                </div>
                                <div className="rounded-2xl border border-orange-100/80 p-5 text-center">
                                    <p className="text-sm font-semibold text-amber-600">Total Reviews</p>
                                    <p className="mt-2 text-3xl font-black text-orange-600">{feedbackAnalytics.totalReviews}</p>
                                    <p className="mt-1 text-xs font-semibold text-stone-400">reviews</p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50 p-4">
                                <p className="text-sm font-semibold text-stone-700">Total Reviews</p>
                                <p className="text-lg font-black text-orange-600">{feedbackAnalytics.totalReviews}</p>
                            </div>
                        </div>
                    </Reveal>

                    {/* ================= RECENT CUSTOMER REVIEWS ================= */}
                    <Reveal>
                        <div className="rounded-2xl border border-orange-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/40">
                            <div className="mb-6">
                                <h2 className="text-lg font-black text-stone-800">
                                    Recent Customer Reviews
                                </h2>
                                <p className="text-sm text-amber-600">
                                    Latest feedback from your customers
                                </p>
                            </div>

                            {recentFeedback.length === 0 ? (
                                <div className="py-10 text-center text-sm text-amber-600">
                                    No customer reviews yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-orange-100/80 text-xs font-bold uppercase tracking-wider text-amber-600">
                                                <th className="px-4 py-3">Customer</th>
                                                <th className="px-4 py-3">Order Number</th>
                                                <th className="px-4 py-3">Overall Rating</th>
                                                <th className="px-4 py-3">Review Comment</th>
                                                <th className="px-4 py-3">Submitted Date</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-orange-50">
                                            {recentFeedback.map((review) => (
                                                <tr key={review.id} className="transition-colors hover:bg-orange-50/40">
                                                    <td className="px-4 py-3 font-semibold text-stone-700">
                                                        {review.customer_name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            className="rounded-full bg-orange-50 px-3 py-1 font-bold text-orange-700"
                                                            variant="secondary"
                                                        >
                                                            {review.order_number}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StarRating value={review.overall_rating} readOnly size="sm" />
                                                    </td>
                                                    <td className="max-w-xs px-4 py-3 text-stone-600">
                                                        <span className="line-clamp-2">
                                                            {review.comment ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-stone-500">
                                                        {new Date(review.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button asChild variant="ghost" size="sm">
                                                            <Link href={`/customer/orders/${review.order_id}/feedback/view`}>
                                                                View Details
                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Reveal>

                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
