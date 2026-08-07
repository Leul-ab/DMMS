import { Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { OrderCard  } from '@/components/order-card';
import type {Order} from '@/components/order-card';
import { Button } from '@/components/ui/button';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
    orders?: Order[];
    menuPath: string;
};

export default function MyOrderView({
    table,
    order,
    orders = [],
    menuPath,
}: Props) {
    // Poll for order updates every 2 seconds for real-time sync.
    // The backend excludes served/cancelled orders, so when an order
    // transitions to "served" it automatically disappears from the list.
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

    // All active orders, newest first (backend already sorts by created_at DESC).
    const activeOrders = orders.length > 0 ? orders : order ? [order] : [];

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
                        My Orders
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Track all your active orders and enjoy your meal.
                    </p>

                </div>

                {/* ================= NO ORDERS ================= */}
                {activeOrders.length === 0 && (
                    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

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
                            className="mt-7 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-4 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                        >
                            Browse Menu →
                        </Link>

                    </div>
                )}

                {/* ================= ACTIVE ORDERS ================= */}
                {activeOrders.length > 0 && (
                    <div className="space-y-8">
                        {activeOrders.map((activeOrder, index) => (
                            <OrderCard
                                key={activeOrder.id}
                                order={activeOrder}
                                table={table}
                                menuPath={menuPath}
                                isNewest={index === 0}
                            />
                        ))}

                        {/* Back to Menu */}
                        <Link
                            href={`${menuPath}?table=${table.table_number}`}
                            className="block w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                        >
                            ← Back to Menu
                        </Link>
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
