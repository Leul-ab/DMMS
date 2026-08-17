import { Head, router } from '@inertiajs/react';
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
    Ban,
    Calendar,
    Table2,
    User,
    Eye,
    Bell,
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
import { useCan } from '@/hooks/use-can';

type Booking = {
    id: number;
    customer_name: string;
    customer_phone: string;
    tables: { id: number; table_number: number; section: string | null }[];
    booked_at: string;
    expires_at: string | null;
    payment_method: string | null;
    booking_amount: string;
    payment_status: string;
    transaction_reference: string | null;
    paid_at: string | null;
    cancelled_at: string | null;
    status: string;
    payment: {
        id: number;
        payment_method: string | null;
        payment_status: string;
        amount: string;
        transaction_number: string | null;
        transaction_reference: string | null;
        verified_at: string | null;
        paid_at: string | null;
        cashier: { id: number; name: string } | null;
        verifier: { id: number; name: string } | null;
    } | null;
};

type PaginatedData = {
    data: Booking[];
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
};

type Props = {
    bookings: PaginatedData;
    stats: Stats;
    filters: {
        search?: string;
        payment_status?: string;
        payment_method?: string;
    };
};

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending Verification',
    paid: 'Verified',
    cancelled: 'Rejected',
};

const paymentMethodLabels: Record<string, string> = {
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
    telebirr: <Smartphone className="size-4" />,
    cbe_birr: <Landmark className="size-4" />,
};

export default function BookingVerificationTab({
    bookings,
    stats,
    filters,
}: Props) {
    const can = useCan();

    const [search, setSearch] = useState(filters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || 'pending');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');

    const [verifyingBooking, setVerifyingBooking] = useState<Booking | null>(null);
    const [transactionNumber, setTransactionNumber] = useState('');
    const [transactionError, setTransactionError] = useState('');
    const [processing, setProcessing] = useState(false);

    const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (search) {
            params.search = search;
        }

        if (paymentStatus) {
            params.payment_status = paymentStatus;
        }

        if (paymentMethod) {
            params.payment_method = paymentMethod;
        }

        router.get('/manager/booking-verification', params, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setPaymentStatus('pending');
        setPaymentMethod('');
        router.get('/manager/booking-verification', {}, { preserveState: true });
    };

    const openVerifyModal = (booking: Booking) => {
        setVerifyingBooking(booking);
        setTransactionNumber('');
        setTransactionError('');
    };

    const submitVerification = () => {
        if (!verifyingBooking) {
            return;
        }

        if (!transactionNumber.trim()) {
            setTransactionError('Transaction number is required before verifying the payment.');

            return;
        }

        setProcessing(true);
        router.patch(
            `/manager/booking-verification/${verifyingBooking.id}/verify`,
            { transaction_number: transactionNumber.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Booking verified successfully.');
                    setVerifyingBooking(null);
                    setTransactionNumber('');
                    setProcessing(false);
                },
                onError: (errors) => {
                    if (errors.transaction_number) {
                        setTransactionError(errors.transaction_number);
                    } else {
                        toast.error('Failed to verify booking.');
                    }

                    setProcessing(false);
                },
            }
        );
    };

    const rejectBooking = (booking: Booking) => {
        setProcessing(true);
        router.patch(
            `/manager/booking-verification/${booking.id}/reject`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Booking rejected.');
                    setRejectingBooking(null);
                    setProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to reject booking.');
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

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);

        return d.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);

        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Head title="Booking Verification" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Booking Verification"
                    description="Verify customer table bookings by confirming their booking payment and reservation details."
                    icon={Calendar}
                />

                {/* Notifications Link */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={() => router.get('/manager/booking-verification/notifications', {}, { preserveState: true })}
                        className="flex items-center gap-2"
                    >
                        <Bell className="size-4" />
                        View Payment Notifications
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-yellow-200 bg-yellow-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-yellow-100 p-3 text-yellow-700">
                                <AlertCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-700">Pending Verification</p>
                                <p className="text-2xl font-black text-yellow-900">{stats.pending}</p>
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
                                    placeholder="Search booking ID, customer, table number, transaction number..."
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

                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger className="w-[190px]">
                                    <SelectValue placeholder="Verification Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending Verification</SelectItem>
                                    <SelectItem value="paid">Verified</SelectItem>
                                    <SelectItem value="cancelled">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-[170px]">
                                    <SelectValue placeholder="Payment Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    {Object.entries(paymentMethodLabels).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
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

                {/* Bookings Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left">
                                        <th className="p-3 font-semibold">Booking ID</th>
                                        <th className="p-3 font-semibold">Customer</th>
                                        <th className="p-3 font-semibold">Table</th>
                                        <th className="p-3 font-semibold">Booking Date</th>
                                        <th className="p-3 font-semibold">Booking Time</th>
                                        <th className="p-3 font-semibold">Payment Method</th>
                                        <th className="p-3 font-semibold">Amount</th>
                                        <th className="p-3 font-semibold">Status</th>
                                        <th className="p-3 font-semibold">Date</th>
                                        <th className="p-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-12 text-center text-gray-500">
                                                No bookings found.
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.data.map((booking) => (
                                            <tr key={booking.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-3 font-mono text-xs font-bold">
                                                    BK-{String(booking.id).padStart(6, '0')}
                                                </td>
                                                <td className="p-3">
                                                    <p className="font-medium">{booking.customer_name}</p>
                                                    {booking.customer_phone && (
                                                        <p className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Phone className="size-3" />
                                                            {booking.customer_phone}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {booking.tables.map((t) => (
                                                            <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                                                <Table2 className="size-3" />
                                                                T-{String(t.table_number).padStart(2, '0')}
                                                                {t.section && ` (${t.section})`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs whitespace-nowrap">
                                                    {formatDate(booking.booked_at)}
                                                </td>
                                                <td className="p-3 text-xs whitespace-nowrap">
                                                    {formatTime(booking.booked_at)}
                                                </td>
                                                <td className="p-3">
                                                    {booking.payment_method ? (
                                                        <span className="flex items-center gap-1.5 capitalize">
                                                            {paymentMethodIcons[booking.payment_method] || <CreditCard className="size-4" />}
                                                            {paymentMethodLabels[booking.payment_method] || booking.payment_method}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="p-3 font-bold">
                                                    {Number(booking.booking_amount || 0).toFixed(2)} ETB
                                                </td>
                                                <td className="p-3">
                                                    <Badge className={`border ${paymentStatusColors[booking.payment_status] || ''}`}>
                                                        {paymentStatusLabels[booking.payment_status] || booking.payment_status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {booking.payment?.verified_at
                                                        ? formatDateTime(booking.payment.verified_at)
                                                        : formatDate(booking.booked_at)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can('view bookings') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setViewingBooking(booking)}
                                                                title="View Details"
                                                            >
                                                                <Eye className="size-4" />
                                                            </Button>
                                                        )}
                                                        {booking.payment_status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => openVerifyModal(booking)}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <CheckCircle2 className="mr-1 size-4" />
                                                                    Verify
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    onClick={() => setRejectingBooking(booking)}
                                                                >
                                                                    <Ban className="mr-1 size-4" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {booking.payment_status === 'paid' && (
                                                            <span className="flex items-center gap-1 text-xs text-green-700">
                                                                <CheckCircle2 className="size-4" />
                                                                Verified
                                                            </span>
                                                        )}
                                                        {booking.payment_status === 'cancelled' && (
                                                            <span className="flex items-center gap-1 text-xs text-red-700">
                                                                <XCircle className="size-4" />
                                                                Rejected
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
                        {bookings.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 border-t p-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={bookings.current_page <= 1}
                                    onClick={() => {
                                        const prevUrl = bookings.links[0]?.url;

                                        if (prevUrl) {
                                            router.get(prevUrl, {}, { preserveState: true });
                                        }
                                    }}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-500">
                                    Page {bookings.current_page} of {bookings.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={bookings.current_page >= bookings.last_page}
                                    onClick={() => {
                                        const nextUrl = bookings.links[bookings.links.length - 1]?.url;

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
            {/* VERIFY BOOKING MODAL */}
            {/* ========================= */}

            <Dialog
                open={!!verifyingBooking}
                onOpenChange={(open) => {
                    if (!open) {
                        setVerifyingBooking(null);
                        setTransactionError('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <ShieldCheck className="size-5 text-green-600" />
                            Verify Booking
                        </DialogTitle>
                        <DialogDescription>
                            Enter the transaction number to verify payment for booking{' '}
                            BK-{String(verifyingBooking?.id).padStart(6, '0')}.
                        </DialogDescription>
                    </DialogHeader>

                    {verifyingBooking && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</p>
                                        <p className="mt-1 font-bold">{verifyingBooking.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Table</p>
                                        <p className="mt-1 font-bold">
                                            {verifyingBooking.tables.map((t) => `T-${String(t.table_number).padStart(2, '0')}`).join(', ') || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Method</p>
                                        <p className="mt-1 flex items-center gap-1 font-bold capitalize">
                                            {verifyingBooking.payment_method
                                                ? (paymentMethodLabels[verifyingBooking.payment_method] || verifyingBooking.payment_method)
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</p>
                                        <p className="mt-1 font-bold text-green-700">
                                            {Number(verifyingBooking.booking_amount || 0).toFixed(2)} ETB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Transaction Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        autoFocus
                                        value={transactionNumber}
                                        onChange={(e) => {
                                            setTransactionNumber(e.target.value);

                                            if (transactionError) {
                                                setTransactionError('');
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                submitVerification();
                                            }
                                        }}
                                        placeholder="e.g. TXNX8F9A2B"
                                        className="pl-9"
                                    />
                                </div>
                                {transactionError && (
                                    <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                                        <AlertCircle className="size-4" />
                                        {transactionError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setVerifyingBooking(null)}
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
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 size-4" />
                                    Verify Booking
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================= */}
            {/* VIEW BOOKING DETAILS MODAL */}
            {/* ========================= */}

            <Dialog
                open={!!viewingBooking}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingBooking(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <User className="size-5 text-blue-600" />
                            Booking Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewingBooking && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                <span className="text-sm font-semibold text-gray-500">Booking ID</span>
                                <span className="font-mono text-sm font-bold">
                                    BK-{String(viewingBooking.id).padStart(6, '0')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Customer Name</span>
                                <span className="text-sm font-bold">{viewingBooking.customer_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Phone</span>
                                <span className="text-sm font-bold">{viewingBooking.customer_phone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Table</span>
                                <div className="flex flex-wrap gap-1">
                                    {viewingBooking.tables.map((t) => (
                                        <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                            <Table2 className="size-3" />
                                            T-{String(t.table_number).padStart(2, '0')}
                                            {t.section && ` (${t.section})`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Date</span>
                                <span className="text-sm font-bold">{formatDate(viewingBooking.booked_at)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Time</span>
                                <span className="text-sm font-bold">{formatTime(viewingBooking.booked_at)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Duration</span>
                                <span className="text-sm font-bold">2 Hours</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Payment Method</span>
                                <span className="text-sm font-bold capitalize">
                                    {viewingBooking.payment_method || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Transaction No</span>
                                <span className="text-sm font-bold">{viewingBooking.transaction_reference || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Amount</span>
                                <span className="text-sm font-bold text-green-700">
                                    {Number(viewingBooking.booking_amount || 0).toFixed(2)} ETB
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Payment Status</span>
                                <Badge className={`border ${paymentStatusColors[viewingBooking.payment_status] || ''}`}>
                                    {paymentStatusLabels[viewingBooking.payment_status] || viewingBooking.payment_status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Booking Status</span>
                                <span className="text-sm font-bold capitalize">{viewingBooking.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500">Created</span>
                                <span className="text-sm font-bold">{formatDateTime(viewingBooking.booked_at)}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setViewingBooking(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================= */}
            {/* REJECT CONFIRMATION */}
            {/* ========================= */}

            <Dialog
                open={!!rejectingBooking}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectingBooking(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            Reject Booking?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject the payment for booking{' '}
                            BK-{String(rejectingBooking?.id).padStart(6, '0')}
                            ?
                            This will mark the booking payment as rejected and cancel the booking.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectingBooking(null)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectingBooking && rejectBooking(rejectingBooking)}
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
                                    Reject Booking
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
