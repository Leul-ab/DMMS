import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    Info,
    Package,
    Receipt,
    Star,
    Utensils,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { OrderProgressBar } from '@/components/order-progress-bar';

type MenuItem = {
    id: number;
    name: string;
    image: string | null;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    status: string;
    notes: string | null;
    menu_item: MenuItem;
};

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Receipt = {
    id: number;
    receipt_number: string;
    transaction_number: string | null;
    payment_method: string | null;
    amount: string;
    subtotal: string;
    tax: string;
    service_charge: string;
    discount: string;
    generated_at: string | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_submitted_at: string | null;
    total_amount: string;
    customer_name: string | null;
    estimated_minutes: number | null;
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    special_instructions: string | null;
    table_id: number;
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
    table: RestaurantTable;
    receipt: Receipt | null;
    payment: {
        id: number;
        payment_method: string | null;
        payment_status: string;
        verified_at: string | null;
        paid_at: string | null;
        verifier: { id: number; name: string } | null;
    } | null;
    feedback: {
        id: number;
        overall_rating: number;
        comment: string | null;
        anonymous: boolean;
        created_at: string;
    } | null;
};

type Props = {
    order: Order;
    isExpanded: boolean;
    onToggle: () => void;
    onCancel: (order: Order) => void;
    isCancelling: boolean;
    onPaymentClick: (method: string) => void;
    onReceiptClick: (order: Order) => void;
    onFeedbackClick: (order: Order) => void;
};

const paymentAccounts: Record<string, { label: string; number: string; icon: string }> = {
    telebirr: { label: 'Telebirr', number: '0987574556', icon: '📱' },
    cbe_birr: { label: 'CBE Birr', number: '1000976545673', icon: '🏦' },
};

function getStatusBadge(status: string): { label: string; className: string } {
    switch (status) {
        case 'pending':
        case 'received':
            return { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
        case 'confirmed':
            return { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200' };
        case 'preparing':
            return { label: 'Preparing', className: 'bg-orange-50 text-orange-700 border-orange-200' };
        case 'ready':
        case 'served':
            return { label: 'Ready', className: 'bg-green-100 text-green-800 border-green-300' };
        case 'completed':
            return { label: 'Completed', className: 'bg-green-500 text-white border-green-600' };
        case 'cancelled':
            return { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-300' };
        default:
            return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
}

function getStatusEmoji(status: string): string {
    switch (status) {
        case 'pending':
            return '⏳';
        case 'preparing':
            return '🍳';
        case 'ready':
            return '✅';
        case 'completed':
            return '🎉';
        case 'cancelled':
            return '❌';
        default:
            return '📋';
    }
}

function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatTimeOnly(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getProgressColor(percentage: number): string {
    if (percentage >= 100) {
        return 'bg-green-500';
    }

    if (percentage >= 81) {
        return 'bg-green-400';
    }

    if (percentage >= 51) {
        return 'bg-orange-500';
    }

    return 'bg-blue-500';
}

function getProgressBgColor(percentage: number): string {
    if (percentage >= 100) {
        return 'bg-green-100';
    }

    if (percentage >= 81) {
        return 'bg-green-100';
    }

    if (percentage >= 51) {
        return 'bg-orange-100';
    }

    return 'bg-blue-100';
}

export function MenuOrderCard({
    order,
    isExpanded,
    onToggle,
    onCancel,
    isCancelling,
    onPaymentClick,
    onReceiptClick,
    onFeedbackClick,
}: Props) {
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [showCompletion, setShowCompletion] = useState(false);

    const statusBadge = getStatusBadge(order.status);
    const isCancelled = order.status === 'cancelled';
    const isCompleted = order.status === 'completed';
    const displayPrepTime = order.preparation_time || order.estimated_minutes;
    const isLocked = ['preparing', 'ready', 'served'].includes(order.status);
    const canCancel = !['completed', 'cancelled'].includes(order.status) && !isLocked;

    // Live countdown timer and progress calculation
    useEffect(() => {
        if (order.status === 'ready' || order.status === 'completed') {
            return;
        }

        if (!order.preparation_started_at || !order.preparation_time) {
            return;
        }

        const updateTimer = () => {
            const startedAt = new Date(order.preparation_started_at!).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startedAt) / 1000);
            const total = order.preparation_time! * 60;
            const remaining = Math.max(0, total - elapsed);
            const progress = Math.min(100, Math.round((elapsed / total) * 100));

            setRemainingSeconds(remaining);
            setProgressPercent(progress);

            if (progress >= 100) {
                setShowCompletion(true);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [order.preparation_started_at, order.preparation_time, order.status, order.id]);

    const isTimerRunning = order.preparation_started_at && order.preparation_time && remainingSeconds !== null && remainingSeconds > 0;
    const isTimerExpired = remainingSeconds !== null && remainingSeconds <= 0;

    const expectedReadyTime = order.preparation_started_at && order.preparation_time
        ? new Date(new Date(order.preparation_started_at).getTime() + order.preparation_time * 60 * 1000)
        : null;

    const progressColor = getProgressColor(progressPercent);
    const progressBgColor = getProgressBgColor(progressPercent);

    const subtotal = order.order_items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
    );
    const tax = order.receipt ? Number(order.receipt.tax || 0) : 0;
    const serviceCharge = order.receipt ? Number(order.receipt.service_charge || 0) : 0;
    const discount = order.receipt ? Number(order.receipt.discount || 0) : 0;
    const grandTotal = Number(order.total_amount || 0);

    return (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
            {/* ================= COMPACT SUMMARY (Always Visible) ================= */}
            <div className="p-5 sm:p-6">
                {/* Top Row: Order Number + Status */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            Order Number
                        </p>
                        <h3 className="mt-1 text-xl font-black text-gray-900">
                            {order.order_number}
                        </h3>
                    </div>

                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusBadge.className}`}
                    >
                        {isCancelled ? (
                            <XCircle className="h-3.5 w-3.5" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                            <Clock className="h-3.5 w-3.5" />
                        )}
                        {statusBadge.label}
                    </span>
                </div>

                {/* Order Date & Time */}
                <p className="mt-2 text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                </p>

                {/* ===== Order Progress (Always Visible) ===== */}
                <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                    <OrderProgressBar
                        status={order.status}
                        preparationStartedAt={order.preparation_started_at}
                        preparationTime={order.preparation_time}
                        estimatedMinutes={order.estimated_minutes}
                        size="sm"
                    />
                </div>

                {/* View Details Button */}
                <button
                    type="button"
                    onClick={onToggle}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-white px-4 py-2.5 text-sm font-bold text-orange-500 transition-all duration-200 hover:bg-orange-500 hover:text-white active:scale-[0.98]"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4" />
                            Hide Details
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4" />
                            View Details
                        </>
                    )}
                </button>
            </div>

            {/* ================= EXPANDABLE DETAILS ================= */}
            {isExpanded && (
                <div className="border-t border-gray-100 bg-white">
                    <div className="space-y-6 p-5 sm:p-6">

                        {/* ===== 1. Order Information ===== */}
                        <section>
                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                <Info className="h-4 w-4 text-orange-500" />
                                Order Details
                            </h4>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-400">Order Number</p>
                                    <p className="mt-0.5 font-bold text-gray-900">{order.order_number}</p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-400">Order Date & Time</p>
                                    <p className="mt-0.5 font-bold text-gray-900">{formatDateTime(order.created_at)}</p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-400">Table Number</p>
                                    <p className="mt-0.5 font-bold text-gray-900">Table {order.table.table_number}</p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-400">Order Status</p>
                                    <p className="mt-0.5 font-bold capitalize text-gray-900">
                                        {order.status} {getStatusEmoji(order.status)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-400">Payment Status</p>
                                    <p className="mt-0.5 font-bold capitalize text-gray-900">{order.payment_status}</p>
                                </div>
                            </div>
                        </section>

                        {/* ===== 2. Preparation Information ===== */}
                        {displayPrepTime && !isCancelled && (
                            <section>
                                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                    <Clock className="h-4 w-4 text-orange-500" />
                                    Preparation Information
                                </h4>
                                <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                                            isTimerExpired || showCompletion ? 'bg-green-500' : 'bg-orange-500'
                                        }`}>
                                            {isTimerExpired || showCompletion ? '✅' : '⏱️'}
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-500">
                                                Estimated Preparation Time
                                            </p>

                                            <p className="mt-1 text-lg font-black">
                                                {displayPrepTime} Minutes
                                            </p>

                                            {isTimerRunning && remainingSeconds !== null && (
                                                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm border border-orange-200">
                                                    <span className="font-mono text-lg font-black tabular-nums text-orange-600">
                                                        {formatCountdown(remainingSeconds)}
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-500">
                                                        remaining
                                                    </span>
                                                </div>
                                            )}

                                            {isTimerExpired && !showCompletion && (
                                                <p className="mt-1 text-sm font-bold text-green-600">
                                                    Your order is ready! A waiter will bring it to you shortly.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {(isTimerRunning || showCompletion) && (
                                        <div className="mt-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-semibold text-gray-500">Preparation Progress</p>
                                                <span className={`text-sm font-bold ${
                                                    progressPercent >= 100 ? 'text-green-600' :
                                                    progressPercent >= 81 ? 'text-green-500' :
                                                    progressPercent >= 51 ? 'text-orange-600' :
                                                    'text-blue-600'
                                                }`}>
                                                    {progressPercent}%
                                                </span>
                                            </div>

                                            <div className={`w-full rounded-full h-5 ${progressBgColor} overflow-hidden`}>
                                                <div
                                                    className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-linear`}
                                                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                                                >
                                                    {progressPercent >= 100 && (
                                                        <div className="flex items-center justify-center h-full text-white text-sm font-bold">
                                                            ✅
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {expectedReadyTime && (
                                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                                    <span>⏰</span>
                                                    <span>
                                                        Expected Ready:{' '}
                                                        <strong className="text-gray-700">
                                                            {formatTimeOnly(expectedReadyTime)}
                                                        </strong>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ===== 3. Order Items ===== */}
                        <section>
                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                <Package className="h-4 w-4 text-orange-500" />
                                Your Items
                            </h4>
                            <div className="mt-3 space-y-3">
                                {order.order_items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-stone-50 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.menu_item.image ? (
                                                <img
                                                    src={`/storage/${item.menu_item.image}`}
                                                    alt={item.menu_item.name}
                                                    className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                                    <Utensils className="h-4 w-4" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-gray-900">
                                                    {item.menu_item.name}
                                                </h3>
                                                <p className="mt-0.5 text-sm text-gray-500">
                                                    {item.quantity} × {Number(item.price).toFixed(2)} ETB
                                                </p>
                                            </div>
                                        </div>

                                        <div className="whitespace-nowrap font-black text-gray-900">
                                            {(Number(item.price) * item.quantity).toFixed(2)} ETB
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Special Instructions */}
                            {order.special_instructions && (
                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800">
                                        <span>📝</span>
                                        Additional Instructions
                                    </h3>
                                    <p className="mt-2 whitespace-pre-line text-sm text-amber-900">
                                        {order.special_instructions}
                                    </p>
                                </div>
                            )}

                            {/* Financial Summary */}
                            <div className="mt-5 space-y-2 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-semibold text-gray-900">{subtotal.toFixed(2)} ETB</span>
                                </div>
                                {tax > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Tax</span>
                                        <span className="font-semibold text-gray-900">{tax.toFixed(2)} ETB</span>
                                    </div>
                                )}
                                {serviceCharge > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Service Charge</span>
                                        <span className="font-semibold text-gray-900">{serviceCharge.toFixed(2)} ETB</span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Discount</span>
                                        <span className="font-semibold text-green-600">-{discount.toFixed(2)} ETB</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                                    <span className="font-black text-gray-900">Total</span>
                                    <span className="text-lg font-black text-orange-500">{grandTotal.toFixed(2)} ETB</span>
                                </div>
                            </div>
                        </section>

                        {/* ===== 4. Payment ===== */}
                        {isCompleted && (
                            <section>
                                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                    <CreditCard className="h-4 w-4 text-orange-500" />
                                    Payment
                                </h4>
                                <div className="mt-3 rounded-3xl border border-orange-100 bg-orange-50 p-5">
                                    {order.payment_status === 'unpaid' && (
                                        <>
                                            <p className="text-gray-600">
                                                Your order is completed. Please choose a payment method to proceed.
                                            </p>

                                            <div className="mt-4 space-y-3">
                                                <h3 className="text-lg font-black">
                                                    Choose Payment Method
                                                </h3>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {Object.entries(paymentAccounts).map(([key, account]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => onPaymentClick(key)}
                                                            className="flex items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/50 active:scale-[0.98]"
                                                        >
                                                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                                                                {account.icon}
                                                            </span>
                                                            <div>
                                                                <p className="font-black text-stone-800">
                                                                    {account.label}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Pay with {account.label}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {order.payment_status === 'pending' && (
                                        <div className="rounded-2xl bg-yellow-100 p-5">
                                            <p className="font-bold text-yellow-800">
                                                Payment Pending Verification
                                            </p>

                                            <p className="mt-1 text-sm text-yellow-700">
                                                Your payment verification request has been sent.
                                                Please wait for the restaurant to verify your payment.
                                            </p>
                                        </div>
                                    )}

                                    {order.payment_status === 'paid' && (
                                        <div className="rounded-2xl bg-green-100 p-5">
                                            <p className="font-bold text-green-800">
                                                Payment Confirmed ✓
                                            </p>

                                            <p className="mt-1 text-sm text-green-700">
                                                Your payment has been successfully verified.
                                            </p>

                                            {order.receipt && (
                                                <button
                                                    type="button"
                                                    onClick={() => onReceiptClick(order)}
                                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-black text-white shadow-lg shadow-green-600/25 transition hover:bg-green-700 active:scale-[0.98]"
                                                >
                                                    <Receipt className="size-4" />
                                                    View Receipt
                                                </button>
                                            )}

                                            {!order.feedback && (
                                                <button
                                                    type="button"
                                                    onClick={() => onFeedbackClick(order)}
                                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-black text-white shadow-lg shadow-amber-500/25 transition hover:from-amber-500 hover:to-orange-600 hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98]"
                                                >
                                                    <Star className="size-4 fill-amber-200" />
                                                    Rate Overall Service
                                                </button>
                                            )}

                                            {order.feedback && (
                                                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-3">
                                                    <CheckCircle2 className="size-4 text-green-600" />
                                                    <p className="text-sm font-bold text-green-700">
                                                        You have already rated this order.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ===== 5. Cancel Order ===== */}
                        {canCancel && (
                            <button
                                type="button"
                                onClick={() => onCancel(order)}
                                disabled={isCancelling}
                                className="block w-full rounded-xl border-2 border-red-200 bg-white px-6 py-3 text-center font-black text-red-500 transition hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
                            >
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
