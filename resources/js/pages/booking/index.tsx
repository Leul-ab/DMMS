import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Table2, UserCheck, UserPlus, ListOrdered } from 'lucide-react';
import AllBookingsSidebar from '@/components/all-bookings-sidebar';
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
                toast.success('Customer verified successfully!');
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
        if (!customerId || selectedTables.size === 0) return;

        setIsBooking(true);
        router.post(bookingStore.url(), {
            customer_id: customerId,
            table_ids: Array.from(selectedTables),
        }, {
            onSuccess: () => {
                toast.success('Tables booked successfully!');
            },
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
            <div className="min-h-screen bg-stone-50 text-gray-900">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">
                                DINE<span className="text-orange-500">.</span>
                            </h1>
                            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                                Digital Menu
                            </p>
                        </div>
                        <a
                            href="/menu"
                            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
                        >
                            ← Back to Menu
                        </a>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-4xl px-5 py-12">
                    {/* Page Header */}
                    <div className="mb-10 text-center">
                        <p className="font-semibold uppercase tracking-widest text-orange-500">
                            Reserve Your Table
                        </p>
                        <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                            Book a Table
                        </h1>
                        <p className="mt-3 text-gray-500">
                            Select your tables and verify your identity to book.
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="mb-10 flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${step === 'select' || step === 'verify' || step === 'confirm' ? 'text-orange-500' : 'text-gray-400'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === 'select' ? 'bg-orange-500 text-white' : step === 'verify' || step === 'confirm' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100'}`}>
                                1
                            </div>
                            <span className="text-sm font-semibold">Select Tables</span>
                        </div>
                        <div className="h-px w-12 bg-gray-300" />
                        <div className={`flex items-center gap-2 ${step === 'verify' || step === 'confirm' ? 'text-orange-500' : 'text-gray-400'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === 'verify' ? 'bg-orange-500 text-white' : step === 'confirm' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100'}`}>
                                2
                            </div>
                            <span className="text-sm font-semibold">Verify</span>
                        </div>
                        <div className="h-px w-12 bg-gray-300" />
                        <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-orange-500' : 'text-gray-400'}`}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === 'confirm' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>
                                3
                            </div>
                            <span className="text-sm font-semibold">Confirm</span>
                        </div>
                    </div>

                    {/* Step 1: Select Tables */}
                    {step === 'select' && (
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black">Select Tables</h2>
                                <p className="mt-1 text-gray-500">Choose one or more tables to book.</p>
                            </div>

                            {availableTables.length === 0 ? (
                                <div className="rounded-2xl bg-stone-50 p-10 text-center">
                                    <Table2 className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className="mt-4 text-lg font-bold text-gray-500">No tables available</p>
                                    <p className="mt-1 text-sm text-gray-400">All tables are currently occupied or booked.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {availableTables.map((table) => {
                                        const tableId = String(table.id);
                                        const isChecked = selectedTables.has(tableId);
                                        return (
                                            <label
                                                key={table.id}
                                                className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 transition-all ${
                                                    isChecked
                                                        ? 'border-orange-500 bg-orange-50 shadow-md'
                                                        : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/50'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleTableSelection(tableId)}
                                                    className="h-5 w-5"
                                                />
                                                <div className="flex items-center justify-between w-full">
                                                    <div>
                                                        <span className="text-lg font-bold">Table {table.table_number}</span>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {table.status === 'available' ? 'Available' : table.status}
                                                        </p>
                                                    </div>
                                                    <Badge variant={table.status === 'available' ? 'default' : 'secondary'} className="capitalize">
                                                        {table.status}
                                                    </Badge>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedTables.size > 0 && (
                                <div className="mt-6 rounded-2xl bg-orange-50 p-4">
                                    <p className="text-sm font-semibold text-orange-700">
                                        {selectedTables.size} table(s) selected
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <Button
                                    onClick={() => setStep('verify')}
                                    disabled={selectedTables.size === 0}
                                    className="rounded-xl bg-gray-900 px-8 py-6 text-base font-bold hover:bg-orange-500"
                                >
                                    Continue to Verify →
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verify Customer */}
                    {step === 'verify' && (
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black">Verify Your Identity</h2>
                                <p className="mt-1 text-gray-500">Enter your customer code to verify.</p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700">Customer Code</label>
                                    <input
                                        type="text"
                                        value={customerCode}
                                        onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                                        placeholder="Enter your customer code (e.g. AB12CD)"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-orange-500 uppercase"
                                    />
                                </div>

                                {verificationError && (
                                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                                        {verificationError}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleBackToSelect}
                                        className="flex-1 rounded-xl py-6"
                                    >
                                        ← Back
                                    </Button>
                                    <Button
                                        onClick={handleVerifyCustomer}
                                        disabled={isVerifying}
                                        className="flex-1 rounded-xl bg-gray-900 py-6 text-base font-bold hover:bg-orange-500"
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
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black">Confirm Booking</h2>
                                <p className="mt-1 text-gray-500">Review your booking details before confirming.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="rounded-2xl bg-stone-50 p-5">
                                    <p className="text-sm font-semibold text-gray-500">Customer</p>
                                    <p className="mt-1 text-lg font-bold">{customerData?.name}</p>
                                    <p className="text-sm text-gray-500">{customerData?.phone} • Code: <span className="font-bold text-gray-900">{customerData?.code}</span></p>
                                </div>

                                {/* Selected Tables */}
                                <div className="rounded-2xl bg-stone-50 p-5">
                                    <p className="text-sm font-semibold text-gray-500">Selected Tables</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {Array.from(selectedTables).map((id) => {
                                            const table = availableTables.find((t) => String(t.id) === id);
                                            return table ? (
                                                <Badge key={id} variant="default" className="px-3 py-1.5 text-sm">
                                                    Table {table.table_number}
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                </div>

                                {/* Timer Info */}
                                <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-5">
                                    <Clock className="h-6 w-6 text-orange-500" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Booking Expiration</p>
                                        <p className="text-sm text-gray-500">
                                            Your booking will expire in <strong>10 minutes</strong> if not confirmed.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleBackToSelect}
                                        className="flex-1 rounded-xl py-6"
                                    >
                                        ← Change Tables
                                    </Button>
                                    <Button
                                        onClick={handleBooking}
                                        disabled={isBooking}
                                        className="flex-1 rounded-xl bg-orange-500 py-6 text-base font-bold hover:bg-orange-600"
                                    >
                                        {isBooking ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Booking...
                                            </span>
                                        ) : (
                                            'Confirm Booking →'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Register Dialog */}
                    {showRegisterDialog && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                            <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold uppercase tracking-widest text-orange-500">
                                            Not Registered
                                        </p>
                                        <h2 className="mt-1 text-2xl font-black text-gray-900">
                                            Register First
                                        </h2>
                                        <p className="mt-2 text-sm text-gray-500">
                                            You need to register as a member before making a booking.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowRegisterDialog(false)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 hover:bg-gray-200"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRegisterDialog(false)}
                                        className="flex-1 rounded-xl py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <a
                                        href="/menu"
                                        className="flex-1 rounded-xl bg-orange-500 px-5 py-3.5 text-center font-bold text-white hover:bg-orange-600"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <UserPlus className="h-5 w-5" />
                                            Register Now
                                        </span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* All Bookings Sidebar */}
                <AllBookingsSidebar />

                {/* Footer */}
                <footer className="mt-12 border-t border-gray-200 bg-white">
                    <div className="mx-auto max-w-5xl px-5 py-8 text-center">
                        <p className="font-black">
                            DINE<span className="text-orange-500">.</span>
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                            Thank you for dining with us.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
