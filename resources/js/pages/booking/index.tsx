import { Head, Link, router } from '@inertiajs/react';
import {
    Loader2,
    Clock,
    Table2,
    UserCheck,
    UserPlus,
    ListOrdered,
    Calendar,
    ArrowRight,
    X,
    Sparkles,
    Utensils,
    CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { store as bookingStore } from '@/routes/booking';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Props = {
    availableTables: RestaurantTable[];
};

export default function BookingIndex({ availableTables }: Props) {
    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
    const [step, setStep] = useState<'select' | 'verify' | 'confirm'>('select');
    const [customerCode, setCustomerCode] = useState('');
    const [customerData, setCustomerData] = useState<{name: string, phone: string, code: string} | null>(null);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);

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
        if (!customerCode.trim()) {
            setVerificationError('Please enter your customer code.');

            return;
        }

        setIsVerifying(true);
        setVerificationError(null);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch('/booking/verify-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ customer_code: customerCode }),
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
                    code: data.customer.customer_code,
                });
                setStep('confirm');
            } else {
                setVerificationError(data.message || 'Customer not found.');

                if (data.message?.includes('register')) {
                    setShowRegisterDialog(true);
                }
            }
        } catch (error: any) {
            setVerificationError(error.message || 'Failed to verify customer. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleBooking = () => {
        if (!customerId || selectedTables.size === 0) {
return;
}

        setIsBooking(true);
        router.post(bookingStore.url(), {
            customer_id: customerId,
            table_ids: Array.from(selectedTables),
        }, {
            onSuccess: () => {},
            onError: (errors) => {
                const errorMsg = errors.tables || 'Failed to create booking.';
                toast.error(errorMsg);
                setIsBooking(false);
            },
        });
    };

    const handleBackToSelect = () => {
        setStep('select');
        setCustomerId(null);
        setVerificationError(null);
    };

    return (
        <>
            <Head title="Book a Table" />
            <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50/30 to-white text-stone-800 selection:bg-orange-200 selection:text-orange-900">
                {/* ================= HEADER ================= */}
                <header className="sticky top-0 z-50 border-b border-orange-200/60 bg-white/80 shadow-sm backdrop-blur-xl">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                        <Link href="/booking" className="group">
                            <h1 className="text-2xl font-black tracking-tight text-stone-800 transition group-hover:text-orange-600">
                                DINE<span className="text-orange-500">.</span>
                            </h1>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">
                                Reserve a Table
                            </p>
                        </Link>

                        <nav className="flex items-center gap-1.5 sm:gap-2.5">
                            <Link href="/menu">
                                <Button variant="ghost" size="sm" className="rounded-full text-amber-600 hover:bg-orange-100 hover:text-orange-700">
                                    <Utensils className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Menu</span>
                                </Button>
                            </Link>
                            <Link href="/menu">
                                <Button size="sm" className="rounded-full">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="hidden xs:inline">Back to</span>
                                    Menu
                                </Button>
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* ================= HERO ================= */}
                <section className="relative overflow-hidden bg-gradient-to-br from-orange-950 via-orange-900 to-amber-900">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                    <div className="absolute -right-40 -top-40 h-[500px] w-[500px] animate-pulse rounded-full bg-orange-500/15 blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] animate-pulse rounded-full bg-amber-500/10 blur-3xl" style={{ animationDelay: '1s' }} />

                    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                        <div className="max-w-2xl">
                            <Badge variant="secondary" className="mb-4 animate-in fade-in slide-in-from-left-4 bg-orange-500/15 text-orange-200 backdrop-blur-sm fill-mode-both">
                                <Sparkles className="mr-1 h-3 w-3" />
                                Reserve Your Table
                            </Badge>

                            <h2 className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl" style={{ animationDelay: '100ms' }}>
                                Book your table,
                                <br />
                                <span className="bg-gradient-to-r from-orange-200 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                                    we'll save your seat.
                                </span>
                            </h2>

                            <p className="mt-5 max-w-xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both text-base leading-relaxed text-orange-200/80 sm:text-lg" style={{ animationDelay: '200ms' }}>
                                Select your tables, verify your identity, and reserve your spot in just a few
                                easy steps. Your table will be held for you once confirmed.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================= MAIN CONTENT ================= */}
                <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                    {/* Page Header */}
                    <div className="mb-8 text-center">
                        <Badge variant="secondary" className="mb-2 bg-orange-100 text-orange-700">
                            <Calendar className="mr-1 h-3 w-3" />
                            Book a Table
                        </Badge>
                        <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
                            Choose Your Table
                        </h1>
                        <p className="mt-2 text-amber-600">
                            Select your tables and verify your identity to book.
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="mb-10 flex items-center justify-center gap-3 sm:gap-4">
                        <div className={`flex items-center gap-2 ${step === 'select' || step === 'verify' || step === 'confirm' ? 'text-orange-600' : 'text-amber-400'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                step === 'select'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                                    : step === 'verify' || step === 'confirm'
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'border border-orange-200 bg-white text-amber-400'
                            }`}>
                                1
                            </div>
                            <span className="text-sm font-semibold">Select Tables</span>
                        </div>
                        <div className="h-px w-10 bg-orange-200 sm:w-12" />
                        <div className={`flex items-center gap-2 ${step === 'verify' || step === 'confirm' ? 'text-orange-600' : 'text-amber-400'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                step === 'verify'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                                    : step === 'confirm'
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'border border-orange-200 bg-white text-amber-400'
                            }`}>
                                2
                            </div>
                            <span className="text-sm font-semibold">Verify</span>
                        </div>
                        <div className="h-px w-10 bg-orange-200 sm:w-12" />
                        <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-orange-600' : 'text-amber-400'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                step === 'confirm'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                                    : 'border border-orange-200 bg-white text-amber-400'
                            }`}>
                                3
                            </div>
                            <span className="text-sm font-semibold">Confirm</span>
                        </div>
                    </div>

                    {/* Step 1: Select Tables */}
                    {step === 'select' && (
                        <div className="rounded-3xl border border-orange-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <Table2 className="h-5 w-5 text-orange-500" />
                                    Select Tables
                                </h2>
                                <p className="mt-1 text-amber-600">Choose one or more tables to book.</p>
                            </div>

                            {availableTables.length === 0 ? (
                                <div className="rounded-2xl border border-orange-100/80 bg-orange-50/50 p-10 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
                                        <Table2 className="h-8 w-8 text-amber-400" />
                                    </div>
                                    <p className="mt-4 text-lg font-bold text-stone-800">No tables available</p>
                                    <p className="mt-1 text-sm text-amber-600">All tables are currently occupied or booked.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {availableTables.map((table) => {
                                        const tableId = String(table.id);
                                        const isChecked = selectedTables.has(tableId);

                                        return (
                                            <label
                                                key={table.id}
                                                className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 transition-all duration-200 active:scale-[0.98] ${
                                                    isChecked
                                                        ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-200/50'
                                                        : 'border-orange-100/80 hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-sm'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleTableSelection(tableId)}
                                                    className="h-5 w-5 border-orange-300 text-orange-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                                />
                                                <div className="flex w-full items-center justify-between">
                                                    <div>
                                                        <span className="text-lg font-bold text-stone-800">Table {table.table_number}</span>
                                                        <p className="mt-0.5 text-xs text-amber-500">
                                                            {table.status === 'available' ? 'Available' : table.status}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant={table.status === 'available' ? 'default' : 'secondary'}
                                                        className={table.status === 'available' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : ''}
                                                    >
                                                        <span className="capitalize">{table.status}</span>
                                                    </Badge>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedTables.size > 0 && (
                                <div className="mt-6 rounded-2xl border border-orange-200/60 bg-orange-50 p-4">
                                    <p className="flex items-center gap-2 text-sm font-bold text-orange-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {selectedTables.size} table(s) selected
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <Button
                                    onClick={() => setStep('verify')}
                                    disabled={selectedTables.size === 0}
                                    className="rounded-xl px-8 py-6 text-base font-bold shadow-lg shadow-orange-500/25"
                                >
                                    Continue to Verify
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verify Customer */}
                    {step === 'verify' && (
                        <div className="rounded-3xl border border-orange-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <UserCheck className="h-5 w-5 text-orange-500" />
                                    Verify Your Identity
                                </h2>
                                <p className="mt-1 text-amber-600">Enter your customer code to verify.</p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-stone-700">Customer Code</label>
                                    <input
                                        type="text"
                                        value={customerCode}
                                        onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                                        placeholder="Enter your customer code (e.g. AB12CD)"
                                        className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-stone-700 uppercase outline-none transition placeholder:text-amber-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                                        className="flex-1 rounded-xl border-orange-200 py-6 text-amber-700 hover:bg-orange-50 hover:text-orange-700"
                                    >
                                        <ArrowRight className="h-4 w-4 rotate-180" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleVerifyCustomer}
                                        disabled={isVerifying}
                                        className="flex-1 rounded-xl py-6 text-base font-bold shadow-lg shadow-orange-500/25"
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
                        <div className="rounded-3xl border border-orange-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <ListOrdered className="h-5 w-5 text-orange-500" />
                                    Confirm Booking
                                </h2>
                                <p className="mt-1 text-amber-600">Review your booking details before confirming.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="rounded-2xl border border-orange-100/80 bg-orange-50/40 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Customer</p>
                                    <p className="mt-1 text-lg font-black text-stone-800">{customerData?.name}</p>
                                    <p className="mt-0.5 text-sm text-amber-600">
                                        {customerData?.phone} • Code:{' '}
                                        <span className="font-bold text-orange-600">{customerData?.code}</span>
                                    </p>
                                </div>

                                {/* Selected Tables */}
                                <div className="rounded-2xl border border-orange-100/80 bg-orange-50/40 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Selected Tables</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {Array.from(selectedTables).map((id) => {
                                            const table = availableTables.find((t) => String(t.id) === id);

                                            return table ? (
                                                <Badge key={id} variant="secondary" className="bg-orange-100 px-3 py-1.5 text-sm text-orange-700">
                                                    Table {table.table_number}
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                </div>

                                {/* Timer Info */}
                                <div className="flex items-center gap-3 rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50 p-5">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                                        <Clock className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-800">Booking Expiration</p>
                                        <p className="text-sm text-amber-600">
                                            Your booking will expire in <strong className="text-orange-600">10 minutes</strong> if not confirmed.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        onClick={handleBackToSelect}
                                        className="flex-1 rounded-xl border-orange-200 py-6 text-amber-700 hover:bg-orange-50 hover:text-orange-700"
                                    >
                                        <ArrowRight className="h-4 w-4 rotate-180" />
                                        Change Tables
                                    </Button>
                                    <Button
                                        onClick={handleBooking}
                                        disabled={isBooking}
                                        className="flex-1 rounded-xl py-6 text-base font-bold shadow-lg shadow-orange-500/25"
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
                            <div className="w-full max-w-md rounded-3xl border border-orange-200 bg-white p-7 shadow-2xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Badge variant="secondary" className="mb-1 bg-orange-100 text-orange-700">
                                            Not Registered
                                        </Badge>
                                        <h2 className="mt-1 text-2xl font-black text-stone-800">
                                            Register First
                                        </h2>
                                        <p className="mt-2 text-sm text-amber-600">
                                            You need to register as a member before making a booking.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowRegisterDialog(false)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-amber-600 transition hover:bg-orange-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRegisterDialog(false)}
                                        className="flex-1 rounded-xl border-orange-200 py-3 text-amber-700 hover:bg-orange-50 hover:text-orange-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Link href="/menu" className="flex-1">
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
                <footer className="mt-20 border-t border-orange-200/60 bg-gradient-to-b from-white to-orange-50/50">
                    <div className="mx-auto max-w-5xl px-5 py-10 text-center">
                        <p className="text-xl font-black text-stone-800">
                            DINE<span className="text-orange-500">.</span>
                        </p>
                        <p className="mt-2 text-sm text-amber-600">
                            Thank you for dining with us. We hope to see you again!
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-amber-400">
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
