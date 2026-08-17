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
    special_preferences: string[] | null;
    menu_item: MenuItem;
};

type Table = {
    id: number;
    table_number: string | number;
};

type Order = {
    id: number;
    status: string;
    created_at: string;
    table?: Table | null;
    order_items: OrderItem[];
};

type Props = {
    orders: Order[];
};

export default function PreparingOrders({ orders }: Props) {
    const updateStatus = (orderId: number, status: string) => {
        router.patch(
            `/kitchen/orders/${orderId}/status`,
            {
                status,
            },
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <>
            <Head title="Preparing Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Preparing Orders
                    </h1>

                    <p className="text-muted-foreground">
                        Orders currently being prepared by the kitchen.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex min-h-[200px] items-center justify-center">
                            <p className="text-muted-foreground">
                                No orders are currently being prepared.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {orders.map((order) => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>
                                            Order #{order.id}
                                        </CardTitle>

                                        <Badge variant="secondary">
                                            Preparing
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        Table:{' '}
                                        {order.table?.table_number ??
                                            'Unknown'}
                                    </p>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {order.order_items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex flex-col rounded-md border p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>
                                                        {item.menu_item.name}
                                                    </span>

                                                    <Badge variant="secondary">
                                                        x{item.quantity}
                                                    </Badge>
                                                </div>
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
                                        ))}
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            updateStatus(
                                                order.id,
                                                'ready'
                                            )
                                        }
                                    >
                                        Mark as Ready
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}