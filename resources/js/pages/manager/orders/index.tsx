import { Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    payment_status: string;
    payment_submitted_at: string | null;
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

const paymentColors: Record<string, string> = {
    unpaid: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
};

const paymentLabels: Record<string, string> = {
    unpaid: 'Unpaid',
    pending: 'Payment Pending',
    paid: 'Paid',
};

export default function OrdersIndex({ orders }: Props) {

    const verifyPayment = (orderId: number) => {
        router.patch(
            `/manager/orders/${orderId}/verify-payment`,
            {},
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <>
            <Head title="Customer Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Customer Orders"
                    description="View customer orders and verify customer payments."
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

                                                {/* Order Status */}
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

                                                {/* Payment Status */}
                                                <Badge
                                                    className={`capitalize ${
                                                        paymentColors[
                                                            order.payment_status
                                                        ] ?? ''
                                                    }`}
                                                >
                                                    {paymentLabels[
                                                        order.payment_status
                                                    ] ??
                                                        order.payment_status}
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

                                        {/* Payment Verification */}
                                        {order.payment_status === 'pending' && (
                                            <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-orange-900">
                                                            Payment Submitted
                                                        </h4>

                                                        <p className="mt-1 text-sm text-orange-800">
                                                            The customer says
                                                            they have paid.
                                                            Please verify the
                                                            payment.
                                                        </p>
                                                    </div>

                                                    <Button
                                                        onClick={() =>
                                                            verifyPayment(
                                                                order.id
                                                            )
                                                        }
                                                    >
                                                        Verify Payment
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Paid Message */}
                                        {order.payment_status === 'paid' && (
                                            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                                                <p className="font-semibold text-green-800">
                                                    ✓ Payment Verified
                                                </p>

                                                <p className="mt-1 text-sm text-green-700">
                                                    This order has been paid
                                                    successfully.
                                                </p>
                                            </div>
                                        )}

                                        {/* Unpaid Message */}
                                        {order.payment_status === 'unpaid' &&
                                            order.status === 'completed' && (
                                                <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                                    <p className="font-semibold text-yellow-800">
                                                        Payment Not Submitted
                                                    </p>

                                                    <p className="mt-1 text-sm text-yellow-700">
                                                        The customer has not
                                                        submitted their payment
                                                        yet.
                                                    </p>
                                                </div>
                                            )}
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