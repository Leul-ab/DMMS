import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Check,
    Utensils,
    RefreshCw,
    Loader2,
    Clock,
    Table2,
    History,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCan } from '@/hooks/use-can';

type MenuItem = {
    id: number;
    name: string;
    price: string;
};

type OrderItem = {
    id: number;
    quantity: number;
    menu_item: MenuItem | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    total_amount: string;
    customer_name: string | null;
    customer_phone: string | null;
    notes: string | null;
    special_instructions: string | null;
    created_at: string;
    table: { id: number; table_number: number } | null;
    customer: { id: number; name: string } | null;
    order_items: OrderItem[];
};

type Props = {
    orders: Order[];
};

export default function ServeOrders({ orders }: Props) {
    const can = useCan();
    const [isProcessing, setIsProcessing] = useState<number | null>(null);

    // Auto-poll for ready orders every 3 seconds for real-time sync
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['orders'],
            });
        }, 3000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const completeOrder = (order: Order) => {
        setIsProcessing(order.id);
        router.patch(
            `/serve/orders/${order.id}/complete`,
            {},
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    toast.success(
                        `Order ${order.order_number} served successfully!`,
                    );
                    setIsProcessing(null);
                },
                onError: () => {
                    toast.error('Failed to complete order');
                    setIsProcessing(null);
                },
            },
        );
    };

    const readyCount = orders.length;
    const tableCount = new Set(
        orders.map((order) => order.table?.table_number).filter(Boolean),
    ).size;
    const itemCount = orders.reduce(
        (total, order) =>
            total +
            order.order_items.reduce((sum, item) => sum + item.quantity, 0),
        0,
    );

    return (
        <>
            <Head title="Serve Orders" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
                            <Utensils className="h-7 w-7 text-red-500" />
                            Serve Orders
                        </h1>
                        <p className="text-sm text-gray-500">
                            Deliver ready orders to tables and mark them
                            complete.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/serve/history">
                                <History className="mr-1 h-4 w-4" />
                                History
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload({ only: ['orders'] })}
                        >
                            <RefreshCw className="mr-1 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                        {
                            label: 'Ready to Serve',
                            value: readyCount,
                            color: 'bg-green-600',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Tables Awaiting',
                            value: tableCount,
                            color: 'bg-red-500',
                            icon: Table2,
                        },
                        {
                            label: 'Items to Deliver',
                            value: itemCount,
                            color: 'bg-blue-500',
                            icon: Utensils,
                        },
                    ].map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <Card key={stat.label} className="overflow-hidden">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div
                                        className={`rounded-lg ${stat.color} p-2.5`}
                                    >
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">
                                            {stat.label}
                                        </p>
                                        <p className="text-xl font-black">
                                            {stat.value}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Ready Orders */}
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                            <p className="font-bold text-gray-900">
                                No orders ready to serve
                            </p>
                            <p className="text-sm text-gray-500">
                                New orders will appear here once the kitchen
                                marks them ready.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {orders.map((order) => (
                            <Card
                                key={order.id}
                                className="border-l-4 border-l-green-500 bg-green-50/40"
                            >
                                <CardContent className="space-y-3 p-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-black text-gray-900">
                                                {order.order_number
                                                    ? `Order #${order.order_number}`
                                                    : `Order #${order.id}`}
                                            </p>
                                            <p className="flex items-center gap-1 text-xs text-gray-500">
                                                <Table2 className="h-3 w-3" />
                                                Table{' '}
                                                {order.table?.table_number ??
                                                    'Unknown'}
                                            </p>
                                        </div>
                                        <Badge className="bg-green-600 text-white">
                                            Ready
                                        </Badge>
                                    </div>

                                    {/* Customer */}
                                    {(order.customer_name ||
                                        order.customer?.name) && (
                                        <p className="text-xs text-gray-600">
                                            Customer:{' '}
                                            <span className="font-semibold">
                                                {order.customer_name ??
                                                    order.customer?.name}
                                            </span>
                                        </p>
                                    )}

                                    {/* Items */}
                                    <div className="space-y-1.5">
                                        {order.order_items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-md border border-green-100 bg-white px-3 py-2"
                                            >
                                                <span className="text-sm font-medium">
                                                    {item.menu_item?.name ??
                                                        'Item'}
                                                </span>
                                                <Badge variant="secondary">
                                                    x{item.quantity}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Special Instructions */}
                                    {order.special_instructions && (
                                        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
                                            <p className="text-xs font-bold text-red-800">
                                                📝 Instructions
                                            </p>
                                            <p className="mt-1 text-xs whitespace-pre-line text-red-900">
                                                {order.special_instructions}
                                            </p>
                                        </div>
                                    )}

                                    {order.notes && (
                                        <div className="rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                                            📝 {order.notes}
                                        </div>
                                    )}

                                    {/* Total + Complete */}
                                    <div className="flex items-center justify-between border-t pt-3">
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Total
                                            </p>
                                            <p className="font-black text-gray-900">
                                                {Number(
                                                    order.total_amount ?? 0,
                                                ).toFixed(2)}{' '}
                                                ETB
                                            </p>
                                        </div>

                                        {can('update serve') && (
                                            <Button
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:from-green-700 hover:to-emerald-700"
                                                onClick={() =>
                                                    completeOrder(order)
                                                }
                                                disabled={
                                                    isProcessing === order.id
                                                }
                                            >
                                                {isProcessing === order.id ? (
                                                    <>
                                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />{' '}
                                                        Serving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="mr-1 h-4 w-4" />{' '}
                                                        Serve
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    <p className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        Ready since{' '}
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ServeOrders.layout = {
    breadcrumbs: [{ title: 'Serve Orders', href: '/serve' }],
};
