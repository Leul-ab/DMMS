import { Link, router } from '@inertiajs/react';
import {
    Clock,
    Table2,
    X,
    ChevronRight,
    ChevronLeft,
    User,
    Calendar,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BookingData = {
    id: number;
    customer_name: string;
    tables: Array<{ id: number; table_number: number }>;
    booked_at: string;
    expires_at: string;
    time_remaining_seconds: number;
    payment_status: string;
};

export default function BookingSidebar() {
    const [booking, setBooking] = useState<BookingData | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);

    const fetchActiveBooking = useCallback(async () => {
        try {
            const response = await fetch('/api/active-booking');
            const data = await response.json();

            if (data.booking) {
                setBooking(data.booking);
                setIsOpen(true);
                setIsExpired(false);
            } else {
                if (data.expired && booking) {
                    setIsExpired(true);
                    toast.error('Your booking has expired.');
                    setTimeout(() => {
                        setBooking(null);
                        setIsOpen(false);
                        setIsExpired(false);
                    }, 3000);
                } else {
                    setBooking(null);
                    setIsOpen(false);
                }
            }
        } catch {
            // Silently fail - booking might not exist
        } finally {
            setIsLoading(false);
        }
    }, [booking]);

    useEffect(() => {
        fetchActiveBooking();
        const fetchInterval = setInterval(fetchActiveBooking, 10000); // Poll every 10 seconds

        return () => clearInterval(fetchInterval);
    }, []);

    useEffect(() => {
        if (!booking) {
            return;
        }

        const calculateTime = () => {
            const expiresAt = new Date(booking.expires_at).getTime();
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
        if (
            !booking ||
            !confirm('Are you sure you want to cancel this booking?')
        ) {
            return;
        }

        try {
            await fetch(`/booking/${booking.id}/cancel`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
            });
            toast.success('Booking cancelled.');
            setBooking(null);
            setIsOpen(false);
        } catch {
            toast.error('Failed to cancel booking.');
        }
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
                setBooking({ ...booking, payment_status: 'paid' });
            } else {
                toast.error(data.message || 'Payment failed.');
            }
        } catch {
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsPaying(false);
        }
    };

    if (isLoading || !booking) {
        return null;
    }

    const progressPercent =
        booking.time_remaining_seconds > 0
            ? (booking.time_remaining_seconds / 300) * 100
            : 0;

    return (
        <>
            {/* Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar - Top Right */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm transform border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-red-500 to-red-600 px-5 py-4 text-white">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <h2 className="text-lg font-black">Active Booking</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex h-[calc(100%-64px)] flex-col overflow-y-auto p-5">
                    {/* Timer Section */}
                    <div
                        className={`rounded-2xl p-5 text-center ${
                            isExpired ? 'bg-red-50' : 'bg-red-50'
                        }`}
                    >
                        <Clock
                            className={`mx-auto h-8 w-8 ${
                                isExpired ? 'text-red-500' : 'text-red-500'
                            }`}
                        />
                        <p
                            className={`mt-2 text-sm font-semibold ${
                                isExpired ? 'text-red-600' : 'text-red-600'
                            }`}
                        >
                            {isExpired ? 'Booking Expired' : 'Time Remaining'}
                        </p>
                        <p
                            className={`mt-1 text-3xl font-black ${
                                isExpired ? 'text-red-500' : 'text-red-500'
                            }`}
                        >
                            {isExpired ? '00:00' : timeRemaining}
                        </p>

                        {/* Progress Bar */}
                        {!isExpired && (
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-red-200">
                                <div
                                    className="h-full rounded-full bg-red-500 transition-all duration-1000"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <User className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500">
                                    Customer
                                </p>
                                <p className="font-bold text-gray-900">
                                    {booking.customer_name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status */}
                    {booking.payment_status && (
                        <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                Payment Status
                            </p>
                            <div className="mt-1">
                                {booking.payment_status === 'paid' ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Paid
                                    </span>
                                ) : booking.payment_status === 'expired' || isExpired ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600">
                                        <X className="h-4 w-4" />
                                        Expired
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-yellow-600">
                                        Unpaid
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Booked Tables */}
                    <div className="mt-4">
                        <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                            Booked Tables
                        </h3>
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
                                            Table {table.table_number}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Booked & reserved
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

                    {/* Booking Time */}
                    <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                            Booking Time
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                            {new Date(booking.booked_at).toLocaleTimeString(
                                [],
                                { hour: '2-digit', minute: '2-digit' },
                            )}
                        </p>
                        <p className="text-xs text-gray-400">
                            {new Date(booking.booked_at).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto space-y-3 pt-6">
                        {!isExpired && booking.payment_status !== 'paid' && (
                            <Button
                                onClick={handlePay}
                                disabled={isPaying}
                                className="w-full rounded-xl bg-green-600 py-3.5 text-white hover:bg-green-700"
                            >
                                {isPaying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Pay Now
                                    </span>
                                )}
                            </Button>
                        )}
                        <Link
                            href={`/booking/${booking.id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                        >
                            View Full Details
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="w-full rounded-xl py-3.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel Booking
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
