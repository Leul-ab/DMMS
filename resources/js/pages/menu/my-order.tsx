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

export default function MyOrder({
    table,
    order,
}: Props) {
    const [showPayment, setShowPayment] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

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
                                            {order.status}
                                        </span>
                                    </div>

                                </div>

                            </div>

                            {/* Status Message */}
                            <div className="border-t border-white/10 bg-white/5 px-7 py-5">

                                <p className="text-sm text-gray-300">
                                    Your order is currently{' '}
                                    <strong className="capitalize text-orange-400">
                                        {order.status}
                                    </strong>
                                    .
                                </p>

                            </div>

                        </div>

                        {/* Estimated Time */}
                        {order.estimated_minutes && (
                            <div className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-5">

                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-xl">
                                    ⏱️
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-500">
                                        Estimated preparation time
                                    </p>

                                    <p className="mt-1 text-lg font-black">
                                        {order.estimated_minutes} minutes
                                    </p>
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
