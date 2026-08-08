import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ChefHat, ClipboardList, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomerOrderCard   } from '@/components/customer-order-card';
import type {CustomerOrderDetails, CustomerOrderSummary} from '@/components/customer-order-card';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Props = {
    table: RestaurantTable;
    order: CustomerOrderSummary | null;
    orders: CustomerOrderSummary[];
};

function PageHeader({ children }: { children?: React.ReactNode }) {
    return (
        <div className="mb-10 text-center">
            <p className="font-semibold uppercase tracking-widest text-green-500">Order Tracking</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">My Orders</h1>
            <p className="mt-3 text-gray-500">Track your current orders and view your order details.</p>
            {children}
        </div>
    );
}

function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
                <Link href="/customer-menu" className="group">
                    <h1 className="text-2xl font-black tracking-tight transition group-hover:text-green-600">
                        DINE<span className="text-green-500">.</span>
                    </h1>
                    <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Digital Menu</p>
                </Link>
                <Link href="/customer-menu">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-green-300 hover:text-green-600">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Menu
                    </span>
                </Link>
            </div>
        </header>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-5">
            {[1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="h-3 w-24 animate-pulse rounded-full bg-gray-100" />
                                <div className="h-6 w-40 animate-pulse rounded-lg bg-gray-100" />
                            </div>
                            <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100" />
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-100" />
                            <div className="h-4 w-4 animate-pulse rounded-full bg-gray-100" />
                            <div className="h-4 w-20 animate-pulse rounded-full bg-gray-100" />
                        </div>
                        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                            <div className="flex items-center justify-between">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div key={s} className="flex flex-col items-center">
                                        <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                                        <div className="mt-2 h-2 w-12 animate-pulse rounded-full bg-gray-100" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4">
                                <div className="h-3 w-full animate-pulse rounded-full bg-gray-100" />
                                <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-gray-100" />
                            </div>
                        </div>
                        <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-2xl font-black text-gray-900">No Orders Yet</h2>
            <p className="mt-2 text-gray-500">You haven't placed any orders yet.</p>
            <Link
                href="/customer-menu"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-7 py-4 font-bold text-white shadow-lg shadow-green-500/25 transition hover:from-green-600 hover:to-green-700 hover:shadow-xl hover:shadow-green-500/40 active:scale-[0.98]"
            >
                <ClipboardList className="h-4 w-4" />
                Browse Menu
            </Link>
        </div>
    );
}

export default function CustomerMyOrderIndex({ table, order, orders }: Props) {
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Show skeleton briefly on first render.
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 600);

        return () => clearTimeout(timer);
    }, []);

    // Real-time sync: refresh the order list every 2 seconds.
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['orders', 'order'] });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleToggle = (orderId: number) => {
        setExpandedOrderId((current) => (current === orderId ? null : orderId));
    };

    const handleDetailsLoaded = (_orderId: number, _details: CustomerOrderDetails) => {
        // The CustomerOrderCard manages its own details state internally.
        // This callback is kept for the component's required prop interface.
    };

    const handleFeedbackSubmitted = () => {
        router.reload({ only: ['orders', 'order'] });
    };

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <SiteHeader />

            <main className="mx-auto max-w-4xl px-5 py-10">
                <PageHeader />

                {isLoading ? (
                    <LoadingSkeleton />
                ) : !orders || orders.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="space-y-5">
                            {orders.map((orderItem) => (
                                <CustomerOrderCard
                                    key={orderItem.id}
                                    order={orderItem}
                                    isExpanded={expandedOrderId === orderItem.id}
                                    onToggle={() => handleToggle(orderItem.id)}
                                    onDetailsLoaded={handleDetailsLoaded}
                                    onFeedbackSubmitted={handleFeedbackSubmitted}
                                />
                            ))}
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4">
                            <ChefHat className="h-4 w-4 text-green-500" />
                            <p className="text-sm font-medium text-gray-500">
                                Updates appear automatically as the kitchen prepares your order.
                            </p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
