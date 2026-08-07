import { Link, router } from '@inertiajs/react';
import { CheckCircle2, Copy, Receipt, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FeedbackModal } from '@/components/feedback-modal';
import { ReceiptModal } from '@/components/receipt-modal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type MenuItem = {
    id: number;
    name: string;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    status: string;
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

type Payment = {
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

type Props = {
    order: Order;
    table: RestaurantTable;
    menuPath: string;
    isNewest: boolean;
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

export function OrderCard({ order, table, menuPath, isNewest }: Props) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const prevPrepTimeRef = useRef<number | null>(null);
    const prevPaymentStatusRef = useRef<string | null>(null);
    const prevOrderStatusRef = useRef<string | null>(null);

    // ── Derived display state (avoid synchronous setState in effects) ──
    const isFinished = order.status === 'ready' || order.status === 'completed';
    const hasActiveTimer = !isFinished && Boolean(order.preparation_started_at && order.preparation_time);

    // Detect when the chef adds additional preparation time and notify the customer.
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
                `Preparation time has been updated. Your order will take approximately ${addedMinutes} additional minutes.`,
                { duration: 5000 }
            );
        }

        prevPrepTimeRef.current = currentPrepTime;
    }, [order.preparation_time, order.status]);

    // Live countdown timer and progress calculation.
    // The progress bar must stop immediately when the kitchen marks the
    // order as ready or completed, regardless of the elapsed time.
    // The ready/completed display state is derived from `order.status`
    // so no synchronous setState is needed in the effect body.
    useEffect(() => {
        if (!hasActiveTimer) {
            return;
        }

        const interval = setInterval(() => {
            const startedAt = new Date(order.preparation_started_at!).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startedAt) / 1000);
            // The total may have been increased by the chef ("Add Time").
            // Recalculating based on the updated preparation_time automatically
            // bumps the remaining time and resets the progress percentage.
            const total = order.preparation_time! * 60;
            const remaining = Math.max(0, total - elapsed);
            const progress = Math.min(100, Math.round((elapsed / total) * 100));

            setRemainingSeconds(remaining);
            setProgressPercent(progress);
        }, 1000);

        return () => clearInterval(interval);
    }, [hasActiveTimer, order.preparation_started_at, order.preparation_time, order.status, order.id]);

    // Detect when the order becomes ready and notify the customer.
    useEffect(() => {
        const prevStatus = prevOrderStatusRef.current;
        const currentStatus = order.status;

        // When the order transitions to "ready" (early completion or normal),
        // notify the customer that their order is ready.
        if (
            prevStatus &&
            prevStatus !== 'ready' &&
            currentStatus === 'ready'
        ) {
            toast.success('Your order is ready!', {
                duration: 5000,
            });
        }

        prevOrderStatusRef.current = currentStatus;
    }, [order.status]);

    // Detect when payment is verified and a receipt is generated.
    useEffect(() => {
        const currentStatus = order.payment_status;
        const hasReceipt = !!order.receipt;

        // When the payment transitions to "paid" and a receipt exists,
        // notify the customer and open the receipt modal automatically.
        if (
            prevPaymentStatusRef.current === 'pending' &&
            currentStatus === 'paid' &&
            hasReceipt
        ) {
            toast.success('Payment verified successfully. Your receipt is ready.', {
                duration: 5000,
            });
            setShowReceipt(true);
        }

        prevPaymentStatusRef.current = currentStatus;
    }, [order.payment_status, order.receipt]);

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

    // Get status emoji
    const getStatusEmoji = (status: string) => {
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
    };

    // Payment method account numbers
    const paymentAccounts: Record<string, { label: string; number: string; icon: string }> = {
        telebirr: { label: 'Telebirr', number: '0987574556', icon: '📱' },
        cbe_birr: { label: 'CBE Birr', number: '1000976545673', icon: '🏦' },
    };

    // Check if a verification request has already been sent for this order
    const hasVerificationBeenSent = order.payment_status === 'pending' || verificationSent;

    // Copy the account number AND submit the verification request
    const handleCopyAndVerify = async () => {
        if (!selectedPaymentMethod) {
return;
}

        // Check if verification already exists
        if (hasVerificationBeenSent) {
            toast.info('A payment verification request has already been sent.');

            return;
        }

        setIsSendingVerification(true);

        const accountNumber = paymentAccounts[selectedPaymentMethod].number;
        let copySuccess = false;

        // Step 1: Copy account number to clipboard
        try {
            await navigator.clipboard.writeText(accountNumber);
            toast.success('✓ Account number copied successfully.');
            copySuccess = true;
        } catch {
            // Fallback for browsers that don't support the clipboard API
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

        // Step 2: Submit verification request
        router.post(
            `/orders/${order.id}/payment`,
            {
                payment_method: selectedPaymentMethod,
            },
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

    // Cancel order
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

    // Determine the preparation time to display
    const displayPrepTime = order.preparation_time || order.estimated_minutes;
    const effectiveProgressPercent = isFinished ? 100 : progressPercent;
    const effectiveRemainingSeconds = isFinished ? 0 : remainingSeconds;
    const effectiveShowCompletion = isFinished || progressPercent >= 100;
    const isTimerRunning = hasActiveTimer && remainingSeconds !== null && remainingSeconds > 0;
    const isTimerExpired = effectiveRemainingSeconds !== null && effectiveRemainingSeconds <= 0;

    // Calculate expected ready time
    const expectedReadyTime = order.preparation_started_at && order.preparation_time
        ? new Date(new Date(order.preparation_started_at).getTime() + order.preparation_time * 60 * 1000)
        : null;

    // Get status info
    const statusInfo = getStatusInfo(order.status, order.preparation_status);

    // Progress bar color
    const progressColor = getProgressColor(effectiveProgressPercent);
    const progressBgColor = getProgressBgColor(effectiveProgressPercent);

    // ─────────────────────────────────────────────────────────────
    // Dynamic Order Button:
    //   - pending/confirmed  → "Add Order" (attach to current order)
    //   - preparing/ready/served → "New Order" (create separate order)
    //   - completed/cancelled → hide the action button
    // ─────────────────────────────────────────────────────────────
    const orderIsLocked = ['preparing', 'ready', 'served'].includes(order.status);

    const canAddToOrder = ['pending', 'received', 'confirmed'].includes(order.status);

    // Show the order action button for all active orders AND completed orders.
    // Cancelled orders are excluded.
    const showOrderActionButton = order.status !== 'cancelled';

    const orderActionHref = canAddToOrder
        ? `${menuPath}?table=${table.table_number}&order_id=${order.id}`
        : `${menuPath}?table=${table.table_number}`;

    const orderActionLabel = canAddToOrder ? '+ Add Order' : '+ New Order';

    return (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            {/* ================= ORDER HEADER ================= */}
            <div className="bg-gray-900 p-6 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
                                Order Number
                            </p>
                            {isNewest && (
                                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                                    Latest
                                </span>
                            )}
                        </div>

                        <h2 className="mt-2 text-2xl font-black">
                            {order.order_number}
                        </h2>

                        <p className="mt-2 text-gray-400">
                            Table {table.table_number}
                        </p>

                        {/* Order Date/Time */}
                        <p className="mt-1 text-sm text-gray-500">
                            {formatDateTime(order.created_at)}
                        </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${getStatusColor(order.status)}`}></span>
                        <span className="w-fit rounded-full bg-orange-500 px-5 py-2 text-sm font-black capitalize text-white">
                            {order.status} {getStatusEmoji(order.status)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Message */}
            <div className="border-b border-gray-100 bg-stone-50 px-6 py-4">
                <p className="text-sm text-gray-600">
                    <span className="text-lg">{statusInfo.emoji}</span>{' '}
                    <strong className="text-orange-500">
                        {statusInfo.message}
                    </strong>
                </p>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
                {/* Preparation Time Section with Progress Bar */}
                {displayPrepTime && (
                    <div className={`rounded-2xl border p-6 ${
                        isTimerRunning
                            ? 'border-orange-100 bg-orange-50'
                            : isTimerExpired || effectiveShowCompletion
                                ? 'border-green-100 bg-green-50'
                                : 'border-orange-100 bg-orange-50'
                    }`}>
                        {/* Completion Animation */}
                        {effectiveShowCompletion && (
                            <div className="mb-4 text-center animate-bounce">
                                <span className="text-4xl">✅</span>
                                <p className="mt-2 text-lg font-bold text-green-600">
                                    Your order is ready!
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                                isTimerExpired || effectiveShowCompletion ? 'bg-green-500' : 'bg-orange-500'
                            }`}>
                                {isTimerExpired || effectiveShowCompletion ? '✅' : '⏱️'}
                            </div>

                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-500">
                                    {isTimerRunning
                                        ? 'Preparing'
                                        : isTimerExpired || effectiveShowCompletion
                                            ? 'Ready to Serve'
                                            : 'Estimated Ready Time'}
                                </p>

                                <p className="mt-1 text-lg font-black">
                                    {order.preparation_time || order.estimated_minutes} Minutes
                                </p>

                                {/* Live Countdown Display */}
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

                                {isTimerExpired && !effectiveShowCompletion && (
                                    <p className="mt-1 text-sm font-bold text-green-600">
                                        Your order is ready! A waiter will bring it to you shortly.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {(isTimerRunning || effectiveShowCompletion) && (
                            <div className="mt-5">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-500">Preparation Progress</p>
                                    <span className={`text-sm font-bold ${
                                        effectiveProgressPercent >= 100 ? 'text-green-600' :
                                        effectiveProgressPercent >= 81 ? 'text-green-500' :
                                        effectiveProgressPercent >= 51 ? 'text-orange-600' :
                                        'text-blue-600'
                                    }`}>
                                        {effectiveProgressPercent}%
                                    </span>
                                </div>

                                {/* Progress Bar Track */}
                                <div className={`w-full rounded-full h-5 ${progressBgColor} overflow-hidden`}>
                                    <div
                                        className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-linear`}
                                        style={{ width: `${Math.min(100, effectiveProgressPercent)}%` }}
                                    >
                                        {/* Completion Checkmark */}
                                        {effectiveProgressPercent >= 100 && (
                                            <div className="flex items-center justify-center h-full text-white text-sm font-bold">
                                                ✅
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expected Ready Time */}
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
                )}

                {/* ================= PREPARING LOCKED MESSAGE ================= */}
                {orderIsLocked && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="font-bold text-amber-800">
                                    This order is being prepared
                                </p>
                                <p className="mt-1 text-sm text-amber-700">
                                    Your current order is being prepared. You can place a new order instead.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-xl font-black">
                            Your Items
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Items included in your order
                        </p>
                    </div>

                    <div className="space-y-3">
                        {order.order_items.map(
                            (item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-stone-50 p-4"
                                >
                                    <div>
                                        <h3 className="font-bold">
                                            {item.menu_item.name}
                                        </h3>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {item.quantity} ×{' '}
                                            {Number(
                                                item.price
                                            ).toFixed(2)}{' '}
                                            ETB
                                        </p>
                                    </div>

                                    <div className="whitespace-nowrap font-black">
                                        {(
                                            Number(
                                                item.price
                                            ) *
                                            item.quantity
                                        ).toFixed(2)}{' '}
                                        ETB
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Additional Instructions */}
                    {order.special_instructions && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800">
                                <span>📝</span>
                                Additional Instructions
                            </h3>
                            <p className="mt-2 whitespace-pre-line text-sm text-amber-900">
                                {order.special_instructions}
                            </p>
                        </div>
                    )}

                    {/* Total */}
                    <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-5">
                        <span className="text-lg font-bold">
                            Total
                        </span>

                        <span className="text-2xl font-black text-orange-500">
                            {Number(
                                order.total_amount
                            ).toFixed(2)}{' '}
                            ETB
                        </span>
                    </div>

                    {/* ================= PAYMENT ================= */}
                    {order.status === 'completed' && (
                        <div className="mt-6 rounded-3xl border border-orange-100 bg-orange-50 p-6">
                            <h2 className="text-xl font-black">
                                Payment
                            </h2>

                            {order.payment_status === 'unpaid' && (
                                <>
                                    <p className="mt-2 text-gray-600">
                                        Your order is completed. Please choose a payment method to proceed.
                                    </p>

                                    <div className="mt-5 space-y-3">
                                        <h3 className="text-base font-black">
                                            Choose Payment Method
                                        </h3>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {Object.entries(paymentAccounts).map(([key, account]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPaymentMethod(key);
                                                        setShowPaymentModal(true);
                                                    }}
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
                                <div className="mt-4 rounded-2xl bg-yellow-100 p-5">
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
                                <div className="mt-4 rounded-2xl bg-green-100 p-5">
                                    <p className="font-bold text-green-800">
                                        Payment Confirmed ✓
                                    </p>

                                    <p className="mt-1 text-sm text-green-700">
                                        Your payment has been successfully verified.
                                    </p>

                                    {order.receipt && (
                                        <button
                                            type="button"
                                            onClick={() => setShowReceipt(true)}
                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-black text-white shadow-lg shadow-green-600/25 transition hover:bg-green-700 active:scale-[0.98]"
                                        >
                                            <Receipt className="size-4" />
                                            View Receipt
                                        </button>
                                    )}

                                    {/* Rate Overall Service Button - Only when payment is verified and no feedback exists */}
                                    {!order.feedback && (
                                        <button
                                            type="button"
                                            onClick={() => setShowFeedbackModal(true)}
                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-white px-6 py-3 font-black text-green-600 shadow-sm transition hover:bg-green-600 hover:text-white hover:shadow-md active:scale-[0.98]"
                                        >
                                            <Star className="size-4" />
                                            Rate Overall Service
                                        </button>
                                    )}

                                    {/* Already Rated Message */}
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
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Dynamic Order Button:
                        - Pending/Confirmed → "+ Add Order" (attaches to current order)
                        - Preparing/Ready/Served → "+ New Order" (creates a separate order) */}
                    {showOrderActionButton && (
                        <Link
                            key={orderActionLabel}
                            href={orderActionHref}
                            className="block w-full rounded-xl border-2 border-green-600 bg-white px-6 py-4 text-center font-black text-green-600 shadow-sm transition-all duration-300 hover:bg-green-600 hover:text-white hover:shadow-md active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                        >
                            {orderActionLabel}
                        </Link>
                    )}

                    {/* Cancel Order Button - Only show for active orders that aren't locked */}
                    {!['completed', 'cancelled'].includes(order.status) && !orderIsLocked && (
                        <button
                            type="button"
                            onClick={cancelOrder}
                            disabled={isCancelling}
                            className="block w-full rounded-xl border-2 border-red-200 bg-white px-6 py-4 text-center font-black text-red-500 transition hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                    )}
                </div>
            </div>

            {/* ================= PAYMENT METHOD MODAL ================= */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-sm gap-5 rounded-3xl p-6 sm:max-w-sm">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-center text-lg font-black">
                            Pay with {selectedPaymentMethod ? paymentAccounts[selectedPaymentMethod].label : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Copy the account number below and complete your payment.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPaymentMethod && (
                        <div className="space-y-5">
                            {/* Payment Method Icon & Name */}
                            <div className="flex flex-col items-center justify-center gap-2">
                                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                                    {paymentAccounts[selectedPaymentMethod].icon}
                                </span>
                                <p className="text-base font-black text-stone-800">
                                    {paymentAccounts[selectedPaymentMethod].label}
                                </p>
                            </div>

                            {/* Account Number in read-only field */}
                            <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 text-center">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                    Account Number
                                </p>
                                <p className="mt-2 select-all font-mono text-xl font-black tracking-wider text-stone-900">
                                    {paymentAccounts[selectedPaymentMethod].number}
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
                                <p className="text-sm font-semibold text-gray-500">
                                    Amount
                                </p>
                                <p className="text-lg font-black text-orange-500">
                                    {Number(order.total_amount || 0).toFixed(2)} ETB
                                </p>
                            </div>

                            {/* Copy & Send for Verification Button */}
                            <button
                                type="button"
                                onClick={handleCopyAndVerify}
                                disabled={isSendingVerification || hasVerificationBeenSent}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-white px-6 py-3.5 font-black text-green-600 shadow-sm transition hover:bg-green-600 hover:text-white hover:shadow-md active:scale-[0.98] disabled:opacity-60"
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

                            <p className="text-center text-xs text-gray-400">
                                After copying, make your payment using the selected method.
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================= RECEIPT MODAL ================= */}
            <ReceiptModal
                open={showReceipt}
                onOpenChange={setShowReceipt}
                order={order}
            />

            {/* ================= FEEDBACK MODAL ================= */}
            <FeedbackModal
                open={showFeedbackModal}
                onOpenChange={setShowFeedbackModal}
                onSubmitted={() => {
                    // Reload to update the order feedback state
                    router.reload({ only: ['order', 'orders'] });
                }}
                order={order}
            />
        </div>
    );
}
