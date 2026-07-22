import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type MenuItem = {
    id: number;
    name: string;
    price: number;
};

type OrderItem = {
    id: number;
    quantity: number;
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

export default function NewOrders({ orders }: Props) {
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
            <Head title="New Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        New Orders
                    </h1>

                    <p className="text-muted-foreground">
                        Orders waiting to be prepared in the kitchen.
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
                                    <div className="flex items-center justify-between">
                                        <CardTitle>
                                            Order #{order.id}
                                        </CardTitle>

                                        <Badge>
                                            {order.status}
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
                                                className="flex items-center justify-between rounded-md border p-3"
                                            >
                                                <span>
                                                    {item.menu_item.name}
                                                </span>

                                                <Badge variant="secondary">
                                                    x{item.quantity}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            updateStatus(
                                                order.id,
                                                'preparing'
                                            )
                                        }
                                    >
                                        Start Preparing
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