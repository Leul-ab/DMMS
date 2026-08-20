import { Head, router } from '@inertiajs/react';
import {
    ChefHat,
    Clock,
    Bell,
    Flame,
    CheckCircle2,
    Utensils,
    User,
    Timer,
    Play,
    Check,
    RefreshCw,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCan } from '@/hooks/use-can';

type MenuItem = {
    id: number;
    name: string;
    image: string | null;
    preparation_time: number | null;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    special_preferences?: string[];
    menu_item: MenuItem | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string | null;
    total_amount: string;
    customer_name: string | null;
    customer_phone: string | null;
    notes: string | null;
    special_instructions: string | null;
    created_at: string;
    estimated_minutes: number | null;
    queue_estimated_minutes: number | null;
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    table: { id: number; table_number: number } | null;
    customer: { id: number; name: string } | null;
    order_items: OrderItem[];
};

type Stats = {
    new_orders: number;
    preparing: number;
    ready: number;
    completed: number;
    total: number;
};

type Props = {
    newOrders: Order[];
    preparingOrders: Order[];
    readyOrders: Order[];
    completedOrders: Order[];
    stats: Stats;
};

const statusColors: Record<string, string> = {
    pending: 'border-l-blue-500 bg-blue-50',
    preparing: 'border-l-red-500 bg-red-50',
    ready: 'border-l-green-500 bg-green-50',
    completed: 'border-l-gray-400 bg-gray-50',
};

const statusBadgeColors: Record<string, string> = {
    pending: 'bg-blue-500 text-white',
    preparing: 'bg-red-500 text-white',
    ready: 'bg-green-600 text-white',
    completed: 'bg-gray-500 text-white',
};

// Calculate total estimated preparation time from order items:
// sum of (quantity × menu_item.preparation_time) for all items.
function calculateEstimatedMinutes(order: Order): number {
    return (order.order_items ?? []).reduce((total, item) => {
        const prepTime = item.menu_item?.preparation_time;

        if (prepTime && item.quantity) {
            return total + prepTime * item.quantity;
        }

        return total;
    }, 0);
}

export default function KitchenDashboard({
    newOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    stats,
}: Props) {
    const can = useCan();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [liveTimers, setLiveTimers] = useState<Record<number, number>>({});
    const [newOrderAlert, setNewOrderAlert] = useState(false);

    // Track new orders for notification
    const prevNewCount = useRef(newOrders.length);

    useEffect(() => {
        if (
            newOrders.length > prevNewCount.current &&
            prevNewCount.current > 0
        ) {
            setNewOrderAlert(true);
            toast.success(
                `${newOrders.length - prevNewCount.current} new order(s) received!`,
                {
                    duration: 5000,
                },
            );
            setTimeout(() => setNewOrderAlert(false), 4000);
        }

        prevNewCount.current = newOrders.length;
    }, [newOrders.length]);

    // Auto-poll for order updates every 2 seconds for real-time sync
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: [
                    'newOrders',
                    'preparingOrders',
                    'readyOrders',
                    'completedOrders',
                    'stats',
                ],
            });
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Live timer countdown for order cards.
    // Only preparing orders count down. Ready/completed orders stop at 0.
    useEffect(() => {
        const interval = setInterval(() => {
            const updated: Record<number, number> = {};
            const now = new Date().getTime();

            // Only preparing orders have a running countdown.
            preparingOrders.forEach((order) => {
                if (order.preparation_started_at && order.preparation_time) {
                    const startedAt = new Date(
                        order.preparation_started_at,
                    ).getTime();
                    const elapsed = Math.floor((now - startedAt) / 1000);
                    const total = order.preparation_time * 60;
                    const remaining = Math.max(0, total - elapsed);
                    updated[order.id] = remaining;
                }
            });

            // Ready orders have their timer stopped at 0.
            readyOrders.forEach((order) => {
                updated[order.id] = 0;
            });

            setLiveTimers((prev) => {
                const hasChanged = Object.keys(updated).some(
                    (k) =>
                        Math.abs(
                            (prev[Number(k)] || 0) - (updated[Number(k)] || 0),
                        ) > 1,
                );

                return hasChanged ? updated : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [preparingOrders, readyOrders]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const timeAgo = (dateStr: string) => {
        const now = new Date().getTime();
        const date = new Date(dateStr).getTime();
        const diffMins = Math.floor((now - date) / 60000);

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

        return new Date(dateStr).toLocaleDateString();
    };

    const isPriority = (order: Order) => {
        if (order.status === 'pending') {
            const created = new Date(order.created_at).getTime();
            const elapsed = (Date.now() - created) / 60000;

            return elapsed > 15;
        }

        return false;
    };

    /**
     * Accept the order and automatically start preparation
     * using the estimated time calculated from the order's items.
     */
    const acceptOrderAndStartPreparation = (order: Order) => {
        setIsProcessing(true);
        const estimatedMinutes = calculateEstimatedMinutes(order);

        router.patch(
            `/kitchen/orders/${order.id}/accept`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Automatically start preparation with the calculated time
                    router.patch(
                        `/kitchen/orders/${order.id}/start-preparation`,
                        {
                            preparation_time: estimatedMinutes || 15,
                        },
                        {
                            preserveScroll: true,
                            preserveState: true,
                            onSuccess: () => {
                                toast.success(
                                    `Preparation started! Estimated time: ${estimatedMinutes || 15} minutes.`,
                                );
                                setIsProcessing(false);
                            },
                            onError: () => {
                                toast.error('Failed to start preparation');
                                setIsProcessing(false);
                            },
                        },
                    );
                },
                onError: () => {
                    toast.error('Failed to accept order');
                    setIsProcessing(false);
                },
            },
        );
    };

    /**
     * Start preparation for an accepted order that hasn't started yet,
     * using the estimated time calculated from the order's items.
     */
    const startPreparationForOrder = (order: Order) => {
        setIsProcessing(true);
        const estimatedMinutes = calculateEstimatedMinutes(order);

        router.patch(
            `/kitchen/orders/${order.id}/start-preparation`,
            {
                preparation_time: estimatedMinutes || 15,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(
                        `Preparation started! Estimated time: ${estimatedMinutes || 15} minutes.`,
                    );
                    setIsProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to start preparation');
                    setIsProcessing(false);
                },
            },
        );
    };

    const markReady = (order: Order) => {
        setIsProcessing(true);
        router.patch(
            `/kitchen/orders/${order.id}/mark-ready`,
            {},
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    toast.success('Order marked as ready to serve!');
                    setIsProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to mark as ready');
                    setIsProcessing(false);
                },
            },
        );
    };

    const getFilteredOrders = (orders: Order[]) => {
        if (!search) {
            return orders;
        }

        const q = search.toLowerCase();

        return orders.filter(
            (o) =>
                o.order_number.toLowerCase().includes(q) ||
                (o.table && String(o.table.table_number).includes(q)) ||
                (o.customer_name && o.customer_name.toLowerCase().includes(q)),
        );
    };

    const renderOrderCard = (order: Order, column: string) => {
        const timer = liveTimers[order.id];
        const isPriorityOrder = isPriority(order);
        const isTimerRunning =
            order.preparation_status === 'preparing' && timer !== undefined;
        const isTimerExpired =
            timer !== undefined && timer <= 0 && order.status === 'preparing';

        return (
            <Card
                key={order.id}
                className={`border-l-4 ${statusColors[order.status] || 'border-l-gray-300'} transition-all duration-200 hover:shadow-lg ${
                    isPriorityOrder ? 'animate-pulse ring-2 ring-red-300' : ''
                }`}
            >
                <CardContent className="space-y-3 p-4">
                    {/* Order Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            {isPriorityOrder && (
                                <Flame className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-mono text-xs font-bold text-gray-900">
                                {order.order_number}
                            </span>
                        </div>
                        <Badge
                            className={`${statusBadgeColors[order.status] || 'bg-gray-500'} text-xs`}
                        >
                            {order.status}
                        </Badge>
                    </div>

                    {/* Table & Customer */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Utensils className="h-3 w-3" />
                            Table {order.table?.table_number || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.customer?.name ||
                                order.customer_name ||
                                'Walk-in'}
                        </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1">
                        {order.order_items?.slice(0, 4).map((item) => (
                            <div
                                key={item.id}
                                className="text-xs"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">
                                        {item.menu_item?.name || 'Item'} ×{' '}
                                        {item.quantity}
                                    </span>
                                </div>
                                {item.special_preferences &&
                                    item.special_preferences.length > 0 && (
                                        <p className="mt-0.5 text-[10px] text-red-700">
                                            {item.special_preferences.join(', ')}
                                        </p>
                                    )}
                            </div>
                        ))}
                        {order.order_items && order.order_items.length > 4 && (
                            <p className="text-xs text-gray-400">
                                +{order.order_items.length - 4} more items
                            </p>
                        )}
                    </div>

                    {/* Order Time */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {timeAgo(order.created_at)}
                    </div>

                    {/* Estimated Preparation Time Display - shows queue-based cumulative time */}
                    {order.queue_estimated_minutes ? (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Timer className="h-3 w-3" />
                            <span className="font-semibold text-red-600">
                                Est. {order.queue_estimated_minutes} min total
                            </span>
                        </div>
                    ) : null}

                    {/* Timer Display */}
                    {isTimerRunning && (
                        <div
                            className={`rounded-lg p-2 text-center font-mono text-lg font-bold ${
                                timer < 120
                                    ? 'animate-pulse bg-red-100 text-red-600'
                                    : 'bg-red-100 text-red-600'
                            }`}
                        >
                            <Timer className="mr-1 inline h-4 w-4" />
                            {formatTime(timer)}
                        </div>
                    )}
                    {isTimerExpired && (
                        <div className="rounded-lg bg-green-100 p-2 text-center text-sm font-bold text-green-600">
                            <CheckCircle2 className="mr-1 inline h-4 w-4" />
                            Time's up! Ready to serve.
                        </div>
                    )}

                    {/* Special Instructions */}
                    {order.special_instructions && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
                            <p className="flex items-center gap-1 text-xs font-bold text-red-800">
                                <span>📝</span>
                                Additional Instructions
                            </p>
                            <p className="mt-1 text-xs whitespace-pre-line text-red-900">
                                {order.special_instructions}
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                        <div className="rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                            📝 {order.notes}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-1">
                        {can('update kitchen') && column === 'new' && (
                            <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                                onClick={() =>
                                    acceptOrderAndStartPreparation(order)
                                }
                                disabled={isProcessing}
                            >
                                <Check className="mr-1 h-4 w-4" />
                                Accept & Start Prep
                            </Button>
                        )}
                        {can('update kitchen') &&
                            column === 'preparing' &&
                            order.preparation_status === 'waiting' && (
                                <Button
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                                    onClick={() =>
                                        startPreparationForOrder(order)
                                    }
                                    disabled={isProcessing}
                                >
                                    <Play className="mr-1 h-4 w-4" />
                                    Start Preparation
                                </Button>
                            )}
                        {can('update kitchen') &&
                            column === 'preparing' &&
                            order.preparation_status === 'preparing' && (
                                <Button
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                                    onClick={() => markReady(order)}
                                    disabled={isProcessing}
                                >
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Mark Ready
                                </Button>
                            )}
                        {can('update kitchen') && column === 'ready' && (
                            <p className="w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center text-xs font-bold text-green-700">
                                <CheckCircle2 className="mr-1 inline h-4 w-4" />
                                Ready to serve
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const filteredNew = getFilteredOrders(newOrders);
    const filteredPreparing = getFilteredOrders(preparingOrders);
    const filteredReady = getFilteredOrders(readyOrders);
    const filteredCompleted = getFilteredOrders(completedOrders);

    const columns = [
        {
            title: 'New Orders',
            key: 'new',
            orders: filteredNew,
            color: 'blue',
            icon: Bell,
        },
        {
            title: 'Preparing',
            key: 'preparing',
            orders: filteredPreparing,
            color: 'red',
            icon: ChefHat,
        },
        {
            title: 'Ready',
            key: 'ready',
            orders: filteredReady,
            color: 'green',
            icon: CheckCircle2,
        },
        {
            title: 'Completed',
            key: 'completed',
            orders: filteredCompleted,
            color: 'gray',
            icon: Clock,
        },
    ];

    return (
        <>
            <Head title="Kitchen Dashboard" />

            {/* New Order Alert Banner */}
            {newOrderAlert && (
                <div className="fixed top-0 right-0 left-0 z-50 animate-bounce bg-blue-600 py-3 text-center text-white">
                    <Bell className="mr-2 inline h-5 w-5" />
                    <span className="font-bold">🔔 New Order Received!</span>
                </div>
            )}

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
                            <ChefHat className="h-7 w-7 text-red-500" />
                            Kitchen Dashboard
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage and track customer orders in real time.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload()}
                        >
                            <RefreshCw className="mr-1 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        {
                            label: 'New Orders',
                            value: stats.new_orders,
                            color: 'bg-blue-500',
                            icon: Bell,
                        },
                        {
                            label: 'Preparing',
                            value: stats.preparing,
                            color: 'bg-red-500',
                            icon: ChefHat,
                        },
                        {
                            label: 'Ready',
                            value: stats.ready,
                            color: 'bg-green-600',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Completed',
                            value: stats.completed,
                            color: 'bg-gray-500',
                            icon: Clock,
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

                {/* Search & Filter */}
                <div className="flex flex-wrap gap-2">
                    <div className="min-w-[200px] flex-1">
                        <input
                            placeholder="Search Order ID, Table #, or Customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {['all', 'new', 'preparing', 'ready', 'completed'].map(
                            (f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilterStatus(f)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                        filterStatus === f
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {f === 'all'
                                        ? 'All'
                                        : f.charAt(0).toUpperCase() +
                                          f.slice(1)}
                                </button>
                            ),
                        )}
                    </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-4">
                    {columns.map((col) => {
                        if (
                            filterStatus !== 'all' &&
                            filterStatus !== col.key
                        ) {
                            return null;
                        }

                        const Icon = col.icon;

                        return (
                            <div
                                key={col.key}
                                className="flex min-h-[300px] flex-col gap-3"
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            className={`h-4 w-4 ${col.color === 'blue' ? 'text-blue-500' : col.color === 'red' ? 'text-red-500' : col.color === 'green' ? 'text-green-600' : 'text-gray-500'}`}
                                        />
                                        <h3 className="text-sm font-bold text-gray-900">
                                            {col.title}
                                        </h3>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {col.orders.length}
                                    </Badge>
                                </div>

                                {/* Order Cards */}
                                <div className="flex max-h-[calc(100vh-380px)] flex-col gap-3 overflow-y-auto pr-1">
                                    {col.orders.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                                            <div className="mb-2 rounded-full bg-gray-50 p-3">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-medium">
                                                No orders
                                            </p>
                                        </div>
                                    ) : (
                                        col.orders.map((order) =>
                                            renderOrderCard(order, col.key),
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

KitchenDashboard.layout = {
    breadcrumbs: [{ title: 'Kitchen Dashboard', href: '/kitchen/dashboard' }],
};
