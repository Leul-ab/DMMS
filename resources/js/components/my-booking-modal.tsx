import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, Table2, X, ChevronRight, User, Calendar, Hash, Ticket, Search, Phone, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

type BookingData = {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_code: string | null;
    status: string;
    tables: Array<{ id: number; table_number: number }>;
    booked_at: string;
    expires_at: string;
    time_remaining_seconds: number;
};

export default function MyBookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [step, setStep] = useState<'code-input' | 'details' | 'error'>('code-input');
    const [customerCode, setCustomerCode] = useState('');
    const [booking, setBooking] = useState<BookingData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep('code-input');
            setCustomerCode('');
            setBooking(null);
            setErrorMessage('');
            setIsExpired(false);
        }
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (!booking || step !== 'details') return;

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
            setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [booking, step]);

    const handleSearch = async () => {
        if (!customerCode.trim()) {
            setErrorMessage('Please enter your customer code.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch(`/api/booking-by-code/${encodeURIComponent(customerCode.trim().toUpperCase())}`);
            const data = await response.json();

            if (!response.ok || data.error) {
                setStep('error');
                setErrorMessage(data.error || 'Invalid customer code. Please try again.');
            } else if (data.booking) {
                setBooking(data.booking);
                setIsExpired(data.is_expired || false);
                setStep('details');
            } else {
                setStep('error');
                setErrorMessage('Invalid customer code. Please try again.');
            }
        } catch {
            setStep('error');
            setErrorMessage('Failed to fetch booking details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!booking || !confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const response = await fetch(`/booking/${booking.id}/cancel`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });

            if (response.ok) {
                toast.success('Booking cancelled successfully.');
                onClose();
            } else {
                toast.error('Failed to cancel booking.');
            }
        } catch {
            toast.error('Failed to cancel booking.');
        }
    };

    const handleRefresh = async () => {
        if (!booking) return;

        try {
            const response = await fetch(`/api/booking-by-code/${encodeURIComponent(booking.customer_code || '')}`);
            const data = await response.json();

            if (data.booking) {
                setBooking(data.booking);
                setIsExpired(data.is_expired || false);
                toast.success('Booking status refreshed.');
            } else {
                toast.error('Booking no longer exists.');
                onClose();
            }
        } catch {
            toast.error('Failed to refresh booking.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
                    {step === 'code-input' && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white">
                                <div>
                                    <h2 className="text-xl font-black">View My Booking</h2>
                                    <p className="text-sm text-white/80">Enter your customer code</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">
                                        Customer Code
                                    </label>
                                    <input
                                        type="text"
                                        value={customerCode}
                                        onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                        placeholder="Enter your customer code"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-lg font-bold uppercase outline-none focus:border-orange-500"
                                        autoFocus
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <Button
                                    onClick={handleSearch}
                                    disabled={isLoading}
                                    className="w-full rounded-xl bg-orange-500 py-6 text-base font-bold text-white hover:bg-orange-600"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Searching...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Search className="h-5 w-5" />
                                            Search Booking
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'details' && booking && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-6 w-6" />
                                    <h2 className="text-xl font-black">My Booking</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
                                {/* Timer Section */}
                                <div className={`rounded-2xl p-6 text-center ${
                                    isExpired ? 'bg-red-50' : 'bg-orange-50'
                                }`}>
                                    <Clock className={`mx-auto h-10 w-10 ${
                                        isExpired ? 'text-red-500' : 'text-orange-500'
                                    }`} />
                                    <p className={`mt-2 text-sm font-semibold ${
                                        isExpired ? 'text-red-600' : 'text-orange-600'
                                    }`}>
                                        {isExpired ? 'Booking Expired' : 'Time Remaining'}
                                    </p>
                                    <p className={`mt-1 text-4xl font-black ${
                                        isExpired ? 'text-red-500' : 'text-orange-500'
                                    }`}>
                                        {isExpired ? '00:00' : timeRemaining}
                                    </p>

                                    {/* Progress Bar */}
                                    {!isExpired && booking.time_remaining_seconds > 0 && (
                                        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-orange-200">
                                            <div
                                                className="h-full rounded-full bg-orange-500 transition-all duration-1000"
                                                style={{
                                                    width: `${Math.max(0, Math.min(100, (booking.time_remaining_seconds / 600) * 100))}%`
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Status Badge */}
                                <div className="flex justify-center">
                                    <Badge
                                        variant="outline"
                                        className={`px-4 py-1.5 text-sm font-bold ${
                                            isExpired
                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                : booking.status === 'active'
                                                ? 'bg-green-50 text-green-600 border-green-200'
                                                : 'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}
                                    >
                                        {isExpired
                                            ? 'Expired'
                                            : booking.status === 'active'
                                            ? 'Reserved'
                                            : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </Badge>
                                </div>

                                {/* Customer Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-stone-50 p-4">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-orange-500" />
                                            <p className="text-xs font-semibold text-gray-500">Customer</p>
                                        </div>
                                        <p className="mt-1.5 font-bold text-gray-900">{booking.customer_name}</p>
                                        {booking.customer_phone && (
                                            <p className="text-xs text-gray-500 mt-0.5">{booking.customer_phone}</p>
                                        )}
                                    </div>

                                    {booking.customer_code && (
                                        <div className="rounded-2xl bg-stone-50 p-4">
                                            <div className="flex items-center gap-2">
                                                <Ticket className="h-4 w-4 text-orange-500" />
                                                <p className="text-xs font-semibold text-gray-500">Customer Code</p>
                                            </div>
                                            <p className="mt-1.5 font-bold text-gray-900">{booking.customer_code}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Booking ID */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-orange-500" />
                                        <p className="text-xs font-semibold text-gray-500">Booking ID</p>
                                    </div>
                                    <p className="mt-1.5 font-bold text-gray-900">BK-{String(booking.id).padStart(5, '0')}</p>
                                </div>

                                {/* Booked Tables */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <div className="flex items-center gap-2">
                                        <Table2 className="h-4 w-4 text-orange-500" />
                                        <p className="text-xs font-semibold text-gray-500">Booked Tables</p>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {booking.tables.map((table) => (
                                            <Badge key={table.id} variant="default" className="bg-orange-500 px-3 py-1.5 text-sm">
                                                <Table2 className="mr-1 h-3 w-3" />
                                                Table {table.table_number}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Booking Date & Time */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-stone-50 p-4">
                                        <p className="text-xs font-semibold text-gray-500">Booking Date</p>
                                        <p className="mt-1.5 font-bold text-gray-900">
                                            {new Date(booking.booked_at).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-stone-50 p-4">
                                        <p className="text-xs font-semibold text-gray-500">Booking Time</p>
                                        <p className="mt-1.5 font-bold text-gray-900">
                                            {new Date(booking.booked_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-gray-100 p-6 space-y-3">
                                <div className="flex gap-3">
                                    {!isExpired && booking.status === 'active' && (
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="flex-1 rounded-xl py-3.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel Booking
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={handleRefresh}
                                        className="flex-1 rounded-xl py-3.5 text-gray-700 hover:bg-gray-100"
                                    >
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                            <path d="M3 3v5h5" />
                                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                            <path d="M16 16h5v5" />
                                        </svg>
                                        Refresh Status
                                    </Button>
                                </div>
                                <Link
                                    href="/menu"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 font-bold text-white transition hover:bg-orange-500"
                                >
                                    Back to Menu
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </>
                    )}

                    {step === 'error' && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-white">
                                <h2 className="text-xl font-black">Error</h2>
                                <button
                                    onClick={onClose}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5 text-center">
                                <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
                                <h3 className="text-xl font-bold text-gray-900">Invalid Customer Code</h3>
                                <p className="text-gray-500">{errorMessage}</p>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1 rounded-xl py-3.5"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setStep('code-input');
                                            setErrorMessage('');
                                        }}
                                        className="flex-1 rounded-xl bg-orange-500 py-3.5 text-white hover:bg-orange-600"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
