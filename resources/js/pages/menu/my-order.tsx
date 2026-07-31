import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';

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

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_submitted_at: string | null;
    total_amount: string;
    estimated_minutes: number | null;
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    table_id: number;
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
    table: RestaurantTable;
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
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

export default function MyOrder({
    table,
    order,
}: Props) {
    const [showPayment, setShowPayment] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [showCompletion, setShowCompletion] = useState(false);

    // Live countdown timer and progress calculation
    useEffect(() => {
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
    }, [order?.preparation_started_at, order?.preparation_time]);

    // Poll for order updates every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['order'],
            });
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, []);

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
                return '✔️';
            case 'cancelled':
                return '❌';
            default:
                return '📋';
        }
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

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">

            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">

                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">

                    {/* Restaurant Logo */}
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">
                            DINE<span className="text-orange-500">.</span>
                        </h1>

                        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                            Digital Menu
                        </p>
                    </div>

                    {/* Table Information */}
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
                            href={`/menu?table=${table.table_number}`}
                            className="mt-7 inline-block rounded-xl bg-gray-900 px-7 py-4 font-bold text-white transition hover:bg-orange-500 active:scale-[0.98]"
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
                                        <span className="text-4xl">🎉</span>
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

                                                {/* Item Status */}
                                                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                                                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    item.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                                                    item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {item.status}
                                                </span>

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
                                                Your order is completed. Please make your payment.
                                            </p>

                                            {!showPayment ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPayment(true)}
                                                    className="mt-6 w-full rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 active:scale-[0.98]"
                                                >
                                                    Pay Now
                                                </button>
                                            ) : (
                                                <div className="mt-6 rounded-2xl bg-white p-6">

                                                    <h3 className="text-lg font-black">
                                                        Payment Instructions
                                                    </h3>

                                                    <p className="mt-3 text-sm text-gray-500">
                                                        Please send the exact amount to the payment number below.
                                                    </p>

                                                    <div className="mt-5 rounded-xl bg-gray-100 p-5">
                                                        <p className="text-sm font-semibold text-gray-500">
                                                            Amount
                                                        </p>

                                                        <p className="mt-1 text-2xl font-black text-orange-500">
                                                            {Number(order.total_amount).toFixed(2)} ETB
                                                        </p>

                                                        <p className="mt-5 text-sm font-semibold text-gray-500">
                                                            Payment Number
                                                        </p>

                                                        <p className="mt-1 text-xl font-black">
                                                            09XXXXXXXX
                                                        </p>

                                                        <p className="mt-5 text-sm font-semibold text-gray-500">
                                                            Account Name
                                                        </p>

                                                        <p className="mt-1 font-bold">
                                                            DINE Restaurant
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            router.post(
                                                                `/orders/${order.id}/payment`,
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                }
                                                            );
                                                        }}
                                                        className="mt-5 w-full rounded-xl bg-gray-900 px-6 py-4 font-black text-white transition hover:bg-orange-500 active:scale-[0.98]"
                                                    >
                                                        I Have Paid
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
                                        </div>
                                    )}

                                </div>
                            )}

                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {/* Add Order Button - Only show for active orders (not completed/cancelled) */}
                            {!['completed', 'cancelled'].includes(order.status) && (
                                <Link
                                    href={`/menu?table=${table.table_number}&order_id=${order.id}`}
                                    className="block w-full rounded-xl bg-orange-500 px-6 py-4 text-center font-black text-white transition hover:bg-orange-600 active:scale-[0.98]"
                                >
                                    + Add Order
                                </Link>
                            )}

                            {/* Cancel Order Button - Only show for active orders */}
                            {!['completed', 'cancelled'].includes(order.status) && (
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
                                href={`/menu?table=${table.table_number}`}
                                className="block w-full rounded-xl bg-gray-900 px-6 py-4 text-center font-black text-white transition hover:bg-orange-500 active:scale-[0.98]"
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
