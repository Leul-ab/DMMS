import { Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Copy, Receipt, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FeedbackModal } from '@/components/feedback-modal';
import { ReceiptModal } from '@/components/receipt-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type MenuItem = {
    id: number;
    name: string;
};

export type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    status: string;
    menu_item: MenuItem;
};

export type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

export type Receipt = {
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

export type Payment = {
    id: number;
    payment_method: string | null;
    payment_status: string;
    verified_at: string | null;
    paid_at: string | null;
    verifier: { id: number; name: string } | null;
};

export type Order = {
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
    payment: Payment | null;
    feedback: {
        id: number;
        overall_rating: number;
        comment: string | null;
        anonymous: boolean;
        created_at: string;
    } | null;
};

export type Props = {
    table: RestaurantTable;
    order: Order | null;
    orders?: Order[];
    menuPath: string;
};

// Payment method account numbers
const paymentAccounts: Record<string, { label: string; number: string; icon: string }> = {
    telebirr: { label: 'Telebirr', number: '0987574556', icon: '📱' },
    cbe_birr: { label: 'CBE Birr', number: '1000976545673', icon: '🏦' },
};

// Get progress bar color based on percentage
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

// Get progress bar background color based on percentage
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

// Get status message and emoji
function getStatusInfo(status: string, preparationStatus: string): { emoji: string; message: string } {
    switch (status) {
        case 'pending':
            return { emoji: '⏳', message: 'Waiting for Kitchen' };
        case 'preparing':
            if (preparationStatus === 'preparing') {
                return { emoji: '🍳', message: 'Preparing Your Order' };
            }

            return { emoji: '⏳', message: 'Waiting for Kitchen' };
        case 'ready':
            return { emoji: '✅', message: 'Ready for Pickup / Ready to Serve' };
        case 'completed':
            return { emoji: '🎉', message: 'Order Completed' };
        case 'cancelled':
            return { emoji: '❌', message: 'Order Cancelled' };
        default:
            return { emoji: '📋', message: 'Order Received' };
    }
}

// Format date/time
const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format time only (e.g., "2:35 PM")
const formatTimeOnly = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

// Format countdown as "MM:SS" (e.g., "14:32")
const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get status color
const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500';
        case 'confirmed':
            return 'bg-blue-500';
        case 'preparing':
            return 'bg-orange-500';
        case 'ready':
            return 'bg-purple-500';
        case 'served':
            return 'bg-teal-500';
        case 'completed':
            return 'bg-green-500';
        case 'cancelled':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

type OrderCardProps = {
    order: Order;
    table: RestaurantTable;
    isExpanded: boolean;
    onToggleExpand: () => void;
};

function OrderCard({
    order,
    table,
    isExpanded,
    onToggleExpand,
}: OrderCardProps) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [showCompletion, setShowCompletion] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const prevPrepTimeRef = useRef<number | null>(null);
    const prevPaymentStatusRef = useRef<string | null>(null);
    const prevOrderStatusRef = useRef<string | null>(null);

    // Live countdown timer and progress calculation
    useEffect(() => {
        if (order.status === 'ready' || order.status === 'completed' || order.status === 'served') {
            setRemainingSeconds(0);
            setProgressPercent(100);
            setShowCompletion(true);

            return;
        }

        if (!order.preparation_started_at || !order.preparation_time) {
            setRemainingSeconds(null);
            setProgressPercent(0);
            setShowCompletion(false);

            return;
        }

        const calculateProgress = () => {
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

        calculateProgress();
        const interval = setInterval(calculateProgress, 1000);

        return () => clearInterval(interval);
    }, [order.preparation_started_at, order.preparation_time, order.status, order.id]);

    // Detect when chef adds additional prep time
    useEffect(() => {
        const currentPrepTime = order.preparation_time;

        if (
            prevPrepTimeRef.current !== null &&
            currentPrepTime !== null &&
            currentPrepTime > prevPrepTimeRef.current &&
            order.status === 'preparing'
        ) {
            const addedMinutes = currentPrepTime - prevPrepTimeRef.current;
            toast.info(
                `Preparation time has been updated for order ${order.order_number}. It will take approximately ${addedMinutes} additional minutes.`,
                { duration: 5000 }
            );
        }

        prevPrepTimeRef.current = currentPrepTime;
    }, [order.preparation_time, order.status, order.order_number]);

    // Detect when order becomes ready
    useEffect(() => {
        const prevStatus = prevOrderStatusRef.current;
        const currentStatus = order.status;

        if (prevStatus && prevStatus !== 'ready' && currentStatus === 'ready') {
            toast.success(`Your order ${order.order_number} is ready!`, {
                duration: 5000,
            });
        }

        prevOrderStatusRef.current = currentStatus;
    }, [order.status, order.order_number]);

    // Detect when payment is verified
    useEffect(() => {
        const currentStatus = order.payment_status;
        const hasReceipt = !!order.receipt;

        if (
            prevPaymentStatusRef.current === 'pending' &&
            currentStatus === 'paid' &&
            hasReceipt
        ) {
            toast.success(`Payment verified successfully for order ${order.order_number}. Your receipt is ready.`, {
                duration: 5000,
            });
            setShowReceipt(true);
        }

        prevPaymentStatusRef.current = currentStatus;
    }, [order.payment_status, order.receipt, order.order_number]);

    const hasVerificationBeenSent = order.payment_status === 'pending' || verificationSent;

    const handleCopyAndVerify = async () => {
        if (!selectedPaymentMethod) {
return;
}

        if (hasVerificationBeenSent) {
            toast.info('A payment verification request has already been sent.');

            return;
        }

        setIsSendingVerification(true);
        const accountNumber = paymentAccounts[selectedPaymentMethod].number;
        let copySuccess = false;

        try {
            await navigator.clipboard.writeText(accountNumber);
            toast.success('✓ Account number copied successfully.');
            copySuccess = true;
        } catch {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = accountNumber;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                toast.success('✓ Account number copied successfully.');
                copySuccess = true;
            } catch {
                toast.error('Unable to copy the account number. Please copy it manually.');
                copySuccess = false;
            }
        }

        router.post(
            `/orders/${order.id}/payment`,
            { payment_method: selectedPaymentMethod },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSendingVerification(false);
                    setVerificationSent(true);
                    setShowPaymentModal(false);
                    toast.success(
                        'Account number copied successfully.\n\nYour payment verification request has been sent.\n\nPlease complete your payment using the copied account number.\n\nThe restaurant will verify your payment shortly.',
                        { duration: 8000 }
                    );
                },
                onError: () => {
                    setIsSendingVerification(false);

                    if (copySuccess) {
                        toast.error('Account number copied, but the verification request could not be sent. Please try again.');
                    } else {
                        toast.error('Unable to copy the account number. Please copy it manually.');
                    }
                },
            }
        );
    };

    const cancelOrder = () => {
        if (!confirm('Are you sure you want to cancel this order?')) {
return;
}

        setIsCancelling(true);

        router.post(
            `/api/orders/${order.id}/cancel`,
            {},
            {
                onSuccess: () => {
                    setIsCancelling(false);
                    toast.success('Order cancelled successfully.');
                },
                onError: () => {
                    setIsCancelling(false);
                    toast.error('Failed to cancel order.');
                },
            }
        );
    };

    const displayPrepTime = order.preparation_time || order.estimated_minutes;
    const isTimerRunning = order.preparation_started_at && order.preparation_time && remainingSeconds !== null && remainingSeconds > 0;
    const isTimerExpired = remainingSeconds !== null && remainingSeconds <= 0;

    const expectedReadyTime = order.preparation_started_at && order.preparation_time
        ? new Date(new Date(order.preparation_started_at).getTime() + order.preparation_time * 60 * 1000)
        : null;

    const progressColor = getProgressColor(progressPercent);
    const progressBgColor = getProgressBgColor(progressPercent);

    const orderIsLocked = ['preparing', 'ready', 'served'].includes(order.status);

    return (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            {/* COMPACT CARD */}
            <div className="flex flex-col gap-4">
                {/* Header: Order Number label */}
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-405">
                        ORDER NUMBER
                    </p>
                </div>

                {/* Order Number and Status on same row */}
                <div className="flex items-start justify-between">
                    <h2 className="text-xl font-black text-stone-900 sm:text-2xl">
                        {order.order_number}
                    </h2>

                    <div className="flex items-center gap-1.5 font-bold text-sm">
                        <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(order.status)}`} />
                        <span className="capitalize text-stone-700">{order.status}</span>
                    </div>
                </div>

                <p className="mt-1 text-xs text-stone-500">
                    {formatDateTime(order.created_at)}
                </p>

                {/* Progress bar track always visible */}
                <div className="mt-1">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-stone-500">Preparation Progress</p>
                        <span className={`text-xs font-black ${
                            progressPercent >= 100 ? 'text-green-600' :
                            progressPercent >= 81 ? 'text-green-500' :
                            progressPercent >= 51 ? 'text-orange-600' :
                            'text-blue-600'
                        }`}>
                            {progressPercent}%
                        </span>
                    </div>

                    {/* Progress Bar track */}
                    <div className={`w-full rounded-full h-4 ${progressBgColor} overflow-hidden`}>
                        <div
                            className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-linear`}
                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                        >
                            {progressPercent >= 100 && (
                                <div className="flex items-center justify-center h-full text-white text-[10px] font-bold">
                                    ✅
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toggle details button */}
                <div className="mt-2 flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleExpand}
                        className="rounded-full px-5 py-2 text-xs font-bold"
                    >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                    </Button>
                </div>
            </div>

            {/* EXPANDED ORDER DETAILS */}
            {isExpanded && (
                <div className="mt-6 border-t border-stone-100 pt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-305">
                    
                    {/* ORDER DETAILS SECTION */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                            ORDER DETAILS
                        </h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
                                <p className="text-xs text-stone-400 font-medium">Table Number</p>
                                <p className="mt-1 text-sm font-bold text-stone-850">Table {table.table_number}</p>
                            </div>

                            {displayPrepTime && (
                                <div className="rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
                                    <p className="text-xs text-stone-400 font-medium">Estimated Preparation Time</p>
                                    <p className="mt-1 text-sm font-bold text-stone-850">{displayPrepTime} Minutes</p>
                                </div>
                            )}

                            {isTimerRunning && remainingSeconds !== null && (
                                <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-orange-600 font-medium">Time Remaining</p>
                                        <p className="mt-1 font-mono text-lg font-black text-orange-600 tabular-nums">
                                            {formatCountdown(remainingSeconds)}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold text-orange-500 bg-white border border-orange-100 px-3 py-1 rounded-full">
                                        remaining
                                    </span>
                                </div>
                            )}

                            {isTimerExpired && !showCompletion && (
                                <div className="rounded-2xl border border-green-100 bg-green-50/30 p-4 sm:col-span-2">
                                    <p className="text-sm font-bold text-green-700">
                                        Your order is ready! A waiter will bring it to you shortly.
                                    </p>
                                </div>
                            )}

                            {expectedReadyTime && (
                                <div className="rounded-2xl border border-stone-100 bg-stone-50/50 p-4 sm:col-span-2 flex items-center gap-2 text-sm text-stone-600">
                                    <span>⏰</span>
                                    <span>
                                        Expected Ready:{' '}
                                        <strong className="text-stone-800">
                                            {formatTimeOnly(expectedReadyTime)}
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* YOUR ITEMS */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                            YOUR ITEMS
                        </h3>

                        <div className="space-y-3">
                            {order.order_items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-stone-100 bg-stone-50/30 p-4"
                                >
                                    <div>
                                        <h4 className="font-bold text-stone-850 text-sm">
                                            {item.menu_item.name}
                                        </h4>
                                        <p className="mt-1 text-xs text-stone-400">
                                            {item.quantity} × {Number(item.price).toFixed(2)} ETB
                                        </p>
                                    </div>
                                    <div className="whitespace-nowrap font-black text-stone-800 text-sm">
                                        {(Number(item.price) * item.quantity).toFixed(2)} ETB
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Special Instructions */}
                        {order.special_instructions && (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                                    <span>📝</span>
                                    Special Instructions
                                </h4>
                                <p className="mt-2 whitespace-pre-line text-sm text-amber-900/90 font-medium">
                                    {order.special_instructions}
                                </p>
                            </div>
                        )}

                        {/* Total */}
                        <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-6">
                            <span className="text-base font-bold text-stone-700">Total</span>
                            <span className="text-2xl font-black text-orange-500">
                                {Number(order.total_amount).toFixed(2)} ETB
                            </span>
                        </div>
                    </div>

                    {/* LOCKED MESSAGE FOR PREPARING */}
                    {orderIsLocked && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">🔒</span>
                                <div>
                                    <p className="font-bold text-amber-805 text-sm">This order is being prepared</p>
                                    <p className="mt-1 text-xs text-amber-700">
                                        Your order is being prepared. You can place a new order instead.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAYMENT CONTROLS */}
                    {order.status === 'completed' && (
                        <div className="rounded-3xl border border-orange-100 bg-orange-50/20 p-6">
                            <h4 className="text-lg font-black text-stone-850">Payment</h4>

                            {order.payment_status === 'unpaid' && (
                                <>
                                    <p className="mt-2 text-sm text-stone-600">
                                        Your order is completed. Please choose a payment method to proceed.
                                    </p>

                                    <div className="mt-5 space-y-3">
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                            Choose Payment Method
                                        </h5>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {Object.entries(paymentAccounts).map(([key, account]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPaymentMethod(key);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-orange-300 hover:bg-orange-50/30 active:scale-[0.98]"
                                                >
                                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl">
                                                        {account.icon}
                                                    </span>
                                                    <div>
                                                        <p className="font-black text-sm text-stone-800">
                                                            {account.label}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500">
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
                                <div className="mt-3 rounded-2xl bg-yellow-100/40 p-4 border border-yellow-200">
                                    <p className="font-bold text-yellow-850 text-sm">Payment Pending Verification</p>
                                    <p className="mt-1 text-xs text-yellow-700">
                                        Your payment verification request has been sent. Please wait for verification.
                                    </p>
                                </div>
                            )}

                            {order.payment_status === 'paid' && (
                                <div className="mt-3 rounded-2xl bg-green-100/45 p-4 border border-green-200 space-y-3">
                                    <div>
                                        <p className="font-bold text-green-800 text-sm">Payment Confirmed ✓</p>
                                        <p className="mt-1 text-xs text-green-700">
                                            Your payment has been successfully verified.
                                        </p>
                                    </div>

                                    {order.receipt && (
                                        <button
                                            type="button"
                                            onClick={() => setShowReceipt(true)}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 active:scale-[0.98]"
                                        >
                                            <Receipt className="size-4" />
                                            View Receipt
                                        </button>
                                    )}

                                    {!order.feedback && (
                                        <button
                                            type="button"
                                            onClick={() => setShowFeedbackModal(true)}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-500 hover:to-orange-655 active:scale-[0.98]"
                                        >
                                            <Star className="size-4 fill-amber-200" />
                                            Rate Overall Service
                                        </button>
                                    )}

                                    {order.feedback && (
                                        <div className="flex items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-2">
                                            <CheckCircle2 className="size-3.5 text-green-600" />
                                            <p className="text-xs font-bold text-green-700">
                                                You have already rated this order.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CANCEL ORDER ACTION */}
                    {!['completed', 'cancelled'].includes(order.status) && !orderIsLocked && (
                        <button
                            type="button"
                            onClick={cancelOrder}
                            disabled={isCancelling}
                            className="block w-full rounded-xl border border-red-200 bg-white px-5 py-3.5 text-center text-xs font-black text-red-500 transition hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                    )}

                    {/* COLLAPSE CARD BUTTON */}
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleExpand}
                            className="text-stone-500 hover:text-stone-700 font-bold"
                        >
                            Hide Details
                        </Button>
                    </div>
                </div>
            )}

            {/* MODALS CONTROLLER */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-sm gap-5 rounded-3xl p-6 sm:max-w-sm">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-center text-lg font-black text-stone-900">
                            Pay with {selectedPaymentMethod ? paymentAccounts[selectedPaymentMethod].label : ''}
                        </DialogTitle>
                        <DialogDescription className="text-stone-500">
                            Copy the account number below and complete your payment.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPaymentMethod && (
                        <div className="space-y-5">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                                    {paymentAccounts[selectedPaymentMethod].icon}
                                </span>
                                <p className="text-base font-black text-stone-850">
                                    {paymentAccounts[selectedPaymentMethod].label}
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 text-center">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                    Account Number
                                </p>
                                <p className="mt-2 select-all font-mono text-xl font-black tracking-wider text-stone-900">
                                    {paymentAccounts[selectedPaymentMethod].number}
                                </p>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-stone-100 px-4 py-3">
                                <p className="text-sm font-semibold text-gray-500">Amount</p>
                                <p className="text-lg font-black text-orange-500">
                                    {Number(order.total_amount || 0).toFixed(2)} ETB
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopyAndVerify}
                                disabled={isSendingVerification || hasVerificationBeenSent}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-655 hover:to-orange-700 active:scale-[0.98] disabled:opacity-60"
                            >
                                {isSendingVerification ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Sending...
                                    </>
                                ) : hasVerificationBeenSent ? (
                                    <>
                                        <CheckCircle2 className="size-4" />
                                        ✓ Verification Requested
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        Copy & Send for Verification
                                    </>
                                )}
                            </button>

                            <p className="text-center text-[10px] text-gray-400">
                                After copying, make your payment using the selected method.
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ReceiptModal
                open={showReceipt}
                onOpenChange={setShowReceipt}
                order={order}
            />

            <FeedbackModal
                open={showFeedbackModal}
                onOpenChange={setShowFeedbackModal}
                onSubmitted={() => {
                    router.reload({ only: ['order', 'orders'] });
                }}
                order={order}
            />
        </div>
    );
}

export function MyOrderView({
    table,
    order,
    orders = [],
    menuPath,
}: Props) {
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    // Poll for order updates every 2 seconds for real-time sync
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['order', 'orders'],
            });
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Combine all orders we have from the backend, using 'orders' if available
    const displayOrders = orders && orders.length > 0 
        ? orders 
        : (order ? [order] : []);

    // Sort displayed orders newest first using the real created_at timestamp
    const sortedOrders = [...displayOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Action button logic is determined by the newest order
    const newestOrder = sortedOrders[0];

    const canAddToOrder = newestOrder
        ? ['pending', 'received', 'confirmed'].includes(newestOrder.status)
        : false;

    // Show action buttons if we have orders, and the newest one isn't cancelled
    const showOrderActionButton = newestOrder && newestOrder.status !== 'cancelled';

    const orderActionHref = canAddToOrder && newestOrder
        ? `${menuPath}?table=${table.table_number}&order_id=${newestOrder.id}`
        : `${menuPath}?table=${table.table_number}`;

    const orderActionLabel = canAddToOrder ? '+ Add Order' : '+ New Order';

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                    {/* Restaurant Logo */}
                    <Link href={menuPath} className="group">
                        <h1 className="text-2xl font-black tracking-tight transition group-hover:text-orange-600">
                            DINE<span className="text-orange-500">.</span>
                        </h1>
                        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                            Digital Menu
                        </p>
                    </Link>

                    {/* Table Information */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 rounded-full bg-orange-50 px-4 py-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                                {table.table_number}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs text-gray-500">Your table</p>
                                <p className="text-sm font-bold">Table {table.table_number}</p>
                            </div>
                        </div>

                        <Link href={menuPath}>
                            <Button size="sm" className="rounded-full">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">Back to</span>
                                Menu
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ================= MAIN ================= */}
            <main className="mx-auto max-w-3xl px-5 py-12">
                {/* Page Header */}
                <div className="mb-10 text-center">
                    <p className="font-semibold uppercase tracking-widest text-orange-500">
                        Order Tracking
                    </p>
                    <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                        My Orders
                    </h1>
                    <p className="mt-3 text-gray-500">
                        Track your orders and enjoy your meal.
                    </p>
                </div>

                {/* ================= NO ORDERS ================= */}
                {sortedOrders.length === 0 && (
                    <div className="rounded-3xl border border-stone-100 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
                            🍽️
                        </div>
                        <h2 className="mt-6 text-2xl font-black">
                            No Active Orders
                        </h2>
                        <p className="mt-2 text-gray-500">
                            You don't have any active orders yet.
                        </p>
                        <Link
                            href={`${menuPath}?table=${table.table_number}`}
                            className="mt-7 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-4 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 active:scale-[0.98]"
                        >
                            Browse Menu →
                        </Link>
                    </div>
                )}

                {/* ================= ORDER CARDS STACK ================= */}
                {sortedOrders.length > 0 && (
                    <div className="space-y-6">
                            {sortedOrders.map((o) => (
                                <OrderCard
                                    key={o.id}
                                    order={o}
                                    table={table}
                                    isExpanded={expandedOrderId === o.id}
                                    onToggleExpand={() =>
                                        setExpandedOrderId(
                                            expandedOrderId === o.id ? null : o.id
                                        )
                                    }
                                />
                            ))}

                        {/* Page Action Buttons (at bottom of card stack) */}
                        <div className="space-y-3 pt-6 border-t border-stone-200">
                            {showOrderActionButton && (
                                <Link
                                    key={orderActionLabel}
                                    href={orderActionHref}
                                    className="block w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                                >
                                    {orderActionLabel}
                                </Link>
                            )}

                            <Link
                                href={`${menuPath}?table=${table.table_number}`}
                                className="block w-full rounded-xl bg-white border border-stone-200 px-6 py-4 text-center font-black text-stone-700 hover:bg-stone-50 transition-all active:scale-[0.98]"
                            >
                                ← Back to Menu
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            {/* ================= FOOTER ================= */}
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
    );
}

export default MyOrderView;
