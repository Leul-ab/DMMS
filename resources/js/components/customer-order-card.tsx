import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    Info,
    Loader2,
    Package,
    Receipt,
    Star,
    Utensils,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FeedbackModal } from '@/components/feedback-modal';
import { OrderProgressBar } from '@/components/order-progress-bar';
import { ReceiptModal } from '@/components/receipt-modal';

type MenuItem = {
    id: number;
    name: string;
    image: string | null;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    status: string;
    notes: string | null;
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

type Customer = {
    id: number;
    name: string;
    customer_code: string;
    phone: string | null;
    email: string | null;
};

type Branch = {
    id: number;
    name: string;
};

/**
 * Summary type — what the My Orders page initially receives.
 * This is intentionally lightweight: no order items, payment,
 * receipt, feedback, or customer relationships are loaded until
 * the user clicks "View Details".
 */
export type CustomerOrderSummary = {
    id: number;
    order_number: string;
    status: string;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_submitted_at: string | null;
    total_amount: string;
    customer_name: string | null;
    estimated_minutes: number | null;
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    special_instructions: string | null;
    table_id: number;
    branch_id: number | null;
    customer_id: number | null;
    created_at: string;
    updated_at: string;
    table: RestaurantTable;
};

/**
 * Full order details — returned by the /api/orders/{order}/details endpoint
 * only when the customer expands an order.
 */
export type CustomerOrderDetails = CustomerOrderSummary & {
    order_items: OrderItem[];
    receipt: Receipt | null;
    payment: Payment | null;
    customer: Customer | null;
    branch: Branch | null;
    feedback: {
        id: number;
        overall_rating: number;
        comment: string | null;
        anonymous: boolean;
        created_at: string;
    } | null;
};

type Props = {
    order: CustomerOrderSummary;
    isExpanded: boolean;
    onToggle: () => void;
    onDetailsLoaded: (orderId: number, details: CustomerOrderDetails) => void;
    onFeedbackSubmitted: () => void;
};

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
};

function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Compact friendly date/time for the collapsed card summary.
 * Shows "Today, 8:15 PM" or "Yesterday, 7:45 PM", otherwise a short date.
 */
function formatOrderDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayDiff = Math.round((startOfToday - startOfDay) / 86400000);

    const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    if (dayDiff === 0) {
        return `Today, ${time}`;
    }

    if (dayDiff === 1) {
        return `Yesterday, ${time}`;
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function getStatusBadge(status: string): { label: string; className: string } {
    switch (status) {
        case 'pending':
        case 'received':
            return { label: 'Pending', className: 'bg-red-50 text-red-700 border-red-200' };
        case 'confirmed':
            return { label: 'Confirmed', className: 'bg-green-50 text-green-700 border-green-200' };
        case 'preparing':
            return { label: 'Preparing', className: 'bg-green-50 text-green-700 border-green-200' };
        case 'ready':
        case 'served':
            return { label: 'Ready', className: 'bg-green-100 text-green-800 border-green-300' };
        case 'completed':
            return { label: 'Completed', className: 'bg-green-500 text-white border-green-600' };
        case 'cancelled':
            return { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-300' };
        default:
            return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
}

export function CustomerOrderCard({ order, isExpanded, onToggle, onDetailsLoaded, onFeedbackSubmitted }: Props) {
    const [details, setDetails] = useState<CustomerOrderDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const loadedOrderVersionRef = useRef<string | null>(null);

    const statusBadge = getStatusBadge(order.status);
    const isCompleted = order.status === 'completed';
    const isCancelled = order.status === 'cancelled';
    const isPaid = order.payment_status === 'paid';

    // Fetch full order details only when the card is expanded.
    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        // Re-fetch when the summary changes so expanded payment, status, and
        // feedback details stay in sync with the page's real-time refresh.
        const orderVersion = `${order.id}:${order.updated_at}`;

        if (loadedOrderVersionRef.current === orderVersion && details) {
            return;
        }

        loadedOrderVersionRef.current = orderVersion;
        setIsLoadingDetails(true);
        setLoadError(null);

        fetch(`/api/orders/${order.id}/details`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load order details.');
                }

                return response.json();
            })
            .then((data) => {
                const fullDetails = data.order as CustomerOrderDetails;
                setDetails(fullDetails);
                setIsLoadingDetails(false);
                onDetailsLoaded(order.id, fullDetails);
            })
            .catch(() => {
                setIsLoadingDetails(false);
                setLoadError('Unable to load order details. Please try again.');
            });
    }, [isExpanded, order.id, details, onDetailsLoaded]);

    // Measure content height for smooth expand/collapse
    useEffect(() => {
        if (isExpanded && contentRef.current) {
            // Slight delay so the content is rendered before measuring.
            const timer = setTimeout(() => {
                if (contentRef.current) {
                    setContentHeight(contentRef.current.scrollHeight);
                }
            }, 50);

            return () => clearTimeout(timer);
        }

        setContentHeight(0);
    }, [isExpanded, details, isLoadingDetails, loadError]);

    const isPaidFull = details?.payment_status === 'paid' || isPaid;
    const canRate = isCompleted && isPaidFull;

    const subtotal = details?.order_items?.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
    ) ?? 0;
    const tax = details?.receipt ? Number(details.receipt.tax || 0) : 0;
    const serviceCharge = details?.receipt ? Number(details.receipt.service_charge || 0) : 0;
    const discount = details?.receipt ? Number(details.receipt.discount || 0) : 0;
    const grandTotal = Number(order.total_amount || 0);

    return (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
            {/* ================= ORDER SUMMARY (Always Visible) ================= */}
            <div className="p-5 sm:p-6">
                {/* Top Row: Order Number + Status */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            Order Number
                        </p>
                        <h3 className="mt-1 text-xl font-black text-gray-900">
                            {order.order_number}
                        </h3>
                    </div>

                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusBadge.className}`}
                    >
                        {isCancelled ? (
                            <XCircle className="h-3.5 w-3.5" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                            <Clock className="h-3.5 w-3.5" />
                        )}
                        {statusBadge.label}
                    </span>
                </div>

                {/* Order Date & Time (compact, friendly format) */}
                <p className="mt-2 text-sm text-gray-500">
                    {formatOrderDateTime(order.created_at)}
                </p>

                {/* ===== Progress Section (Always Visible) ===== */}
                <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                    <OrderProgressBar
                        status={order.status}
                        preparationStartedAt={order.preparation_started_at}
                        preparationTime={order.preparation_time}
                        estimatedMinutes={order.estimated_minutes}
                        size="sm"
                    />
                </div>

                {/* View Details Button */}
                <button
                    type="button"
                    onClick={onToggle}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-white px-4 py-2.5 text-sm font-bold text-green-600 transition-all duration-200 hover:bg-green-600 hover:text-white active:scale-[0.98]"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4" />
                            Hide Details
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4" />
                            View Details
                        </>
                    )}
                </button>
            </div>

            {/* ================= EXPANDABLE DETAILS ================= */}
            <div
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
            >
                <div ref={contentRef} className="border-t border-gray-100 bg-white">
                    <div className="space-y-6 p-5 sm:p-6">
                        {isLoadingDetails && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                                <p className="mt-3 text-sm font-semibold text-gray-500">
                                    Loading order details...
                                </p>
                            </div>
                        )}

                        {loadError && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <XCircle className="h-8 w-8 text-red-500" />
                                <p className="mt-3 text-sm font-semibold text-red-600">{loadError}</p>
                            </div>
                        )}

                        {details && !isLoadingDetails && !loadError && (
                            <>
                                {/* ===== 1. Order Information ===== */}
                                <section>
                                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                        <Info className="h-4 w-4 text-green-600" />
                                        Order Information
                                    </h4>
                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Order Number</p>
                                            <p className="mt-0.5 font-bold text-gray-900">{details.order_number}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Order Date & Time</p>
                                            <p className="mt-0.5 font-bold text-gray-900">{formatDateTime(details.created_at)}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Customer Name</p>
                                            <p className="mt-0.5 font-bold text-gray-900">
                                                {details.customer?.name || details.customer_name || 'Walk-in'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Customer Code</p>
                                            <p className="mt-0.5 font-mono font-bold text-gray-900">
                                                {details.customer?.customer_code || '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Table Number</p>
                                            <p className="mt-0.5 font-bold text-gray-900">Table {details.table.table_number}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Branch</p>
                                            <p className="mt-0.5 font-bold text-gray-900">{details.branch?.name || '—'}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Order Status</p>
                                            <p className="mt-0.5 font-bold capitalize text-gray-900">{details.status}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Payment Status</p>
                                            <p className="mt-0.5 font-bold capitalize text-gray-900">{details.payment_status}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* ===== 2. Ordered Items ===== */}
                                <section>
                                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                        <Package className="h-4 w-4 text-green-600" />
                                        Ordered Items
                                    </h4>
                                    <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full min-w-[600px] text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                    <th className="px-4 py-3">Item</th>
                                                    <th className="px-4 py-3 text-center">Qty</th>
                                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                                    <th className="px-4 py-3">Special Instructions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {details.order_items.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {item.menu_item.image ? (
                                                                    <img
                                                                        src={`/storage/${item.menu_item.image}`}
                                                                        alt={item.menu_item.name}
                                                                        className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                                                        <Utensils className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                                <span className="font-semibold text-gray-900">
                                                                    {item.menu_item.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right text-gray-600">
                                                            {Number(item.price).toFixed(2)} ETB
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                            {(Number(item.price) * item.quantity).toFixed(2)} ETB
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500">
                                                            {item.notes || 'No special instructions.'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* ===== 3. Order Summary ===== */}
                                <section>
                                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                        <Receipt className="h-4 w-4 text-green-600" />
                                        Order Summary
                                    </h4>
                                    <div className="mt-3 space-y-2 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-semibold text-gray-900">{subtotal.toFixed(2)} ETB</span>
                                        </div>
                                        {tax > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Tax</span>
                                                <span className="font-semibold text-gray-900">{tax.toFixed(2)} ETB</span>
                                            </div>
                                        )}
                                        {serviceCharge > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Service Charge</span>
                                                <span className="font-semibold text-gray-900">{serviceCharge.toFixed(2)} ETB</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Discount</span>
                                                <span className="font-semibold text-green-600">-{discount.toFixed(2)} ETB</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                                            <span className="font-black text-gray-900">Grand Total</span>
                                            <span className="text-lg font-black text-gray-900">{grandTotal.toFixed(2)} ETB</span>
                                        </div>
                                    </div>
                                </section>

                                {/* ===== 4. Detailed Order Progress ===== */}
                                <section>
                                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                        <Clock className="h-4 w-4 text-green-600" />
                                        Detailed Order Progress
                                    </h4>
                                    <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                                        <OrderProgressBar
                                            status={details.status}
                                            preparationStartedAt={details.preparation_started_at}
                                            preparationTime={details.preparation_time}
                                            estimatedMinutes={details.estimated_minutes}
                                            size="lg"
                                        />
                                    </div>
                                </section>

                                {/* ===== 5. Payment Information ===== */}
                                <section>
                                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                        <CreditCard className="h-4 w-4 text-green-600" />
                                        Payment Information
                                    </h4>
                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Payment Method</p>
                                            <p className="mt-0.5 font-bold capitalize text-gray-900">
                                                {details.payment?.payment_method
                                                    ? (paymentMethodLabels[details.payment.payment_method] || details.payment.payment_method)
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-semibold text-gray-400">Payment Status</p>
                                            <div className="mt-1">
                                                {isPaidFull ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Payment Confirmed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Waiting for Verification
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Receipt Button */}
                                    {isPaidFull && details.receipt && (
                                        <button
                                            type="button"
                                            onClick={() => setShowReceipt(true)}
                                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98]"
                                        >
                                            <Receipt className="h-4 w-4" />
                                            View Receipt
                                        </button>
                                    )}
                                </section>

                                {/* ===== 6. Customer Rating ===== */}
                                {canRate && (
                                    <section>
                                        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-500">
                                            <Star className="h-4 w-4 text-green-600" />
                                            Customer Rating
                                        </h4>
                                        <div className="mt-3">
                                            {!details.feedback ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowFeedbackModal(true)}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-white px-4 py-2.5 text-sm font-bold text-green-600 transition-all duration-200 hover:bg-green-600 hover:text-white active:scale-[0.98]"
                                                >
                                                    <Star className="h-4 w-4" />
                                                    Rate Service
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <p className="text-sm font-bold text-green-700">
                                                        You have already rated this order.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= RECEIPT MODAL ================= */}
            <ReceiptModal
                open={showReceipt}
                onOpenChange={setShowReceipt}
                order={details}
            />

            {/* ================= FEEDBACK MODAL ================= */}
            {details && (
                <FeedbackModal
                    open={showFeedbackModal}
                    onOpenChange={setShowFeedbackModal}
                    onSubmitted={onFeedbackSubmitted}
                    order={details}
                />
            )}
        </div>
    );
}
