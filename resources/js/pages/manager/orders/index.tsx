import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    served: 'Served',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export default function OrdersIndex({ orders }: Props) {
    return (
        <>
            <Head title="Customer Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Customer Orders"
                    description="View customer orders in real time."
                />

                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
                                🍽️
                            </div>

                            <h3 className="mt-5 text-lg font-semibold">
                                No Orders Yet
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Customer orders will appear here once placed.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card key={order.id}>
                                <CardContent className="p-0">

                                    {/* Order Header */}
                                    <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-lg font-semibold">
                                                    {order.order_number}
                                                </h3>

                                                {/* View-only status */}
                                                <Badge
                                                    className={`capitalize ${
                                                        statusColors[
                                                            order.status
                                                        ] ?? ''
                                                    }`}
                                                >
                                                    {statusLabels[
                                                        order.status
                                                    ] ?? order.status}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <span>
                                                    🍽️ Table{' '}
                                                    {order.table?.table_number ??
                                                        'Unknown'}
                                                </span>

                                                {order.estimated_minutes !==
                                                    null && (
                                                    <span>
                                                        🕐{' '}
                                                        {
                                                            order.estimated_minutes
                                                        }{' '}
                                                        min
                                                    </span>
                                                )}

                                                <span>
                                                    🕐{' '}
                                                    {new Date(
                                                        order.created_at
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Information */}
                                    {(order.customer_name ||
                                        order.customer_phone) && (
                                        <div className="mx-6 mt-4 rounded-lg bg-muted p-4">
                                            <h4 className="text-sm font-semibold">
                                                Customer Information
                                            </h4>

                                            <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-6">
                                                {order.customer_name && (
                                                    <span>
                                                        👤{' '}
                                                        {order.customer_name}
                                                    </span>
                                                )}

                                                {order.customer_phone && (
                                                    <span>
                                                        📞{' '}
                                                        {order.customer_phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Order Items */}
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            {order.order_items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-lg border p-3"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {
                                                                item.menu_item
                                                                    .name
                                                            }
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {item.quantity} ×{' '}
                                                            {Number(
                                                                item.price
                                                            ).toFixed(2)}{' '}
                                                            ETB
                                                        </p>
                                                    </div>

                                                    <span className="text-sm font-semibold">
                                                        {(
                                                            Number(item.price) *
                                                            item.quantity
                                                        ).toFixed(2)}{' '}
                                                        ETB
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Notes */}
                                        {order.notes && (
                                            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                                <h4 className="text-sm font-semibold">
                                                    📝 Order Notes
                                                </h4>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {order.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Total */}
                                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                                            <span className="text-base font-semibold">
                                                Total
                                            </span>

                                            <span className="text-lg font-bold">
                                                {Number(
                                                    order.total_amount
                                                ).toFixed(2)}{' '}
                                                ETB
                                            </span>
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