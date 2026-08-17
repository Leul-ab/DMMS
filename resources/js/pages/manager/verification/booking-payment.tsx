import { Head, router } from '@inertiajs/react';
import {
    Bell,
    Table2,
    Landmark,
    Eye,
    CheckCircle2,
    XCircle,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Notification = {
    id: number;
    booking_id: number;
    customer_name: string;
    customer_phone: string;
    tables: { id: number; table_number: number; section: string | null }[];
    payment_method: string;
    amount: string;
    status: string;
    notification_type: string;
    read_at: string | null;
    created_at: string;
    booking: {
        id: number;
        status: string;
        payment_status: string;
        booked_at: string;
        expires_at: string | null;
    } | null;
};

type PaginatedData = {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Stats = {
    pending: number;
    read: number;
    verified: number;
    rejected: number;
};

type Props = {
    notifications: PaginatedData;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
    };
};

const paymentMethodLabels: Record<string, string> = {
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
    telebirr: <span className="text-sm">📱</span>,
    cbe_birr: <span className="text-sm">🏦</span>,
};

const statusColors: Record<string, string> = {
    pending: 'bg-red-100 text-red-800 border-red-200',
    read: 'bg-blue-100 text-blue-800 border-blue-200',
    verified: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    read: 'Read',
    verified: 'Verified',
    rejected: 'Rejected',
};

export default function BookingPaymentTab({
    notifications,
    stats,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'pending');

    const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
    const [processing, setProcessing] = useState(false);

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (search) {
            params.search = search;
        }

        if (status) {
            params.status = status;
        }

        router.get('/manager/booking-payment', params, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('pending');
        router.get('/manager/booking-payment', {}, { preserveState: true });
    };

    const markAsRead = (notification: Notification) => {
        setProcessing(true);
        router.patch(
            `/manager/booking-payment/notifications/${notification.id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Notification marked as read.');
                    setProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to mark notification as read.');
                    setProcessing(false);
                },
            }
        );
    };

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);

        return (
            d.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }) +
            ' ' +
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
    };

    return (
        <>
            <Head title="Booking Payment" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Booking Payment"
                    description="Review and verify customer booking payment notifications."
                    icon={Bell}
                />

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-red-100 p-3 text-red-700">
                                <Bell className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-700">Pending</p>
                                <p className="text-2xl font-black text-red-900">{stats.pending}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-blue-100 p-3 text-blue-700">
                                <Eye className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Read</p>
                                <p className="text-2xl font-black text-blue-900">{stats.read}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-green-100 p-3 text-green-700">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700">Verified</p>
                                <p className="text-2xl font-black text-green-900">{stats.verified}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-red-100 p-3 text-red-700">
                                <XCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-700">Rejected</p>
                                <p className="text-2xl font-black text-red-900">{stats.rejected}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-wrap gap-3">
                            <div className="min-w-[200px] flex-1">
                                <Input
                                    placeholder="Search booking ID, customer, phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    className="w-full"
                                />
                            </div>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[190px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={applyFilters}>
                                <Search className="mr-2 size-4" />
                                Search
                            </Button>

                            <Button variant="outline" onClick={clearFilters}>
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications List */}
                <div className="grid gap-4">
                    {notifications.data.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-gray-500">
                                No booking payment notifications found.
                            </CardContent>
                        </Card>
                    ) : (
                        notifications.data.map((notification) => (
                            <Card key={notification.id} className="border-red-100 bg-gradient-to-r from-red-50/50 to-white">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                                    <Bell className="size-3" />
                                                    New Booking Payment
                                                </span>
                                                <Badge className={`border ${statusColors[notification.status] || ''}`}>
                                                    {statusLabels[notification.status] || notification.status}
                                                </Badge>
                                            </div>

                                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500">Customer</p>
                                                    <p className="text-sm font-bold">{notification.customer_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500">Booking ID</p>
                                                    <p className="font-mono text-sm font-bold">
                                                        BK-{String(notification.booking_id).padStart(6, '0')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500">Table</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {notification.tables.map((t) => (
                                                            <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                                                <Table2 className="size-3" />
                                                                T-{String(t.table_number).padStart(2, '0')}
                                                                {t.section && ` (${t.section})`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500">Payment Method</p>
                                                    <span className="flex items-center gap-1.5 text-sm font-bold capitalize">
                                                        {paymentMethodIcons[notification.payment_method] || <Landmark className="size-4" />}
                                                        {paymentMethodLabels[notification.payment_method] || notification.payment_method}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-gray-500">Amount</p>
                                                <p className="text-lg font-black text-green-700">
                                                    {Number(notification.amount || 0).toFixed(2)} ETB
                                                </p>
                                            </div>

                                            <p className="text-sm text-gray-600">
                                                Customer copied the payment account number. Payment requires verification.
                                            </p>

                                            <p className="text-xs text-gray-400">
                                                Received: {formatDateTime(notification.created_at)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                            <Button
                                                onClick={() => router.get(`/manager/booking-payment/${notification.id}`)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Eye className="mr-2 size-4" />
                                                View & Verify
                                            </Button>
                                            {notification.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => markAsRead(notification)}
                                                    disabled={processing}
                                                >
                                                    Mark Read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 border-t p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={notifications.current_page <= 1}
                            onClick={() => {
                                const prevUrl = notifications.links[0]?.url;

                                if (prevUrl) {
                                    router.get(prevUrl, {}, { preserveState: true });
                                }
                            }}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-500">
                            Page {notifications.current_page} of {notifications.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={notifications.current_page >= notifications.last_page}
                            onClick={() => {
                                const nextUrl = notifications.links[notifications.links.length - 1]?.url;

                                if (nextUrl) {
                                    router.get(nextUrl, {}, { preserveState: true });
                                }
                            }}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* ========================= */}
            {/* VIEW NOTIFICATION MODAL */}
            {/* ========================= */}

            <Dialog
                open={!!viewingNotification}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingNotification(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <Bell className="size-5 text-blue-600" />
                            Booking Payment Notification
                        </DialogTitle>
                        <DialogDescription>
                            Customer has initiated payment for booking{' '}
                            BK-{String(viewingNotification?.booking_id).padStart(6, '0')}.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingNotification && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                <span className="text-sm font-semibold text-gray-500">Booking ID</span>
                                <span className="font-mono text-sm font-bold">
                                    BK-{String(viewingNotification.booking_id).padStart(6, '0')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Customer</span>
                                <span className="text-sm font-bold">{viewingNotification.customer_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Phone</span>
                                <span className="text-sm font-bold">{viewingNotification.customer_phone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Table</span>
                                <div className="flex flex-wrap gap-1">
                                    {viewingNotification.tables.map((t) => (
                                        <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                            <Table2 className="size-3" />
                                            T-{String(t.table_number).padStart(2, '0')}
                                            {t.section && ` (${t.section})`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Payment Method</span>
                                <span className="text-sm font-bold capitalize">
                                    {paymentMethodLabels[viewingNotification.payment_method] || viewingNotification.payment_method}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Amount</span>
                                <span className="text-sm font-bold text-green-700">
                                    {Number(viewingNotification.amount || 0).toFixed(2)} ETB
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Status</span>
                                <Badge className={`border ${statusColors[viewingNotification.status] || ''}`}>
                                    {statusLabels[viewingNotification.status] || viewingNotification.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Received</span>
                                <span className="text-sm font-bold">{formatDateTime(viewingNotification.created_at)}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setViewingNotification(null)}
                        >
                            Close
                        </Button>
                        <Button asChild>
                            <a href={`/manager/booking-payment/${viewingNotification?.id}`}>
                                View & Verify
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

BookingPaymentTab.layout = {
    breadcrumbs: [
        { title: 'Verification', href: '/manager/payment-verification' },
        { title: 'Booking Payment', href: '/manager/booking-payment' },
    ],
};
