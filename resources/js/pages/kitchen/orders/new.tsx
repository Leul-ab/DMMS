import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MenuItem = {
    id: number;
    name: string;
    price: number;
};

type OrderItem = {
    id: number;
    quantity: number;
    price?: number;
    special_preferences: string[] | null;
    menu_item: MenuItem;
};

type Table = {
    id: number;
    table_number: string | number;
};

type Order = {
    id: number;
    order_number?: string;
    status: string;
    created_at: string;
    estimated_minutes?: number | null;
    queue_estimated_minutes?: number | null;
    total_amount?: string | number;
    table?: Table | null;
    order_items: OrderItem[];
};

type Props = {
    orders: Order[];
};

export default function NewOrders({ orders }: Props) {
    const updateStatus = (orderId: number, status: string) => {
        router.patch(
            `/kitchen/orders/${orderId}/status`,
            {
                status,
            },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="New Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        New Orders
                    </h1>

                    <p className="text-muted-foreground">
                        Receive and complete customer orders.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex min-h-[200px] items-center justify-center">
                            <p className="text-muted-foreground">
                                No new orders at the moment.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {orders.map((order) => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-3">
                                        <CardTitle>
                                            {order.order_number ??
                                                `Order #${order.id}`}
                                        </CardTitle>

                                        <Badge
                                            variant={
                                                order.status === 'received'
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p>
                                            🍽️ Table:{' '}
                                            {order.table?.table_number ??
                                                'Unknown'}
                                        </p>

                                        {(order.queue_estimated_minutes ||
                                            order.estimated_minutes) && (
                                            <p>
                                                ⏱️{' '}
                                                {order.queue_estimated_minutes ||
                                                    order.estimated_minutes}{' '}
                                                min
                                            </p>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {order.order_items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-md border p-3"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {item.menu_item.name}
                                                    </p>

                                                    <p className="text-sm text-muted-foreground">
                                                        {item.quantity} ×{' '}
                                                        {Number(
                                                            item.price ??
                                                                item.menu_item
                                                                    .price,
                                                        ).toFixed(2)}{' '}
                                                        ETB
                                                    </p>
                                                    {item.special_preferences &&
                                                        item.special_preferences.length >
                                                            0 && (
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {item.special_preferences.map(
                                                                    (pref) => (
                                                                        <span
                                                                            key={
                                                                                pref
                                                                            }
                                                                            className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700"
                                                                        >
                                                                            {pref}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                </div>

                                                <p className="font-semibold">
                                                    {(
                                                        Number(
                                                            item.price ??
                                                                item.menu_item
                                                                    .price,
                                                        ) * item.quantity
                                                    ).toFixed(2)}{' '}
                                                    ETB
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="font-semibold">
                                                Total
                                            </span>

                                            <span className="font-bold">
                                                {Number(
                                                    order.total_amount ?? 0,
                                                ).toFixed(2)}{' '}
                                                ETB
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {order.status === 'pending' && (
                                                <Button
                                                    className="w-full"
                                                    onClick={() =>
                                                        updateStatus(
                                                            order.id,
                                                            'received',
                                                        )
                                                    }
                                                >
                                                    Receive Order
                                                </Button>
                                            )}

                                            {order.status === 'received' && (
                                                <Button
                                                    className="w-full"
                                                    onClick={() =>
                                                        updateStatus(
                                                            order.id,
                                                            'completed',
                                                        )
                                                    }
                                                >
                                                    Complete Order
                                                </Button>
                                            )}

                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() =>
                                                    updateStatus(
                                                        order.id,
                                                        'cancelled',
                                                    )
                                                }
                                            >
                                                Cancel Order
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
