import { Head, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    Search,
    Eye,
    CheckCircle2,
    XCircle,
    AlertCircle,
    DollarSign,
    CreditCard,
    Printer,
    Ban,
    Loader2,
    Wallet,
    ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { useCan } from '@/hooks/use-can';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500 text-white hover:bg-yellow-500',
    paid: 'bg-green-600 text-white hover:bg-green-600',
    unpaid: 'bg-red-600 text-white hover:bg-red-600',
    refunded: 'bg-purple-600 text-white hover:bg-purple-600',
    cancelled: 'bg-gray-500 text-white hover:bg-gray-500',
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
    menu_item_id: number;
    quantity: number;
    price: string;
    menu_item: {
        id: number;
        name: string;
        image: string | null;
    };
};

type Payment = {
    id: number;
    payment_method: string | null;
    payment_status: string;
    amount: string;
    subtotal: string;
    tax: string;
    service_charge: string;
    discount: string;
    transaction_reference: string | null;
    paid_at: string | null;
    cashier: { id: number; name: string } | null;
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
    payment: Payment | null;
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

type RestaurantTable = {
    id: number;
    table_number: number;
};

type Props = {
    orders: PaginatedData;
    stats: Stats;
    tables: RestaurantTable[];
    filters: {
        search?: string;
        payment_status?: string;
        order_status?: string;
        table_id?: string;
        payment_method?: string;
        date_from?: string;
        date_to?: string;
    };
};

const paymentMethods: Record<string, string> = {
    cash: 'Cash',
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
};

type StatCard = {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
    filterParams: Record<string, string | undefined>;
    route?: string;
};

export default function PaymentsIndex({ orders, stats, tables, filters }: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [orderStatus, setOrderStatus] = useState(filters.order_status || '');
    const [tableId, setTableId] = useState(filters.table_id || '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [statusAction, setStatusAction] = useState<string>('');
    const [statusMethod, setStatusMethod] = useState<string>('cash');
    const [statusRef, setStatusRef] = useState('');
    const [dateError, setDateError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];

    const navigateToFilter = (params: Record<string, string | undefined>, route?: string) => {
        const cleaned: Record<string, string> = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== '') {
                cleaned[key] = value;
            }
        }
        if (route) {
            router.get(route, cleaned, { preserveState: true });
        } else {
            router.get('/admin/payments/orders', cleaned, { preserveState: true });
        }
    };

    const statCards: StatCard[] = useMemo(() => [
        {
            label: 'Total Orders',
            value: stats.total_orders,
            icon: <CreditCard className="h-6 w-6" />,
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            filterParams: {},
        },
        {
            label: 'Pending',
            value: stats.pending_payments,
            icon: <AlertCircle className="h-6 w-6" />,
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            filterParams: { payment_status: 'pending' },
        },
        {
            label: 'Paid',
            value: stats.paid_orders,
            icon: <CheckCircle2 className="h-6 w-6" />,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            filterParams: { payment_status: 'paid' },
        },
        {
            label: 'Unpaid',
            value: stats.unpaid_orders,
            icon: <XCircle className="h-6 w-6" />,
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600',
            filterParams: { payment_status: 'unpaid' },
        },
        {
            label: 'Cancelled',
            value: stats.cancelled_payments,
            icon: <Ban className="h-6 w-6" />,
            bgColor: 'bg-gray-100',
            iconColor: 'text-gray-600',
            filterParams: { payment_status: 'cancelled' },
        },
        {
            label: "Today's Revenue",
            value: `${Number(stats.today_revenue).toFixed(2)} ETB`,
            icon: <DollarSign className="h-6 w-6" />,
            bgColor: 'bg-orange-100',
            iconColor: 'text-orange-600',
            filterParams: {
                payment_status: 'paid',
                order_status: 'completed',
                date_from: todayStr,
                date_to: todayStr,
            },
        },
        {
            label: 'Total Revenue',
            value: `${Number(stats.total_revenue).toFixed(2)} ETB`,
            icon: <Wallet className="h-6 w-6" />,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            filterParams: {
                payment_status: 'paid',
                order_status: 'completed',
            },
        },
    ], [stats, todayStr]);

    const applyFilters = () => {
        // Validate date range
        if (dateFrom && dateTo && dateTo < dateFrom) {
            setDateError('End date cannot be before start date.');
            return;
        }
        setDateError('');

        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (paymentStatus) params.payment_status = paymentStatus;
        if (orderStatus) params.order_status = orderStatus;
        if (tableId) params.table_id = tableId;
        if (paymentMethod) params.payment_method = paymentMethod;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/admin/payments', params, { preserveState: true });
    };

    const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFrom(e.target.value);
        if (dateError) setDateError('');
    };

    const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateTo(e.target.value);
        if (dateError) setDateError('');
    };

    const clearFilters = () => {
        setSearch('');
        setPaymentStatus('');
        setOrderStatus('');
        setTableId('');
        setPaymentMethod('');
        setDateFrom('');
        setDateTo('');
        setDateError('');
        router.get('/admin/payments', {}, { preserveState: true });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') applyFilters();
    };

    const openView = (order: Order) => {
        setSelectedOrder(order);
        setIsViewOpen(true);
    };

    const openStatusChange = (order: Order, status: string) => {
        setSelectedOrder(order);
        setStatusAction(status);
        setStatusMethod(order.payment?.payment_method || 'cash');
        setStatusRef(order.payment?.transaction_reference || '');
        setIsStatusOpen(true);
    };

    const confirmStatusChange = () => {
        if (!selectedOrder) return;
        setIsLoading(true);
        router.patch(
            `/admin/payments/${selectedOrder.id}/status`,
            {
                payment_status: statusAction,
                payment_method: statusMethod,
                transaction_reference: statusRef,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsStatusOpen(false);
                    setSelectedOrder(null);
                    toast.success(`Payment marked as ${paymentStatusLabels[statusAction] || statusAction}`);
                    setIsLoading(false);
                },
                onError: () => {
                    toast.error('Failed to update payment status.');
                    setIsLoading(false);
                },
            }
        );
    };

    const handlePrint = (order: Order) => {
        window.open(`/admin/payments/${order.id}/receipt`, '_blank');
    };

    return (
        <>
            <Head title="Payment Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Payment Management"
                    description="Manage all customer payments from one centralized page."
                    icon={Wallet}
                />

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card) => (
                        <Card
                            key={card.label}
                            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                            onClick={() => navigateToFilter(card.filterParams, card.route)}
                        >
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className={`rounded-full ${card.bgColor} p-3 ${card.iconColor}`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                    <p className="text-2xl font-black">{card.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder="Search order ID, customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="w-full"
                                />
                            </div>
                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Payment Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={orderStatus} onValueChange={setOrderStatus}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Order Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="served">Served</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={tableId} onValueChange={setTableId}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Table" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tables</SelectItem>
                                    {tables.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            Table {t.table_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Payment Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    {Object.entries(paymentMethods).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={handleDateFromChange}
                                className="w-[160px]"
                                placeholder="From"
                            />
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={handleDateToChange}
                                className="w-[160px]"
                                placeholder="To"
                            />
                            <Button onClick={applyFilters}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                            <Button variant="destructive" onClick={clearFilters}>
                                Clear
                            </Button>
                            {dateError && (
                                <div className="w-full text-sm text-red-500">{dateError}</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    {['', 'pending', 'paid', 'unpaid', 'refunded', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => {
                                setPaymentStatus(status);
                                const params: Record<string, string> = { ...filters };
                                if (status) params.payment_status = status;
                                else delete params.payment_status;
                                router.get('/admin/payments', params, { preserveState: true });
                            }}
                            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                                (paymentStatus || '') === status
                                    ? 'bg-gray-900 text-white'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {status ? paymentStatusLabels[status] || status : 'All Orders'}
                        </button>
                    ))}
                </div>

                {/* Orders Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left">
                                        <th className="p-3 font-semibold">Order ID</th>
                                        <th className="p-3 font-semibold">Customer</th>
                                        <th className="p-3 font-semibold">Table</th>
                                        <th className="p-3 font-semibold">Total</th>
                                        <th className="p-3 font-semibold">Payment Status</th>
                                        <th className="p-3 font-semibold">Order Status</th>
                                        <th className="p-3 font-semibold">Method</th>
                                        <th className="p-3 font-semibold">Date</th>
                                        <th className="p-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-gray-500">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.data.map((order) => (
                                            <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-3 font-mono text-xs font-bold">
                                                    {order.order_number}
                                                </td>
                                                <td className="p-3">
                                                    <p className="font-medium">{order.customer?.name || order.customer_name || 'Walk-in'}</p>
                                                    {order.customer?.customer_code && (
                                                        <p className="text-xs text-gray-500">{order.customer.customer_code}</p>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {order.table ? `Table ${order.table.table_number}` : '—'}
                                                </td>
                                                <td className="p-3 font-bold">
                                                    {Number(order.total_amount).toFixed(2)} ETB
                                                </td>
                                                <td className="p-3">
                                                    <Badge className={paymentStatusColors[order.payment_status || 'pending'] || 'bg-gray-500'}>
                                                        {paymentStatusLabels[order.payment_status || 'pending'] || 'Pending'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <Badge className={orderStatusColors[order.status] || 'bg-gray-500'}>
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs">
                                                    {order.payment?.payment_method
                                                        ? (paymentMethods[order.payment.payment_method] || order.payment.payment_method)
                                                        : '—'}
                                                </td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {order.payment?.paid_at
                                                        ? new Date(order.payment.paid_at).toLocaleDateString()
                                                        : new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {can('show payments') && (
                                                            <Button variant="ghost" size="icon" onClick={() => openView(order)} title="View">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {can('status payments') && order.payment_status !== 'paid' && order.payment_status !== 'cancelled' && (
                                                            <Button variant="ghost" size="icon" onClick={() => openStatusChange(order, 'paid')} title="Mark as Paid">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {can('view payments') && order.payment?.payment_method && (
                                                            <Button variant="ghost" size="icon" onClick={() => handlePrint(order)} title="Print Receipt">
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 border-t p-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={orders.current_page <= 1}
                                    onClick={() => {
                                        const prevUrl = orders.links[0]?.url;
                                        if (prevUrl) router.get(prevUrl, {}, { preserveState: true });
                                    }}
                                >
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
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* View Details Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            Order {selectedOrder?.order_number}
                        </DialogTitle>
                        <DialogDescription>
                            Payment and order details
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</p>
                                    <p className="mt-1 font-bold">{selectedOrder.customer?.name || selectedOrder.customer_name || 'Walk-in'}</p>
                                    {selectedOrder.customer?.customer_code && (
                                        <p className="text-xs text-gray-500">{selectedOrder.customer.customer_code}</p>
                                    )}
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Table</p>
                                    <p className="mt-1 font-bold">{selectedOrder.table ? `Table ${selectedOrder.table.table_number}` : '—'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Time</p>
                                    <p className="mt-1 font-bold text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Time</p>
                                    <p className="mt-1 font-bold text-sm">{selectedOrder.payment?.paid_at ? new Date(selectedOrder.payment.paid_at).toLocaleString() : '—'}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="mb-3 font-bold">Ordered Items</h3>
                                <div className="space-y-2">
                                    {selectedOrder.order_items?.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                                            {item.menu_item?.image ? (
                                                <img src={`/storage/${item.menu_item.image}`} alt={item.menu_item.name} className="h-12 w-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xl">🍽️</div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.menu_item?.name || 'Item'}</p>
                                                <p className="text-xs text-gray-500">x{item.quantity} @ {Number(item.price).toFixed(2)} ETB</p>
                                            </div>
                                            <p className="font-bold text-sm">{(Number(item.price) * item.quantity).toFixed(2)} ETB</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{Number(selectedOrder.total_amount).toFixed(2)} ETB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <span>{selectedOrder.payment ? Number(selectedOrder.payment.tax).toFixed(2) : '0.00'} ETB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Service Charge</span>
                                    <span>{selectedOrder.payment ? Number(selectedOrder.payment.service_charge).toFixed(2) : '0.00'} ETB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Discount</span>
                                    <span>{selectedOrder.payment ? Number(selectedOrder.payment.discount).toFixed(2) : '0.00'} ETB</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Grand Total</span>
                                    <span>{selectedOrder.payment ? Number(selectedOrder.payment.amount).toFixed(2) : Number(selectedOrder.total_amount).toFixed(2)} ETB</span>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Method</p>
                                    <p className="mt-1 font-bold capitalize">{selectedOrder.payment?.payment_method ? (paymentMethods[selectedOrder.payment.payment_method] || selectedOrder.payment.payment_method) : '—'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                    <Badge className={paymentStatusColors[selectedOrder.payment_status || 'pending'] || 'bg-gray-500'}>
                                        {paymentStatusLabels[selectedOrder.payment_status || 'pending'] || 'Pending'}
                                    </Badge>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</p>
                                    <p className="mt-1 font-bold">{selectedOrder.payment?.cashier?.name || '—'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Ref</p>
                                    <p className="mt-1 font-mono text-sm">{selectedOrder.payment?.transaction_reference || '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="destructive" onClick={() => setIsViewOpen(false)}>Close</Button>
                        {can('view payments') && selectedOrder && selectedOrder.payment?.payment_method && (
                            <Button variant="outline" onClick={() => handlePrint(selectedOrder)}>
                                <Printer className="mr-2 h-4 w-4" /> Print Receipt
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Change Confirmation Modal */}
            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Payment Status Change</DialogTitle>
                        <DialogDescription>
                            Update payment status for order {selectedOrder?.order_number}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <p className="text-sm text-gray-600">
                                    Change payment status from{' '}
                                    <Badge className={paymentStatusColors[selectedOrder.payment_status || 'pending']}>
                                        {paymentStatusLabels[selectedOrder.payment_status || 'pending']}
                                    </Badge>{' '}
                                    to{' '}
                                    <Badge className={paymentStatusColors[statusAction]}>
                                        {paymentStatusLabels[statusAction] || statusAction}
                                    </Badge>
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Payment Method</label>
                                <Select value={statusMethod} onValueChange={setStatusMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(paymentMethods).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Transaction Reference (optional)</label>
                                <Input
                                    value={statusRef}
                                    onChange={(e) => setStatusRef(e.target.value)}
                                    placeholder="e.g. TXN-12345"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="destructive" onClick={() => setIsStatusOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={confirmStatusChange} disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                            ) : (
                                'Confirm'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Payment Management',
            href: '/admin/payments',
        },
    ],
};
