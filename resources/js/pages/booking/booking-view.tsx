import { Head, Link } from '@inertiajs/react';
import {
    Loader2,
    Clock,
    Table2,
    UserCheck,
    UserPlus,
    ListOrdered,
    Calendar,
    ArrowLeft,
    ArrowRight,
    X,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Wallet,
    Smartphone,
    Building2,
    ShieldCheck,
    Hourglass,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import PhoneInput, {
    isValidEthiopianPhone,
} from '@/components/phone-input';
import { store as bookingStore } from '@/routes/booking';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
    table_section_id: number | null;
};

type Section = {
    id: number;
    name: string;
    description: string | null;
    sort_order: number;
    available_tables: RestaurantTable[];
};

type Props = {
    availableTables: RestaurantTable[];
    sections: Section[];
    basePath: string;
    menuPath: string;
};

type PaymentMethod = 'cbe_birr' | 'telebirr' | null;

const CBE_BIRR_NUMBER = '1000976545673';
const TELEBIRR_NUMBER = '0987574556';

export default function BookingView({
    availableTables,
    sections,
    basePath,
    menuPath,
}: Props) {
    const [selectedTables, setSelectedTables] = useState<Set<string>>(
        new Set(),
    );
    const [step, setStep] = useState<'select' | 'verify' | 'confirm' | 'payment' | 'success'>('select');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [customerData, setCustomerData] = useState<{
        name: string;
        phone: string;
    } | null>(null);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(
        null,
    );
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
        null,
    );

    // Payment step state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
    const [transactionNumber, setTransactionNumber] = useState('');
    const [transactionReference, setTransactionReference] = useState('');
    const [payerName, setPayerName] = useState('');
    const [payerPhone, setPayerPhone] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentCountdown, setPaymentCountdown] = useState<string>('');
    const [bookingData, setBookingData] = useState<{
        id: number;
        expires_at: string;
        booking_amount: number;
    } | null>(null);

    const toggleTableSelection = (tableId: string) => {
        setSelectedTables((prev) => {
            const next = new Set(prev);

            if (next.has(tableId)) {
                next.delete(tableId);
            } else {
                next.add(tableId);
            }

            return next;
        });
    };

    const handleVerifyCustomer = async () => {
        if (!isValidEthiopianPhone(phoneNumber)) {
            setVerificationError(
                'Please enter a valid phone number starting with 9 (9 digits).',
            );

            return;
        }

        setIsVerifying(true);
        setVerificationError(null);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );
                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch('/booking/verify-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ phone: phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to verify customer.');
            }

            if (data.found) {
                setCustomerId(data.customer.id);
                setCustomerData({
                    name: data.customer.name,
                    phone: data.customer.phone,
                });
                setStep('confirm');
            } else {
                setVerificationError(data.message || 'Customer not found.');

                if (data.message?.includes('register')) {
                    setShowRegisterDialog(true);
                }
            }
        } catch (error: any) {
            setVerificationError(
                error.message || 'Failed to verify customer. Please try again.',
            );
        } finally {
            setIsVerifying(false);
        }
    };

    const handleBooking = async () => {
        if (!customerId || selectedTables.size === 0) {
            return;
        }

        setIsBooking(true);
        setPaymentError(null);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );
                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(bookingStore.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    table_ids: Array.from(selectedTables),
                    source: basePath.replace(/^\//, ''),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setBookingData({
                    id: data.booking.id,
                    expires_at: data.booking.expires_at,
                    booking_amount: data.booking.booking_amount,
                });
                setStep('payment');
                startPaymentCountdown(data.booking.expires_at);
            } else {
                toast.error(data.message || 'Failed to create booking.');
            }
        } catch {
            toast.error('Failed to create booking. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    const startPaymentCountdown = (expiresAt: string) => {
        const calculateTime = () => {
            const expiresAtDate = new Date(expiresAt).getTime();
            const now = Date.now();
            const diff = Math.floor((expiresAtDate - now) / 1000);

            if (diff <= 0) {
                setPaymentCountdown('00:00');
                handlePaymentTimeout();
                return;
            }

            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;
            setPaymentCountdown(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            );
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    };

    const handlePaymentTimeout = useCallback(() => {
        setPaymentError('Payment time expired. This booking has been cancelled.');
        setStep('success');
    }, []);

    useEffect(() => {
        if (step !== 'payment' || !bookingData?.expires_at) {
            return;
        }

        const cleanup = startPaymentCountdown(bookingData.expires_at);
        return cleanup;
    }, [step, bookingData]);

    const handleSubmitPayment = async () => {
        if (!paymentMethod || !transactionNumber.trim() || !payerName.trim() || !payerPhone.trim()) {
            setPaymentError('Please fill in all required fields.');
            return;
        }

        if (!bookingData) {
            setPaymentError('Booking data missing. Please try again.');
            return;
        }

        setIsSubmittingPayment(true);
        setPaymentError(null);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );
                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(`/booking/${bookingData.id}/submit-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    payment_method: paymentMethod,
                    transaction_number: transactionNumber,
                    transaction_reference: transactionReference || null,
                    payer_name: payerName,
                    payer_phone: payerPhone,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setPaymentSuccess(true);
                setStep('success');
                toast.success('Payment submitted successfully. Waiting for verification.');
            } else {
                setPaymentError(data.message || 'Payment submission failed.');
            }
        } catch {
            setPaymentError('Payment submission failed. Please try again.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const isPaymentFormValid = paymentMethod
        && transactionNumber.trim().length > 0
        && payerName.trim().length > 0
        && payerPhone.trim().length > 0;

    const handleBackToConfirm = () => {
        setStep('confirm');
    };

    return (
        <>
            <Head title="Book a Table" />
            <div className="min-h-screen bg-gradient-to-b from-red-50 via-red-50/30 to-white text-stone-800 selection:bg-red-200 selection:text-red-900">
                {/* ================= HEADER ================= */}
                <header className="sticky top-0 z-50 border-b border-red-200/60 bg-white/80 shadow-sm backdrop-blur-xl">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                        <Link href={basePath} className="group">
                            <h1 className="text-2xl font-black tracking-tight text-stone-800 transition group-hover:text-red-600">
                                DINE<span className="text-red-500">.</span>
                            </h1>
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-red-500 uppercase">
                                Reserve a Table
                            </p>
                        </Link>

                        <nav className="flex items-center gap-1.5 sm:gap-2.5">
                            <Link href={menuPath}>
                                <Button size="sm" className="rounded-full">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span className="xs:inline hidden">
                                        Back to
                                    </span>
                                    Menu
                                </Button>
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* ================= HERO ================= */}
                <section className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-red-900">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                    <div className="absolute -top-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-red-500/15 blur-3xl" />
                    <div
                        className="absolute -bottom-40 -left-40 h-[400px] w-[400px] animate-pulse rounded-full bg-red-500/10 blur-3xl"
                        style={{ animationDelay: '1s' }}
                    />

                    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                        <div className="max-w-2xl">
                            <Badge
                                variant="secondary"
                                className="mb-4 animate-in bg-red-500/15 text-red-200 backdrop-blur-sm fill-mode-both fade-in slide-in-from-left-4"
                            >
                                <Sparkles className="mr-1 h-3 w-3" />
                                Reserve Your Table
                            </Badge>

                            <h2
                                className="animate-in text-4xl leading-tight font-black text-white fill-mode-both fade-in slide-in-from-bottom-4 sm:text-5xl lg:text-6xl"
                                style={{ animationDelay: '100ms' }}
                            >
                                Book your table,
                                <br />
                                <span className="bg-gradient-to-r from-red-200 via-red-300 to-red-200 bg-clip-text text-transparent">
                                    we'll save your seat.
                                </span>
                            </h2>

                            <p
                                className="mt-5 max-w-xl animate-in text-base leading-relaxed text-red-200/80 fill-mode-both fade-in slide-in-from-bottom-4 sm:text-lg"
                                style={{ animationDelay: '200ms' }}
                            >
                                Select your tables, verify your identity, and
                                reserve your spot in just a few easy steps. Your
                                table will be held for you once confirmed.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================= MAIN CONTENT ================= */}
                <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                    {/* Step Indicator */}
                    {(step === 'select' || step === 'verify' || step === 'confirm' || step === 'payment') && (
                        <div className="mb-10 flex items-center justify-center gap-3 sm:gap-4">
                            <div
                                className={`flex items-center gap-2 ${['select', 'verify', 'confirm', 'payment'].includes(step) ? 'text-red-600' : 'text-red-400'}`}
                            >
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                        step === 'select'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                            : ['verify', 'confirm', 'payment'].includes(step)
                                              ? 'bg-red-100 text-red-600'
                                              : 'border border-red-200 bg-white text-red-400'
                                    }`}
                                >
                                    1
                                </div>
                                <span className="text-sm font-semibold">
                                    Select Tables
                                </span>
                            </div>
                            <div className="h-px w-10 bg-red-200 sm:w-12" />
                            <div
                                className={`flex items-center gap-2 ${['verify', 'confirm', 'payment'].includes(step) ? 'text-red-600' : 'text-red-400'}`}
                            >
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                        step === 'verify'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                            : ['confirm', 'payment'].includes(step)
                                              ? 'bg-red-100 text-red-600'
                                              : 'border border-red-200 bg-white text-red-400'
                                    }`}
                                >
                                    2
                                </div>
                                <span className="text-sm font-semibold">
                                    Verify
                                </span>
                            </div>
                            <div className="h-px w-10 bg-red-200 sm:w-12" />
                            <div
                                className={`flex items-center gap-2 ${['confirm', 'payment'].includes(step) ? 'text-red-600' : 'text-red-400'}`}
                            >
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                        step === 'confirm'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                            : step === 'payment'
                                              ? 'bg-red-100 text-red-600'
                                              : 'border border-red-200 bg-white text-red-400'
                                    }`}
                                >
                                    3
                                </div>
                                <span className="text-sm font-semibold">
                                    Confirm
                                </span>
                            </div>
                            <div className="h-px w-10 bg-red-200 sm:w-12" />
                            <div
                                className={`flex items-center gap-2 ${step === 'payment' ? 'text-red-600' : 'text-red-400'}`}
                            >
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                        step === 'payment'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                            : 'border border-red-200 bg-white text-red-400'
                                    }`}
                                >
                                    4
                                </div>
                                <span className="text-sm font-semibold">
                                    Pay
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Select Tables */}
                    {step === 'select' && (
                        <div className="rounded-3xl border border-red-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <Table2 className="h-5 w-5 text-red-500" />
                                    Select Section
                                </h2>
                                <p className="mt-1 text-red-600">
                                    Choose a section to view available tables.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {sections.map((section) => {
                                    const isSelected =
                                        selectedSectionId === section.id;

                                    return (
                                        <button
                                            key={section.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedSectionId(
                                                    section.id,
                                                )
                                            }
                                            className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 active:scale-[0.98] ${
                                                isSelected
                                                    ? 'border-red-500 bg-red-50 shadow-md shadow-red-200/50'
                                                    : 'border-red-100/80 hover:border-red-300 hover:bg-red-50/50 hover:shadow-sm'
                                            }`}
                                        >
                                            <p className="text-lg font-bold text-stone-800">
                                                {section.name}
                                            </p>
                                            <p className="mt-1 text-xs text-red-500">
                                                {section.available_tables.length}{' '}
                                                available
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedSectionId && (
                                <div className="mt-8">
                                    <h3 className="mb-4 text-xl font-black text-stone-800">
                                        Available Tables
                                    </h3>

                                    {(() => {
                                        const section = sections.find(
                                            (s) =>
                                                s.id === selectedSectionId,
                                        );
                                        const tables =
                                            section?.available_tables || [];

                                        if (tables.length === 0) {
                                            return (
                                                <div className="rounded-2xl border border-red-100/80 bg-red-50/50 p-10 text-center">
                                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
                                                        <Table2 className="h-8 w-8 text-red-400" />
                                                    </div>
                                                    <p className="mt-4 text-lg font-bold text-stone-800">
                                                        No available tables in
                                                        this section.
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-2">
                                                {tables.map((table) => {
                                                    const tableId =
                                                        String(table.id);
                                                    const isChecked =
                                                        selectedTables.has(
                                                            tableId,
                                                        );

                                                    return (
                                                        <label
                                                            key={table.id}
                                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 active:scale-[0.98] ${
                                                                isChecked
                                                                    ? 'border-red-500 bg-red-50 shadow-md shadow-red-200/50'
                                                                    : 'border-red-100/80 hover:border-red-300 hover:bg-red-50/50 hover:shadow-sm'
                                                                }`}
                                                        >
                                                            <Checkbox
                                                                checked={
                                                                    isChecked
                                                                }
                                                                onCheckedChange={() =>
                                                                    toggleTableSelection(
                                                                        tableId,
                                                                    )
                                                                }
                                                                className="h-5 w-5 border-red-300 text-red-600 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                                                            />
                                                            <span className="text-base font-bold text-stone-800">
                                                                Table{' '}
                                                                {
                                                                    table.table_number
                                                                }
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {selectedTables.size > 0 && (
                                <div className="mt-6 rounded-2xl border border-red-200/60 bg-red-50 p-4">
                                    <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {selectedTables.size} table(s) selected
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <Button
                                    onClick={() => setStep('verify')}
                                    disabled={selectedTables.size === 0}
                                    className="rounded-xl px-8 py-6 text-base font-bold shadow-lg shadow-red-500/25"
                                >
                                    Continue to Verify
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verify Customer */}
                    {step === 'verify' && (
                        <div className="rounded-3xl border border-red-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <UserCheck className="h-5 w-5 text-red-500" />
                                    Verify Your Identity
                                </h2>
                                <p className="mt-1 text-red-600">
                                    Enter your phone number to verify.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-stone-700">
                                        Phone Number
                                    </label>
                                    <PhoneInput
                                        value={phoneNumber}
                                        onChange={setPhoneNumber}
                                        required
                                        className="h-11 w-full rounded-xl border-red-200 bg-white focus-within:border-red-500 focus-within:ring-red-500/20"
                                        prefixClassName="border-r border-red-200 text-red-600"
                                        inputClassName="text-stone-700 placeholder:text-red-400"
                                    />
                                </div>

                                {verificationError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                                        {verificationError}
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep('select')}
                                        className="flex-1 rounded-xl border-red-200 py-6 text-red-700 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <ArrowRight className="h-4 w-4 rotate-180" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleVerifyCustomer}
                                        disabled={isVerifying}
                                        className="flex-1 rounded-xl py-6 text-base font-bold shadow-lg shadow-red-500/25"
                                    >
                                        {isVerifying ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Verifying...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <UserCheck className="h-5 w-5" />
                                                Verify & Continue
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirm Booking */}
                    {step === 'confirm' && (
                        <div className="rounded-3xl border border-red-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <ListOrdered className="h-5 w-5 text-red-500" />
                                    Confirm Booking
                                </h2>
                                <p className="mt-1 text-red-600">
                                    Review your booking details before
                                    confirming.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-2xl border border-red-100/80 bg-red-50/40 p-5">
                                    <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">
                                        Customer
                                    </p>
                                    <p className="mt-1 text-lg font-black text-stone-800">
                                        {customerData?.name}
                                    </p>
                                    <p className="mt-0.5 text-sm text-red-600">
                                        {customerData?.phone}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-red-100/80 bg-red-50/40 p-5">
                                    <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">
                                        Selected Tables
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {Array.from(selectedTables).map(
                                            (id) => {
                                                const table =
                                                    availableTables.find(
                                                        (t) =>
                                                            String(t.id) === id,
                                                    );

                                                return table ? (
                                                    <Badge
                                                        key={id}
                                                        variant="secondary"
                                                        className="bg-red-100 px-3 py-1.5 text-sm text-red-700"
                                                    >
                                                        Table{' '}
                                                        {table.table_number}
                                                    </Badge>
                                                ) : null;
                                            },
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50 to-red-50 p-5">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                                        <Clock className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-800">
                                            Payment Window
                                        </p>
                                        <p className="text-sm text-red-600">
                                            You will have{' '}
                                            <strong className="text-red-600">
                                                5 minutes
                                            </strong>{' '}
                                            to complete payment after
                                            confirming.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep('verify')}
                                        className="flex-1 rounded-xl border-red-200 py-6 text-red-700 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <ArrowRight className="h-4 w-4 rotate-180" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleBooking}
                                        disabled={isBooking}
                                        className="flex-1 rounded-xl py-6 text-base font-bold shadow-lg shadow-red-500/25"
                                    >
                                        {isBooking ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Creating...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Confirm Booking
                                                <ArrowRight className="h-4 w-4" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Payment */}
                    {step === 'payment' && bookingData && (
                        <div className="rounded-3xl border border-red-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <Wallet className="h-5 w-5 text-red-500" />
                                    Complete Payment
                                </h2>
                                <p className="mt-1 text-red-600">
                                    Select your payment method to complete the
                                    booking.
                                </p>
                            </div>

                            {paymentError && (
                                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                                    {paymentError}
                                </div>
                            )}

                            {paymentSuccess ? (
                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                                        <h3 className="mt-3 text-xl font-black text-green-700">
                                            Payment Submitted
                                        </h3>
                                        <p className="mt-2 text-sm text-green-600">
                                            Your payment has been submitted
                                            successfully and is awaiting
                                            verification.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-red-100/80 bg-red-50/40 p-5">
                                        <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">
                                            Booking Amount
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-stone-800">
                                            {bookingData.booking_amount.toLocaleString()} ETB
                                        </p>
                                    </div>
                                    <Link href={menuPath}>
                                        <Button className="w-full rounded-xl py-6 text-base font-bold">
                                            Return to Menu
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Payment Countdown */}
                                    <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                                            <Hourglass className="h-6 w-6 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-stone-800">
                                                Payment Time Remaining
                                            </p>
                                            <p className="text-2xl font-black text-orange-500">
                                                {paymentCountdown || '05:00'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Method Selection */}
                                    <div>
                                        <label className="mb-3 block text-sm font-bold text-stone-700">
                                            Payment Method
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPaymentMethod('cbe_birr')
                                                }
                                                className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.98] ${
                                                    paymentMethod === 'cbe_birr'
                                                        ? 'border-red-500 bg-red-50 shadow-md shadow-red-200/50'
                                                        : 'border-red-100/80 hover:border-red-300 hover:bg-red-50/50'
                                                }`}
                                            >
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${paymentMethod === 'cbe_birr' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                    <Building2 className={`h-5 w-5 ${paymentMethod === 'cbe_birr' ? 'text-red-500' : 'text-gray-400'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-stone-800">
                                                        CBE Birr
                                                    </p>
                                                    <p className="text-xs text-red-500">
                                                        Bank Transfer
                                                    </p>
                                                </div>
                                                {paymentMethod === 'cbe_birr' && (
                                                    <CheckCircle2 className="ml-auto h-5 w-5 text-red-500" />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPaymentMethod('telebirr')
                                                }
                                                className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.98] ${
                                                    paymentMethod === 'telebirr'
                                                        ? 'border-red-500 bg-red-50 shadow-md shadow-red-200/50'
                                                        : 'border-red-100/80 hover:border-red-300 hover:bg-red-50/50'
                                                }`}
                                            >
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${paymentMethod === 'telebirr' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                    <Smartphone className={`h-5 w-5 ${paymentMethod === 'telebirr' ? 'text-red-500' : 'text-gray-400'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-stone-800">
                                                        Telebirr
                                                    </p>
                                                    <p className="text-xs text-red-500">
                                                        Mobile Money
                                                    </p>
                                                </div>
                                                {paymentMethod === 'telebirr' && (
                                                    <CheckCircle2 className="ml-auto h-5 w-5 text-red-500" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    {paymentMethod && (
                                        <div className="rounded-2xl border border-red-100/80 bg-red-50/40 p-5">
                                            <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">
                                                Send Payment To
                                            </p>
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                                                    {paymentMethod === 'cbe_birr' ? (
                                                        <Building2 className="h-5 w-5 text-red-500" />
                                                    ) : (
                                                        <Smartphone className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-stone-800">
                                                        {paymentMethod === 'cbe_birr' ? 'CBE Birr' : 'Telebirr'}
                                                    </p>
                                                    <p className="text-sm text-red-600">
                                                        {paymentMethod === 'cbe_birr' ? CBE_BIRR_NUMBER : TELEBIRR_NUMBER}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-stone-700">
                                                Payer Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={payerName}
                                                onChange={(e) => setPayerName(e.target.value)}
                                                placeholder="Enter payer full name"
                                                className="h-11"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-stone-700">
                                                Payer Phone <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={payerPhone}
                                                onChange={(e) => setPayerPhone(e.target.value)}
                                                placeholder="Enter payer phone number"
                                                className="h-11"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-stone-700">
                                                Transaction Number <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={transactionNumber}
                                                onChange={(e) => setTransactionNumber(e.target.value)}
                                                placeholder="Enter transaction/reference number"
                                                className="h-11"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Provide the transaction number from your payment confirmation.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-stone-700">
                                                Transaction Reference{' '}
                                                <span className="text-gray-400">(optional)</span>
                                            </label>
                                            <Input
                                                value={transactionReference}
                                                onChange={(e) => setTransactionReference(e.target.value)}
                                                placeholder="Enter reference number if available"
                                                className="h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            variant="outline"
                                            onClick={handleBackToConfirm}
                                            className="flex-1 rounded-xl border-red-200 py-6 text-red-700 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <ArrowRight className="h-4 w-4 rotate-180" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmitPayment}
                                            disabled={!isPaymentFormValid || isSubmittingPayment}
                                            className="flex-1 rounded-xl bg-green-600 py-6 text-base font-bold text-white hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {isSubmittingPayment ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <ShieldCheck className="h-5 w-5" />
                                                    Pay {bookingData.booking_amount.toLocaleString()} ETB
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Register Dialog */}
                    {showRegisterDialog && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                            <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 shadow-2xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Badge
                                            variant="secondary"
                                            className="mb-1 bg-red-100 text-red-700"
                                        >
                                            Not Registered
                                        </Badge>
                                        <h2 className="mt-1 text-2xl font-black text-stone-800">
                                            Register First
                                        </h2>
                                        <p className="mt-2 text-sm text-red-600">
                                            You need to register as a member
                                            before making a booking.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowRegisterDialog(false)
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowRegisterDialog(false)
                                        }
                                        className="flex-1 rounded-xl border-red-200 py-3 text-red-700 hover:bg-red-50 hover:text-red-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Link href={menuPath} className="flex-1">
                                        <Button className="w-full rounded-xl py-3">
                                            <UserPlus className="h-4 w-4" />
                                            Register Now
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* ================= FOOTER ================= */}
                <footer className="mt-20 border-t border-red-200/60 bg-gradient-to-b from-white to-red-50/50">
                    <div className="mx-auto max-w-5xl px-5 py-10 text-center">
                        <p className="text-xl font-black text-stone-800">
                            DINE<span className="text-red-500">.</span>
                        </p>
                        <p className="mt-2 text-sm text-red-600">
                            Thank you for dining with us. We hope to see you
                            again!
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-red-400">
                            <span>© 2026 DINE Restaurant</span>
                            <span>·</span>
                            <span>Digital Menu System</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
