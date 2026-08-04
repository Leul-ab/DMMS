import { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ReceiptModal } from '@/components/receipt-modal';

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
    payment: Payment | null;
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
    orders?: Order[];
    menuPath: string;
};

// Get progress bar color based on percentage
function getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 81) return 'bg-green-400';
    if (percentage >= 51) return 'bg-orange-500';
    return 'bg-blue-500';
}

// Get progress bar background color based on percentage
function getProgressBgColor(percentage: number): string {
    if (percentage >= 100) return 'bg-green-100';
    if (percentage >= 81) return 'bg-green-100';
    if (percentage >= 51) return 'bg-orange-100';
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

export default function MyOrderView({
    table,
    order,
    orders = [],
    menuPath,
}: Props) {
    const [showPayment, setShowPayment] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [showCompletion, setShowCompletion] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const prevPrepTimeRef = useRef<number | null>(null);
    const prevPaymentStatusRef = useRef<string | null>(null);
    const prevOrderStatusRef = useRef<string | null>(null);

    // Detect when the chef adds additional preparation time and notify the customer.
    useEffect(() => {
        if (!order) return;
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
    }, [order?.preparation_time, order?.status]);

    // Live countdown timer and progress calculation.
    // The progress bar must stop immediately when the kitchen marks the
    // order as ready or completed, regardless of the elapsed time.
    useEffect(() => {
        // If the chef marked the order as ready or completed (early finish),
        // stop the countdown immediately and complete the progress bar.
        if (order && (order.status === 'ready' || order.status === 'completed')) {
            setRemainingSeconds(0);
            setProgressPercent(100);
            setShowCompletion(true);
            return;
        }

        // No active preparation timer yet
        if (!order || !order.preparation_started_at || !order.preparation_time) {
            setRemainingSeconds(null);
            setProgressPercent(0);
            setShowCompletion(false);
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

            // Show completion animation when progress reaches 100%
            if (progress >= 100) {
                setShowCompletion(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [order?.preparation_started_at, order?.preparation_time, order?.status, order?.id]);

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

    // Detect when the order becomes ready and notify the customer.
    useEffect(() => {
        if (!order) return;

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
    }, [order?.status]);

    // Detect when payment is verified and a receipt is generated.
    useEffect(() => {
        if (!order) return;

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
    }, [order?.payment_status, order?.receipt]);

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

    // Copy the selected payment account number to the clipboard,
    // show a success message, and close the modal automatically.
    const copyAccountNumber = async () => {
        if (!selectedPaymentMethod) return;

        const accountNumber = paymentAccounts[selectedPaymentMethod].number;

        try {
            await navigator.clipboard.writeText(accountNumber);
            toast.success('Account number copied successfully.');
        } catch {
            // Fallback for browsers that don't support the clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = accountNumber;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast.success('Account number copied successfully.');
        }

        // Close the modal after copying so the customer can proceed with the payment.
        setShowPaymentModal(false);
        setShowPayment(true);
    };

    // Submit payment with the selected method
    const submitPayment = () => {
        if (!order || !selectedPaymentMethod) return;

        setIsSubmittingPayment(true);

        router.post(
            `/orders/${order.id}/payment`,
            {
                payment_method: selectedPaymentMethod,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmittingPayment(false);
                    toast.success('Payment submitted successfully. Please wait for confirmation.');
                },
                onError: () => {
                    setIsSubmittingPayment(false);
                    toast.error('Failed to submit payment. Please try again.');
                },
            }
        );
    };

    // Cancel order
    const cancelOrder = () => {
        if (!order) return;

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
    const displayPrepTime = order?.preparation_time || order?.estimated_minutes;
    const isTimerRunning = order?.preparation_started_at && order?.preparation_time && remainingSeconds !== null && remainingSeconds > 0;
    const isTimerExpired = remainingSeconds !== null && remainingSeconds <= 0;

    // Calculate expected ready time
    const expectedReadyTime = order?.preparation_started_at && order?.preparation_time
        ? new Date(new Date(order.preparation_started_at).getTime() + order.preparation_time * 60 * 1000)
        : null;

    // Get status info
    const statusInfo = order ? getStatusInfo(order.status, order.preparation_status) : { emoji: '', message: '' };

    // Progress bar color
    const progressColor = getProgressColor(progressPercent);
    const progressBgColor = getProgressBgColor(progressPercent);

    // ─────────────────────────────────────────────────────────────
    // Dynamic Order Button:
    //   - pending/confirmed  → "Add Order" (attach to current order)
    //   - preparing/ready/served → "New Order" (create separate order)
    //   - completed/cancelled → hide the action button
    // ─────────────────────────────────────────────────────────────
    const orderIsLocked = order
        ? ['preparing', 'ready', 'served'].includes(order.status)
        : false;

    const canAddToOrder = order
        ? ['pending', 'received', 'confirmed'].includes(order.status)
        : false;

    // Show the order action button for all active orders AND completed orders.
    // Cancelled orders are excluded.
    const showOrderActionButton = order && order.status !== 'cancelled';

    const orderActionHref = canAddToOrder && order
        ? `${menuPath}?table=${table.table_number}&order_id=${order.id}`
        : `${menuPath}?table=${table.table_number}`;

    const orderActionLabel = canAddToOrder ? '+ Add Order' : '+ New Order';

    // Orders to show in history: all orders except the currently displayed one
    const previousOrders = orders.filter((o) => o.id !== order?.id);

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
                                <p className="text-xs text-gray-500">
                                    Your table
                                </p>

                                <p className="text-sm font-bold">
                                    Table {table.table_number}
                                </p>
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
                        My Order
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Track your order and enjoy your meal.
                    </p>

                </div>

                {/* ================= NO ORDER ================= */}
                {!order && (
                    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
                            🍽️
                        </div>

                        <h2 className="mt-6 text-2xl font-black">
                            No Active Order
                        </h2>

                        <p className="mt-2 text-gray-500">
                            You don't have an active order yet.
                        </p>

                        <Link
                            href={`${menuPath}?table=${table.table_number}`}
                            className="mt-7 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-4 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                        >
                            Browse Menu →
                        </Link>

                    </div>
                )}

                {/* ================= ORDER ================= */}
                {order && (
                    <div className="space-y-6">

                        {/* Order Header */}
                        <div className="overflow-hidden rounded-3xl bg-gray-900 text-white shadow-xl">

                            <div className="p-7">

                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
                                            Order Number
                                        </p>

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
                            <div className="border-t border-white/10 bg-white/5 px-7 py-5">

                                <p className="text-sm text-gray-300">
                                    <span className="text-lg">{statusInfo.emoji}</span>{' '}
                                    <strong className="text-orange-400">
                                        {statusInfo.message}
                                    </strong>
                                </p>

                            </div>

                        </div>

                        {/* Preparation Time Section with Progress Bar */}
                        {displayPrepTime && (
                            <div className={`rounded-2xl border p-6 ${
                                isTimerRunning
                                    ? 'border-orange-100 bg-orange-50'
                                    : isTimerExpired || showCompletion
                                        ? 'border-green-100 bg-green-50'
                                        : 'border-orange-100 bg-orange-50'
                            }`}>
                                {/* Completion Animation */}
                                {showCompletion && (
                                    <div className="mb-4 text-center animate-bounce">
                                        <span className="text-4xl">✅</span>
                                        <p className="mt-2 text-lg font-bold text-green-600">
                                            Your order is ready!
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                                        isTimerExpired || showCompletion ? 'bg-green-500' : 'bg-orange-500'
                                    }`}>
                                        {isTimerExpired || showCompletion ? '✅' : '⏱️'}
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-500">
                                            {isTimerRunning
                                                ? 'Preparing'
                                                : isTimerExpired || showCompletion
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

                                        {/* Progress Bar Track */}
                                        <div className={`w-full rounded-full h-5 ${progressBgColor} overflow-hidden`}>
                                            <div
                                                className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-linear`}
                                                style={{ width: `${Math.min(100, progressPercent)}%` }}
                                            >
                                                {/* Completion Checkmark */}
                                                {progressPercent >= 100 && (
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
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">

                            <div className="mb-6">

                                <h2 className="text-2xl font-black">
                                    Your Items
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Items included in your order
                                </p>

                            </div>

                            <div className="space-y-4">

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
                                <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
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
                            <div className="mt-7 flex items-center justify-between border-t border-gray-200 pt-6">

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
                                <div className="mt-8 rounded-3xl border border-orange-100 bg-orange-50 p-6 sm:p-8">

                                    <h2 className="text-2xl font-black">
                                        Payment
                                    </h2>

                                    {order.payment_status === 'unpaid' && (
                                        <>
                                            <p className="mt-2 text-gray-600">
                                                Your order is completed. Please choose a payment method to proceed.
                                            </p>

                                            {/* Step 1: Choose Payment Method */}
                                            {!showPayment && (
                                                <div className="mt-6 space-y-3">
                                                    <h3 className="text-lg font-black">
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
                                            )}

                                            {/* Step 2: Complete Payment */}
                                            {showPayment && selectedPaymentMethod && (
                                                <div className="mt-6 rounded-2xl bg-white p-6 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">

                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-lg font-black">
                                                            Complete Payment
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowPayment(false);
                                                                setSelectedPaymentMethod(null);
                                                            }}
                                                            className="text-xs font-semibold text-gray-400 transition hover:text-orange-500"
                                                        >
                                                            ← Change Method
                                                        </button>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-100 p-4">
                                                        <span className="text-2xl">
                                                            {paymentAccounts[selectedPaymentMethod].icon}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-500">
                                                                Selected Payment Method
                                                            </p>
                                                            <p className="text-lg font-black text-stone-800">
                                                                {paymentAccounts[selectedPaymentMethod].label}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-100 p-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-500">
                                                                Amount to Pay
                                                            </p>
                                                            <p className="mt-1 text-2xl font-black text-orange-500">
                                                                {Number(order.total_amount).toFixed(2)} ETB
                                                            </p>
                                                        </div>
                                                        <Copy className="size-5 text-gray-400" />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={submitPayment}
                                                        disabled={isSubmittingPayment}
                                                        className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98] disabled:opacity-60"
                                                    >
                                                        {isSubmittingPayment ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                Submitting...
                                                            </span>
                                                        ) : (
                                                            'Paid'
                                                        )}
                                                    </button>

                                                </div>
                                            )}
                                        </>
                                    )}

                                    {order.payment_status === 'pending' && (
                                        <div className="mt-5 rounded-2xl bg-yellow-100 p-5">
                                            <p className="font-bold text-yellow-800">
                                                Payment Pending Verification
                                            </p>

                                            <p className="mt-1 text-sm text-yellow-700">
                                                Your payment has been submitted.
                                                Please wait for the restaurant to confirm it.
                                            </p>
                                        </div>
                                    )}

                                    {order.payment_status === 'paid' && (
                                        <div className="mt-5 rounded-2xl bg-green-100 p-5">
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
                                        </div>
                                    )}

                                </div>
                            )}

                        </div>

                        {/* ================= ORDER HISTORY ================= */}
                        {previousOrders.length > 0 && (
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">

                                <div className="mb-6">

                                    <h2 className="text-2xl font-black">
                                        Order History
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Your previous orders for this table
                                    </p>

                                </div>

                                <div className="space-y-4">

                                    {previousOrders.map((prevOrder) => (
                                        <div
                                            key={prevOrder.id}
                                            className="rounded-2xl border border-gray-100 bg-stone-50 p-5"
                                        >

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                                <div>
                                                    <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                                                        Order Number
                                                    </p>

                                                    <p className="mt-1 text-lg font-black">
                                                        {prevOrder.order_number}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(prevOrder.status)}`}></span>
                                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold capitalize text-gray-600">
                                                        {prevOrder.status}
                                                    </span>
                                                </div>

                                            </div>

                                            <div className="mt-4 border-t border-gray-200 pt-4">

                                                <div className="flex items-center justify-between">

                                                    <div className="space-y-1">
                                                        {prevOrder.order_items.slice(0, 3).map((item) => (
                                                            <p key={item.id} className="text-sm text-gray-500">
                                                                {item.quantity} × {item.menu_item.name}
                                                            </p>
                                                        ))}
                                                        {prevOrder.order_items.length > 3 && (
                                                            <p className="text-xs font-semibold text-gray-400">
                                                                +{prevOrder.order_items.length - 3} more items
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-orange-500">
                                                            {Number(prevOrder.total_amount).toFixed(2)} ETB
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            {formatDateTime(prevOrder.created_at)}
                                                        </p>
                                                    </div>

                                                </div>

                                            </div>

                                        </div>
                                    ))}

                                </div>

                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {/* Dynamic Order Button:
                                - Pending/Confirmed → "+ Add Order" (attaches to current order)
                                - Preparing/Ready/Served → "+ New Order" (creates a separate order) */}
                            {showOrderActionButton && (
                                <Link
                                    key={orderActionLabel}
                                    href={orderActionHref}
                                    className="block w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
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

                            <Link
                                href={`${menuPath}?table=${table.table_number}`}
                                className="block w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                            >
                                ← Back to Menu
                            </Link>
                        </div>

                    </div>
                )}

            </main>

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
                                    {Number(order?.total_amount || 0).toFixed(2)} ETB
                                </p>
                            </div>

                            {/* Copy Account Number Button */}
                            <button
                                type="button"
                                onClick={copyAccountNumber}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                            >
                                <Copy className="size-4" />
                                Copy Account Number
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
