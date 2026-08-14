import { Head, Link, router } from '@inertiajs/react';
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
    MapPin,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { store as bookingStore } from '@/routes/booking';

type TableSection = {
    id: number;
    name: string;
    description: string | null;
    status: string;
};

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
    table_section_id: number | null;
};

type Props = {
    availableTables: RestaurantTable[];
    basePath: string;
    menuPath: string;
    sections: TableSection[];
};

export default function BookingView({
    availableTables,
    basePath,
    menuPath,
    sections,
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

    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
        null,
    );
    const [sectionTables, setSectionTables] = useState<RestaurantTable[]>([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [tableError, setTableError] = useState<string | null>(null);

    const fetchTablesForSection = async (sectionId: string) => {
        setLoadingTables(true);
        setTableError(null);
        setSectionTables([]);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(`/api/sections/${sectionId}/tables`, {
                headers: {
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch tables.');
            }

            setSectionTables(data.tables || []);
        } catch (error: any) {
            setTableError(
                error.message || 'Failed to load tables for this section.',
            );
        } finally {
            setLoadingTables(false);
        }
    };

    const handleSectionClick = (sectionId: number) => {
        const sectionIdStr = String(sectionId);

        if (selectedSectionId === sectionIdStr) {
            setSelectedSectionId(null);
            setSectionTables([]);
            setTableError(null);
            setSelectedTables(new Set());
        } else {
            setSelectedSectionId(sectionIdStr);
            setSelectedTables(new Set());
            fetchTablesForSection(sectionIdStr);
        }
    };

    const handleTableToggle = (tableId: string) => {
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

    const handleBooking = () => {
        if (!customerId || selectedTables.size === 0) {
            return;
        }

        setIsBooking(true);
        router.post(
            bookingStore.url(),
            {
                customer_id: customerId,
                table_ids: Array.from(selectedTables),
                source: basePath.replace(/^\//, ''),
            },
            {
                onSuccess: () => {},
                onError: (errors) => {
                    const errorMsg =
                        errors.tables || 'Failed to create booking.';
                    toast.error(errorMsg);
                    setIsBooking(false);
                },
            },
        );
    };

    const handleBackToSelect = () => {
        setStep('select');
        setCustomerId(null);
        setVerificationError(null);
    };

    const selectedSection = selectedSectionId
        ? sections.find((s) => String(s.id) === selectedSectionId)
        : null;

    return (
        <>
            <Head title="Book a Table" />
            <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50/30 to-white text-stone-800 selection:bg-orange-200 selection:text-orange-900">
                {/* ================= HEADER ================= */}
                <header className="sticky top-0 z-50 border-b border-orange-200/60 bg-white/80 shadow-sm backdrop-blur-xl">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                        <Link href={basePath} className="group">
                            <h1 className="text-2xl font-black tracking-tight text-stone-800 transition group-hover:text-orange-600">
                                DINE<span className="text-orange-500">.</span>
                            </h1>
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-500 uppercase">
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
                <section className="relative overflow-hidden bg-gradient-to-br from-orange-950 via-orange-900 to-amber-900">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                    <div className="absolute -top-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-orange-500/15 blur-3xl" />
                    <div
                        className="absolute -bottom-40 -left-40 h-[400px] w-[400px] animate-pulse rounded-full bg-amber-500/10 blur-3xl"
                        style={{ animationDelay: '1s' }}
                    />

                    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                        <div className="max-w-2xl">
                            <Badge
                                variant="secondary"
                                className="mb-4 animate-in bg-orange-500/15 text-orange-200 backdrop-blur-sm fill-mode-both fade-in slide-in-from-left-4"
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
                                <span className="bg-gradient-to-r from-orange-200 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                                    we'll save your seat.
                                </span>
                            </h2>

                            <p
                                className="mt-5 max-w-xl animate-in text-base leading-relaxed text-orange-200/80 fill-mode-both fade-in slide-in-from-bottom-4 sm:text-lg"
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
                            className="mb-2 bg-orange-100 text-orange-700"
                        >
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
                        <div
                            className={`flex items-center gap-2 ${step === 'select' || step === 'verify' || step === 'confirm' ? 'text-orange-600' : 'text-amber-400'}`}
                        >
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                    step === 'select'
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                                        : step === 'verify' ||
                                            step === 'confirm'
                                          ? 'bg-orange-100 text-orange-600'
                                          : 'border border-orange-200 bg-white text-amber-400'
                                }`}
                            >
                                1
                            </div>
                            <span className="text-sm font-semibold">
                                Select Tables
                            </span>
                        </div>
                        <div className="h-px w-10 bg-orange-200 sm:w-12" />
                        <div
                            className={`flex items-center gap-2 ${step === 'verify' || step === 'confirm' ? 'text-orange-600' : 'text-amber-400'}`}
                        >
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                    step === 'verify'
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                                        : step === 'confirm'
                                          ? 'bg-orange-100 text-orange-600'
                                          : 'border border-orange-200 bg-white text-amber-400'
                                }`}
                            >
                                2
                            </div>
                            <span className="text-sm font-semibold">
                                Verify
                            </span>
                        </div>
                        <div className="h-px w-10 bg-orange-200 sm:w-12" />
                        <div
                            className={`flex items-center gap-2 ${step === 'confirm' ? 'text-orange-600' : 'text-amber-400'}`}
                        >
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                                    step === 'confirm'
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                                        : 'border border-orange-200 bg-white text-amber-400'
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
                        <div className="rounded-3xl border border-orange-200/60 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6">
                                <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
                                    <Table2 className="h-5 w-5 text-orange-500" />
                                    Select Tables
                                </h2>
                                <p className="mt-1 text-amber-600">
                                    Choose a section, then pick an available
                                    table.
                                </p>
                            </div>

                            {/* Sections Grid */}
                            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {sections.map((section) => {
                                    const isSelected =
                                        selectedSectionId ===
                                        String(section.id);

                                    return (
                                        <button
                                            key={section.id}
                                            type="button"
                                            onClick={() =>
                                                handleSectionClick(section.id)
                                            }
                                            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-5 transition-all duration-200 active:scale-[0.98] ${
                                                isSelected
                                                    ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-200/50'
                                                    : 'border-orange-100/80 hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-sm'
                                            }`}
                                        >
                                            <MapPin
                                                className={`h-6 w-6 ${isSelected ? 'text-orange-600' : 'text-amber-500'}`}
                                            />
                                            <span
                                                className={`text-sm font-bold ${isSelected ? 'text-orange-700' : 'text-stone-800'}`}
                                            >
                                                {section.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Selected Section - Available Tables */}
                            {selectedSection && (
                                <div className="rounded-2xl border border-orange-200/60 bg-white p-5">
                                    <h3 className="mb-3 text-lg font-bold text-stone-800">
                                        Available Tables
                                    </h3>

                                    {loadingTables ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                                            <span className="ml-2 text-sm text-amber-600">
                                                Loading tables...
                                            </span>
                                        </div>
                                    ) : tableError ? (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                                            {tableError}
                                        </div>
                                    ) : sectionTables.length === 0 ? (
                                        <div className="rounded-xl border border-orange-100/80 bg-orange-50/50 p-6 text-center">
                                            <p className="text-sm font-semibold text-stone-800">
                                                No available tables in this
                                                section.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {sectionTables.map((table) => {
                                                const tableId = String(
                                                    table.id,
                                                );
                                                const isSelected =
                                                    selectedTables.has(tableId);

                                                return (
                                                    <label
                                                        key={table.id}
                                                        htmlFor={`table-${table.id}`}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                                                            isSelected
                                                                ? 'border-orange-400 bg-orange-100 shadow'
                                                                : 'border-orange-100/80 hover:border-orange-200 hover:bg-orange-50/40'
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            id={`table-${table.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                handleTableToggle(
                                                                    tableId,
                                                                )
                                                            }
                                                            className="border-orange-400"
                                                        />
                                                        <span
                                                            className={`text-sm font-medium ${isSelected ? 'text-orange-800' : 'text-stone-800'}`}
                                                        >
                                                            Table{' '}
                                                            {table.table_number}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
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
                                <p className="mt-1 text-amber-600">
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
                                        className="h-11 w-full rounded-xl border border-orange-200 bg-white px-4 text-stone-700 transition outline-none placeholder:text-amber-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                                <p className="mt-1 text-amber-600">
                                    Review your booking details before
                                    confirming.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="rounded-2xl border border-orange-100/80 bg-orange-50/40 p-5">
                                    <p className="text-xs font-semibold tracking-wider text-amber-500 uppercase">
                                        Customer
                                    </p>
                                    <p className="mt-1 text-lg font-black text-stone-800">
                                        {customerData?.name}
                                    </p>
                                    <p className="mt-0.5 text-sm text-amber-600">
                                        {customerData?.phone}
                                    </p>
                                </div>

                                {/* Selected Tables */}
                                <div className="rounded-2xl border border-orange-100/80 bg-orange-50/40 p-5">
                                    <p className="text-xs font-semibold tracking-wider text-amber-500 uppercase">
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
                                                        className="bg-orange-100 px-3 py-1.5 text-sm text-orange-700"
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
                                <div className="flex items-center gap-3 rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50 p-5">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                                        <Clock className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-800">
                                            Booking Expiration
                                        </p>
                                        <p className="text-sm text-amber-600">
                                            Your booking will expire in{' '}
                                            <strong className="text-orange-600">
                                                10 minutes
                                            </strong>{' '}
                                            if not confirmed.
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
                                        <Badge
                                            variant="secondary"
                                            className="mb-1 bg-orange-100 text-orange-700"
                                        >
                                            Not Registered
                                        </Badge>
                                        <h2 className="mt-1 text-2xl font-black text-stone-800">
                                            Register First
                                        </h2>
                                        <p className="mt-2 text-sm text-amber-600">
                                            You need to register as a member
                                            before making a booking.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowRegisterDialog(false)
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-amber-600 transition hover:bg-orange-200"
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
                                        className="flex-1 rounded-xl border-orange-200 py-3 text-amber-700 hover:bg-orange-50 hover:text-orange-700"
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
                <footer className="mt-20 border-t border-orange-200/60 bg-gradient-to-b from-white to-orange-50/50">
                    <div className="mx-auto max-w-5xl px-5 py-10 text-center">
                        <p className="text-xl font-black text-stone-800">
                            DINE<span className="text-orange-500">.</span>
                        </p>
                        <p className="mt-2 text-sm text-amber-600">
                            Thank you for dining with us. We hope to see you
                            again!
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
