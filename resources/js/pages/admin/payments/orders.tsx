import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Search, CreditCard, AlertCircle, CheckCircle2, XCircle, Ban, DollarSign, Wallet, Eye, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500 text-white',
    paid: 'bg-green-600 text-white',
    unpaid: 'bg-red-600 text-white',
    refunded: 'bg-purple-600 text-white',
    cancelled: 'bg-gray-500 text-white',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    unpaid: 'Unpaid',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
};

const orderStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500 text-white',
    preparing: 'bg-blue-600 text-white',
    ready: 'bg-green-600 text-white',
    served: 'bg-purple-600 text-white',
    completed: 'bg-gray-800 text-white',
    cancelled: 'bg-red-600 text-white',
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    menu_item: { id: number; name: string; image: string | null } | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string | null;
    total_amount: string;
    customer_name: string | null;
    customer_phone: string | null;
    created_at: string;
    table: { id: number; table_number: number } | null;
    customer: { id: number; customer_code: string; name: string } | null;
    order_items: OrderItem[];
};

type PaginatedData = {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Stats = {
    total_orders: number;
    pending_payments: number;
    paid_orders: number;
    unpaid_orders: number;
    cancelled_payments: number;
    today_revenue: number;
    total_revenue: number;
};

type Props = {
    orders: PaginatedData;
    stats: Stats;
    filters: {
        payment_status?: string;
        order_status?: string;
        date_from?: string;
        date_to?: string;
    };
};

export default function PaymentOrders({ orders, stats, filters }: Props) {
    const getFilterLabel = () => {
        const ps = filters.payment_status;
        const os = filters.order_status;
        if (ps === 'pending') return 'Pending Orders';
        if (ps === 'paid' && os === 'completed') return 'Revenue Orders';
        if (ps === 'paid') return 'Paid Orders';
        if (ps === 'unpaid') return 'Unpaid Orders';
        if (ps === 'cancelled') return 'Cancelled Orders';
        return 'All Orders';
    };

    const getFilterIcon = () => {
        const ps = filters.payment_status;
        if (ps === 'pending') return <AlertCircle className="h-5 w-5 text-yellow-600" />;
        if (ps === 'paid') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        if (ps === 'unpaid') return <XCircle className="h-5 w-5 text-red-600" />;
        if (ps === 'cancelled') return <Ban className="h-5 w-5 text-gray-600" />;
        return <CreditCard className="h-5 w-5 text-blue-600" />;
    };

    const timeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            <Head title={getFilterLabel()} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header with back button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/payments"
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gray-100 p-2">
                            {getFilterIcon()}
                        </div>
                        <div>
                            <p className="text-lg font-bold">{getFilterLabel()}</p>
                            <p className="text-xs text-gray-500">{orders.total} orders found</p>
                        </div>
                    </div>
                </div>

                {/* Orders Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {orders.data.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-semibold text-gray-900">No orders found</p>
                            <p className="text-sm text-gray-500 mt-1">No orders match the current filter criteria.</p>
                            <Link href="/admin/payments" className="mt-4">
                                <Button variant="outline">Back to Dashboard</Button>
                            </Link>
                        </div>
                    ) : (
                        orders.data.map((order) => (
                            <Link
                                key={order.id}
                                href={`/admin/payments/orders/${order.id}/detail`}
                                className="block group"
                            >
                                <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 h-full">
                                    <CardContent className="p-5">
                                        {/* Order Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="font-mono text-xs font-bold text-gray-900">
                                                    {order.order_number}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {order.table ? `Table ${order.table.table_number}` : '—'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">{timeAgo(order.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Status Badges */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge className={orderStatusColors[order.status] || 'bg-gray-500'}>
                                                {order.status}
                                            </Badge>
                                            <Badge className={paymentStatusColors[order.payment_status || 'pending'] || 'bg-gray-500'}>
                                                {paymentStatusLabels[order.payment_status || 'pending'] || 'Pending'}
                                            </Badge>
                                        </div>

                                        {/* Customer */}
                                        {order.customer?.name && (
                                            <p className="text-xs text-gray-500 mb-3">
                                                {order.customer.name}
                                                {order.customer.customer_code && (
                                                    <> · {order.customer.customer_code}</>
                                                )}
                                            </p>
                                        )}

                                        {/* Order Items Preview */}
                                        <div className="space-y-1.5 mb-4">
                                            {order.order_items?.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-700 truncate">
                                                        {item.menu_item?.name || 'Item'} × {item.quantity}
                                                    </span>
                                                    <span className="text-gray-900 font-medium">
                                                        {Number(item.price).toFixed(2)} ETB
                                                    </span>
                                                </div>
                                            ))}
                                            {order.order_items && order.order_items.length > 3 && (
                                                <p className="text-xs text-gray-400">+{order.order_items.length - 3} more items</p>
                                            )}
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 pt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-500">Total</span>
                                                <span className="text-lg font-black text-gray-900">
                                                    {Number(order.total_amount).toFixed(2)} ETB
                                                </span>
                                            </div>
                                        </div>

                                        {/* View Details */}
                                        <div className="mt-3 flex items-center justify-end text-xs text-orange-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Eye className="h-3 w-3 mr-1" />
                                            View Details
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={orders.current_page <= 1}
                            onClick={() => {
                                const prevUrl = orders.links[0]?.url;
                                if (prevUrl) router.get(prevUrl, {}, { preserveState: true });
                            }}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-sm text-gray-500">
                            Page {orders.current_page} of {orders.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={orders.current_page >= orders.last_page}
                            onClick={() => {
                                const nextUrl = orders.links[orders.links.length - 1]?.url;
                                if (nextUrl) router.get(nextUrl, {}, { preserveState: true });
                            }}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

PaymentOrders.layout = {
    breadcrumbs: [
        { title: 'Payment Management', href: '/admin/payments' },
        { title: 'Orders', href: '/admin/payments/orders' },
    ],
};
