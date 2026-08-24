import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    History,
    Table2,
    Utensils,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type { PaginatedData } from '@/types';

type MenuItem = {
    id: number;
    name: string;
};

type OrderItem = {
    id: number;
    quantity: number;
    special_preferences: string[] | null;
    menu_item: MenuItem | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    total_amount: string;
    customer_name: string | null;
    updated_at: string;
    table: { id: number; table_number: number } | null;
    customer: { id: number; name: string } | null;
    order_items: OrderItem[];
};

type Props = {
    orders: PaginatedData<Order>;
};

export default function ServeHistory({ orders }: Props) {
    const handlePageChange = (url: string | null) => {
        if (!url) {
            return;
        }

        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const renderPagination = (data: PaginatedData<Order>) => {
        if (data.last_page <= 1) {
            return null;
        }

        return (
            <div className="mt-4 flex items-center justify-center gap-2">
                {data.links.map((link, i) => (
                    <Button
                        key={i}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => handlePageChange(link.url)}
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    </Button>
                ))}
            </div>
        );
    };

    const totalServed = orders.total ?? orders.data.length;

    return (
        <>
            <Head title="Served History" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/serve" title="Back to Serve">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>

                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
                                <History className="h-7 w-7 text-red-500" />
                                Served History
                            </h1>
                            <p className="text-sm text-gray-500">
                                Orders you have served and completed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Card className="overflow-hidden">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="rounded-lg bg-green-600 p-2.5">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500">
                                    Total Served
                                </p>
                                <p className="text-xl font-black">
                                    {totalServed}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-left text-xs font-semibold text-gray-600 uppercase">
                                        <th className="px-4 py-3">Order</th>
                                        <th className="px-4 py-3">Table</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Items</th>
                                        <th className="px-4 py-3">Total</th>
                                        <th className="px-4 py-3">Served At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-16 text-center text-gray-500"
                                            >
                                                <Utensils className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                                                No served orders yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.data.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="border-b last:border-0 hover:bg-muted/40"
                                            >
                                                <td className="px-4 py-3 font-semibold">
                                                    {order.order_number
                                                        ? `#${order.order_number}`
                                                        : `#${order.id}`}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1.5">
                                                        <Table2 className="h-3.5 w-3.5 text-gray-400" />
                                                        {order.table
                                                            ?.table_number ??
                                                            'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.customer_name ??
                                                        order.customer
                                                            ?.name ?? (
                                                            <span className="text-gray-400">
                                                                Walk-in
                                                            </span>
                                                        )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        {order.order_items.map(
                                                            (item) => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="flex flex-wrap items-center gap-1"
                                                                >
                                                                    <Badge
                                                                        variant="secondary"
                                                                    >
                                                                        {item
                                                                            .menu_item
                                                                            ?.name ??
                                                                            'Item'}{' '}
                                                                        ×
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </Badge>
                                                                    {item.special_preferences &&
                                                                        item.special_preferences.length >
                                                                            0 &&
                                                                        item.special_preferences
                                                                            .slice(
                                                                                0,
                                                                                2,
                                                                            )
                                                                        .map(
                                                                            (
                                                                                pref,
                                                                            idx,
                                                                            arr,
                                                                            ) => (
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
                                                            ),
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-bold">
                                                    {Number(
                                                        order.total_amount ?? 0,
                                                    ).toFixed(2)}{' '}
                                                    ETB
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {order.updated_at
                                                        ? new Date(
                                                              order.updated_at,
                                                          ).toLocaleString(
                                                              'en-US',
                                                              {
                                                                  month: 'short',
                                                                  day: 'numeric',
                                                                  year: 'numeric',
                                                                  hour: 'numeric',
                                                                  minute: '2-digit',
                                                              },
                                                          )
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {renderPagination(orders)}
            </div>
        </>
    );
}

ServeHistory.layout = {
    breadcrumbs: [
        { title: 'Serve Orders', href: '/serve' },
        { title: 'Served History', href: '/serve/history' },
    ],
};
