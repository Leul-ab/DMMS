import { ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RecentOrder = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: string | number;
    customer_name: string | null;
    table_id: number | null;
    created_at: string;
    table?: {
        table_number: number;
    } | null;
};

type RecentOrdersProps = {
    orders: RecentOrder[];
};

export default function RecentOrders({
    orders,
}: RecentOrdersProps) {
    const getStatusVariant = (
        status: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'completed':
                return 'default';

            case 'cancelled':
                return 'destructive';

            case 'received':
                return 'secondary';

            default:
                return 'outline';
        }
    };

    const getPaymentVariant = (
        status: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'paid':
                return 'default';

            case 'pending':
                return 'secondary';

            default:
                return 'outline';
        }
    };

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Recent Orders
                </CardTitle>
            </CardHeader>

            <CardContent>
                {orders.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        No orders found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-3 py-3">
                                        Order
                                    </th>

                                    <th className="px-3 py-3">
                                        Customer
                                    </th>

                                    <th className="px-3 py-3">
                                        Table
                                    </th>

                                    <th className="px-3 py-3">
                                        Status
                                    </th>

                                    <th className="px-3 py-3">
                                        Payment
                                    </th>

                                    <th className="px-3 py-3 text-right">
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-3 py-3 text-sm font-medium">
                                            {order.order_number}
                                        </td>

                                        <td className="px-3 py-3 text-sm">
                                            {order.customer_name ||
                                                'Walk-in Customer'}
                                        </td>

                                        <td className="px-3 py-3 text-sm text-muted-foreground">
                                            {order.table?.table_number
                                                ? `Table ${order.table.table_number}`
                                                : '—'}
                                        </td>

                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={getStatusVariant(
                                                    order.status,
                                                )}
                                            >
                                                {order.status}
                                            </Badge>
                                        </td>

                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={getPaymentVariant(
                                                    order.payment_status,
                                                )}
                                            >
                                                {order.payment_status}
                                            </Badge>
                                        </td>

                                        <td className="px-3 py-3 text-right text-sm font-medium">
                                            $
                                            {Number(
                                                order.total_amount,
                                            ).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}