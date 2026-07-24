import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, Table2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AllBookingsSidebar from '@/components/all-bookings-sidebar';

type TableBooking = {
    id: number;
    customer: {
        id: number;
        name: string;
        phone: string;
    };
    tables: Array<{
        id: number;
        table_number: number;
    }>;
    status: string;
    booked_at: string;
    expires_at: string;
    cancelled_at: string | null;
};

type Props = {
    booking: TableBooking;
};

export default function BookingShow({ booking }: Props) {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const expiresAt = new Date(booking.expires_at).getTime();
            const now = Date.now();
            const diff = expiresAt - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeRemaining('Expired');
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    }, [booking.expires_at]);

    const handleCancel = () => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        router.post(`/booking/${booking.id}/cancel`, {}, {
            onSuccess: () => {
                toast.success('Booking cancelled successfully.');
            },
            onError: () => {
                toast.error('Failed to cancel booking.');
            },
        });
    };

    if (booking.status !== 'active' || isExpired) {
        return (
            <>
                <Head title="Booking - Expired" />
                <div className="min-h-screen bg-stone-50 text-gray-900">
                    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">
                                    DINE<span className="text-orange-500">.</span>
                                </h1>
                                <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Digital Menu</p>
                            </div>
                        </div>
                    </header>
                    <main className="mx-auto max-w-2xl px-5 py-20 text-center">
                        <XCircle className="mx-auto h-16 w-16 text-red-400" />
                        <h1 className="mt-6 text-3xl font-black">
                            {booking.status === 'cancelled' ? 'Booking Cancelled' : 'Booking Expired'}
                        </h1>
                        <p className="mt-3 text-gray-500">
                            {booking.status === 'cancelled'
                                ? 'This booking has been cancelled.'
                                : 'The 10-minute booking window has expired.'}
                        </p>
                        <a
                            href="/booking"
                            className="mt-8 inline-block rounded-xl bg-gray-900 px-8 py-4 font-bold text-white transition hover:bg-orange-500"
                        >
                            Book Again →
                        </a>
                    </main>
                </div>
                <AllBookingsSidebar />
            </>
        );
    }

    return (
        <>
            <Head title="Booking Confirmed" />
            <div className="min-h-screen bg-stone-50 text-gray-900">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">
                                DINE<span className="text-orange-500">.</span>
                            </h1>
                            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Digital Menu</p>
                        </div>
                        <a
                            href="/menu"
                            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
                        >
                            ← Browse Menu
                        </a>
                    </div>
                </header>

                {/* Main */}
                <main className="mx-auto max-w-2xl px-5 py-12">
                    {/* Success */}
                    <div className="mb-8 text-center">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                        <h1 className="mt-4 text-3xl font-black">Booking Confirmed!</h1>
                        <p className="mt-2 text-gray-500">
                            Your tables have been booked. Please arrive within the time limit.
                        </p>
                    </div>

                    {/* Timer */}
                    <div className="mb-6 flex items-center justify-center gap-4 rounded-3xl bg-orange-50 p-6">
                        <Clock className="h-8 w-8 text-orange-500" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-500">Time Remaining</p>
                            <p className="text-3xl font-black text-orange-500">{timeRemaining}</p>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                        <h2 className="text-2xl font-black mb-6">Booking Details</h2>

                        <div className="space-y-5">
                            <div className="rounded-2xl bg-stone-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">Customer</p>
                                <p className="mt-1 text-lg font-bold">{booking.customer.name}</p>
                                <p className="text-sm text-gray-500">{booking.customer.phone}</p>
                            </div>

                            <div className="rounded-2xl bg-stone-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">Booked Tables</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {booking.tables.map((table) => (
                                        <Badge key={table.id} variant="default" className="px-3 py-1.5 text-sm">
                                            <Table2 className="mr-1 h-3 w-3" />
                                            Table {table.table_number}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-stone-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">Booked At</p>
                                <p className="mt-1 font-medium">
                                    {new Date(booking.booked_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-stone-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">Expires At</p>
                                <p className="mt-1 font-medium text-orange-600">
                                    {new Date(booking.expires_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1 rounded-xl py-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                                <XCircle className="mr-2 h-5 w-5" />
                                Cancel Booking
                            </Button>
                            <a
                                href="/menu"
                                className="flex-1 rounded-xl bg-orange-500 px-5 py-3.5 text-center font-bold text-white hover:bg-orange-600"
                            >
                                Browse Menu →
                            </a>
                        </div>
                    </div>
                </main>

                <AllBookingsSidebar />

                {/* Footer */}
                <footer className="mt-12 border-t border-gray-200 bg-white">
                    <div className="mx-auto max-w-5xl px-5 py-8 text-center">
                        <p className="font-black">DINE<span className="text-orange-500">.</span></p>
                        <p className="mt-2 text-sm text-gray-500">Thank you for dining with us.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
