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
    Copy,
    Check,
    Upload,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import MyBooking from '@/pages/booking/my-booking';

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

type BookingData = {
    id: number;
    customer_name: string;
    tables: number[];
    booked_at: string;
    expires_at: string;
    expires_in_seconds?: number | null;
    payment_status: string;
    payment_method?: string | null;
    transaction_number?: string | null;
    amount?: string | number | null;
    paid_at?: string | null;
    verification_status?: string | null;
    rejection_reason?: string | null;
};

type Props = {
    availableTables: RestaurantTable[];
    sections: Section[];
    basePath: string;
    menuPath: string;
};

export default function BookingView({
    availableTables,
    sections,
    basePath,
    menuPath,
}: Props) {
    const [selectedTables, setSelectedTables] = useState<Set<string>>(
        new Set(),
    );
    const [step, setStep] = useState<'select' | 'verify' | 'confirm'>('select');
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
    const [confirmedBooking, setConfirmedBooking] =
        useState<BookingData | null>(null);
    const [showBookingConfirmedModal, setShowBookingConfirmedModal] =
        useState(false);
    const [countdown, setCountdown] = useState(300);
    const [paymentStep, setPaymentStep] = useState<
        'idle' | 'select' | 'account' | 'verification' | 'success'
    >('idle');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
        string | null
    >(null);
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(
        null,
    );
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
        null,
    );
    const [isSubmittingVerification, setIsSubmittingVerification] =
        useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [showMyBooking, setShowMyBooking] = useState(false);

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
        if (!phoneNumber.trim()) {
            setVerificationError('Please enter your phone number.');

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

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch('/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    table_ids: Array.from(selectedTables),
                    source: basePath.replace(/^\//, ''),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create booking.');
            }

            setConfirmedBooking(data.booking);
            setShowBookingConfirmedModal(true);
            setCountdown(data.booking.expires_in_seconds ?? 300);
        } catch (error: any) {
            toast.error(
                error.message || 'Failed to create booking. Please try again.',
            );
        } finally {
            setIsBooking(false);
        }
    };

    const handleBackToSelect = () => {
        setStep('select');
        setVerificationError(null);
    };

    const formatCountdown = (seconds: number): string => {
        if (seconds <= 0) {
            return 'Expired';
        }

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const bookingPaymentAccounts: Record<
        string,
        { label: string; number: string }
    > = {
        telebirr: { label: 'Telebirr', number: '0912345678' },
        cbe_birr: { label: 'CBE', number: '100012345678' },
    };

    useEffect(() => {
        if (!showBookingConfirmedModal) {
            return;
        }

        if (confirmedBooking?.payment_status === 'paid' || confirmedBooking?.payment_status === 'pending_verification') {
            return;
        }

        const interval = setInterval(() => {
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [showBookingConfirmedModal, confirmedBooking?.payment_status]);

    const handlePayNow = () => {
        setPaymentStep('select');
    };

    const handleSelectMethod = (method: string) => {
        setSelectedPaymentMethod(method);
        setPaymentStep('account');
    };

    const handleCopyAccount = async () => {
        if (!selectedPaymentMethod || !confirmedBooking || copySuccess || isCopying) {
            return;
        }

        const accountNumber =
            bookingPaymentAccounts[selectedPaymentMethod].number;

        setIsCopying(true);

        try {
            await navigator.clipboard.writeText(accountNumber);
            setCopySuccess(true);

            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(
                `/customer/bookings/${confirmedBooking.id}/copy-account`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    body: JSON.stringify({
                        payment_method: selectedPaymentMethod,
                    }),
                },
            );

            const data = await response.json();

            const paymentMethodLabel = bookingPaymentAccounts[selectedPaymentMethod]?.label || 'Payment';

            if (data.success) {
                if (data.notification_error) {
                    toast.success(`${paymentMethodLabel} account number copied successfully.`);
                    toast.error(data.notification_error_message || 'The payment notification could not be created. Please try again.');
                } else {
                    toast.success(`${paymentMethodLabel} account number copied successfully.\nPayment verification request submitted.\nPlease wait for manager approval.`);
                }

                if (data.booking) {
                    setConfirmedBooking({
                        ...confirmedBooking,
                        payment_status:
                            data.booking.payment_status ||
                            'pending_verification',
                        payment_method:
                            data.booking.payment_method ||
                            selectedPaymentMethod,
                    });
                } else {
                    setConfirmedBooking({
                        ...confirmedBooking,
                        payment_status: 'pending_verification',
                        payment_method: selectedPaymentMethod,
                    });
                }
            } else if (data.already_exists) {
                toast.success(data.message || 'Account number copied.\nThis booking has already been paid.');

                if (data.booking) {
                    setConfirmedBooking({
                        ...confirmedBooking,
                        payment_status:
                            data.booking.payment_status ||
                            'pending_verification',
                        payment_method:
                            data.booking.payment_method ||
                            selectedPaymentMethod,
                    });
                }
            } else {
                toast.error(
                    data.message ||
                        'Account number copied. However, we could not submit your payment verification request. Please try again.',
                );
            }

            setTimeout(() => {
                setCopySuccess(false);
                setIsCopying(false);
            }, 2000);
        } catch {
            toast.error('Unable to copy account number.');
            setCopySuccess(false);
            setIsCopying(false);
        }
    };

    const handleScreenshotChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
                toast.error(
                    'Please upload a valid payment screenshot (JPG, PNG, or WEBP).',
                );

                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Payment screenshot must not exceed 5 MB.');

                return;
            }
        }

        setPaymentScreenshot(file);
        setScreenshotPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleRemoveScreenshot = () => {
        setPaymentScreenshot(null);
        setScreenshotPreview(null);
    };

    const handleSubmitVerification = async () => {
        if (!confirmedBooking || !selectedPaymentMethod || !paymentScreenshot) {
            return;
        }

        setIsSubmittingVerification(true);

        try {
            const csrfToken =
                (document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement)?.content || '';

            const formData = new FormData();
            formData.append('payment_method', selectedPaymentMethod);
            formData.append('payment_screenshot', paymentScreenshot);

            const response = await fetch(
                `/booking/${confirmedBooking.id}/submit-payment`,
                {
                    method: 'POST',
                    headers: {
                        'X-XSRF-TOKEN': csrfToken,
                    },
                    body: formData,
                },
            );

            const data = await response.json();

            if (data.success) {
                toast.success(
                    'Payment verification submitted. Please wait for manager approval.',
                );
                setConfirmedBooking({
                    ...confirmedBooking,
                    payment_status: 'pending_verification',
                    payment_method:
                        data.booking?.payment_method || selectedPaymentMethod,
                });
                setPaymentStep('success');
            } else {
                toast.error(
                    data.message ||
                        'Failed to submit payment verification.',
                );
            }
        } catch {
            toast.error(
                'Unable to submit payment verification. Please try again.',
            );
        } finally {
            setIsSubmittingVerification(false);
        }
    };

    const handleClosePayment = () => {
        setPaymentStep('idle');
        setSelectedPaymentMethod(null);
        setPaymentScreenshot(null);
        setScreenshotPreview(null);
        setCopySuccess(false);
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
                    {/* Page Header */}
                    <div className="mb-8 text-center">
                        <Badge
                            variant="secondary"
                            className="mb-2 bg-red-100 text-red-700"
                        >
                            <Calendar className="mr-1 h-3 w-3" />
                            Book a Table
                        </Badge>
                        <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
                            Choose Your Table
                        </h1>
                        <p className="mt-2 text-red-600">
                            Select your tables and verify your identity to book.
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="mb-10 flex items-center justify-center gap-3 sm:gap-4">
                        <div
                            className={`flex items-center gap-2 ${step === 'select' || step === 'verify' || step === 'confirm' ? 'text-red-600' : 'text-red-400'}`}
                        >
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                    step === 'select'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                        : step === 'verify' ||
                                            step === 'confirm'
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
                            className={`flex items-center gap-2 ${step === 'verify' || step === 'confirm' ? 'text-red-600' : 'text-red-400'}`}
                        >
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                    step === 'verify'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                        : step === 'confirm'
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
                            className={`flex items-center gap-2 ${step === 'confirm' ? 'text-red-600' : 'text-red-400'}`}
                        >
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                    step === 'confirm'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                        : 'border border-red-200 bg-white text-red-400'
                                }`}
                            >
                                3
                            </div>
                            <span className="text-sm font-semibold">
                                Confirm
                            </span>
                        </div>
                    </div>

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
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) =>
                                            setPhoneNumber(e.target.value)
                                        }
                                        placeholder="Enter your phone number"
                                        className="h-11 w-full rounded-xl border border-red-200 bg-white px-4 text-stone-700 transition outline-none placeholder:text-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
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
                                        onClick={handleBackToSelect}
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
                                {/* Customer Info */}
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

                                {/* Selected Tables */}
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

                                {/* Timer Info */}
                                <div className="flex items-center gap-3 rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50 to-red-50 p-5">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                                        <Clock className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-800">
                                            Booking Expiration
                                        </p>
                                        <p className="text-sm text-red-600">
                                            Your booking will expire in{' '}
                                            <strong className="text-red-600">
                                                5 minutes
                                            </strong>{' '}
                                            if not confirmed.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        onClick={handleBackToSelect}
                                        className="flex-1 rounded-xl border-red-200 py-6 text-red-700 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <ArrowRight className="h-4 w-4 rotate-180" />
                                        Change Tables
                                    </Button>
                                    <Button
                                        onClick={handleBooking}
                                        disabled={isBooking}
                                        className="flex-1 rounded-xl py-6 text-base font-bold shadow-lg shadow-red-500/25"
                                    >
                                        {isBooking ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Booking...
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

                    {/* ================= BOOKING CONFIRMED MODAL ================= */}
                    <Dialog
                        open={showBookingConfirmedModal}
                        onOpenChange={(open) => {
                            setShowBookingConfirmedModal(open);

                            if (!open) {
                                setConfirmedBooking(null);
                                setPaymentStep('idle');
                                setSelectedPaymentMethod(null);
                                setPaymentScreenshot(null);
                                setScreenshotPreview(null);
                                setCopySuccess(false);
                            }
                        }}
                    >
                        <DialogContent className="border-red-200 sm:max-w-md">
                            <DialogHeader className="text-center">
                                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-stone-800">
                                    Booking Confirmed!
                                </DialogTitle>
                                <DialogDescription className="text-red-600">
                                    Your table has been booked successfully.
                                </DialogDescription>
                            </DialogHeader>

                            {confirmedBooking && (
                                <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-5">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Booking ID
                                            </span>
                                            <span className="text-sm font-bold text-stone-800">
                                                #{confirmedBooking.id}
                                            </span>
                                        </div>
                                        <Separator className="bg-red-200/40" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Customer
                                            </span>
                                            <span className="text-sm font-bold text-stone-800">
                                                {confirmedBooking.customer_name}
                                            </span>
                                        </div>
                                        <Separator className="bg-red-200/40" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Phone Number
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="bg-red-200 font-mono font-bold text-red-800"
                                            >
                                                {customerData?.phone}
                                            </Badge>
                                        </div>
                                        <Separator className="bg-red-200/40" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Table
                                            </span>
                                            <span className="text-sm font-bold text-stone-800">
                                                {confirmedBooking.tables?.join(', ') ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                        <Separator className="bg-red-200/40" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Date
                                            </span>
                                            <span className="text-sm font-bold text-stone-800">
                                                {confirmedBooking.booked_at
                                                    ? new Date(
                                                          confirmedBooking.booked_at,
                                                      ).toLocaleDateString(
                                                          'en-US',
                                                          {
                                                              year: 'numeric',
                                                              month: 'short',
                                                              day: 'numeric',
                                                          },
                                                      )
                                                    : '—'}
                                            </span>
                                        </div>
                                        <Separator className="bg-red-200/40" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Time
                                            </span>
                                            <span className="text-sm font-bold text-stone-800">
                                                {confirmedBooking.booked_at
                                                    ? new Date(
                                                          confirmedBooking.booked_at,
                                                      ).toLocaleTimeString(
                                                          'en-US',
                                                          {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          },
                                                      )
                                                    : '—'}
                                            </span>
                                        </div>
                                        <Separator className="bg-red-200/40" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Payment Status
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 text-xs font-bold capitalize ${
                                                    confirmedBooking.payment_status === 'paid'
                                                        ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full'
                                                        : confirmedBooking.payment_status === 'pending_verification'
                                                          ? 'text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full'
                                                          : confirmedBooking.payment_status === 'pending'
                                                            ? 'text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full'
                                                            : 'text-red-600 bg-red-50 px-2 py-0.5 rounded-full'
                                                }`}
                                            >
                                                {confirmedBooking.payment_status === 'pending_verification' && (
                                                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                                )}
                                                {confirmedBooking.payment_status === 'paid'
                                                    ? 'Paid'
                                                    : confirmedBooking.payment_status === 'pending_verification'
                                                      ? 'Pending Verification'
                                                      : confirmedBooking.payment_status === 'pending'
                                                        ? 'Pending Verification'
                                                        : 'Unpaid'}
                                            </span>
                                        </div>
                                        <Separator className="bg-red-200/40" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-red-600">
                                                Expires In
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${confirmedBooking.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {confirmedBooking.payment_status === 'paid' ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                                )}
                                                {formatCountdown(countdown)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl bg-red-100 p-4">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 font-bold text-red-700">
                                        !
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-red-800">
                                            Save Your Phone Number
                                        </p>
                                        <p className="mt-1 text-xs text-red-600">
                                            Your phone number is required to
                                            manage your booking. Please save it.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {paymentStep === 'idle' &&
                                confirmedBooking &&
                                countdown > 0 &&
                                confirmedBooking.payment_status !==
                                    'paid' && (
                                    <Button
                                        onClick={handlePayNow}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Pay Now
                                    </Button>
                                )}

                            {/* Payment Flow UI */}
                            {paymentStep === 'select' && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-black text-gray-900">
                                        Make Payment
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Select Payment Method
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(
                                            bookingPaymentAccounts,
                                        ).map(([key, account]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectMethod(key)
                                                }
                                                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-red-100 p-4 transition hover:border-red-300 hover:bg-red-50"
                                            >
                                                <span className="text-2xl">
                                                    {key === 'telebirr'
                                                        ? '📱'
                                                        : '🏦'}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {account.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={handleClosePayment}
                                        className="w-full text-gray-500"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}

                            {paymentStep === 'account' &&
                                selectedPaymentMethod &&
                                confirmedBooking && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-black text-gray-900">
                                            {bookingPaymentAccounts[selectedPaymentMethod].label}{' '}
                                            Payment
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {bookingPaymentAccounts[selectedPaymentMethod].label}{' '}
                                            Account Number
                                        </p>
                                        <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50 p-4 text-center">
                                            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                                                Account Number
                                            </p>
                                            <p className="mt-2 font-mono text-xl font-black tracking-wider text-stone-900 select-all">
                                                {bookingPaymentAccounts[selectedPaymentMethod].number}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleCopyAccount}
                                            disabled={copySuccess || isCopying}
                                            className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3.5 font-bold text-white hover:from-red-600 hover:to-red-700"
                                        >
                                            {isCopying ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Submitting...
                                                </span>
                                            ) : copySuccess ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Check className="h-4 w-4" />
                                                    Copied
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Copy className="h-4 w-4" />
                                                    Copy
                                                </span>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleClosePayment}
                                            className="w-full text-gray-500"
                                        >
                                            Back
                                        </Button>
                                    </div>
                                )}

                            {paymentStep === 'verification' &&
                                selectedPaymentMethod &&
                                confirmedBooking && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-black text-gray-900">
                                            Payment Verification
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Booking
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    #
                                                    {String(confirmedBooking.id).padStart(
                                                        6,
                                                        '0',
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Table
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    Table{' '}
                                                    {confirmedBooking.tables?.join(
                                                        ', ',
                                                    ) || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Payment Method
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {bookingPaymentAccounts[selectedPaymentMethod].label}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Amount
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    0.00 ETB
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                                Upload Payment Screenshot
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleScreenshotChange}
                                                className="hidden"
                                                id="booking-payment-screenshot"
                                            />
                                            {!screenshotPreview ? (
                                                <label
                                                    htmlFor="booking-payment-screenshot"
                                                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition hover:border-red-400"
                                                >
                                                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-600">
                                                        Choose Screenshot
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        JPG, PNG, WEBP up to 5MB
                                                    </span>
                                                </label>
                                            ) : (
                                                <div className="relative rounded-xl border border-gray-200 p-2">
                                                    <img
                                                        src={screenshotPreview}
                                                        alt="Payment screenshot preview"
                                                        className="mx-auto max-h-48 rounded-lg object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleRemoveScreenshot
                                                        }
                                                        className="absolute right-3 top-3 rounded-full bg-red-600 p-1 text-white transition hover:bg-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleSubmitVerification}
                                            disabled={
                                                isSubmittingVerification ||
                                                !paymentScreenshot
                                            }
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {isSubmittingVerification ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Submitting...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Submit Payment
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                )}

                            {paymentStep === 'success' &&
                                confirmedBooking && (
                                    <div className="text-center space-y-3">
                                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                                        <h3 className="text-lg font-black text-gray-900">
                                            Payment Successful
                                        </h3>
                                        <div className="space-y-2 text-left">
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Booking
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    #
                                                    {String(confirmedBooking.id).padStart(
                                                        6,
                                                        '0',
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Table
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    Table{' '}
                                                    {confirmedBooking.tables?.join(
                                                        ', ',
                                                    ) || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Payment Status
                                                </span>
                                                <span className="text-sm font-bold text-green-600">
                                                    Paid
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">
                                                    Time Remaining
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {formatCountdown(countdown)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {confirmedBooking &&
                                confirmedBooking.payment_status ===
                                    'paid' &&
                                paymentStep !== 'success' && (
                                    <div className="rounded-xl bg-green-50 p-4 text-center">
                                        <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
                                        <p className="mt-2 text-sm font-bold text-green-700">
                                            Payment Confirmed
                                        </p>
                                        <p className="text-xs text-green-600">
                                            Your booking payment has been
                                            received.
                                        </p>
                                    </div>
                                )}

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowBookingConfirmedModal(false);
                                        setConfirmedBooking(null);
                                        setPaymentStep('idle');
                                        setSelectedPaymentMethod(null);
                                        setPaymentScreenshot(null);
                                        setScreenshotPreview(null);
                                        setCopySuccess(false);
                                    }}
                                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                                >
                                    Done
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowBookingConfirmedModal(false);
                                        setConfirmedBooking(null);
                                        setPaymentStep('idle');
                                        setSelectedPaymentMethod(null);
                                        setPaymentScreenshot(null);
                                        setScreenshotPreview(null);
                                        setCopySuccess(false);
                                        setShowMyBooking(true);
                                    }}
                                    className="flex-1"
                                >
                                    View My Booking
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {showMyBooking &&
                        createPortal(
                            <MyBooking
                                onClose={() => setShowMyBooking(false)}
                            />,
                            document.body,
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
