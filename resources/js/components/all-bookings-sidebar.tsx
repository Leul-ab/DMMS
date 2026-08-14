import { Link } from '@inertiajs/react';
import {
    Clock,
    Table2,
    X,
    ChevronLeft,
    ChevronRight,
    User,
    Calendar,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ListOrdered,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';

type BookingTable = {
    id: number;
    table_number: number;
};

type Booking = {
    id: number;
    customer_name: string;
    customer_phone: string;
    tables: BookingTable[];
    status: string;
    booked_at: string;
    expires_at: string | null;
    cancelled_at: string | null;
    time_remaining_seconds: number | null;
    is_expired: boolean;
};

type BookingsResponse = {
    bookings: Booking[];
    total: number;
    active_count: number;
};

export default function AllBookingsSidebar() {
    const [data, setData] = useState<BookingsResponse | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
    const [timeRemainingMap, setTimeRemainingMap] = useState<
        Record<number, string>
    >({});

    const fetchAllBookings = useCallback(async () => {
        try {
            const response = await fetch('/api/bookings');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: BookingsResponse = await response.json();
            setData(result);
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllBookings();
        const fetchInterval = setInterval(fetchAllBookings, 15000); // Poll every 15 seconds

        return () => clearInterval(fetchInterval);
    }, [fetchAllBookings]);

    // Update countdown timers for active bookings
    useEffect(() => {
        if (!data?.bookings) {
            return;
        }

        const calculateTimes = () => {
            const newMap: Record<number, string> = {};
            data.bookings.forEach((booking) => {
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
    }, [data]);

    const getStatusBadge = (status: string, isExpired: boolean) => {
        if (isExpired || status === 'cancelled') {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1 h-3 w-3" />
                    {status === 'cancelled' ? 'Cancelled' : 'Expired'}
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

        return <Badge variant="outline">{status}</Badge>;
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
        });
    };

    const activeBookings =
        data?.bookings?.filter((b) => b.status === 'active' && !b.is_expired) ||
        [];
    const otherBookings =
        data?.bookings?.filter((b) => b.status !== 'active' || b.is_expired) ||
        [];

    return (
        <>
            {/* Sidebar Overlay (mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 z-50 h-full w-full max-w-md transform border-r border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 text-white">
                    <div className="flex items-center gap-2">
                        <ListOrdered className="h-5 w-5" />
                        <h2 className="text-lg font-black">All Bookings</h2>
                        {data && (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                                {data.total}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex h-[calc(100%-64px)] flex-col overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                        </div>
                    ) : !data ||
                      !data.bookings ||
                      data.bookings.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                            <Calendar className="h-16 w-16 text-gray-200" />
                            <h3 className="mt-4 text-lg font-bold text-gray-500">
                                No Bookings
                            </h3>
                            <p className="mt-1 text-sm text-gray-400">
                                There are no bookings to display.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 p-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-indigo-50 p-3 text-center">
                                    <p className="text-2xl font-black text-indigo-600">
                                        {data.total}
                                    </p>
                                    <p className="text-xs font-semibold text-indigo-500">
                                        Total
                                    </p>
                                </div>
                                <div className="rounded-xl bg-green-50 p-3 text-center">
                                    <p className="text-2xl font-black text-green-600">
                                        {data.active_count}
                                    </p>
                                    <p className="text-xs font-semibold text-green-500">
                                        Active
                                    </p>
                                </div>
                                <div className="rounded-xl bg-red-50 p-3 text-center">
                                    <p className="text-2xl font-black text-red-600">
                                        {data.total - data.active_count}
                                    </p>
                                    <p className="text-xs font-semibold text-red-500">
                                        Inactive
                                    </p>
                                </div>
                            </div>

                            {/* Active Bookings Section */}
                            {activeBookings.length > 0 && (
                                <div>
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wider text-green-600 uppercase">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                        Active Bookings
                                    </h3>
                                    <div className="space-y-3">
                                        {activeBookings.map((booking) => (
                                            <BookingCard
                                                key={booking.id}
                                                booking={booking}
                                                timeRemaining={
                                                    timeRemainingMap[booking.id]
                                                }
                                                isExpanded={
                                                    expandedBooking ===
                                                    booking.id
                                                }
                                                onToggle={() =>
                                                    setExpandedBooking(
                                                        expandedBooking ===
                                                            booking.id
                                                            ? null
                                                            : booking.id,
                                                    )
                                                }
                                                getStatusBadge={getStatusBadge}
                                                formatTime={formatTime}
                                                formatDate={formatDate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Bookings Section */}
                            {otherBookings.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase">
                                        Past Bookings
                                    </h3>
                                    <div className="space-y-3">
                                        {otherBookings.map((booking) => (
                                            <BookingCard
                                                key={booking.id}
                                                booking={booking}
                                                timeRemaining={
                                                    timeRemainingMap[booking.id]
                                                }
                                                isExpanded={
                                                    expandedBooking ===
                                                    booking.id
                                                }
                                                onToggle={() =>
                                                    setExpandedBooking(
                                                        expandedBooking ===
                                                            booking.id
                                                            ? null
                                                            : booking.id,
                                                    )
                                                }
                                                getStatusBadge={getStatusBadge}
                                                formatTime={formatTime}
                                                formatDate={formatDate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

type BookingCardProps = {
    booking: Booking;
    timeRemaining?: string;
    isExpanded: boolean;
    onToggle: () => void;
    getStatusBadge: (status: string, isExpired: boolean) => React.ReactNode;
    formatTime: (dateStr: string) => string;
    formatDate: (dateStr: string) => string;
};

function BookingCard({
    booking,
    timeRemaining,
    isExpanded,
    onToggle,
    getStatusBadge,
    formatTime,
    formatDate,
}: BookingCardProps) {
    const isActive = booking.status === 'active' && !booking.is_expired;

    return (
        <div
            className={`rounded-xl border bg-white shadow-sm transition-all ${
                isActive
                    ? 'border-green-200 ring-1 ring-green-100'
                    : 'border-gray-100'
            }`}
        >
            {/* Card Header - Always visible */}
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-3 p-4 text-left"
            >
                <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                        isActive
                            ? 'bg-green-100'
                            : booking.status === 'cancelled'
                              ? 'bg-red-100'
                              : 'bg-gray-100'
                    }`}
                >
                    <User
                        className={`h-5 w-5 ${
                            isActive
                                ? 'text-green-600'
                                : booking.status === 'cancelled'
                                  ? 'text-red-500'
                                  : 'text-gray-500'
                        }`}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-gray-900">
                        {booking.customer_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                        <Table2 className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                            {booking.tables
                                .map((t) => `Table ${t.table_number}`)
                                .join(', ')}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(booking.status, booking.is_expired)}
                    {isActive && timeRemaining && (
                        <span className="text-xs font-bold text-red-500">
                            {timeRemaining}
                        </span>
                    )}
                </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="space-y-3 border-t border-gray-50 px-4 pt-3 pb-4">
                    {/* Customer Phone */}
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium text-gray-900">
                            {booking.customer_phone}
                        </span>
                    </div>

                    {/* Booked Tables */}
                    <div>
                        <p className="mb-1.5 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                            Tables
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {booking.tables.map((table) => (
                                <Badge
                                    key={table.id}
                                    variant="secondary"
                                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50"
                                >
                                    <Table2 className="mr-1 h-3 w-3" />
                                    Table {table.table_number}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Booking Time */}
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Booked:</span>
                        <span className="font-medium text-gray-900">
                            {formatDate(booking.booked_at)} at{' '}
                            {formatTime(booking.booked_at)}
                        </span>
                    </div>

                    {/* Expiry / Cancellation */}
                    {booking.expires_at && (
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">Expires:</span>
                            <span
                                className={`font-medium ${isActive ? 'text-red-600' : 'text-gray-500'}`}
                            >
                                {formatDate(booking.expires_at)} at{' '}
                                {formatTime(booking.expires_at)}
                            </span>
                        </div>
                    )}

                    {booking.cancelled_at && (
                        <div className="flex items-center gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="text-gray-500">Cancelled:</span>
                            <span className="font-medium text-red-600">
                                {formatDate(booking.cancelled_at)} at{' '}
                                {formatTime(booking.cancelled_at)}
                            </span>
                        </div>
                    )}

                    {/* View Details Link */}
                    <Link
                        href={`/booking/${booking.id}`}
                        className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-600"
                    >
                        View Full Details →
                    </Link>
                </div>
            )}
        </div>
    );
}
