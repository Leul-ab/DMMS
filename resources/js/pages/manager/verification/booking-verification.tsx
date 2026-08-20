import { router } from '@inertiajs/react';
import {
    Search,
    ShieldCheck,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    Hash,
    Phone,
    Smartphone,
    Landmark,
    Banknote,
    CreditCard as CardIcon,
    Ban,
    Calendar,
    Table2,
    User,
    Eye,
    Bell,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCan } from '@/hooks/use-can';

type Notification = {
    id: number;
    booking_id: number;
    customer_name: string;
    customer_phone: string;
    table_numbers: string[];
    payment_method: string | null;
    payment_account: string | null;
    payment_attempt_reference: string | null;
    transaction_number: string | null;
    payment_screenshot: string | null;
    amount: string;
    status: string;
    notification_type: string;
    read_at: string | null;
    copied_at: string | null;
    verified_at: string | null;
    rejected_at: string | null;
    rejection_reason: string | null;
    created_at: string;
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
    verified: number;
    rejected: number;
    expired: number;
    cancelled: number;
};

type Props = {
    notifications: PaginatedData;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        payment_method?: string;
        verification_type?: string;
    };
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    read: 'bg-blue-100 text-blue-800 border-blue-200',
    verified: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    expired: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    read: 'Read',
    verified: 'Verified',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
};

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
    cash: <Banknote className="size-4" />,
    telebirr: <Smartphone className="size-4" />,
    cbe_birr: <Landmark className="size-4" />,
    bank_transfer: <CreditCard className="size-4" />,
    card: <CardIcon className="size-4" />,
};

export default function BookingVerificationTab({
    notifications,
    stats,
    filters,
}: Props) {
    const can = useCan();

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');

    const [verifyingNotification, setVerifyingNotification] = useState<Notification | null>(null);
    const [processing, setProcessing] = useState(false);

    const [rejectingNotification, setRejectingNotification] = useState<Notification | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (search) {
            params.search = search;
        }

        if (status) {
            params.status = status;
        }

        if (paymentMethod) {
            params.payment_method = paymentMethod;
        }

        router.get('/manager/booking-verification', params, {
            preserveState: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setPaymentMethod('');
        router.get('/manager/booking-verification', {}, { preserveState: true });
    };

    const openVerifyModal = (notification: Notification) => {
        setVerifyingNotification(notification);
    };

    const submitVerification = () => {
        if (!verifyingNotification) {
            return;
        }

        setProcessing(true);
        router.post(
            `/manager/booking-verification/${verifyingNotification.id}/verify`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Booking payment approved successfully.');
                    setVerifyingNotification(null);
                    setProcessing(false);
                },
                onError: (errors: any) => {
                    if (errors.message) {
                        toast.error(errors.message);
                    } else {
                        toast.error('Failed to approve booking payment.');
                    }
                    setProcessing(false);
                },
            }
        );
    };

    const confirmReject = (notification: Notification) => {
        setRejectingNotification(notification);
        setRejectionReason('');
    };

    const rejectNotification = () => {
        if (!rejectingNotification) {
            return;
        }

        setProcessing(true);
        router.post(
            `/manager/booking-verification/${rejectingNotification.id}/reject`,
            { rejection_reason: rejectionReason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Booking payment rejected.');
                    setRejectingNotification(null);
                    setRejectionReason('');
                    setProcessing(false);
                },
                onError: (errors: any) => {
                    if (errors.message) {
                        toast.error(errors.message);
                    } else {
                        toast.error('Failed to reject booking payment.');
                    }
                    setProcessing(false);
                },
            }
        );
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '—';
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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);

        return d.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);

        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <Card className="border-yellow-200 bg-yellow-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-yellow-100 p-3 text-yellow-700">
                                <AlertCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-700">
                                    Pending
                                </p>
                                <p className="text-2xl font-black text-yellow-900">
                                    {stats.pending}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-green-100 p-3 text-green-700">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700">
                                    Verified
                                </p>
                                <p className="text-2xl font-black text-green-900">
                                    {stats.verified}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-red-100 p-3 text-red-700">
                                <XCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-700">
                                    Rejected
                                </p>
                                <p className="text-2xl font-black text-red-900">
                                    {stats.rejected}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gray-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-gray-100 p-3 text-gray-700">
                                <Calendar className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    Expired
                                </p>
                                <p className="text-2xl font-black text-gray-900">
                                    {stats.expired}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-orange-100 p-3 text-orange-700">
                                <Ban className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-orange-700">
                                    Cancelled
                                </p>
                                <p className="text-2xl font-black text-orange-900">
                                    {stats.cancelled}
                                </p>
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
                                    placeholder="Search notification ID, booking ID, customer, phone, table..."
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
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-[170px]">
                                    <SelectValue placeholder="Payment Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {Object.entries(paymentMethodLabels).map(
                                        ([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        )
                                    )}
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
                                        <th className="p-3 font-semibold">
                                            Notification ID
                                        </th>
                                        <th className="p-3 font-semibold">
                                            Booking ID
                                        </th>
                                        <th className="p-3 font-semibold">
                                            Customer
                                        </th>
                                        <th className="p-3 font-semibold">
                                            Table
                                        </th>
                                        <th className="p-3 font-semibold">
                                            Payment Method
                                        </th>
                                        <th className="p-3 font-semibold">
                                            Amount
                                        </th>
                                        <th className="p-3 font-semibold">
                                            Status
                                        </th>
                                        <th className="p-3 font-semibold">
                                            Received
                                        </th>
                                        <th className="p-3 text-right font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="p-12 text-center text-gray-500"
                                            >
                                                No notifications found.
                                            </td>
                                        </tr>
                                    ) : (
                                        notifications.data.map((notification) => (
                                            <tr
                                                key={notification.id}
                                                className="border-b last:border-0 hover:bg-gray-50"
                                            >
                                                <td className="p-3 font-mono text-xs font-bold">
                                                    N-{String(notification.id).padStart(6, '0')}
                                                </td>
                                                <td className="p-3 font-mono text-xs font-bold">
                                                    BK-{String(notification.booking_id).padStart(6, '0')}
                                                </td>
                                                <td className="p-3">
                                                    <p className="font-medium">
                                                        {notification.customer_name}
                                                    </p>
                                                    {notification.customer_phone && (
                                                        <p className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Phone className="size-3" />
                                                            {notification.customer_phone}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {notification.table_numbers.map((t, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700"
                                                            >
                                                                <Table2 className="size-3" />
                                                                T-{String(t).padStart(2, '0')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {notification.payment_method ? (
                                                        <span className="flex items-center gap-1.5 capitalize">
                                                            {paymentMethodIcons[notification.payment_method] ||
                                                                <CreditCard className="size-4" />}
                                                            {paymentMethodLabels[notification.payment_method] ||
                                                                notification.payment_method}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="p-3 font-bold">
                                                    {Number(
                                                        notification.amount || 0
                                                    ).toFixed(2)}{' '}
                                                    ETB
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        className={`border ${statusColors[notification.status] ||
                                                            ''}`}
                                                    >
                                                        {statusLabels[notification.status] ||
                                                            notification.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {formatDateTime(notification.created_at)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can('view payments') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    setViewingNotification(
                                                                        notification
                                                                    )
                                                                }
                                                                title="View Details"
                                                            >
                                                                <Eye className="size-4" />
                                                            </Button>
                                                        )}
                                                        {notification.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openVerifyModal(notification)
                                                                    }
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <CheckCircle2 className="mr-1 size-4" />
                                                                    Verify
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    onClick={() =>
                                                                        confirmReject(notification)
                                                                    }
                                                                >
                                                                    <Ban className="mr-1 size-4" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {notification.status === 'read' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openVerifyModal(notification)
                                                                    }
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <CheckCircle2 className="mr-1 size-4" />
                                                                    Verify
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    onClick={() =>
                                                                        confirmReject(notification)
                                                                    }
                                                                >
                                                                    <Ban className="mr-1 size-4" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {(notification.status === 'verified' || notification.status === 'rejected') && (
                                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                {notification.status === 'verified' ? (
                                                                    <CheckCircle2 className="size-4 text-green-600" />
                                                                ) : (
                                                                    <XCircle className="size-4 text-red-600" />
                                                                )}
                                                                {statusLabels[notification.status] || notification.status}
                                                            </span>
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
                        {notifications.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 border-t p-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={notifications.current_page <= 1}
                                    onClick={() => {
                                        const prevUrl =
                                            notifications.links[0]?.url;

                                        if (prevUrl) {
                                            router.get(
                                                prevUrl,
                                                {},
                                                { preserveState: true }
                                            );
                                        }
                                    }}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-500">
                                    Page {notifications.current_page} of{' '}
                                    {notifications.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        notifications.current_page >=
                                        notifications.last_page
                                    }
                                    onClick={() => {
                                        const nextUrl =
                                            notifications.links[
                                                notifications.links.length - 1
                                            ]?.url;

                                        if (nextUrl) {
                                            router.get(
                                                nextUrl,
                                                {},
                                                { preserveState: true }
                                            );
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
            {/* VERIFY BOOKING MODAL */}
            {/* ========================= */}

            <Dialog
                open={!!verifyingNotification}
                onOpenChange={(open) => {
                    if (!open) {
                        setVerifyingNotification(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <ShieldCheck className="size-5 text-green-600" />
                            Approve Booking Payment
                        </DialogTitle>
                        <DialogDescription>
                            Approve payment for booking BK-{String(verifyingNotification?.booking_id).padStart(6, '0')}.
                        </DialogDescription>
                    </DialogHeader>

                    {verifyingNotification && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Customer
                                        </p>
                                        <p className="mt-1 font-bold">
                                            {verifyingNotification.customer_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Table
                                        </p>
                                        <p className="mt-1 font-bold">
                                            {verifyingNotification.table_numbers
                                                .map(
                                                    (t) =>
                                                        `T-${String(t).padStart(2, '0')}`
                                                )
                                                .join(', ') || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Method
                                        </p>
                                        <p className="mt-1 flex items-center gap-1 font-bold capitalize">
                                            {verifyingNotification.payment_method
                                                ? (paymentMethodLabels[verifyingNotification.payment_method] || verifyingNotification.payment_method)
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Amount
                                        </p>
                                        <p className="mt-1 font-bold text-green-700">
                                            {Number(verifyingNotification.amount || 0).toFixed(2)}{' '}
                                            ETB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setVerifyingNotification(null);
                                }}
                                disabled={processing}
                            >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitVerification}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 size-4" />
                                    Approve Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================= */}
            {/* VIEW NOTIFICATION DETAILS */}
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
                            Notification N-{String(viewingNotification?.id).padStart(6, '0')} for booking BK-{String(viewingNotification?.booking_id).padStart(6, '0')}.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingNotification && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                <span className="text-sm font-semibold text-gray-500">
                                    Customer
                                </span>
                                <span className="text-sm font-bold">
                                    {viewingNotification.customer_name}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">
                                    Phone
                                </span>
                                <span className="text-sm font-bold">
                                    {viewingNotification.customer_phone || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">
                                    Table
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {viewingNotification.table_numbers.map((t, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700"
                                        >
                                            <Table2 className="size-3" />
                                            T-{String(t).padStart(2, '0')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">
                                    Payment Method
                                </span>
                                <span className="text-sm font-bold capitalize">
                                    {viewingNotification.payment_method ? (paymentMethodLabels[viewingNotification.payment_method] || viewingNotification.payment_method) : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">
                                    Amount
                                </span>
                                <span className="text-sm font-bold text-green-700">
                                    {Number(viewingNotification.amount || 0).toFixed(2)} ETB
                                </span>
                            </div>
                            {viewingNotification.payment_screenshot && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Payment Screenshot
                                    </p>
                                    <div className="mt-1">
                                        <img
                                            src={`/manager/booking-payment/${viewingNotification.id}/screenshot`}
                                            alt="Payment screenshot"
                                            className="mx-auto max-h-48 rounded-lg object-contain"
                                        />
                                        <a
                                            href={`/manager/booking-payment/${viewingNotification.id}/screenshot`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Full Image
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">
                                    Status
                                </span>
                                <Badge className={`border ${statusColors[viewingNotification.status] || ''}`}>
                                    {statusLabels[viewingNotification.status] || viewingNotification.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">
                                    Received
                                </span>
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

            {/* ========================= */}
            {/* REJECT CONFIRMATION */}
            {/* ========================= */}

            <Dialog
                open={!!rejectingNotification}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectingNotification(null);
                        setRejectionReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            Reject Booking Payment?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject the payment for booking{' '}
                            BK-{String(rejectingNotification?.booking_id).padStart(6, '0')}
                            ?
                            <br />
                            This action will mark the booking payment as rejected and
                            cancel the booking. The assigned table will be released.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3">
                        <label className="mb-2 block text-sm font-medium">
                            Rejection Reason{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) =>
                                setRejectionReason(e.target.value)
                            }
                            placeholder="Enter the reason for rejection..."
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectingNotification(null);
                                setRejectionReason('');
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={rejectNotification}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <Ban className="mr-2 size-4" />
                                    Reject Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
