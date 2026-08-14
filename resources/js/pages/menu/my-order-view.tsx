import { Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Copy,
    Receipt,
    Star,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FeedbackModal } from '@/components/feedback-modal';
import { ReceiptModal } from '@/components/receipt-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
    status: string;
};

type Receipt = {
    id: number;
    receipt_number: string;
    transaction_number: string | null;
    payment_method: string | null;
    amount: string;
    subtotal: string;
    tax: string;
    service_charge: string;
    discount: string;
    generated_at: string | null;
};

type Payment = {
    id: number;
    payment_method: string | null;
    payment_status: string;
    verified_at: string | null;
    paid_at: string | null;
    verifier: { id: number; name: string } | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_submitted_at: string | null;
    total_amount: string;
    customer_name: string | null;
    estimated_minutes: number | null;
    queue_estimated_minutes: number | null;
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    special_instructions: string | null;
    table_id: number;
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
    table: RestaurantTable;
    receipt: Receipt | null;
    payment: Payment | null;
    feedback: {
        id: number;
        overall_rating: number;
        comment: string | null;
        anonymous: boolean;
        created_at: string;
    } | null;
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
    orders?: Order[];
    menuPath: string;
};

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────

/**
 * Build a compact order name from the actual menu item names.
 *  - 1 item  → "Burger"
 *  - 2 items → "Burger and Juice"
 *  - 3+ items → "Burger, French Fries, and Juice"
 */
function getOrderName(order: Order): string {
    const names = order.order_items
        .map((item) => item.menu_item.name)
        .filter(Boolean);

    if (names.length === 0) {
        return 'Order';
    }

    if (names.length === 1) {
        return names[0];
    }

    if (names.length === 2) {
        return `${names[0]} and ${names[1]}`;
    }

    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/**
 * Compute the progress percentage for a single order using the
 * *existing* order-progress logic:
 *  - ready / served / completed → 100%
 *  - no preparation_started_at or preparation_time → 0%
 *  - otherwise → elapsed / total * 100  (live countdown)
 */
function calculateOrderProgress(
    order: Order,
    now: number,
): { progress: number; remaining: number | null } {
    if (['ready', 'served', 'completed'].includes(order.status)) {
        return { progress: 100, remaining: 0 };
    }

    if (!order.preparation_started_at || !order.preparation_time) {
        return { progress: 0, remaining: null };
    }

    const startedAt = new Date(order.preparation_started_at).getTime();
    const elapsed = Math.floor((now - startedAt) / 1000);
    const total = order.preparation_time * 60;
    const remaining = Math.max(0, total - elapsed);
    const progress = Math.min(100, Math.round((elapsed / total) * 100));

    return { progress, remaining };
}

// Status color for the status badge (kept for card & detail status display)
function getStatusColor(status: string): string {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500';
        case 'confirmed':
            return 'bg-blue-500';
        case 'preparing':
            return 'bg-red-500';
        case 'ready':
            return 'bg-purple-500';
        case 'served':
            return 'bg-teal-500';
        case 'completed':
            return 'bg-green-500';
        case 'cancelled':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
}

function getStatusEmoji(status: string): string {
    switch (status) {
        case 'pending':
            return '⏳';
        case 'preparing':
            return '🍳';
        case 'ready':
            return '✅';
        case 'served':
            return '🍽️';
        case 'completed':
            return '🎉';
        case 'cancelled':
            return '❌';
        default:
            return '📋';
    }
}

function formatDateTime(dateString: string): string {
    const date = new Date(dateString);

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatTimeOnly(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

// Single consistent progress-bar colour used for *every* order.
// Only the width changes — never the colour.
const PROGRESS_COLOR = 'bg-red-500';
const PROGRESS_BG = 'bg-red-100';

function ProgressBar({ percentage }: { percentage: number }) {
    return (
        <div
            className={`h-4 w-full rounded-full ${PROGRESS_BG} overflow-hidden`}
        >
            <div
                className={`h-full rounded-full ${PROGRESS_COLOR} transition-all duration-1000 ease-linear`}
                style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
            />
        </div>
    );
}

// Payment method account numbers
const paymentAccounts: Record<
    string,
    { label: string; number: string; icon: string }
> = {
    telebirr: { label: 'Telebirr', number: '0987574556', icon: '📱' },
    cbe_birr: { label: 'CBE Birr', number: '1000976545673', icon: '🏦' },
};

export default function MyOrderView({
    table,
    order,
    orders = [],
    menuPath,
}: Props) {
    // ── Order-level state ──
    // Track progress and completion independently for every order.
    const [progressMap, setProgressMap] = useState<Record<number, number>>({});

    // Which order's View Details is expanded (null = none).
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    // Payment workflow — keyed to whichever order the customer is paying for.
    const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
        string | null
    >(null);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    // Cancel workflow
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(
        null,
    );

    // Receipt / Feedback
    const [showReceipt, setShowReceipt] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    // Refs for change-detection notifications
    const prevPrepTimeRef = useRef<Record<number, number>>({});
    const prevPaymentStatusRef = useRef<Record<number, string>>({});
    const prevOrderStatusRef = useRef<Record<number, string>>({});

    // ── Effects ─────────────────────────────────────────────

    // Live, per-order progress + countdown (1 s interval).
    // Reuses the existing elapsed/total calculation so there are no
    // conflicting progress numbers — only the width of each bar changes.
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const nextProgress: Record<number, number> = {};

            orders.forEach((o) => {
                const { progress } = calculateOrderProgress(o, now);
                nextProgress[o.id] = progress;
            });

            setProgressMap(nextProgress);
        }, 1000);

        return () => clearInterval(interval);
    }, [orders]);

    // Poll for order updates every 2 seconds for real-time sync.
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['order', 'orders'] });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Detect when the chef adds additional preparation time.
    useEffect(() => {
        orders.forEach((o) => {
            const currentPrepTime = o.preparation_time;
            const prev = prevPrepTimeRef.current[o.id];

            if (
                prev !== undefined &&
                currentPrepTime !== null &&
                currentPrepTime > prev &&
                o.status === 'preparing'
            ) {
                const addedMinutes = currentPrepTime - prev;
                toast.info(
                    `Order ${o.order_number}: Preparation time updated. Approximately ${addedMinutes} additional minutes.`,
                    { duration: 5000 },
                );
            }

            prevPrepTimeRef.current[o.id] = currentPrepTime ?? 0;
        });
    }, [orders]);

    // Detect when an order becomes ready and notify the customer.
    useEffect(() => {
        orders.forEach((o) => {
            const prevStatus = prevOrderStatusRef.current[o.id];
            const currentStatus = o.status;

            if (
                prevStatus &&
                prevStatus !== 'ready' &&
                currentStatus === 'ready'
            ) {
                toast.success(`Order ${o.order_number} is ready!`, {
                    duration: 5000,
                });
            }

            prevOrderStatusRef.current[o.id] = currentStatus;
        });
    }, [orders]);

    // Detect when payment is verified and a receipt is generated.
    useEffect(() => {
        orders.forEach((o) => {
            const currentStatus = o.payment_status;
            const hasReceipt = !!o.receipt;
            const prev = prevPaymentStatusRef.current[o.id];

            if (prev === 'pending' && currentStatus === 'paid' && hasReceipt) {
                toast.success(
                    `Payment verified for ${o.order_number}. Your receipt is ready.`,
                    { duration: 5000 },
                );
                setPaymentOrder(o);
                setShowReceipt(true);
            }

            prevPaymentStatusRef.current[o.id] = currentStatus;
        });
    }, [orders]);

    // ── Handlers ────────────────────────────────────────────

    const hasVerificationBeenSent =
        paymentOrder?.payment_status === 'pending' || verificationSent;

    const openPaymentModal = (targetOrder: Order, method: string) => {
        setPaymentOrder(targetOrder);
        setSelectedPaymentMethod(method);
        setVerificationSent(false);
        setShowPaymentModal(true);
    };

    const handleCopyAndVerify = async () => {
        if (!paymentOrder || !selectedPaymentMethod) {
            return;
        }

        if (hasVerificationBeenSent) {
            toast.info('A payment verification request has already been sent.');

            return;
        }

        setIsSendingVerification(true);
        const accountNumber = paymentAccounts[selectedPaymentMethod].number;
        let copySuccess = false;

        // Step 1: Copy account number to clipboard
        try {
            await navigator.clipboard.writeText(accountNumber);
            toast.success('✓ Account number copied successfully.');
            copySuccess = true;
        } catch {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = accountNumber;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                toast.success('✓ Account number copied successfully.');
                copySuccess = true;
            } catch {
                toast.error(
                    'Unable to copy the account number. Please copy it manually.',
                );
            }
        }

        // Step 2: Submit verification request
        router.post(
            `/orders/${paymentOrder.id}/payment`,
            {
                payment_method: selectedPaymentMethod,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSendingVerification(false);
                    setVerificationSent(true);
                    setShowPaymentModal(false);
                    toast.success(
                        'Account number copied successfully.\n\nYour payment verification request has been sent.\n\nPlease complete your payment using the copied account number.\n\nThe restaurant will verify your payment shortly.',
                        { duration: 8000 },
                    );
                },
                onError: () => {
                    setIsSendingVerification(false);

                    if (copySuccess) {
                        toast.error(
                            'Account number copied, but the verification request could not be sent. Please try again.',
                        );
                    } else {
                        toast.error(
                            'Unable to copy the account number. Please copy it manually.',
                        );
                    }
                },
            },
        );
    };

    const cancelOrder = (targetOrder: Order) => {
        if (
            !confirm(
                `Are you sure you want to cancel order ${targetOrder.order_number}?`,
            )
        ) {
            return;
        }

        setCancellingOrderId(targetOrder.id);

        router.post(
            `/api/orders/${targetOrder.id}/cancel`,
            {},
            {
                onSuccess: () => {
                    setCancellingOrderId(null);
                    toast.success('Order cancelled successfully.');
                },
                onError: () => {
                    setCancellingOrderId(null);
                    toast.error('Failed to cancel order.');
                },
            },
        );
    };

    // ── Derived values ──────────────────────────────────────

    // The most-recent order drives the "+ Add Order" / "+ New Order" button.
    const latestOrder = orders[0] ?? order ?? null;

    const canAddToOrder = latestOrder
        ? ['pending', 'received', 'confirmed'].includes(latestOrder.status)
        : false;

    const showOrderActionButton =
        latestOrder && latestOrder.status !== 'cancelled';

    const orderActionHref =
        canAddToOrder && latestOrder
            ? `${menuPath}?table=${table.table_number}&order_id=${latestOrder.id}`
            : `${menuPath}?table=${table.table_number}`;

    const orderActionLabel = canAddToOrder ? '+ Add Order' : '+ New Order';

    const totalAmount = (o: Order) => Number(o.total_amount ?? 0);
    const subtotalOf = (o: Order) =>
        o.order_items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0,
        );

    // ── Render helpers ──────────────────────────────────────

    const renderPaymentStatus = (status: 'unpaid' | 'pending' | 'paid') => {
        if (status === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                    <CheckCircle2 className="size-3" />
                    Paid
                </span>
            );
        }

        if (status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
                    Pending Verification
                </span>
            );
        }

        return <span className="font-bold text-red-600">Unpaid</span>;
    };

    // ── Main render ─────────────────────────────────────────

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
                    {/* Restaurant Logo */}
                    <Link href={menuPath} className="group">
                        <h1 className="text-2xl font-black tracking-tight transition group-hover:text-red-600">
                            DINE<span className="text-red-500">.</span>
                        </h1>
                        <p className="text-xs font-medium tracking-widest text-gray-500 uppercase">
                            Digital Menu
                        </p>
                    </Link>

                    {/* Table Information + Menu Button */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            <div className="flex items-center gap-3 rounded-full bg-red-50 px-4 py-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                                    {table.table_number}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-xs text-gray-500">
                                        Your table
                                    </p>
                                    <p className="text-sm font-bold">
                                        Table {table.table_number}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button size="sm" variant="outline" asChild>
                            <Link href={menuPath}>Menu</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* ================= MAIN ================= */}
            <main className="mx-auto max-w-3xl px-5 py-12">
                {/* Page Header */}
                <div className="mb-10 text-center">
                    <p className="font-semibold tracking-widest text-red-500 uppercase">
                        Order Tracking
                    </p>
                    <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                        My Orders
                    </h1>
                    <p className="mt-3 text-gray-500">
                        Track your orders and enjoy your meal.
                    </p>
                </div>

                {/* ================= NO ORDER ================= */}
                {orders.length === 0 && (
                    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl">
                            🍽️
                        </div>
                        <h2 className="mt-6 text-2xl font-black">
                            No Active Order
                        </h2>
                        <p className="mt-2 text-gray-500">
                            You don't have an active order yet.
                        </p>
                        <Link
                            href={`${menuPath}?table=${table.table_number}`}
                            className="mt-7 inline-block rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-7 py-4 font-bold text-white shadow-lg shadow-red-500/25 transition hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 active:scale-[0.98]"
                        >
                            Browse Menu →
                        </Link>
                    </div>
                )}

                {/* ================= ORDER CARDS ================= */}
                {orders.length > 0 && (
                    <div className="space-y-6">
                        {orders.map((o) => {
                            const progress = progressMap[o.id] ?? 0;
                            const isExpanded = expandedOrderId === o.id;
                            const isActive = ![
                                'completed',
                                'cancelled',
                                'served',
                            ].includes(o.status);
                            const isCompleted = o.status === 'completed';
                            const displayPrepTime =
                                o.preparation_time || o.estimated_minutes;
                            const queuePrepTime =
                                o.queue_estimated_minutes || displayPrepTime;
                            const expectedReadyTime =
                                o.preparation_started_at && o.preparation_time
                                    ? new Date(
                                          new Date(
                                              o.preparation_started_at,
                                          ).getTime() +
                                              o.preparation_time * 60 * 1000,
                                      )
                                    : o.queue_estimated_minutes
                                      ? new Date(
                                            new Date(o.created_at).getTime() +
                                                o.queue_estimated_minutes *
                                                    60 *
                                                    1000,
                                        )
                                      : o.estimated_minutes
                                        ? new Date(
                                              new Date(o.created_at).getTime() +
                                                  o.estimated_minutes *
                                                      60 *
                                                      1000,
                                          )
                                        : null;

                            const subtotal = subtotalOf(o);

                            return (
                                <div
                                    key={o.id}
                                    className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                                >
                                    {/* Card Header: order # + status */}
                                    <div className="p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase">
                                                    Order Number
                                                </p>
                                                <h2 className="mt-1 text-2xl font-black">
                                                    {o.order_number}
                                                </h2>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {formatDateTime(
                                                        o.created_at,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`h-3 w-3 rounded-full ${getStatusColor(o.status)}`}
                                                ></span>
                                                <span className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-black text-white capitalize">
                                                    {o.status}{' '}
                                                    {getStatusEmoji(o.status)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order Name — displayed before the progress bar */}
                                        <div className="mt-5">
                                            <p className="text-lg font-bold text-gray-800">
                                                {getOrderName(o)}
                                            </p>
                                            {o.special_instructions && (
                                                <p className="mt-1.5 text-xs break-words text-gray-500 italic">
                                                    {o.special_instructions}
                                                </p>
                                            )}
                                        </div>

                                        {/* Estimated Preparation Time - queue-based cumulative time */}
                                        {queuePrepTime && (
                                            <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="h-4 w-4 text-red-500" />
                                                <span>
                                                    <strong className="text-gray-700">
                                                        Estimated Wait:
                                                    </strong>{' '}
                                                    {queuePrepTime} minutes
                                                </span>
                                            </p>
                                        )}

                                        {/* Order Progress — simple bar, one consistent colour */}
                                        {(isActive || isCompleted) && (
                                            <div className="mt-5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-gray-500">
                                                        Order Progress
                                                    </p>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {progress}%
                                                    </span>
                                                </div>

                                                <div className="mt-2">
                                                    <ProgressBar
                                                        percentage={progress}
                                                    />
                                                </div>

                                                {progress >= 100 &&
                                                    [
                                                        'ready',
                                                        'served',
                                                    ].includes(o.status) && (
                                                        <p className="mt-2 text-sm font-bold text-green-600">
                                                            ✅ Your order is
                                                            ready!
                                                        </p>
                                                    )}

                                                {expectedReadyTime && (
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        Expected Ready:{' '}
                                                        <strong className="text-gray-700">
                                                            {formatTimeOnly(
                                                                expectedReadyTime,
                                                            )}
                                                        </strong>
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* View Details Button */}
                                        {!isExpanded && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedOrderId(o.id)
                                                }
                                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white px-6 py-3 font-black text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                                View Details
                                            </button>
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 bg-stone-50 p-6">
                                            {/* Order Info Grid */}
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                                                        Order Date/Time
                                                    </p>
                                                    <p className="mt-1 font-semibold">
                                                        {formatDateTime(
                                                            o.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                                                        Payment Status
                                                    </p>
                                                    <div className="mt-1">
                                                        {renderPaymentStatus(
                                                            o.payment_status,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="mt-6">
                                                <h3 className="text-lg font-black">
                                                    Order Items
                                                </h3>
                                                <div className="mt-3 space-y-2">
                                                    {o.order_items.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                                                            >
                                                                <div>
                                                                    <p className="font-bold">
                                                                        {
                                                                            item
                                                                                .menu_item
                                                                                .name
                                                                        }
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {
                                                                            item.quantity
                                                                        }{' '}
                                                                        ×{' '}
                                                                        {Number(
                                                                            item.price,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}{' '}
                                                                        ETB
                                                                    </p>
                                                                </div>
                                                                <p className="font-black whitespace-nowrap">
                                                                    {(
                                                                        Number(
                                                                            item.price,
                                                                        ) *
                                                                        item.quantity
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{' '}
                                                                    ETB
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {/* Subtotal / Total */}
                                            <div className="mt-5 space-y-1.5 border-t border-gray-200 pt-4 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">
                                                        Subtotal
                                                    </span>
                                                    <span className="font-semibold">
                                                        {subtotal.toFixed(2)}{' '}
                                                        ETB
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-lg font-black">
                                                    <span>Total</span>
                                                    <span className="text-red-500">
                                                        {totalAmount(o).toFixed(
                                                            2,
                                                        )}{' '}
                                                        ETB
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Special Instructions */}
                                            {o.special_instructions && (
                                                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                                                    <h3 className="flex items-center gap-2 text-sm font-bold text-red-800">
                                                        <span>📝</span>
                                                        Additional Instructions
                                                    </h3>
                                                    <p className="mt-2 text-sm whitespace-pre-line text-red-900">
                                                        {o.special_instructions}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Payment section for completed orders */}
                                            {isCompleted && (
                                                <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5">
                                                    <h3 className="text-lg font-black">
                                                        Payment
                                                    </h3>

                                                    {o.payment_status ===
                                                        'unpaid' && (
                                                        <>
                                                            <p className="mt-2 text-sm text-gray-600">
                                                                Your order is
                                                                completed.
                                                                Please choose a
                                                                payment method
                                                                to proceed.
                                                            </p>
                                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                                {Object.entries(
                                                                    paymentAccounts,
                                                                ).map(
                                                                    ([
                                                                        key,
                                                                        account,
                                                                    ]) => (
                                                                        <button
                                                                            key={
                                                                                key
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openPaymentModal(
                                                                                    o,
                                                                                    key,
                                                                                )
                                                                            }
                                                                            className="flex items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-red-300 hover:bg-red-50/50 active:scale-[0.98]"
                                                                        >
                                                                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-2xl">
                                                                                {
                                                                                    account.icon
                                                                                }
                                                                            </span>
                                                                            <div>
                                                                                <p className="font-black text-stone-800">
                                                                                    {
                                                                                        account.label
                                                                                    }
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    Pay
                                                                                    with{' '}
                                                                                    {
                                                                                        account.label
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </button>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </>
                                                    )}

                                                    {o.payment_status ===
                                                        'pending' && (
                                                        <div className="mt-4 rounded-2xl bg-yellow-100 p-4">
                                                            <p className="font-bold text-yellow-800">
                                                                Payment Pending
                                                                Verification
                                                            </p>
                                                            <p className="mt-1 text-sm text-yellow-700">
                                                                Your payment
                                                                verification
                                                                request has been
                                                                sent. Please
                                                                wait for the
                                                                restaurant to
                                                                verify your
                                                                payment.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {o.payment_status ===
                                                        'paid' && (
                                                        <div className="mt-4 rounded-2xl bg-green-100 p-4">
                                                            <p className="font-bold text-green-800">
                                                                Payment
                                                                Confirmed ✓
                                                            </p>
                                                            <p className="mt-1 text-sm text-green-700">
                                                                Your payment has
                                                                been
                                                                successfully
                                                                verified.
                                                            </p>

                                                            {o.receipt && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPaymentOrder(
                                                                            o,
                                                                        );
                                                                        setShowReceipt(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-black text-white shadow-lg shadow-green-600/25 transition hover:bg-green-700 active:scale-[0.98]"
                                                                >
                                                                    <Receipt className="size-4" />
                                                                    View Receipt
                                                                </button>
                                                            )}

                                                            {!o.feedback && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPaymentOrder(
                                                                            o,
                                                                        );
                                                                        setShowFeedbackModal(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-400 to-red-500 px-6 py-3 font-black text-white shadow-lg shadow-red-500/25 transition hover:from-red-500 hover:to-red-600 hover:shadow-xl hover:shadow-red-500/40 active:scale-[0.98]"
                                                                >
                                                                    <Star className="size-4 fill-red-200" />
                                                                    Rate Overall
                                                                    Service
                                                                </button>
                                                            )}

                                                            {o.feedback && (
                                                                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-3">
                                                                    <CheckCircle2 className="size-4 text-green-600" />
                                                                    <p className="text-sm font-bold text-green-700">
                                                                        You have
                                                                        already
                                                                        rated
                                                                        this
                                                                        order.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-6 flex flex-row gap-2 sm:gap-3">
                                                {/* Cancel button — only for active orders that aren't locked */}
                                                {!isCompleted &&
                                                    ![
                                                        'cancelled',
                                                        'served',
                                                    ].includes(o.status) &&
                                                    ![
                                                        'preparing',
                                                        'ready',
                                                    ].includes(o.status) && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                cancelOrder(o)
                                                            }
                                                            disabled={
                                                                cancellingOrderId ===
                                                                o.id
                                                            }
                                                            className="flex-1 rounded-xl border-2 border-red-200 bg-white px-4 py-2 text-center text-sm font-bold text-red-500 transition hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
                                                        >
                                                            {cancellingOrderId ===
                                                            o.id
                                                                ? 'Cancelling...'
                                                                : 'Cancel Order'}
                                                        </button>
                                                    )}

                                                {/* Hide Details Button */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedOrderId(
                                                            isExpanded
                                                                ? null
                                                                : o.id,
                                                        )
                                                    }
                                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                                                >
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                    Hide Details
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ================= ACTION BUTTONS ================= */}
                {orders.length > 0 && (
                    <div className="mt-10 space-y-3">
                        {/* Dynamic Order Button */}
                        {showOrderActionButton && (
                            <Link
                                key={orderActionLabel}
                                href={orderActionHref}
                                className="block w-full animate-in rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-center font-black text-white shadow-lg shadow-red-500/25 transition-all duration-300 fill-mode-both fade-in slide-in-from-bottom-2 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 active:scale-[0.98]"
                            >
                                {orderActionLabel}
                            </Link>
                        )}
                    </div>
                )}
            </main>

            {/* ================= PAYMENT METHOD MODAL ================= */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-sm gap-5 rounded-3xl p-6 sm:max-w-sm">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-center text-lg font-black">
                            Pay with{' '}
                            {selectedPaymentMethod
                                ? paymentAccounts[selectedPaymentMethod].label
                                : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Copy the account number below and complete your
                            payment.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPaymentMethod && (
                        <div className="space-y-5">
                            {/* Payment Method Icon & Name */}
                            <div className="flex flex-col items-center justify-center gap-2">
                                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
                                    {
                                        paymentAccounts[selectedPaymentMethod]
                                            .icon
                                    }
                                </span>
                                <p className="text-base font-black text-stone-800">
                                    {
                                        paymentAccounts[selectedPaymentMethod]
                                            .label
                                    }
                                </p>
                            </div>

                            {/* Account Number */}
                            <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50 p-4 text-center">
                                <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                                    Account Number
                                </p>
                                <p className="mt-2 font-mono text-xl font-black tracking-wider text-stone-900 select-all">
                                    {
                                        paymentAccounts[selectedPaymentMethod]
                                            .number
                                    }
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
                                <p className="text-sm font-semibold text-gray-500">
                                    Amount
                                </p>
                                <p className="text-lg font-black text-red-500">
                                    {totalAmount(
                                        paymentOrder ?? ({} as Order),
                                    ).toFixed(2)}{' '}
                                    ETB
                                </p>
                            </div>

                            {/* Copy & Send for Verification Button */}
                            <button
                                type="button"
                                onClick={handleCopyAndVerify}
                                disabled={
                                    isSendingVerification ||
                                    hasVerificationBeenSent
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3.5 font-black text-white shadow-lg shadow-red-500/25 transition hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 active:scale-[0.98] disabled:opacity-60"
                            >
                                {isSendingVerification ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Sending...
                                    </>
                                ) : hasVerificationBeenSent ? (
                                    <>
                                        <CheckCircle2 className="size-4" />✓
                                        Verification Requested
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        Copy & Send for Verification
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                After copying, make your payment using the
                                selected method.
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================= RECEIPT MODAL ================= */}
            <ReceiptModal
                open={showReceipt}
                onOpenChange={setShowReceipt}
                order={paymentOrder}
            />

            {/* ================= FEEDBACK MODAL ================= */}
            {paymentOrder && (
                <FeedbackModal
                    open={showFeedbackModal}
                    onOpenChange={setShowFeedbackModal}
                    onSubmitted={() => {
                        router.reload({ only: ['order', 'orders'] });
                    }}
                    order={paymentOrder}
                />
            )}

            {/* ================= FOOTER ================= */}
            <footer className="mt-12 border-t border-gray-200 bg-white">
                <div className="mx-auto max-w-5xl px-5 py-8 text-center">
                    <p className="font-black">
                        DINE<span className="text-red-500">.</span>
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        Thank you for dining with us.
                    </p>
                </div>
            </footer>
        </div>
    );
}
