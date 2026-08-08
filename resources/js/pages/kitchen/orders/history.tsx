import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function OrderHistory({ orders }: Props) {
    return (
        <>
            <Head title="Order History" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Order History
                    </h1>

                    <p className="text-muted-foreground">
                        View completed and cancelled orders.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex min-h-[200px] items-center justify-center">
                            <p className="text-muted-foreground">
                                No order history available.
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

                                        <Badge
                                            variant={
                                                order.status === 'completed'
                                                    ? 'default'
                                                    : 'destructive'
                                            }
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        Table:{' '}
                                        {order.table?.table_number ??
                                            'Unknown'}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {new Date(
                                            order.created_at
                                        ).toLocaleString()}
                                    </p>
                                </CardHeader>

                                <CardContent>
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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
