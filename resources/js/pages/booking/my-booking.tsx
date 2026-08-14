import {
    Clock,
    Table2,
    X,
    User,
    Calendar,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Loader2,
    SearchX,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BookingTable = {
    id: number;
    table_number: number;
};

type BookingData = {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_id: number;
    tables: BookingTable[];
    status: string;
    payment_status: string;
    booked_at: string;
    expires_at: string | null;
    cancelled_at: string | null;
    paid_at: string | null;
    time_remaining_seconds: number | null;
    is_expired: boolean;
};

type Props = {
    onClose: () => void;
};

export default function MyBooking({ onClose }: Props) {
    const [step, setStep] = useState<'phone' | 'booking'>('phone');
    const [phoneInput, setPhoneInput] = useState('');
    const [codeError, setCodeError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const [booking, setBooking] = useState<BookingData | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchActiveBooking = useCallback(
        async (showRefreshIndicator = false) => {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            }

            try {
                const getXsrfToken = () => {
                    const match = document.cookie.match(
                        new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                    );

                    return match ? decodeURIComponent(match[3]) : '';
                };

                const response = await fetch('/api/active-booking', {
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                });
                const data = await response.json();

                if (data.booking) {
                    setBooking(data.booking);
                    setIsExpired(data.booking.is_expired || false);
                    setError(null);
                } else {
                    if (data.expired) {
                        setIsExpired(true);

                        if (booking) {
                            setBooking({ ...booking, status: 'expired' });
                        }
                    } else {
                        setBooking(null);
                        setError('No active booking found.');
                    }
                }
            } catch {
                setError('Failed to load booking. Please try again.');
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [booking],
    );

    useEffect(() => {
        // Don't fetch on mount - wait for code verification
        setIsLoading(false);
    }, []);

    // Lock background scroll while the modal is open. The current scroll
    // position is preserved (we never change scrollY), and it is restored
    // automatically when the modal unmounts (on close).
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const handleVerifyCode = async () => {
        const trimmedPhone = phoneInput.trim();

        if (!trimmedPhone) {
            setCodeError('Phone number is required.');

            return;
        }

        setCodeError(null);
        setIsVerifying(true);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch('/api/bookings/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ phone: trimmedPhone }),
            });

            const data = await response.json();

            if (data.found && data.booking) {
                setBooking(data.booking);
                setIsExpired(data.booking.is_expired || false);
                setError(null);
                setStep('booking');
                setIsLoading(false);
            } else {
                setIsLoading(false);

                if (data.found && !data.booking) {
                    setError('No active booking found for this phone number.');
                    setStep('booking');
                } else {
                    setCodeError(
                        'No booking found. Please check your phone number.',
                    );
                }
            }
        } catch {
            setCodeError('Failed to verify phone number. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Real-time countdown
    useEffect(() => {
        if (!booking || booking.status !== 'active' || !booking.expires_at) {
            return;
        }

        const calculateTime = () => {
            const expiresAt = new Date(booking.expires_at!).getTime();
            const now = Date.now();
            const diff = Math.floor((expiresAt - now) / 1000);

            if (diff <= 0) {
                setIsExpired(true);
                setTimeRemaining('Expired');

                return;
            }

            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;
            setTimeRemaining(
                `${minutes}:${seconds.toString().padStart(2, '0')}`,
            );
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    }, [booking]);

    const handleCancel = async () => {
        if (!booking) {
            return;
        }

        setIsCancelling(true);

        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const response = await fetch(`/booking/${booking.id}/cancel`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                toast.success('Booking cancelled successfully.');
                setBooking({ ...booking, status: 'cancelled' });
                setIsExpired(true);
            } else {
                toast.error('Failed to cancel booking.');
            }
        } catch {
            toast.error('Failed to cancel booking. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleRefresh = () => {
        fetchActiveBooking(true);
        toast.success('Booking status refreshed.');
    };

    const getStatusBadge = () => {
        if (!booking) {
            return null;
        }

        if (
            isExpired ||
            booking.status === 'cancelled' ||
            booking.status === 'expired'
        ) {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    {booking.status === 'cancelled' ? 'Cancelled' : 'Expired'}
                </Badge>
            );
        }

        if (booking.status === 'active') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Reserved
                </Badge>
            );
        }

        if (booking.status === 'completed') {
            return (
                <Badge
                    variant="secondary"
                    className="bg-blue-100 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Completed
                </Badge>
            );
        }

        if (booking.status === 'confirmed') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Confirmed
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
                {booking.status}
            </Badge>
        );
    };

    const getPaymentBadge = () => {
        if (!booking) {
            return null;
        }

        if (booking.payment_status === 'paid') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Paid
                </Badge>
            );
        }

        if (booking.payment_status === 'expired' || isExpired) {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Expired
                </Badge>
            );
        }

        return (
            <Badge
                variant="secondary"
                className="bg-yellow-100 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100"
            >
                Unpaid
            </Badge>
        );
    };

    const handlePay = async () => {
        if (!booking) {
            return;
        }

        setIsPaying(true);

        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const response = await fetch(`/booking/${booking.id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Payment confirmed successfully!');
                setBooking({ ...booking, payment_status: 'paid', paid_at: data.booking?.paid_at || new Date().toISOString() });
            } else {
                toast.error(data.message || 'Payment failed.');
            }
        } catch {
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsPaying(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const progressPercent =
        booking?.time_remaining_seconds && booking?.time_remaining_seconds > 0
            ? (booking.time_remaining_seconds / 300) * 100
            : 0;

    const showCancelButton =
        booking && !isExpired && booking.status === 'active';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between rounded-t-3xl border-b border-gray-100 bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <h2 className="text-lg font-black">My Booking</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Enter Phone Number */}
                    {step === 'phone' && (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <User className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="mt-4 text-xl font-black text-gray-900">
                                    Enter Your Phone Number
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Please enter your phone number to view your
                                    booking.
                                </p>
                            </div>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => {
                                        setPhoneInput(e.target.value);
                                        setCodeError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleVerifyCode();
                                        }
                                    }}
                                    placeholder="Enter your phone number"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-red-500"
                                    autoFocus
                                />
                                {codeError && (
                                    <p className="mt-2 text-sm text-red-500">
                                        {codeError}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl py-3.5 font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={isVerifying}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                                >
                                    {isVerifying ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Verifying...
                                        </span>
                                    ) : (
                                        'View Booking'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Show Booking Details */}
                    {step === 'booking' && isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            <p className="mt-3 text-sm text-gray-500">
                                Loading your booking...
                            </p>
                        </div>
                    ) : step === 'booking' && error && !booking ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <SearchX className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="mt-4 text-xl font-black text-gray-900">
                                No Active Booking
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {error}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep('phone');
                                    setPhoneInput('');
                                    setCodeError(null);
                                }}
                                className="mt-4 rounded-xl px-6 py-3.5 font-bold"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="mt-2 rounded-xl px-6 py-3.5 font-bold text-gray-500"
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        step === 'booking' &&
                        booking && (
                            <div className="space-y-5">
                                {/* Timer Section */}
                                {booking.status === 'active' && !isExpired ? (
                                    <div className="rounded-2xl bg-red-50 p-5 text-center">
                                        <Clock className="mx-auto h-8 w-8 text-red-500" />
                                        <p className="mt-2 text-sm font-semibold text-red-600">
                                            Time Remaining
                                        </p>
                                        <p className="mt-1 text-4xl font-black text-red-500">
                                            {timeRemaining}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-red-200">
                                            <div
                                                className="h-full rounded-full bg-red-500 transition-all duration-1000"
                                                style={{
                                                    width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl bg-red-50 p-5 text-center">
                                        <XCircle className="mx-auto h-8 w-8 text-red-500" />
                                        <p className="mt-2 text-sm font-semibold text-red-600">
                                            Booking Expired
                                        </p>
                                        <p className="mt-1 text-3xl font-black text-red-500">
                                            00:00
                                        </p>
                                    </div>
                                )}

                                {/* Status */}
                                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                                    <p className="text-sm font-semibold text-gray-500">
                                        Booking Status
                                    </p>
                                    {getStatusBadge()}
                                </div>

                                {/* Payment Status */}
                                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                                    <p className="text-sm font-semibold text-gray-500">
                                        Payment Status
                                    </p>
                                    {getPaymentBadge()}
                                </div>

                                {/* Customer Info */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                        Customer
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {booking.customer_name}
                                    </p>
                                    <p className="mt-0.5 text-sm text-gray-500">
                                        Phone:{' '}
                                        <span className="font-bold text-gray-900">
                                            {booking.customer_phone}
                                        </span>
                                    </p>
                                </div>

                                {/* Booking ID */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                        Booking ID
                                    </p>
                                    <p className="font-bold text-gray-900">
                                        BK-{String(booking.id).padStart(6, '0')}
                                    </p>
                                </div>

                                {/* Booked Tables */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                        Reserved Tables
                                    </p>
                                    <div className="space-y-2">
                                        {booking.tables.map((table) => (
                                            <div
                                                key={table.id}
                                                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                                    <Table2 className="h-5 w-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        Table{' '}
                                                        {table.table_number}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Reserved
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="default"
                                                    className="ml-auto bg-red-500"
                                                >
                                                    Reserved
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Booking Time & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-stone-50 p-4">
                                        <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            Booking Time
                                        </p>
                                        <p className="font-bold text-gray-900">
                                            {formatTime(booking.booked_at)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-stone-50 p-4">
                                        <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            Booking Date
                                        </p>
                                        <p className="font-bold text-gray-900">
                                            {formatDate(booking.booked_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 pt-2">
                                    {showCancelButton && (
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={isCancelling}
                                            className="w-full rounded-xl border-red-200 py-3.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            {isCancelling ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Cancelling...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <XCircle className="h-4 w-4" />
                                                    Cancel Booking
                                                </span>
                                            )}
                                        </Button>
                                    )}
                                    {booking && !isExpired && booking.status === 'active' && booking.payment_status !== 'paid' && (
                                        <Button
                                            onClick={handlePay}
                                            disabled={isPaying}
                                            className="w-full rounded-xl bg-green-600 py-3.5 text-white hover:bg-green-700"
                                        >
                                            {isPaying ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Pay Now
                                                </span>
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="w-full rounded-xl py-3.5 text-gray-500 hover:bg-gray-50"
                                    >
                                        {isRefreshing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Refresh Booking Status
                                    </Button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
