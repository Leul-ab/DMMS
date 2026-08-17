import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    X,
    Eye,
    XCircle,
    CheckCircle2,
    Trash2,
    Loader2,
    Calendar,
    Clock,
    Table2,
    User,
    AlertCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/hooks/use-can';
import {
    index as bookingsIndex,
    cancel as cancelBooking,
    complete as completeBooking,
    destroy as deleteBooking,
} from '@/routes/manager/bookings';
import type { PaginatedData } from '@/types';

type BookingTable = {
    id: number;
    table_number: number;
};

type Booking = {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    tables: BookingTable[];
    status: string;
    payment_status: string;
    extension_payment_status?: string | null;
    booked_at: string;
    expires_at: string | null;
    original_expires_at?: string | null;
    extension_expires_at?: string | null;
    cancelled_at: string | null;
    is_expired: boolean;
    time_remaining_seconds: number | null;
    booking_amount?: number | null;
    extension_amount?: number | null;
    extension_fee?: number | null;
};

type Stats = {
    total_bookings: number;
    active_bookings: number;
    expired_bookings: number;
    available_tables: number;
    reserved_tables: number;
};

type Props = {
    bookings: PaginatedData<Booking>;
    filters: {
        search?: string;
        status?: string;
    };
    stats: Stats;
};

export default function BookingManagementIndex({
    bookings,
    filters,
    stats,
}: Props) {
    const can = useCan();
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [timeRemainingMap, setTimeRemainingMap] = useState<
        Record<number, string>
    >({});

    // View modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
    const [viewLoading, setViewLoading] = useState(false);

    // Cancel confirmation
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(
        null,
    );
    const [cancelLoading, setCancelLoading] = useState(false);

    // Complete confirmation
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completingBooking, setCompletingBooking] = useState<Booking | null>(
        null,
    );
    const [completeLoading, setCompleteLoading] = useState(false);

    // Delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingBooking, setDeletingBooking] = useState<Booking | null>(
        null,
    );
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Update countdown timers for active bookings
    useEffect(() => {
        if (!bookings?.data) {
            return;
        }

        const calculateTimes = () => {
            const newMap: Record<number, string> = {};
            bookings.data.forEach((booking) => {
                if (
                    booking.status === 'active' &&
                    booking.expires_at &&
                    !booking.is_expired
                ) {
                    const expiresAt = new Date(booking.expires_at).getTime();
                    const now = Date.now();
                    const diff = Math.floor((expiresAt - now) / 1000);

                    if (diff <= 0) {
                        newMap[booking.id] = 'Expired';
                    } else {
                        const minutes = Math.floor(diff / 60);
                        const seconds = diff % 60;
                        newMap[booking.id] =
                            `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
            });
            setTimeRemainingMap(newMap);
        };

        calculateTimes();
        const interval = setInterval(calculateTimes, 1000);

        return () => clearInterval(interval);
    }, [bookings]);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                bookingsIndex.url(),
                {
                    search: search || undefined,
                    status: statusFilter === 'all' ? undefined : statusFilter,
                },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    // ============ VIEW BOOKING ============
    const openViewModal = async (booking: Booking) => {
        setViewLoading(true);
        setShowViewModal(true);

        try {
            const response = await fetch(`/api/bookings/${booking.id}`);
            const data = await response.json();
            setViewingBooking(data.booking);
        } catch {
            toast.error('Failed to load booking details.');
            setShowViewModal(false);
        } finally {
            setViewLoading(false);
        }
    };

    // ============ CANCEL BOOKING ============
    const openCancelModal = (booking: Booking) => {
        setCancellingBooking(booking);
        setShowCancelModal(true);
    };

    const handleCancelBooking = () => {
        if (!cancellingBooking) {
            return;
        }

        setCancelLoading(true);
        router.post(
            cancelBooking.url(cancellingBooking.id),
            {},
            {
                onSuccess: () => {
                    setShowCancelModal(false);
                    setCancellingBooking(null);
                    setCancelLoading(false);
                    toast.success('Booking cancelled successfully.');
                },
                onError: () => {
                    setCancelLoading(false);
                    toast.error('Failed to cancel booking.');
                },
            },
        );
    };

    // ============ COMPLETE BOOKING ============
    const openCompleteModal = (booking: Booking) => {
        setCompletingBooking(booking);
        setShowCompleteModal(true);
    };

    const handleCompleteBooking = () => {
        if (!completingBooking) {
            return;
        }

        setCompleteLoading(true);
        router.post(
            completeBooking.url(completingBooking.id),
            {},
            {
                onSuccess: () => {
                    setShowCompleteModal(false);
                    setCompletingBooking(null);
                    setCompleteLoading(false);
                    toast.success('Booking marked as completed.');
                },
                onError: () => {
                    setCompleteLoading(false);
                    toast.error('Failed to complete booking.');
                },
            },
        );
    };

    // ============ DELETE BOOKING ============
    const openDeleteModal = (booking: Booking) => {
        setDeletingBooking(booking);
        setShowDeleteModal(true);
    };

    const handleDeleteBooking = () => {
        if (!deletingBooking) {
            return;
        }

        setDeleteLoading(true);
        router.delete(deleteBooking.url(deletingBooking.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingBooking(null);
                setDeleteLoading(false);
                toast.success('Booking deleted successfully.');
            },
            onError: () => {
                setDeleteLoading(false);
                toast.error('Failed to delete booking.');
            },
        });
    };

    // ============ PAGINATION ============
    const handlePageChange = (url: string | null) => {
        if (!url) {
            return;
        }

        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const renderPagination = (data: PaginatedData<Booking>) => {
        if (data.last_page <= 1) {
            return null;
        }

        return (
            <div className="mt-4 flex items-center justify-center gap-2">
                {data.links.map((link, i) => (
                    <Button
                        key={i}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => handlePageChange(link.url)}
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    </Button>
                ))}
            </div>
        );
    };

    const getStatusBadge = (status: string, isExpired: boolean) => {
        if (isExpired || status === 'expired') {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1 h-3 w-3" />
                    Expired
                </Badge>
            );
        }

        if (status === 'active') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                </Badge>
            );
        }

        if (status === 'completed') {
            return (
                <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                </Badge>
            );
        }

        if (status === 'cancelled') {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1 h-3 w-3" />
                    Cancelled
                </Badge>
            );
        }

        return <Badge variant="outline">{status}</Badge>;
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

    const renderSkeletonRows = () => (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-3 text-right">
                        <Skeleton className="ml-auto h-4 w-24" />
                    </td>
                </tr>
            ))}
        </>
    );

    return (
        <>
            <Head title="Booking Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Booking Management"
                        description="Manage all customer table bookings"
                        icon={Calendar}
                    />
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-black text-gray-900">
                                {stats.total_bookings}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-gray-500">
                                Total Bookings
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-black text-green-600">
                                {stats.active_bookings}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-green-500">
                                Active Bookings
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-black text-red-600">
                                {stats.expired_bookings}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-red-500">
                                Expired Bookings
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-black text-blue-600">
                                {stats.available_tables}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-blue-500">
                                Available Tables
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-black text-red-600">
                                {stats.reserved_tables}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-red-500">
                                Reserved Tables
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, ID, or table..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Booking ID
                                    </th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Customer Name
                                    </th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Phone Number
                                    </th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Booked Tables
                                    </th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Booking Date & Time
                                    </th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Remaining Time
                                    </th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                                        Payment
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-4 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Calendar className="h-8 w-8 text-muted-foreground/50" />
                                                <p className="text-sm text-muted-foreground">
                                                    No bookings found.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.data.map((booking) => {
                                        const isActive =
                                            booking.status === 'active' &&
                                            !booking.is_expired;
                                        const canCancel = isActive;
                                        const canComplete = isActive;
                                        const canDelete = !isActive;

                                        return (
                                            <tr
                                                key={booking.id}
                                                className="border-b transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3 font-mono text-sm font-medium">
                                                    #{booking.id}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    {booking.customer_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {booking.customer_phone}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {booking.tables.map(
                                                            (t) => (
                                                                <Badge
                                                                    key={t.id}
                                                                    variant="secondary"
                                                                    className="text-xs whitespace-nowrap"
                                                                >
                                                                    <Table2 className="mr-1 h-3 w-3" />
                                                                    T
                                                                    {
                                                                        t.table_number
                                                                    }
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
                                                    {formatDateTime(
                                                        booking.booked_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                    {isActive &&
                                                    timeRemainingMap[
                                                        booking.id
                                                    ] ? (
                                                        <span className="font-bold text-red-500">
                                                            {
                                                                timeRemainingMap[
                                                                    booking.id
                                                                ]
                                                            }
                                                        </span>
                                                    ) : booking.is_expired ? (
                                                        <span className="text-xs font-semibold text-red-500">
                                                            Expired
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(
                                                        booking.status,
                                                        booking.is_expired,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {booking.payment_status === 'paid' ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                            Paid
                                                        </Badge>
                                                    ) : booking.payment_status === 'expired' || booking.is_expired ? (
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                            Expired
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                                            Unpaid
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {can(
                                                            'view bookings',
                                                        ) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        booking,
                                                                    )
                                                                }
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {can(
                                                            'status bookings',
                                                        ) &&
                                                            canCancel && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openCancelModal(
                                                                            booking,
                                                                        )
                                                                    }
                                                                    title="Cancel Booking"
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        {can(
                                                            'status bookings',
                                                        ) &&
                                                            canComplete && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openCompleteModal(
                                                                            booking,
                                                                        )
                                                                    }
                                                                    title="Mark Completed"
                                                                    className="text-green-500 hover:text-green-700"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        {can(
                                                            'delete bookings',
                                                        ) &&
                                                            canDelete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openDeleteModal(
                                                                            booking,
                                                                        )
                                                                    }
                                                                    title="Delete Booking"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {renderPagination(bookings)}
            </div>

            {/* ============ VIEW MODAL ============ */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                    </DialogHeader>
                    {viewLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : viewingBooking ? (
                        <div className="space-y-4">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Status
                                </span>
                                {getStatusBadge(
                                    viewingBooking.status,
                                    viewingBooking.is_expired,
                                )}
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-2 rounded-lg bg-stone-50 p-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        {viewingBooking.customer_name}
                                    </span>
                                </div>
                                <p className="pl-6 text-sm text-muted-foreground">
                                    📞 {viewingBooking.customer_phone}
                                </p>
                                {viewingBooking.customer_email && (
                                    <p className="pl-6 text-sm text-muted-foreground">
                                        ✉️ {viewingBooking.customer_email}
                                    </p>
                                )}
                            </div>

                            {/* Booked Tables */}
                            <div>
                                <p className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Booked Tables
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {viewingBooking.tables.map(
                                        (t: BookingTable) => (
                                            <Badge
                                                key={t.id}
                                                variant="secondary"
                                                className="bg-indigo-50 text-indigo-700"
                                            >
                                                <Table2 className="mr-1 h-3 w-3" />
                                                Table {t.table_number}
                                            </Badge>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Times */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Booked:
                                    </span>
                                    <span className="font-medium">
                                        {formatDateTime(
                                            viewingBooking.booked_at,
                                        )}
                                    </span>
                                </div>
                                {viewingBooking.expires_at && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            Expires:
                                        </span>
                                        <span
                                            className={`font-medium ${viewingBooking.is_expired ? 'text-red-600' : 'text-red-600'}`}
                                        >
                                            {formatDateTime(
                                                viewingBooking.expires_at,
                                            )}
                                        </span>
                                    </div>
                                )}
                                {viewingBooking.cancelled_at && (
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-400" />
                                        <span className="text-muted-foreground">
                                            Cancelled:
                                        </span>
                                        <span className="font-medium text-red-600">
                                            {formatDateTime(
                                                viewingBooking.cancelled_at,
                                            )}
                                        </span>
                                    </div>
                                )}
                                {viewingBooking.payment_status && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-gray-400" />
                                        <span className="text-muted-foreground">
                                            Payment:
                                        </span>
                                        <span
                                            className={`font-medium ${
                                                viewingBooking.payment_status === 'paid'
                                                    ? 'text-green-600'
                                                    : viewingBooking.payment_status === 'expired'
                                                      ? 'text-red-600'
                                                      : viewingBooking.payment_status === 'pending'
                                                        ? 'text-orange-600'
                                                        : 'text-yellow-600'
                                            }`}
                                        >
                                            {viewingBooking.payment_status === 'paid'
                                                ? 'Paid'
                                                : viewingBooking.payment_status === 'expired'
                                                  ? 'Expired'
                                                  : viewingBooking.payment_status === 'pending'
                                                    ? 'Pending Verification'
                                                    : 'Unpaid'}
                                        </span>
                                    </div>
                                )}
                                {viewingBooking.extension_payment_status && viewingBooking.extension_payment_status !== 'unpaid' && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-gray-400" />
                                        <span className="text-muted-foreground">
                                            Extension Payment:
                                        </span>
                                        <span
                                            className={`font-medium ${
                                                viewingBooking.extension_payment_status === 'paid'
                                                    ? 'text-green-600'
                                                    : viewingBooking.extension_payment_status === 'rejected'
                                                      ? 'text-red-600'
                                                      : 'text-orange-600'
                                            }`}
                                        >
                                            {viewingBooking.extension_payment_status === 'paid'
                                                ? 'Paid'
                                                : viewingBooking.extension_payment_status === 'rejected'
                                                  ? 'Rejected'
                                                  : 'Pending'}
                                        </span>
                                    </div>
                                )}
                                {viewingBooking.booking_amount && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                            Booking Amount:
                                        </span>
                                        <span className="font-medium">
                                            {viewingBooking.booking_amount.toLocaleString()} ETB
                                        </span>
                                    </div>
                                )}
                                {viewingBooking.extension_amount && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                            Extension Amount:
                                        </span>
                                        <span className="font-medium">
                                            {viewingBooking.extension_amount.toLocaleString()} ETB
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            Failed to load booking details.
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowViewModal(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ CANCEL MODAL ============ */}
            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Cancel Booking?</DialogTitle>
                        <DialogDescription>
                            This will cancel the booking for{' '}
                            <span className="font-medium text-foreground">
                                {cancellingBooking?.customer_name}
                            </span>
                            {cancellingBooking &&
                                cancellingBooking.tables.length > 0 && (
                                    <>
                                        {' '}
                                        (Table
                                        {cancellingBooking.tables.length > 1
                                            ? 's'
                                            : ''}{' '}
                                        {cancellingBooking.tables
                                            .map((t) => t.table_number)
                                            .join(', ')}
                                        )
                                    </>
                                )}
                            . The tables will be released and become available.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelModal(false)}
                        >
                            Keep Booking
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelBooking}
                            disabled={cancelLoading}
                        >
                            {cancelLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Cancel Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ COMPLETE MODAL ============ */}
            <Dialog
                open={showCompleteModal}
                onOpenChange={setShowCompleteModal}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Mark as Completed?</DialogTitle>
                        <DialogDescription>
                            Mark this booking as completed for{' '}
                            <span className="font-medium text-foreground">
                                {completingBooking?.customer_name}
                            </span>
                            . The tables will be released and become available.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowCompleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCompleteBooking}
                            disabled={completeLoading}
                        >
                            {completeLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Mark Completed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ DELETE MODAL ============ */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Booking?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete the booking
                            {deletingBooking && (
                                <>
                                    {' '}
                                    for{' '}
                                    <span className="font-medium text-foreground">
                                        {deletingBooking.customer_name}
                                    </span>
                                </>
                            )}
                            .
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteBooking}
                            disabled={deleteLoading}
                        >
                            {deleteLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

BookingManagementIndex.layout = {
    breadcrumbs: [{ title: 'Booking Management', href: bookingsIndex.url() }],
};
