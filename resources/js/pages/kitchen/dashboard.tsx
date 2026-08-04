import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
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
    Loader2,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCan } from '@/hooks/use-can';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type MenuItem = {
    id: number;
    name: string;
    image: string | null;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
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
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    table: { id: number; table_number: number } | null;
    customer: { id: number; customer_code: string; name: string } | null;
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
    preparing: 'border-l-orange-500 bg-orange-50',
    ready: 'border-l-green-500 bg-green-50',
    completed: 'border-l-gray-400 bg-gray-50',
};

const statusBadgeColors: Record<string, string> = {
    pending: 'bg-blue-500 text-white',
    preparing: 'bg-orange-500 text-white',
    ready: 'bg-green-600 text-white',
    completed: 'bg-gray-500 text-white',
};

// Generate time options: 5, 10, 15, ... 60
const TIME_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);

// Split into two rows of 6 for the UI layout
const TIME_ROW_1 = TIME_OPTIONS.slice(0, 6); // [5, 10, 15, 20, 25, 30]
const TIME_ROW_2 = TIME_OPTIONS.slice(6);    // [35, 40, 45, 50, 55, 60]

// Round a number to the nearest 5, clamped between 5 and 60
function roundToNearest5(minutes: number): number {
    const rounded = Math.round(minutes / 5) * 5;
    return Math.max(5, Math.min(60, rounded));
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
    const [prepDialog, setPrepDialog] = useState<Order | null>(null);
    const [prepTime, setPrepTime] = useState<number>(15);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTimerLocked, setIsTimerLocked] = useState(false);
    const [liveTimers, setLiveTimers] = useState<Record<number, number>>({});
    const [newOrderAlert, setNewOrderAlert] = useState(false);
    const [dialogTimerSeconds, setDialogTimerSeconds] = useState<number | null>(null);
    const [addTimeDialog, setAddTimeDialog] = useState<Order | null>(null);
    const [addTimeValue, setAddTimeValue] = useState<number>(10);
    const dialogTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Track new orders for notification
    const prevNewCount = useRef(newOrders.length);

    useEffect(() => {
        if (newOrders.length > prevNewCount.current && prevNewCount.current > 0) {
            setNewOrderAlert(true);
            toast.success(`${newOrders.length - prevNewCount.current} new order(s) received!`, {
                duration: 5000,
            });
            setTimeout(() => setNewOrderAlert(false), 4000);
        }
        prevNewCount.current = newOrders.length;
    }, [newOrders.length]);

    // Auto-poll for order updates every 2 seconds for real-time sync
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['newOrders', 'preparingOrders', 'readyOrders', 'completedOrders', 'stats'],
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
                    const startedAt = new Date(order.preparation_started_at).getTime();
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
                    (k) => Math.abs((prev[Number(k)] || 0) - (updated[Number(k)] || 0)) > 1
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
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
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
     * Accept the order and automatically open the preparation dialog
     * with the estimated time pre-selected.
     */
    const acceptOrderAndOpenDialog = (order: Order) => {
        setIsProcessing(true);
        router.patch(`/kitchen/orders/${order.id}/accept`, {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Order accepted. Set preparation time.');
                setIsProcessing(false);
                // Auto-calculate and open the dialog with the estimated time
                const estimated = order.estimated_minutes || 15;
                setPrepTime(roundToNearest5(estimated));
                setPrepDialog(order);
                setIsTimerLocked(false);
                setDialogTimerSeconds(null);
            },
            onError: () => {
                toast.error('Failed to accept order');
                setIsProcessing(false);
            },
        });
    };

    /**
     * Open the preparation dialog for an order that is already accepted
     * but hasn't started preparation yet.
     */
    const openPrepDialog = (order: Order) => {
        setPrepDialog(order);
        // Auto-calculate estimated time from the order's existing estimated_minutes
        const estimated = order.estimated_minutes || 15;
        setPrepTime(roundToNearest5(estimated));
        setIsTimerLocked(false);
        setDialogTimerSeconds(null);
    };

    /**
     * Update the estimated_minutes on the backend when the kitchen staff
     * selects a different time in the dialog. This syncs the customer view
     * in real-time before the timer starts.
     */
    const handleTimeSelect = (order: Order, time: number) => {
        // Update local state immediately
        setPrepTime(time);

        // Send PATCH to update estimated_minutes for customer sync
        // Use a debounced approach to avoid too many requests
        router.patch(`/kitchen/orders/${order.id}/update-estimated-time`, {
            estimated_minutes: time,
        }, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                // Silently fail - the customer will still see the final time when timer starts
            },
        });
    };

    /**
     * Start the preparation timer.
     * Saves the selected time, starts the countdown, and locks the time selection.
     */
    const startPreparation = () => {
        if (!prepDialog) return;
        setIsProcessing(true);
        router.patch(`/kitchen/orders/${prepDialog.id}/start-preparation`, {
            preparation_time: prepTime,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Preparation started! Timer is running.');
                // Lock the dialog timer and show the countdown
                setIsTimerLocked(true);
                setDialogTimerSeconds(prepTime * 60);
                setIsProcessing(false);

                // Start the dialog countdown timer
                if (dialogTimerRef.current) {
                    clearInterval(dialogTimerRef.current);
                }
                dialogTimerRef.current = setInterval(() => {
                    setDialogTimerSeconds((prev) => {
                        if (prev === null || prev <= 1) {
                            if (dialogTimerRef.current) {
                                clearInterval(dialogTimerRef.current);
                            }
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                // Close the dialog after showing the timer briefly
                setTimeout(() => {
                    setPrepDialog(null);
                    setPrepTime(15);
                    setIsTimerLocked(false);
                    setDialogTimerSeconds(null);
                    if (dialogTimerRef.current) {
                        clearInterval(dialogTimerRef.current);
                        dialogTimerRef.current = null;
                    }
                }, 3000);
            },
            onError: () => {
                toast.error('Failed to start preparation');
                setIsProcessing(false);
            },
        });
    };

    const markReady = (order: Order) => {
        setIsProcessing(true);
        router.patch(`/kitchen/orders/${order.id}/mark-ready`, {}, {
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
        });
    };

    /**
     * Open the Add Time dialog for an order currently being prepared.
     */
    const openAddTimeDialog = (order: Order) => {
        setAddTimeValue(10);
        setAddTimeDialog(order);
    };

    /**
     * Submit the additional time to the backend. The backend increases
     * preparation_time so the customer's countdown and progress recalculate.
     */
    const submitAddTime = () => {
        if (!addTimeDialog || !addTimeValue || addTimeValue <= 0) return;
        setIsProcessing(true);
        router.patch(`/kitchen/orders/${addTimeDialog.id}/add-time`, {
            additional_minutes: addTimeValue,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success(`Added ${addTimeValue} minute(s) to order ${addTimeDialog.order_number}.`);
                setAddTimeDialog(null);
                setIsProcessing(false);
            },
            onError: () => {
                toast.error('Failed to add time');
                setIsProcessing(false);
            },
        });
    };

    const completeOrder = (order: Order) => {
        setIsProcessing(true);
        router.patch(`/kitchen/orders/${order.id}/complete`, {}, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                toast.success('Order completed!');
                setIsProcessing(false);
            },
            onError: () => {
                toast.error('Failed to complete order');
                setIsProcessing(false);
            },
        });
    };

    const getFilteredOrders = (orders: Order[]) => {
        if (!search) return orders;
        const q = search.toLowerCase();
        return orders.filter(
            (o) =>
                o.order_number.toLowerCase().includes(q) ||
                (o.table && String(o.table.table_number).includes(q)) ||
                (o.customer_name && o.customer_name.toLowerCase().includes(q))
        );
    };

    const renderOrderCard = (order: Order, column: string) => {
        const timer = liveTimers[order.id];
        const isPriorityOrder = isPriority(order);
        const isTimerRunning = order.preparation_status === 'preparing' && timer !== undefined;
        const isTimerExpired = timer !== undefined && timer <= 0 && order.status === 'preparing';

        return (
            <Card
                key={order.id}
                className={`border-l-4 ${statusColors[order.status] || 'border-l-gray-300'} transition-all duration-200 hover:shadow-lg ${
                    isPriorityOrder ? 'ring-2 ring-red-300 animate-pulse' : ''
                }`}
            >
                <CardContent className="p-4 space-y-3">
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
                        <Badge className={`${statusBadgeColors[order.status] || 'bg-gray-500'} text-xs`}>
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
                            {order.customer?.name || order.customer_name || 'Walk-in'}
                        </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1">
                        {order.order_items?.slice(0, 4).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">
                                    {item.menu_item?.name || 'Item'} × {item.quantity}
                                </span>
                            </div>
                        ))}
                        {order.order_items && order.order_items.length > 4 && (
                            <p className="text-xs text-gray-400">+{order.order_items.length - 4} more items</p>
                        )}
                    </div>

                    {/* Order Time */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {timeAgo(order.created_at)}
                    </div>

                    {/* Preparation Time Display */}
                    {order.preparation_time && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {order.preparation_status === 'preparing' ? (
                                <span className="font-semibold text-orange-600">
                                    {order.preparation_time} min total
                                </span>
                            ) : (
                                <span>Est. {order.preparation_time} min</span>
                            )}
                        </div>
                    )}

                    {/* Timer Display */}
                    {isTimerRunning && (
                        <div className={`rounded-lg p-2 text-center font-mono text-lg font-bold ${
                            timer < 120 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'
                        }`}>
                            <Timer className="h-4 w-4 inline mr-1" />
                            {formatTime(timer)}
                        </div>
                    )}
                    {isTimerExpired && (
                        <div className="rounded-lg bg-green-100 p-2 text-center text-sm font-bold text-green-600">
                            <CheckCircle2 className="h-4 w-4 inline mr-1" />
                            Time's up! Ready to serve.
                        </div>
                    )}

                    {/* Special Instructions */}
                    {order.special_instructions && (
                        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3">
                            <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                                <span>📝</span>
                                Additional Instructions
                            </p>
                            <p className="mt-1 whitespace-pre-line text-xs text-amber-900">
                                {order.special_instructions}
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                        <div className="rounded bg-yellow-50 p-2 text-xs text-yellow-800 border border-yellow-200">
                            📝 {order.notes}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-1">
                        {can('update kitchen') && column === 'new' && (
                            <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40"
                                onClick={() => acceptOrderAndOpenDialog(order)}
                                disabled={isProcessing}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Accept Order
                            </Button>
                        )}
                        {can('update kitchen') && column === 'preparing' && order.preparation_status === 'waiting' && (
                            <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40"
                                onClick={() => openPrepDialog(order)}
                                disabled={isProcessing}
                            >
                                <Play className="h-4 w-4 mr-1" />
                                Set Timer & Start
                            </Button>
                        )}
                        {can('update kitchen') && column === 'preparing' && order.preparation_status === 'preparing' && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                                        onClick={() => openAddTimeDialog(order)}
                                        disabled={isProcessing}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Time
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40"
                                        onClick={() => markReady(order)}
                                        disabled={isProcessing}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Mark Ready
                                    </Button>
                                </div>
                            </div>
                        )}
                        {can('update kitchen') && column === 'ready' && (
                            <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40"
                                onClick={() => completeOrder(order)}
                                disabled={isProcessing}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                            </Button>
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
        { title: 'New Orders', key: 'new', orders: filteredNew, color: 'blue', icon: Bell },
        { title: 'Preparing', key: 'preparing', orders: filteredPreparing, color: 'orange', icon: ChefHat },
        { title: 'Ready', key: 'ready', orders: filteredReady, color: 'green', icon: CheckCircle2 },
        { title: 'Completed', key: 'completed', orders: filteredCompleted, color: 'gray', icon: Clock },
    ];

    // Calculate the estimated time for the dialog order
    const dialogEstimatedTime = prepDialog?.estimated_minutes
        ? roundToNearest5(prepDialog.estimated_minutes)
        : null;

    return (
        <>
            <Head title="Kitchen Dashboard" />

            {/* New Order Alert Banner */}
            {newOrderAlert && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-center py-3 animate-bounce">
                    <Bell className="h-5 w-5 inline mr-2" />
                    <span className="font-bold">🔔 New Order Received!</span>
                </div>
            )}

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <ChefHat className="h-7 w-7 text-orange-500" />
                            Kitchen Dashboard
                        </h1>
                        <p className="text-sm text-gray-500">Manage and track customer orders in real time.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload()}
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'New Orders', value: stats.new_orders, color: 'bg-blue-500', icon: Bell },
                        { label: 'Preparing', value: stats.preparing, color: 'bg-orange-500', icon: ChefHat },
                        { label: 'Ready', value: stats.ready, color: 'bg-green-600', icon: CheckCircle2 },
                        { label: 'Completed', value: stats.completed, color: 'bg-gray-500', icon: Clock },
                    ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} className="overflow-hidden">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className={`rounded-lg ${stat.color} p-2.5`}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                                        <p className="text-xl font-black">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Search & Filter */}
                <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            placeholder="Search Order ID, Table #, or Customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {['all', 'new', 'preparing', 'ready', 'completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilterStatus(f)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                                    filterStatus === f
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 overflow-auto">
                    {columns.map((col) => {
                        if (filterStatus !== 'all' && filterStatus !== col.key) return null;
                        const Icon = col.icon;
                        return (
                            <div key={col.key} className="flex flex-col gap-3 min-h-[300px]">
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${col.color === 'blue' ? 'text-blue-500' : col.color === 'orange' ? 'text-orange-500' : col.color === 'green' ? 'text-green-600' : 'text-gray-500'}`} />
                                        <h3 className="text-sm font-bold text-gray-900">{col.title}</h3>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {col.orders.length}
                                    </Badge>
                                </div>

                                {/* Order Cards */}
                                <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                                    {col.orders.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                                            <div className="rounded-full bg-gray-50 p-3 mb-2">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-medium">No orders</p>
                                        </div>
                                    ) : (
                                        col.orders.map((order) => renderOrderCard(order, col.key))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Preparation Timer Dialog */}
            <Dialog open={!!prepDialog} onOpenChange={(open) => !open && setPrepDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Timer className="h-5 w-5 text-orange-500" />
                            Preparation Time
                        </DialogTitle>
                        <DialogDescription>
                            {isTimerLocked
                                ? `Timer running for ${prepDialog?.order_number}`
                                : `Set preparation time for ${prepDialog?.order_number}`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {prepDialog && (
                        <div className="py-4 space-y-5">
                            {/* Order Items Summary */}
                            <div className="rounded-lg bg-orange-50 p-3">
                                <p className="text-sm font-medium text-orange-900">Order Items</p>
                                {prepDialog.order_items?.slice(0, 3).map((item) => (
                                    <p key={item.id} className="text-xs text-orange-700 mt-1">
                                        {item.menu_item?.name || 'Item'} × {item.quantity}
                                    </p>
                                ))}
                                {prepDialog.order_items && prepDialog.order_items.length > 3 && (
                                    <p className="text-xs text-orange-500 mt-1">
                                        +{prepDialog.order_items.length - 3} more items
                                    </p>
                                )}
                            </div>

                            {/* Special Instructions */}
                            {prepDialog.special_instructions && (
                                <div className="rounded-lg bg-amber-50 border border-amber-300 p-3">
                                    <p className="text-sm font-bold text-amber-800 flex items-center gap-1">
                                        <span>📝</span>
                                        Additional Instructions
                                    </p>
                                    <p className="mt-1 whitespace-pre-line text-sm text-amber-900">
                                        {prepDialog.special_instructions}
                                    </p>
                                </div>
                            )}

                            {/* Estimated Time Display */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span>
                                    Estimated: <strong className="text-orange-700">{dialogEstimatedTime || prepTime} Minutes</strong>
                                </span>
                            </div>

                            {/* Time Selection Chips - Two Rows, Horizontally Scrollable */}
                            {!isTimerLocked ? (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">Select Time</p>
                                    <div className="flex flex-col gap-2">
                                        {/* Row 1: 5, 10, 15, 20, 25, 30 */}
                                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                            {TIME_ROW_1.map((time) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => handleTimeSelect(prepDialog, time)}
                                                    className={`flex-shrink-0 min-w-[3.5rem] px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150 ${
                                                        prepTime === time
                                                            ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300 scale-105'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                                                    }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Row 2: 35, 40, 45, 50, 55, 60 */}
                                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                            {TIME_ROW_2.map((time) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => handleTimeSelect(prepDialog, time)}
                                                    className={`flex-shrink-0 min-w-[3.5rem] px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150 ${
                                                        prepTime === time
                                                            ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300 scale-105'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                                                    }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Timer Locked View - Show locked time and countdown */
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-center">
                                        <p className="text-sm text-gray-500 font-medium">Preparation Time</p>
                                        <p className="text-2xl font-black text-orange-600">{prepTime} Minutes</p>
                                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-200 px-3 py-1 text-xs font-bold text-orange-700">
                                            <Timer className="h-3 w-3" />
                                            Locked
                                        </div>
                                    </div>

                                    {/* Live Countdown in Dialog */}
                                    {dialogTimerSeconds !== null && (
                                        <div className="rounded-lg bg-orange-100 p-4 text-center">
                                            <p className="text-sm text-gray-500 font-medium">Remaining Time</p>
                                            <p className={`font-mono text-3xl font-black ${
                                                dialogTimerSeconds < 120 ? 'text-red-500 animate-pulse' : 'text-orange-600'
                                            }`}>
                                                {formatTime(dialogTimerSeconds)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected Time Display */}
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Preparation Time</p>
                                <p className="text-2xl font-black text-orange-600">{prepTime} Minutes</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPrepDialog(null);
                                setIsTimerLocked(false);
                                setDialogTimerSeconds(null);
                                if (dialogTimerRef.current) {
                                    clearInterval(dialogTimerRef.current);
                                    dialogTimerRef.current = null;
                                }
                            }}
                            disabled={isProcessing}
                        >
                            {isTimerLocked ? 'Close' : 'Cancel'}
                        </Button>
                        {!isTimerLocked && (
                            <Button
                                onClick={startPreparation}
                                disabled={isProcessing || !prepTime}
                                className="min-w-[140px]"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</>
                                ) : (
                                    <><Play className="h-4 w-4 mr-2" /> Start Preparation</>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Additional Time Dialog */}
            <Dialog open={!!addTimeDialog} onOpenChange={(open) => !open && setAddTimeDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-orange-500" />
                            Add Preparation Time
                        </DialogTitle>
                        <DialogDescription>
                            Add additional time for order {addTimeDialog?.order_number}. The customer's remaining time and progress bar will update automatically.
                        </DialogDescription>
                    </DialogHeader>

                    {addTimeDialog && (
                        <div className="py-4 space-y-5">
                            {/* Current Total Time Display */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <Timer className="h-4 w-4 text-orange-500" />
                                <span>
                                    Current Total:{' '}
                                    <strong className="text-orange-700">
                                        {addTimeDialog.preparation_time || addTimeDialog.estimated_minutes || 0} Minutes
                                    </strong>
                                </span>
                            </div>

                            {/* Quick Add Options */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Add Time</p>
                                <div className="flex gap-2 flex-wrap">
                                    {[5, 10, 15, 20, 30].map((minutes) => (
                                        <button
                                            key={minutes}
                                            type="button"
                                            onClick={() => setAddTimeValue(minutes)}
                                            className={`flex-shrink-0 min-w-[3.5rem] px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150 ${
                                                addTimeValue === minutes
                                                    ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300 scale-105'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                                            }`}
                                        >
                                            +{minutes} min
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Minutes Input */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Custom Minutes
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={addTimeValue}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val >= 1 && val <= 120) {
                                            setAddTimeValue(val);
                                        }
                                    }}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Enter minutes (1-120)"
                                />
                            </div>

                            {/* New Total Preview */}
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                <p className="text-xs text-amber-700 font-semibold">
                                    New Total:{' '}
                                    <strong className="text-amber-900">
                                        {(addTimeDialog.preparation_time || addTimeDialog.estimated_minutes || 0) + addTimeValue} Minutes
                                    </strong>
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setAddTimeDialog(null)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitAddTime}
                            disabled={isProcessing || !addTimeValue || addTimeValue <= 0}
                            className="min-w-[140px]"
                        >
                            {isProcessing ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
                            ) : (
                                <><Plus className="h-4 w-4 mr-2" /> Add Time</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

KitchenDashboard.layout = {
    breadcrumbs: [
        { title: 'Kitchen Dashboard', href: '/kitchen/dashboard' },
    ],
};
