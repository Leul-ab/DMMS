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
    Wallet,
    Smartphone,
    Building2,
    Hourglass,
    AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type BookingTable = {
    id: number;
    table_number: number;
};

type BookingPaymentInfo = {
    id: number;
    payment_method: string | null;
    amount: number | null;
    payment_status: string;
};

type BookingData = {
    id: number;
    customer_name: string;
    tables: BookingTable[];
    booked_at: string;
    expires_at: string;
    time_remaining_seconds: number;
    payment_status: string;
    status: string;
    extension_payment_status: string | null;
    booking_amount: number | null;
    extension_fee: number | null;
    is_expired: boolean;
    pending_payment: BookingPaymentInfo | null;
    pending_extension_payment: BookingPaymentInfo | null;
    can_extend: boolean;
};

export default function BookingSidebar() {
    const [booking, setBooking] = useState<BookingData | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
    const [extensionError, setExtensionError] = useState<string | null>(null);
    const [extensionPaymentMethod, setExtensionPaymentMethod] = useState<string | null>(null);
    const [extensionTransactionNumber, setExtensionTransactionNumber] = useState('');
    const [extensionPayerName, setExtensionPayerName] = useState('');
    const [extensionPayerPhone, setExtensionPayerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const [transactionNumber, setTransactionNumber] = useState('');
    const [payerName, setPayerName] = useState('');
    const [payerPhone, setPayerPhone] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const CBE_BIRR_NUMBER = '1000976545673';
    const TELEBIRR_NUMBER = '0987574556';

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
        const fetchInterval = setInterval(fetchActiveBooking, 10000);

        return () => clearInterval(fetchInterval);
    }, [fetchActiveBooking]);

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

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            if (hours > 0) {
                setTimeRemaining(
                    `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
                );
            } else {
                setTimeRemaining(
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
                );
            }
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

    const handleSubmitPayment = async () => {
        if (!booking || !paymentMethod || !transactionNumber.trim() || !payerName.trim() || !payerPhone.trim()) {
            setPaymentError('Please fill in all required fields.');
            return;
        }

        setIsSubmittingPayment(true);
        setPaymentError(null);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            const response = await fetch(`/booking/${booking.id}/submit-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    payment_method: paymentMethod,
                    transaction_number: transactionNumber,
                    payer_name: payerName,
                    payer_phone: payerPhone,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Payment submitted. Waiting for verification.');
                setBooking((prev) => prev ? {
                    ...prev,
                    payment_status: 'pending',
                    pending_payment: {
                        id: data.payment.id,
                        payment_method: data.payment.payment_method,
                        amount: data.payment.amount,
                        payment_status: data.payment.payment_status,
                    },
                } : null);
                setShowPaymentForm(false);
                setPaymentMethod(null);
                setTransactionNumber('');
                setPayerName('');
                setPayerPhone('');
            } else {
                setPaymentError(data.message || 'Payment submission failed.');
            }
        } catch {
            setPaymentError('Payment submission failed. Please try again.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleSubmitExtensionPayment = async () => {
        if (!booking || !extensionPaymentMethod || !extensionTransactionNumber.trim() || !extensionPayerName.trim() || !extensionPayerPhone.trim()) {
            setExtensionError('Please fill in all required fields.');
            return;
        }

        setIsSubmittingExtension(true);
        setExtensionError(null);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            const response = await fetch(`/booking/${booking.id}/submit-extension-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    payment_method: extensionPaymentMethod,
                    transaction_number: extensionTransactionNumber,
                    payer_name: extensionPayerName,
                    payer_phone: extensionPayerPhone,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Extension payment submitted. Waiting for verification.');
                setBooking((prev) => prev ? {
                    ...prev,
                    extension_payment_status: 'pending',
                    pending_extension_payment: {
                        id: data.payment.id,
                        payment_method: data.payment.payment_method,
                        amount: data.payment.amount,
                        payment_status: data.payment.payment_status,
                    },
                } : null);
                setIsExtending(false);
                setExtensionPaymentMethod(null);
                setExtensionTransactionNumber('');
                setExtensionPayerName('');
                setExtensionPayerPhone('');
            } else {
                setExtensionError(data.message || 'Extension payment submission failed.');
            }
        } catch {
            setExtensionError('Extension payment failed. Please try again.');
        } finally {
            setIsSubmittingExtension(false);
        }
    };

    if (isLoading || !booking) {
        return null;
    }

    const isPendingPayment = booking.status === 'pending_payment' && booking.payment_status !== 'paid';
    const isActive = booking.status === 'active' || booking.status === 'extended';
    const showPaymentFormCondition = isPendingPayment && !booking.pending_payment && !isExpired;

    const progressPercent =
        booking.time_remaining_seconds > 0
            ? (booking.time_remaining_seconds / (isPendingPayment ? 300 : 7200)) * 100
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
                            isExpired ? 'bg-red-50' : isPendingPayment ? 'bg-orange-50' : 'bg-green-50'
                        }`}
                    >
                        <Clock
                            className={`mx-auto h-8 w-8 ${
                                isExpired ? 'text-red-500' : isPendingPayment ? 'text-orange-500' : 'text-green-500'
                            }`}
                        />
                        <p
                            className={`mt-2 text-sm font-semibold ${
                                isExpired ? 'text-red-600' : isPendingPayment ? 'text-orange-600' : 'text-green-600'
                            }`}
                        >
                            {isExpired ? 'Booking Expired' : isPendingPayment ? 'Payment Time Remaining' : 'Time Remaining'}
                        </p>
                        <p
                            className={`mt-1 text-3xl font-black ${
                                isExpired ? 'text-red-500' : isPendingPayment ? 'text-orange-500' : 'text-green-500'
                            }`}
                        >
                            {isExpired ? '00:00' : timeRemaining || '--:--'}
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
                                ) : booking.payment_status === 'pending' ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600">
                                        <Hourglass className="h-4 w-4" />
                                        Pending Verification
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-yellow-600">
                                        Unpaid
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pending Payment Info */}
                    {booking.pending_payment && (
                        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                            <p className="text-sm font-bold text-orange-700">
                                Payment Pending Verification
                            </p>
                            <p className="mt-1 text-xs text-orange-600">
                                Method: {booking.pending_payment.payment_method} | Amount: {booking.pending_payment.amount?.toLocaleString()} ETB
                            </p>
                        </div>
                    )}

                    {/* Pending Extension Payment Info */}
                    {booking.pending_extension_payment && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-bold text-amber-700">
                                Extension Payment Pending
                            </p>
                            <p className="mt-1 text-xs text-amber-600">
                                Method: {booking.pending_extension_payment.payment_method} | Amount: {booking.pending_extension_payment.amount?.toLocaleString()} ETB
                            </p>
                        </div>
                    )}

                    {/* Extension Notification */}
                    {booking.can_extend && !isExpired && !isExtending && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                                <div>
                                    <p className="text-sm font-bold text-amber-800">
                                        Your booking is about to expire.
                                    </p>
                                    <p className="mt-1 text-sm text-amber-600">
                                        Extension Fee: {booking.extension_fee?.toLocaleString()} ETB
                                    </p>
                                    <Button
                                        onClick={() => setIsExtending(true)}
                                        className="mt-2 w-full rounded-xl bg-amber-500 py-2 text-sm text-white hover:bg-amber-600"
                                    >
                                        Extend Time
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Extension Payment UI */}
                    {isExtending && (
                        <div className="mt-4 space-y-3 rounded-2xl border border-red-200/60 bg-red-50/40 p-4">
                            <h3 className="text-sm font-black text-stone-800">
                                Extend Booking
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-red-100/80 bg-white p-2">
                                    <p className="text-xs text-gray-500">Original</p>
                                    <p className="text-sm font-black text-stone-800">
                                        {booking.booking_amount?.toLocaleString()} ETB
                                    </p>
                                </div>
                                <div className="rounded-xl border border-red-100/80 bg-white p-2">
                                    <p className="text-xs text-gray-500">Extension Fee</p>
                                    <p className="text-sm font-black text-red-600">
                                        {booking.extension_fee?.toLocaleString()} ETB
                                    </p>
                                </div>
                            </div>

                            {extensionError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                                    {extensionError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExtensionPaymentMethod('cbe_birr')}
                                    className={`flex items-center gap-2 rounded-xl border-2 p-2 text-xs ${
                                        extensionPaymentMethod === 'cbe_birr'
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-red-100/80'
                                    }`}
                                >
                                    <Building2 className={`h-3 w-3 ${extensionPaymentMethod === 'cbe_birr' ? 'text-red-500' : 'text-gray-400'}`} />
                                    <span className="font-bold">CBE Birr</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExtensionPaymentMethod('telebirr')}
                                    className={`flex items-center gap-2 rounded-xl border-2 p-2 text-xs ${
                                        extensionPaymentMethod === 'telebirr'
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-red-100/80'
                                    }`}
                                >
                                    <Smartphone className={`h-3 w-3 ${extensionPaymentMethod === 'telebirr' ? 'text-red-500' : 'text-gray-400'}`} />
                                    <span className="font-bold">Telebirr</span>
                                </button>
                            </div>

                            {extensionPaymentMethod && (
                                <div className="rounded-xl border border-red-100/80 bg-red-50/40 p-2">
                                    <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">
                                        Send Payment To
                                    </p>
                                    <p className="text-xs font-bold text-stone-800">
                                        {extensionPaymentMethod === 'cbe_birr' ? CBE_BIRR_NUMBER : TELEBIRR_NUMBER}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Input
                                    value={extensionPayerName}
                                    onChange={(e) => setExtensionPayerName(e.target.value)}
                                    placeholder="Payer Name"
                                    className="h-9 text-xs"
                                />
                                <Input
                                    value={extensionPayerPhone}
                                    onChange={(e) => setExtensionPayerPhone(e.target.value)}
                                    placeholder="Payer Phone"
                                    className="h-9 text-xs"
                                />
                                <Input
                                    value={extensionTransactionNumber}
                                    onChange={(e) => setExtensionTransactionNumber(e.target.value)}
                                    placeholder="Transaction Number"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsExtending(false)}
                                    className="flex-1 rounded-xl py-2 text-xs text-red-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitExtensionPayment}
                                    disabled={!extensionPaymentMethod || !extensionTransactionNumber.trim() || !extensionPayerName.trim() || !extensionPayerPhone.trim() || isSubmittingExtension}
                                    className="flex-1 rounded-xl bg-green-600 py-2 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSubmittingExtension ? (
                                        <span className="flex items-center justify-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        `Pay ${booking.extension_fee?.toLocaleString()} ETB`
                                    )}
                                </Button>
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
                        {showPaymentFormCondition && (
                            <div className="space-y-3 rounded-2xl border border-red-200/60 bg-red-50/40 p-4">
                                <h3 className="text-sm font-black text-stone-800">
                                    Complete Payment
                                </h3>

                                {paymentError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                                        {paymentError}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cbe_birr')}
                                        className={`flex items-center gap-2 rounded-xl border-2 p-2 text-xs ${
                                            paymentMethod === 'cbe_birr'
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-red-100/80'
                                        }`}
                                    >
                                        <Building2 className={`h-3 w-3 ${paymentMethod === 'cbe_birr' ? 'text-red-500' : 'text-gray-400'}`} />
                                        <span className="font-bold">CBE Birr</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('telebirr')}
                                        className={`flex items-center gap-2 rounded-xl border-2 p-2 text-xs ${
                                            paymentMethod === 'telebirr'
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-red-100/80'
                                        }`}
                                    >
                                        <Smartphone className={`h-3 w-3 ${paymentMethod === 'telebirr' ? 'text-red-500' : 'text-gray-400'}`} />
                                        <span className="font-bold">Telebirr</span>
                                    </button>
                                </div>

                                {paymentMethod && (
                                    <div className="rounded-xl border border-red-100/80 bg-red-50/40 p-2">
                                        <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">
                                            Send Payment To
                                        </p>
                                        <p className="text-xs font-bold text-stone-800">
                                            {paymentMethod === 'cbe_birr' ? CBE_BIRR_NUMBER : TELEBIRR_NUMBER}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Input
                                        value={payerName}
                                        onChange={(e) => setPayerName(e.target.value)}
                                        placeholder="Payer Name"
                                        className="h-9 text-xs"
                                    />
                                    <Input
                                        value={payerPhone}
                                        onChange={(e) => setPayerPhone(e.target.value)}
                                        placeholder="Payer Phone"
                                        className="h-9 text-xs"
                                    />
                                    <Input
                                        value={transactionNumber}
                                        onChange={(e) => setTransactionNumber(e.target.value)}
                                        placeholder="Transaction Number"
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <Button
                                    onClick={handleSubmitPayment}
                                    disabled={!paymentMethod || !transactionNumber.trim() || !payerName.trim() || !payerPhone.trim() || isSubmittingPayment}
                                    className="w-full rounded-xl bg-green-600 py-2.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSubmittingPayment ? (
                                        <span className="flex items-center justify-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-1">
                                            <Wallet className="h-3 w-3" />
                                            Pay {booking.booking_amount?.toLocaleString()} ETB
                                        </span>
                                    )}
                                </Button>
                            </div>
                        )}

                        {!isExpired && booking.payment_status !== 'paid' && !showPaymentFormCondition && (
                            <Button
                                onClick={() => setShowPaymentForm(true)}
                                className="w-full rounded-xl bg-green-600 py-3.5 text-white hover:bg-green-700"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Pay Now
                                </span>
                            </Button>
                        )}

                        <Link
                            href={`/booking/${booking.id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                        >
                            View Full Details
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                        {!isExpired && (booking.status === 'pending_payment' || booking.status === 'active' || booking.status === 'extended') && (
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="w-full rounded-xl py-3.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Booking
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
