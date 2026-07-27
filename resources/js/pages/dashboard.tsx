import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    DollarSign,
    MenuSquare,
    Plus,
    Star,
    Table2,
    TrendingUp,
    Users,
    Utensils,
    UserCheck,
    XCircle,
} from 'lucide-react';

import StatCard from '@/components/dashboard/stat-card';
import Heading from '@/components/heading';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

type RecentOrder = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: string | number;
    customer_name: string | null;
    customer_phone: string | null;
    table_id: number | null;
    created_at: string;

    table?: {
        table_number: number;
    } | null;
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

type RecentBooking = {
    id: number;
    status: string;
    created_at: string;
    booking_date?: string;
    booking_time?: string;
    customer_name?: string;
    customer_phone?: string;
    number_of_guests?: number;

    table?: {
        table_number: number;
    } | null;
};

type Props = {
    stats: DashboardStats;
    recentOrders: RecentOrder[];
    orderStatusOverview: OrderStatusOverview[];
    popularMenuItems: PopularMenuItem[];
    recentBookings: RecentBooking[];
};

export default function Dashboard({
    stats,
    recentOrders,
    orderStatusOverview,
    popularMenuItems,
    recentBookings,
}: Props) {
    /*
    |--------------------------------------------------------------------------
    | Helper Functions
    |--------------------------------------------------------------------------
    */

    const formatCurrency = (
        amount: number | string,
    ) => {
        return `ETB ${Number(amount).toLocaleString(
            'en-US',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        )}`;
    };

    const formatDateTime = (
        date: string,
    ) => {
        if (!date) {
            return '—';
        }

        return new Date(date).toLocaleString(
            'en-US',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            },
        );
    };

    const getStatusVariant = (
        status: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'completed':
                return 'default';

            case 'cancelled':
                return 'destructive';

            case 'received':
                return 'secondary';

            case 'pending':
                return 'outline';

            default:
                return 'outline';
        }
    };

    const getPaymentVariant = (
        status: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'paid':
                return 'default';

            case 'pending':
                return 'secondary';

            case 'unpaid':
                return 'outline';

            default:
                return 'outline';
        }
    };

    const getBookingStatusVariant = (
        status: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'confirmed':
                return 'default';

            case 'cancelled':
                return 'destructive';

            case 'pending':
                return 'secondary';

            default:
                return 'outline';
        }
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-stone-50">
                <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-5 lg:p-8">

                    {/* ================================================= */}
                    {/* HEADER */}
                    {/* ================================================= */}

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <Heading
                            title="Dashboard"
                            description="Overview of your restaurant management system"
                        />

                        <div className="flex flex-wrap gap-3">
                            <Button
                                asChild
                                variant="outline"
                                className="rounded-full border-gray-200 bg-white font-bold shadow-sm hover:border-orange-300 hover:text-orange-500"
                            >
                                <Link href="/manager/orders">
                                    <ClipboardList className="mr-2 h-4 w-4" />
                                    View Orders
                                </Link>
                            </Button>

                            <Button
                                asChild
                                className="rounded-full bg-gray-900 font-bold text-white hover:bg-orange-500"
                            >
                                <Link href="/manager/items/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Menu Item
                                </Link>
                            </Button>
                        </div>
                    </div>


                    {/* ================================================= */}
                    {/* MAIN STATISTICS */}
                    {/* ================================================= */}

                   {/* ================= TOP STATISTICS ================= */}

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

    <StatCard
        title="Total Orders"
        value={stats.totalOrders}
        icon={ClipboardList}
        iconClassName="text-blue-600"
        href="/manager/orders"
    />

    <StatCard
        title="Pending Orders"
        value={stats.pendingOrders}
        icon={Clock}
        iconClassName="text-yellow-600"
        href="/manager/orders"
    />

    <StatCard
        title="Completed Orders"
        value={stats.completedOrders}
        icon={CheckCircle2}
        iconClassName="text-green-600"
        href="/manager/orders"
    />

    <StatCard
        title="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        icon={DollarSign}
        iconClassName="text-blue-600"
        href="/manager/orders"
    />

</div>

                    {/* ================================================= */}
                    {/* SECOND STATISTICS */}
                    {/* ================================================= */}
{/* ================= SECOND STATISTICS ================= */}

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

    <StatCard
        title="Total Customers"
        value={stats.totalCustomers}
        icon={Users}
        iconClassName="text-purple-600"
        href="/manager/customers"
    />

    <StatCard
        title="Available Tables"
        value={stats.availableTables}
        icon={Table2}
        iconClassName="text-green-600"
        href="/manager/tables"
    />

    <StatCard
        title="Occupied Tables"
        value={stats.occupiedTables}
        icon={Utensils}
        iconClassName="text-red-600"
        href="/manager/tables"
    />

</div>

                    {/* ================================================= */}
                    {/* RECENT ORDERS + ORDER STATUS */}
                    {/* ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* Recent Orders */}

                        <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm lg:col-span-2">

                            <CardHeader className="border-b border-gray-100">
                                <div className="flex items-center justify-between">

                                    <CardTitle className="flex items-center gap-2 font-black">
                                        <ClipboardList className="h-5 w-5 text-orange-500" />

                                        Recent Orders
                                    </CardTitle>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="font-bold hover:text-orange-500"
                                    >
                                        <Link href="/manager/orders">
                                            View All

                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>

                                </div>
                            </CardHeader>

                            <CardContent className="p-0">

                                {recentOrders.length === 0 ? (

                                    <div className="py-16 text-center text-sm text-gray-500">
                                        No orders found.
                                    </div>

                                ) : (

                                    <div className="overflow-x-auto">

                                        <table className="w-full">

                                            <thead>
                                                <tr className="border-b bg-stone-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500">

                                                    <th className="px-5 py-4">
                                                        Order
                                                    </th>

                                                    <th className="px-5 py-4">
                                                        Customer
                                                    </th>

                                                    <th className="px-5 py-4">
                                                        Table
                                                    </th>

                                                    <th className="px-5 py-4">
                                                        Status
                                                    </th>

                                                    <th className="px-5 py-4">
                                                        Payment
                                                    </th>

                                                    <th className="px-5 py-4 text-right">
                                                        Total
                                                    </th>

                                                </tr>
                                            </thead>

                                            <tbody>

                                                {recentOrders.map(
                                                    (order) => (

                                                        <tr
                                                            key={order.id}
                                                            className="border-b border-gray-100 transition hover:bg-orange-50/30 last:border-0"
                                                        >

                                                            <td className="px-5 py-4 text-sm font-bold">
                                                                {order.order_number}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm">
                                                                {order.customer_name ||
                                                                    'Walk-in Customer'}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm text-gray-500">
                                                                {order.table?.table_number
                                                                    ? `Table ${order.table.table_number}`
                                                                    : '—'}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <Badge
                                                                    variant={getStatusVariant(
                                                                        order.status,
                                                                    )}
                                                                    className="capitalize"
                                                                >
                                                                    {order.status}
                                                                </Badge>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <Badge
                                                                    variant={getPaymentVariant(
                                                                        order.payment_status,
                                                                    )}
                                                                    className="capitalize"
                                                                >
                                                                    {order.payment_status}
                                                                </Badge>
                                                            </td>

                                                            <td className="px-5 py-4 text-right text-sm font-black">
                                                                {formatCurrency(
                                                                    order.total_amount,
                                                                )}
                                                            </td>

                                                        </tr>

                                                    ),
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </CardContent>

                        </Card>


                        {/* Order Status */}

                        <Card className="rounded-2xl border-gray-100 bg-white shadow-sm">

                            <CardHeader>
                                <CardTitle className="font-black">
                                    Order Status
                                </CardTitle>
                            </CardHeader>

                            <CardContent>

                                {orderStatusOverview.length === 0 ? (

                                    <div className="py-10 text-center text-sm text-gray-500">
                                        No order data available.
                                    </div>

                                ) : (

                                    <div className="space-y-3">

                                        {orderStatusOverview.map(
                                            (item) => (

                                                <div
                                                    key={item.status}
                                                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/30"
                                                >

                                                    <div className="flex items-center gap-3">

                                                        {item.status ===
                                                            'completed' && (
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        )}

                                                        {item.status ===
                                                            'pending' && (
                                                            <Clock className="h-5 w-5 text-yellow-600" />
                                                        )}

                                                        {item.status ===
                                                            'cancelled' && (
                                                            <XCircle className="h-5 w-5 text-red-600" />
                                                        )}

                                                        {item.status ===
                                                            'received' && (
                                                            <TrendingUp className="h-5 w-5 text-blue-600" />
                                                        )}

                                                        <span className="text-sm font-bold capitalize">
                                                            {item.status}
                                                        </span>

                                                    </div>

                                                    <Badge variant="secondary">
                                                        {item.count}
                                                    </Badge>

                                                </div>

                                            ),
                                        )}

                                    </div>

                                )}

                            </CardContent>

                        </Card>

                    </div>


                    {/* ================================================= */}
                    {/* POPULAR MENU + TABLES */}
                    {/* ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-2">

                        {/* Popular Menu Items */}

                        <Card className="rounded-2xl border-gray-100 bg-white shadow-sm">

                            <CardHeader>
                                <div className="flex items-center justify-between">

                                    <CardTitle className="flex items-center gap-2 font-black">
                                        <Star className="h-5 w-5 text-orange-500" />

                                        Popular Menu Items
                                    </CardTitle>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Link href="/manager/items">
                                            View Menu
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>

                                </div>
                            </CardHeader>

                            <CardContent>

                                {popularMenuItems.length === 0 ? (

                                    <div className="py-10 text-center text-sm text-gray-500">
                                        No menu item data available.
                                    </div>

                                ) : (

                                    <div className="space-y-3">

                                        {popularMenuItems.map(
                                            (item, index) => (

                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/30"
                                                >

                                                    <div className="flex items-center gap-4">

                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-sm font-black text-orange-500">
                                                            {index + 1}
                                                        </div>

                                                        <span className="text-sm font-bold">
                                                            {item.name}
                                                        </span>

                                                    </div>

                                                    <Badge variant="secondary">
                                                        {item.total_quantity}{' '}
                                                        sold
                                                    </Badge>

                                                </div>

                                            ),
                                        )}

                                    </div>

                                )}

                            </CardContent>

                        </Card>


                        {/* Restaurant Tables */}

                        <Card className="rounded-2xl border-gray-100 bg-white shadow-sm">

                            <CardHeader>
                                <div className="flex items-center justify-between">

                                    <CardTitle className="flex items-center gap-2 font-black">
                                        <Table2 className="h-5 w-5 text-orange-500" />

                                        Restaurant Tables
                                    </CardTitle>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Link href="/manager/tables">
                                            Manage
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>

                                </div>
                            </CardHeader>

                            <CardContent>

                                <div className="grid grid-cols-2 gap-4">

                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-gray-100 p-5 text-center transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                                    >
                                        <p className="text-sm font-semibold text-gray-500">
                                            Total
                                        </p>

                                        <p className="mt-2 text-3xl font-black">
                                            {stats.totalTables}
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-green-100 bg-green-50/40 p-5 text-center transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <p className="text-sm font-semibold text-gray-500">
                                            Available
                                        </p>

                                        <p className="mt-2 text-3xl font-black text-green-600">
                                            {stats.availableTables}
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-red-100 bg-red-50/40 p-5 text-center transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <p className="text-sm font-semibold text-gray-500">
                                            Occupied
                                        </p>

                                        <p className="mt-2 text-3xl font-black text-red-600">
                                            {stats.occupiedTables}
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/tables"
                                        className="rounded-2xl border border-yellow-100 bg-yellow-50/40 p-5 text-center transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <p className="text-sm font-semibold text-gray-500">
                                            Payment
                                        </p>

                                        <p className="mt-2 text-3xl font-black text-yellow-600">
                                            {stats.awaitingPaymentTables}
                                        </p>
                                    </Link>

                                </div>

                            </CardContent>

                        </Card>

                    </div>


                    {/* ================================================= */}
                    {/* CUSTOMER + MENU OVERVIEW */}
                    {/* ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-2">

                        {/* Customer Overview */}

                        <Card className="rounded-2xl border-gray-100 bg-white shadow-sm">

                            <CardHeader>
                                <div className="flex items-center justify-between">

                                    <CardTitle className="flex items-center gap-2 font-black">
                                        <Users className="h-5 w-5 text-orange-500" />

                                        Customer Overview
                                    </CardTitle>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Link href="/manager/customers">
                                            View Customers
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>

                                </div>
                            </CardHeader>

                            <CardContent>

                                <div className="grid grid-cols-2 gap-4">

                                    <Link
                                        href="/manager/customers"
                                        className="rounded-2xl border border-gray-100 p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3">

                                            <Users className="h-6 w-6 text-purple-600" />

                                            <div>
                                                <p className="text-sm font-semibold text-gray-500">
                                                    Total Customers
                                                </p>

                                                <p className="mt-1 text-2xl font-black">
                                                    {stats.totalCustomers}
                                                </p>
                                            </div>

                                        </div>
                                    </Link>

                                    <Link
                                        href="/manager/customers"
                                        className="rounded-2xl border border-green-100 bg-green-50/30 p-5 transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3">

                                            <UserCheck className="h-6 w-6 text-green-600" />

                                            <div>
                                                <p className="text-sm font-semibold text-gray-500">
                                                    Members
                                                </p>

                                                <p className="mt-1 text-2xl font-black">
                                                    {stats.memberCustomers}
                                                </p>
                                            </div>

                                        </div>
                                    </Link>

                                </div>

                            </CardContent>

                        </Card>


                        {/* Menu Overview */}

                        <Card className="rounded-2xl border-gray-100 bg-white shadow-sm">

                            <CardHeader>
                                <div className="flex items-center justify-between">

                                    <CardTitle className="flex items-center gap-2 font-black">
                                        <MenuSquare className="h-5 w-5 text-orange-500" />

                                        Menu Overview
                                    </CardTitle>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Link href="/manager/items">
                                            Manage Menu
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>

                                </div>
                            </CardHeader>

                            <CardContent>

                                <div className="grid grid-cols-2 gap-4">

                                    <Link
                                        href="/manager/items"
                                        className="rounded-2xl border border-gray-100 p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                                    >
                                        <p className="text-sm font-semibold text-gray-500">
                                            Total Items
                                        </p>

                                        <p className="mt-1 text-3xl font-black">
                                            {stats.totalMenuItems}
                                        </p>

                                        <p className="mt-2 text-xs font-bold text-green-600">
                                            {stats.availableMenuItems}{' '}
                                            available
                                        </p>
                                    </Link>

                                    <Link
                                        href="/manager/categories"
                                        className="rounded-2xl border border-gray-100 p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                                    >
                                        <p className="text-sm font-semibold text-gray-500">
                                            Categories
                                        </p>

                                        <p className="mt-1 text-3xl font-black">
                                            {stats.totalCategories}
                                        </p>

                                        <p className="mt-2 text-xs font-semibold text-gray-500">
                                            {stats.activeCategories}{' '}
                                            active
                                        </p>
                                    </Link>

                                </div>

                            </CardContent>

                        </Card>

                    </div>


                    {/* ================================================= */}
                    {/* RECENT BOOKINGS */}
                    {/* ================================================= */}

                    <Card className="rounded-2xl border-gray-100 bg-white shadow-sm">

                        <CardHeader>
                            <div className="flex items-center justify-between">

                                <CardTitle className="flex items-center gap-2 font-black">
                                    <CalendarDays className="h-5 w-5 text-orange-500" />

                                    Recent Table Bookings
                                </CardTitle>

                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                >
                                    <Link href="/manager/bookings">
                                        View All
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>

                            </div>
                        </CardHeader>

                        <CardContent className="p-0">

                            {recentBookings.length === 0 ? (

                                <div className="py-16 text-center text-sm text-gray-500">
                                    No recent bookings found.
                                </div>

                            ) : (

                                <div className="overflow-x-auto">

                                    <table className="w-full">

                                        <thead>
                                            <tr className="border-b bg-stone-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500">

                                                <th className="px-5 py-4">
                                                    Customer
                                                </th>

                                                <th className="px-5 py-4">
                                                    Table
                                                </th>

                                                <th className="px-5 py-4">
                                                    Guests
                                                </th>

                                                <th className="px-5 py-4">
                                                    Status
                                                </th>

                                                <th className="px-5 py-4">
                                                    Created
                                                </th>

                                            </tr>
                                        </thead>

                                        <tbody>

                                            {recentBookings.map(
                                                (booking) => (

                                                    <tr
                                                        key={booking.id}
                                                        className="border-b border-gray-100 transition hover:bg-orange-50/30 last:border-0"
                                                    >

                                                        <td className="px-5 py-4 text-sm font-bold">
                                                            {booking.customer_name ||
                                                                'Customer'}
                                                        </td>

                                                        <td className="px-5 py-4 text-sm">
                                                            {booking.table?.table_number
                                                                ? `Table ${booking.table.table_number}`
                                                                : '—'}
                                                        </td>

                                                        <td className="px-5 py-4 text-sm">
                                                            {booking.number_of_guests ||
                                                                '—'}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <Badge
                                                                variant={getBookingStatusVariant(
                                                                    booking.status,
                                                                )}
                                                                className="capitalize"
                                                            >
                                                                {booking.status}
                                                            </Badge>
                                                        </td>

                                                        <td className="px-5 py-4 text-sm text-gray-500">
                                                            {formatDateTime(
                                                                booking.created_at,
                                                            )}
                                                        </td>

                                                    </tr>

                                                ),
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </CardContent>

                    </Card>


                    {/* ================================================= */}
                    {/* QUICK ACTIONS */}
                    {/* ================================================= */}

                    <Card className="rounded-2xl border-gray-100 bg-white shadow-sm">

                        <CardHeader>
                            <CardTitle className="font-black">
                                Quick Actions
                            </CardTitle>
                        </CardHeader>

                        <CardContent>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-12 rounded-xl font-bold hover:border-orange-300 hover:text-orange-500"
                                >
                                    <Link href="/manager/items/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Menu Item
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-12 rounded-xl font-bold hover:border-orange-300 hover:text-orange-500"
                                >
                                    <Link href="/manager/categories/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Category
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-12 rounded-xl font-bold hover:border-orange-300 hover:text-orange-500"
                                >
                                    <Link href="/manager/orders">
                                        <ClipboardList className="mr-2 h-4 w-4" />
                                        Manage Orders
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-12 rounded-xl font-bold hover:border-orange-300 hover:text-orange-500"
                                >
                                    <Link href="/admin/users/create">
                                        <Users className="mr-2 h-4 w-4" />
                                        Add User
                                    </Link>
                                </Button>

                            </div>

                        </CardContent>

                    </Card>

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