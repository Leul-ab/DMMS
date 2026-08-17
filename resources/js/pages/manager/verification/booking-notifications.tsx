import { Head, router } from '@inertiajs/react';
import {
    Bell,
    Calendar,
    Table2,
    User,
    Smartphone,
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
    telebirr: <Smartphone className="size-4" />,
    cbe_birr: <Landmark className="size-4" />,
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
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

export default function BookingVerificationNotifications({
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

        router.get('/manager/booking-verification/notifications', params, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('pending');
        router.get('/manager/booking-verification/notifications', {}, { preserveState: true });
    };

    const markAsRead = (notification: Notification) => {
        setProcessing(true);
        router.patch(
            `/manager/booking-verification/notifications/${notification.id}/read`,
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
            <Head title="Booking Verification Notifications" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Booking Verification Notifications"
                    description="Manage booking payment verification requests from customers."
                    icon={Bell}
                />

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-yellow-200 bg-yellow-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-yellow-100 p-3 text-yellow-700">
                                <Bell className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-700">Pending</p>
                                <p className="text-2xl font-black text-yellow-900">{stats.pending}</p>
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

                {/* Notifications Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left">
                                        <th className="p-3 font-semibold">Notification ID</th>
                                        <th className="p-3 font-semibold">Booking</th>
                                        <th className="p-3 font-semibold">Customer</th>
                                        <th className="p-3 font-semibold">Table</th>
                                        <th className="p-3 font-semibold">Payment</th>
                                        <th className="p-3 font-semibold">Amount</th>
                                        <th className="p-3 font-semibold">Status</th>
                                        <th className="p-3 font-semibold">Received</th>
                                        <th className="p-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-gray-500">
                                                No notifications found.
                                            </td>
                                        </tr>
                                    ) : (
                                        notifications.data.map((notification) => (
                                            <tr key={notification.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-3 font-mono text-xs font-bold">
                                                    #{String(notification.id).padStart(6, '0')}
                                                </td>
                                                <td className="p-3 font-mono text-xs font-bold">
                                                    BK-{String(notification.booking_id).padStart(6, '0')}
                                                </td>
                                                <td className="p-3">
                                                    <p className="font-medium">{notification.customer_name}</p>
                                                    {notification.customer_phone && (
                                                        <p className="flex items-center gap-1 text-xs text-gray-500">
                                                            {notification.customer_phone}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {notification.tables.map((t) => (
                                                            <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                                                <Table2 className="size-3" />
                                                                T-{String(t.table_number).padStart(2, '0')}
                                                                {t.section && ` (${t.section})`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="flex items-center gap-1.5 capitalize">
                                                        {paymentMethodIcons[notification.payment_method] || <Landmark className="size-4" />}
                                                        {paymentMethodLabels[notification.payment_method] || notification.payment_method}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold">
                                                    {Number(notification.amount || 0).toFixed(2)} ETB
                                                </td>
                                                <td className="p-3">
                                                    <Badge className={`border ${statusColors[notification.status] || ''}`}>
                                                        {statusLabels[notification.status] || notification.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {formatDateTime(notification.created_at)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setViewingNotification(notification)}
                                                            title="View Details"
                                                        >
                                                            <Eye className="size-4" />
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
                                                        <Button
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <a href={`/manager/booking-verification?search=${notification.booking_id}`}>
                                                                View Booking
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
                    </CardContent>
                </Card>
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
                            <a href={`/manager/booking-verification?search=${viewingNotification?.booking_id}`}>
                                View Booking Verification
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

BookingVerificationNotifications.layout = {
    breadcrumbs: [
        { title: 'Verification', href: '/manager/payment-verification' },
        { title: 'Booking Notifications', href: '/manager/booking-verification/notifications' },
    ],
};
