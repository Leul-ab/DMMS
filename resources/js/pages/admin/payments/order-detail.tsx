import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Printer,
    CheckCircle2,
    Clock,
    Hash,
    User,
    Table2,
    CreditCard,
    Wallet,
    Receipt,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500 text-white',
    paid: 'bg-green-600 text-white',
    unpaid: 'bg-red-600 text-white',
    refunded: 'bg-purple-600 text-white',
    cancelled: 'bg-gray-500 text-white',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    unpaid: 'Unpaid',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
};

const orderStatusColors: Record<string, string> = {
    pending: 'bg-yellow-500 text-white',
    preparing: 'bg-blue-600 text-white',
    ready: 'bg-green-600 text-white',
    served: 'bg-purple-600 text-white',
    completed: 'bg-gray-800 text-white',
    cancelled: 'bg-red-600 text-white',
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    menu_item: { id: number; name: string; image: string | null } | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string | null;
    total_amount: string;
    customer_name: string | null;
    customer_phone: string | null;
    special_instructions: string | null;
    created_at: string;
    table: { id: number; table_number: number } | null;
    customer: { id: number; customer_code: string; name: string } | null;
    order_items: OrderItem[];
    payment: {
        id: number;
        payment_method: string | null;
        payment_status: string;
        amount: string;
        subtotal: string;
        tax: string;
        service_charge: string;
        discount: string;
        transaction_reference: string | null;
        paid_at: string | null;
        cashier: { id: number; name: string } | null;
    } | null;
};

type Props = {
    order: Order;
};

const paymentMethods: Record<string, string> = {
    cash: 'Cash',
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
};

export default function PaymentOrderDetail({ order }: Props) {
    const timeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) {
            return 'Just now';
        }

        if (diffMins < 60) {
            return `${diffMins} min ago`;
        }

        const diffHours = Math.floor(diffMins / 60);

        if (diffHours < 24) {
            return `${diffHours}h ago`;
        }

        return date.toLocaleDateString();
    };

    const handlePrint = () => {
        window.open(`/admin/payments/${order.id}/receipt`, '_blank');
    };

    return (
        <>
            <Head title={`Order ${order.order_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/admin/payments/orders"
                        className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Orders
                    </Link>
                    {order.payment?.payment_method && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                        </Button>
                    )}
                </div>

                {/* Order Detail Card */}
                <div className="mx-auto w-full max-w-2xl">
                    <Card className="shadow-lg">
                        <CardContent className="p-0">
                            {/* Receipt Header */}
                            <div className="rounded-t-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center text-white">
                                <Receipt className="mx-auto mb-3 h-10 w-10 opacity-80" />
                                <p className="font-mono text-2xl font-black tracking-wider">
                                    {order.order_number}
                                </p>
                                <p className="mt-1 text-sm text-red-100">
                                    {new Date(
                                        order.created_at,
                                    ).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-6 p-6">
                                {/* Order Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="mb-1 flex items-center gap-2 text-gray-500">
                                            <Table2 className="h-4 w-4" />
                                            <span className="text-xs font-semibold tracking-wider uppercase">
                                                Table
                                            </span>
                                        </div>
                                        <p className="text-lg font-bold">
                                            {order.table
                                                ? `Table ${order.table.table_number}`
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="mb-1 flex items-center gap-2 text-gray-500">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-xs font-semibold tracking-wider uppercase">
                                                Time
                                            </span>
                                        </div>
                                        <p className="text-lg font-bold">
                                            {timeAgo(order.created_at)}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="mb-1 flex items-center gap-2 text-gray-500">
                                            <Hash className="h-4 w-4" />
                                            <span className="text-xs font-semibold tracking-wider uppercase">
                                                Order Status
                                            </span>
                                        </div>
                                        <Badge
                                            className={`${orderStatusColors[order.status] || 'bg-gray-500'} mt-1`}
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="mb-1 flex items-center gap-2 text-gray-500">
                                            <CreditCard className="h-4 w-4" />
                                            <span className="text-xs font-semibold tracking-wider uppercase">
                                                Payment Status
                                            </span>
                                        </div>
                                        <Badge
                                            className={`${paymentStatusColors[order.payment_status || 'pending'] || 'bg-gray-500'} mt-1`}
                                        >
                                            {paymentStatusLabels[
                                                order.payment_status ||
                                                    'pending'
                                            ] || 'Pending'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                {(order.customer?.name ||
                                    order.customer_name) && (
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span className="text-xs font-semibold tracking-wider uppercase">
                                                Customer
                                            </span>
                                        </div>
                                        <p className="font-bold">
                                            {order.customer?.name ||
                                                order.customer_name}
                                        </p>
                                        {order.customer?.customer_code && (
                                            <p className="text-sm text-gray-500">
                                                Code:{' '}
                                                {order.customer.customer_code}
                                            </p>
                                        )}
                                        {order.customer_phone && (
                                            <p className="text-sm text-gray-500">
                                                {order.customer_phone}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Order Items */}
                                <div>
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                                        <Receipt className="h-4 w-4 text-red-500" />
                                        Order Items
                                    </h3>
                                    <div className="space-y-2">
                                        {order.order_items?.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {item.menu_item?.image ? (
                                                        <img
                                                            src={`/storage/${item.menu_item.image}`}
                                                            alt={
                                                                item.menu_item
                                                                    .name
                                                            }
                                                            className="h-10 w-10 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-lg">
                                                            🍽️
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item.menu_item
                                                                ?.name ||
                                                                'Item'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            × {item.quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold">
                                                    {(
                                                        Number(item.price) *
                                                        item.quantity
                                                    ).toFixed(2)}{' '}
                                                    ETB
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Special Instructions */}
                                {order.special_instructions && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="flex items-center gap-2 text-sm font-bold text-red-800">
                                            <span>📝</span>
                                            Additional Instructions
                                        </p>
                                        <p className="mt-1 text-sm whitespace-pre-line text-red-900">
                                            {order.special_instructions}
                                        </p>
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="border-t border-dashed border-gray-200" />

                                {/* Totals */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Subtotal
                                        </span>
                                        <span className="font-medium">
                                            {order.payment
                                                ? Number(
                                                      order.payment.subtotal,
                                                  ).toFixed(2)
                                                : Number(
                                                      order.total_amount,
                                                  ).toFixed(2)}{' '}
                                            ETB
                                        </span>
                                    </div>
                                    {order.payment && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">
                                                    Tax
                                                </span>
                                                <span className="font-medium">
                                                    {Number(
                                                        order.payment.tax,
                                                    ).toFixed(2)}{' '}
                                                    ETB
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">
                                                    Service Charge
                                                </span>
                                                <span className="font-medium">
                                                    {Number(
                                                        order.payment
                                                            .service_charge,
                                                    ).toFixed(2)}{' '}
                                                    ETB
                                                </span>
                                            </div>
                                            {Number(order.payment.discount) >
                                                0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">
                                                        Discount
                                                    </span>
                                                    <span className="font-medium text-green-600">
                                                        -
                                                        {Number(
                                                            order.payment
                                                                .discount,
                                                        ).toFixed(2)}{' '}
                                                        ETB
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="border-t border-gray-200 pt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-bold text-gray-900">
                                                Total
                                            </span>
                                            <span className="text-2xl font-black text-red-600">
                                                {order.payment
                                                    ? Number(
                                                          order.payment.amount,
                                                      ).toFixed(2)
                                                    : Number(
                                                          order.total_amount,
                                                      ).toFixed(2)}{' '}
                                                ETB
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                {order.payment && (
                                    <>
                                        <div className="border-t border-dashed border-gray-200" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-gray-50 p-3">
                                                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                                    Payment Method
                                                </p>
                                                <p className="mt-1 font-bold capitalize">
                                                    {order.payment
                                                        .payment_method
                                                        ? paymentMethods[
                                                              order.payment
                                                                  .payment_method
                                                          ] ||
                                                          order.payment
                                                              .payment_method
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-gray-50 p-3">
                                                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                                    Cashier
                                                </p>
                                                <p className="mt-1 font-bold">
                                                    {order.payment.cashier
                                                        ?.name || '—'}
                                                </p>
                                            </div>
                                            {order.payment
                                                .transaction_reference && (
                                                <div className="col-span-2 rounded-lg bg-gray-50 p-3">
                                                    <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                                        Transaction Reference
                                                    </p>
                                                    <p className="mt-1 font-mono text-sm font-bold">
                                                        {
                                                            order.payment
                                                                .transaction_reference
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

PaymentOrderDetail.layout = {
    breadcrumbs: [
        { title: 'Payment Management', href: '/admin/payments' },
        { title: 'Orders', href: '/admin/payments/orders' },
        { title: 'Order Detail', href: '' },
    ],
};
