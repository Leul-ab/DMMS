import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, Clock, ChefHat } from 'lucide-react';
import { useCan } from '@/hooks/use-can';

type MenuItem = {
    id: number;
    name: string;
};

type OrderItem = {
    id: number;
    quantity: number;
    menu_item: MenuItem;
};

type Table = {
    id: number;
    name: string;
};

type Order = {
    id: number;
    status: string;
    table: Table | null;
    order_items: OrderItem[];
    created_at: string;
};

type Props = {
    orders: Order[];
};

export default function KitchenOrders({ orders }: Props) {
    const can = useCan();
    const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

    const updateStatus = (orderId: number, status: string) => {
        setUpdatingOrder(orderId);

        router.patch(
            `/kitchen/orders/${orderId}/status`,
            { status },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingOrder(null),
            },
        );
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'New Order';
            case 'confirmed':
                return 'Confirmed';
            case 'preparing':
                return 'Preparing';
            case 'ready':
                return 'Ready';
            default:
                return status;
        }
    };

    return (
        <>
            <Head title="Kitchen Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Kitchen Orders
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage incoming orders and update their preparation
                        status.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed">
                        <div className="text-center">
                            <ChefHat className="mx-auto mb-3 size-10 text-muted-foreground" />

                            <h2 className="text-lg font-medium">
                                No active orders
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                New kitchen orders will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-xl border bg-card p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            Order #{order.id}
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            {order.table
                                                ? `Table ${order.table.name}`
                                                : 'No table assigned'}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>

                                <div className="my-4 border-t" />

                                <div className="space-y-3">
                                    {order.order_items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between"
                                        >
                                            <span>
                                                {item.menu_item.name}
                                            </span>

                                            <span className="font-semibold">
                                                × {item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex gap-2">
                                    {can('update kitchen') && order.status === 'pending' && (
                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    order.id,
                                                    'confirmed',
                                                )
                                            }
                                            disabled={
                                                updatingOrder === order.id
                                            }
                                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                        >
                                            Confirm Order
                                        </button>
                                    )}

                                    {can('update kitchen') && order.status === 'confirmed' && (
                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    order.id,
                                                    'preparing',
                                                )
                                            }
                                            disabled={
                                                updatingOrder === order.id
                                            }
                                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                        >
                                            Start Preparing
                                        </button>
                                    )}

                                    {can('update kitchen') && order.status === 'preparing' && (
                                        <button
                                            onClick={() =>
                                                updateStatus(
                                                    order.id,
                                                    'ready',
                                                )
                                            }
                                            disabled={
                                                updatingOrder === order.id
                                            }
                                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                        >
                                            Mark as Ready
                                        </button>
                                    )}

                                    {order.status === 'ready' && (
                                        <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium">
                                            <CheckCircle className="size-4" />
                                            Ready for Pickup
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
