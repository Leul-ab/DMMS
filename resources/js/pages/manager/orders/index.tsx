import { Head, router } from '@inertiajs/react';

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
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    total_amount: string;
    estimated_minutes: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    notes: string | null;
    created_at: string;
    table: RestaurantTable;
    order_items: OrderItem[];
};

type Props = {
    orders: Order[];
};

export default function OrdersIndex({
    orders,
}: Props) {
    // Update order status
    const updateStatus = (
        orderId: number,
        status: string
    ) => {
        router.patch(
            `/manager/orders/${orderId}/status`,
            {
                status,
            },
            {
                preserveScroll: true,
            }
        );
    };

    // Get color based on order status
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';

            case 'confirmed':
                return 'bg-blue-100 text-blue-800';

            case 'preparing':
                return 'bg-purple-100 text-purple-800';

            case 'ready':
                return 'bg-green-100 text-green-800';

            case 'served':
                return 'bg-indigo-100 text-indigo-800';

            case 'completed':
                return 'bg-gray-100 text-gray-800';

            case 'cancelled':
                return 'bg-red-100 text-red-800';

            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <Head title="Orders" />

            <div className="min-h-screen bg-stone-50 text-gray-900">

                {/* ================= HEADER ================= */}
                <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

                        {/* Restaurant Logo */}
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">
                                DINE<span className="text-orange-500">.</span>
                            </h1>

                            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                                Order Management
                            </p>
                        </div>

                        {/* Order Count */}
                        <div className="flex items-center gap-3 rounded-full bg-orange-50 px-4 py-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                                {orders.length}
                            </div>

                            <div className="hidden sm:block">
                                <p className="text-xs text-gray-500">
                                    Total Orders
                                </p>

                                <p className="text-sm font-bold">
                                    Customer Orders
                                </p>
                            </div>
                        </div>

                    </div>
                </header>

                {/* ================= MAIN ================= */}
                <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">

                    {/* Page Header */}
                    <div className="mb-10">
                        <p className="font-semibold uppercase tracking-widest text-orange-500">
                            Restaurant Dashboard
                        </p>

                        <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                            Customer Orders
                        </h1>

                        <p className="mt-3 max-w-2xl text-gray-500">
                            View and manage customer orders,
                            update their status, and monitor
                            order progress.
                        </p>
                    </div>

                    {/* No Orders */}
                    {orders.length === 0 && (
                        <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-sm">

                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
                                🍽️
                            </div>

                            <h2 className="mt-6 text-2xl font-black">
                                No Orders Yet
                            </h2>

                            <p className="mt-2 text-gray-500">
                                Customer orders will appear here.
                            </p>

                        </div>
                    )}

                    {/* Orders */}
                    <div className="space-y-8">

                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:shadow-lg"
                            >

                                {/* ================= ORDER HEADER ================= */}
                                <div className="border-b border-gray-100 p-6 sm:p-8">

                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                                        {/* Order Information */}
                                        <div>

                                            <div className="flex flex-wrap items-center gap-3">

                                                <h2 className="text-2xl font-black">
                                                    {order.order_number}
                                                </h2>

                                                <span
                                                    className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${getStatusClass(
                                                        order.status
                                                    )}`}
                                                >
                                                    {order.status}
                                                </span>

                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">

                                                <span>
                                                    🍽️ Table{' '}
                                                    {order.table.table_number}
                                                </span>

                                                <span>
                                                    🕐{' '}
                                                    {new Date(
                                                        order.created_at
                                                    ).toLocaleString()}
                                                </span>

                                            </div>

                                        </div>

                                        {/* Status Selector */}
                                        <div className="lg:min-w-[220px]">

                                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                                Update Status
                                            </label>

                                            <select
                                                value={order.status}
                                                onChange={(e) =>
                                                    updateStatus(
                                                        order.id,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                            >
                                                <option value="pending">
                                                    Pending
                                                </option>

                                                <option value="confirmed">
                                                    Confirmed
                                                </option>

                                                <option value="preparing">
                                                    Preparing
                                                </option>

                                                <option value="ready">
                                                    Ready
                                                </option>

                                                <option value="served">
                                                    Served
                                                </option>

                                                <option value="completed">
                                                    Completed
                                                </option>

                                                <option value="cancelled">
                                                    Cancelled
                                                </option>
                                            </select>

                                        </div>

                                    </div>

                                </div>

                                {/* ================= CUSTOMER INFORMATION ================= */}
                                {(order.customer_name ||
                                    order.customer_phone) && (
                                    <div className="mx-6 mt-6 rounded-2xl bg-orange-50 p-5 sm:mx-8">

                                        <h3 className="font-black text-gray-900">
                                            Customer Information
                                        </h3>

                                        <div className="mt-3 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:gap-6">

                                            {order.customer_name && (
                                                <p>
                                                    👤{' '}
                                                    {order.customer_name}
                                                </p>
                                            )}

                                            {order.customer_phone && (
                                                <p>
                                                    📞{' '}
                                                    {order.customer_phone}
                                                </p>
                                            )}

                                        </div>

                                    </div>
                                )}

                                {/* ================= ORDER ITEMS ================= */}
                                <div className="p-6 sm:p-8">

                                    <div className="mb-5 flex items-center justify-between">

                                        <div>
                                            <h3 className="text-xl font-black">
                                                Order Items
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Items included in this order
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600">
                                            {order.order_items.length}{' '}
                                            items
                                        </span>

                                    </div>

                                    <div className="space-y-4">

                                        {order.order_items.map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-stone-50 p-4 transition hover:border-orange-100"
                                                >

                                                    <div className="min-w-0">

                                                        <h4 className="font-bold">
                                                            {
                                                                item
                                                                    .menu_item
                                                                    .name
                                                            }
                                                        </h4>

                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {item.quantity}{' '}
                                                            ×{' '}
                                                            {Number(
                                                                item.price
                                                            ).toFixed(2)}{' '}
                                                            ETB
                                                        </p>

                                                    </div>

                                                    <span className="whitespace-nowrap font-black text-gray-900">
                                                        {(
                                                            Number(
                                                                item.price
                                                            ) *
                                                            item.quantity
                                                        ).toFixed(2)}{' '}
                                                        ETB
                                                    </span>

                                                </div>
                                            )
                                        )}

                                    </div>

                                    {/* Customer Notes */}
                                    {order.notes && (
                                        <div className="mt-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-5">

                                            <h3 className="font-black text-gray-900">
                                                📝 Customer Notes
                                            </h3>

                                            <p className="mt-2 text-sm leading-relaxed text-gray-700">
                                                {order.notes}
                                            </p>

                                        </div>
                                    )}

                                    {/* ================= ORDER SUMMARY ================= */}
                                    <div className="mt-8 rounded-2xl bg-gray-900 p-6 text-white">

                                        <div className="flex items-center justify-between">

                                            <span className="text-lg font-bold">
                                                Total
                                            </span>

                                            <span className="text-2xl font-black text-orange-400">
                                                {Number(
                                                    order.total_amount
                                                ).toFixed(2)}{' '}
                                                ETB
                                            </span>

                                        </div>

                                        {order.estimated_minutes && (
                                            <div className="mt-4 border-t border-white/10 pt-4">

                                                <p className="text-sm text-gray-400">
                                                    Estimated preparation time
                                                </p>

                                                <p className="mt-1 font-bold">
                                                    ⏱️{' '}
                                                    {
                                                        order.estimated_minutes
                                                    }{' '}
                                                    minutes
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-gray-200 bg-white">
                    <div className="mx-auto max-w-7xl px-5 py-8 text-center lg:px-8">

                        <p className="font-black">
                            DINE<span className="text-orange-500">.</span>
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                            Restaurant Order Management
                        </p>

                    </div>
                </footer>

            </div>
        </>
    );
}