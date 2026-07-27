import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import OrderDetailsBottomSheet from '@/components/order-details-bottom-sheet';

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
    menu_item: MenuItem;
};

type RestaurantTable = {
    id: number;
    table_number: number;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_submitted_at: string | null;
    total_amount: string;
    estimated_minutes: number | null;
    order_items: OrderItem[];
    created_at: string;
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
    orders: Order[];
    orderCount: number;
};

export default function MyOrder({
    table,
    order,
    orders,
    orderCount,
}: Props) {
    const [showPayment, setShowPayment] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Auto-polling for the current order
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['order', 'orders'],
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

    // Format short date/time for card view
    const formatShortDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
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
            case 'received':
                return 'bg-blue-500';
            case 'preparing':
                return 'bg-purple-500';
            case 'completed':
                return 'bg-green-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    // Get status badge color (lighter for card backgrounds)
    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'received':
                return 'bg-blue-100 text-blue-800';
            case 'preparing':
                return 'bg-purple-100 text-purple-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Open bottom sheet for a specific order
    const openOrderDetails = (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsSheetOpen(true);
    };

    // Close bottom sheet
    const closeOrderDetails = () => {
        setIsSheetOpen(false);
        setSelectedOrderId(null);
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
                        My Orders
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Track your orders and enjoy your meal.
                    </p>

                    {/* Order Count Badge */}
                    {orderCount > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                            <span>📋</span>
                            <span>{orderCount} active order{orderCount > 1 ? 's' : ''}</span>
                        </div>
                    )}

                </div>

                {/* ================= NO ORDERS ================= */}
                {orders.length === 0 && (
                    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
                            🍽️
                        </div>

                        <h2 className="mt-6 text-2xl font-black">
                            No Orders Yet
                        </h2>

                        <p className="mt-2 text-gray-500">
                            You haven't placed any orders yet.
                        </p>

                        <Link
                            href={`/menu?table=${table.table_number}`}
                            className="mt-7 inline-block rounded-xl bg-gray-900 px-7 py-4 font-bold text-white transition hover:bg-orange-500 active:scale-[0.98]"
                        >
                            Browse Menu →
                        </Link>

                    </div>
                )}

                {/* ================= LATEST ORDER (Full View) ================= */}
                {order && (
                    <div className="space-y-6">

                        {/* Active Order Highlight */}
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
                                <p className="flex items-center gap-2 text-sm font-bold text-orange-700">
                                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    Currently Active Order
                                </p>
                            </div>
                        )}

                        {/* Order Header Card */}
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
                                    <span className={`w-fit rounded-full ${getStatusColor(order.status)} px-5 py-2 text-sm font-black capitalize text-white`}>
                                        {order.status}
                                    </span>

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

                        {/* Order Items Section */}
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
                                            <div className="flex items-center gap-4">
                                                {/* Item Image Thumbnail */}
                                                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone-200">
                                                    {item.menu_item.image ? (
                                                        <img
                                                            src={`/storage/${item.menu_item.image}`}
                                                            alt={item.menu_item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-2xl">
                                                            🍽️
                                                        </div>
                                                    )}
                                                </div>

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

                            {/* ================= ADD ORDER BUTTON ================= */}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <div className="mt-6">
                                    <Link
                                        href={`/menu?table=${table.table_number}&add_to_order=${order.id}`}
                                        className="block w-full rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-6 py-4 text-center font-black text-orange-600 transition hover:border-orange-500 hover:bg-orange-100 active:scale-[0.98]"
                                    >
                                        + Add More Items to This Order
                                    </Link>
                                </div>
                            )}

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

                    </div>
                )}

                {/* ================= ALL ORDERS LIST ================= */}
                {orders.length > 1 && (
                    <div className="mt-12">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black">
                                Order History
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Click on an order to view more details
                            </p>
                        </div>

                        <div className="space-y-3">
                            {orders.map((orderItem) => (
                                <button
                                    key={orderItem.id}
                                    type="button"
                                    onClick={() => openOrderDetails(orderItem.id)}
                                    className="w-full text-left"
                                >
                                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md active:scale-[0.99]">
                                        <div className="flex items-center gap-4">
                                            {/* Order Icon */}
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
                                                🧾
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-gray-900">
                                                    {orderItem.order_number}
                                                </h3>
                                                <p className="mt-0.5 text-sm text-gray-500">
                                                    {formatShortDateTime(orderItem.created_at)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    {orderItem.order_items.length} item{orderItem.order_items.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusBadgeColor(orderItem.status)}`}>
                                                {orderItem.status}
                                            </span>
                                            <span className="text-sm font-black text-orange-500">
                                                {Number(orderItem.total_amount).toFixed(2)} ETB
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ================= SINGLE ORDER BACKUP (when only 1 order) ================= */}
                {orders.length === 1 && order && (
                    <div className="mt-8">
                        <Link
                            href={`/menu?table=${table.table_number}`}
                            className="block w-full rounded-xl bg-gray-900 px-6 py-4 text-center font-black text-white transition hover:bg-orange-500 active:scale-[0.98]"
                        >
                            ← Back to Menu
                        </Link>
                    </div>
                )}

                {/* ================= MULTIPLE ORDERS BACK ================= */}
                {orders.length > 1 && (
                    <div className="mt-8">
                        <Link
                            href={`/menu?table=${table.table_number}`}
                            className="block w-full rounded-xl bg-gray-900 px-6 py-4 text-center font-black text-white transition hover:bg-orange-500 active:scale-[0.98]"
                        >
                            ← Back to Menu
                        </Link>
                    </div>
                )}

            </main>

            {/* ================= ORDER DETAILS BOTTOM SHEET ================= */}
            <OrderDetailsBottomSheet
                orderId={selectedOrderId}
                tableNumber={table.table_number}
                isOpen={isSheetOpen}
                onClose={closeOrderDetails}
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
