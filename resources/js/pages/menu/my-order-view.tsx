import { Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FeedbackModal } from '@/components/feedback-modal';
import { MenuOrderCard } from '@/components/menu-order-card';
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

type Order = {
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

// Payment method account numbers
const paymentAccounts: Record<string, { label: string; number: string; icon: string }> = {
    telebirr: { label: 'Telebirr', number: '0987574556', icon: '📱' },
    cbe_birr: { label: 'CBE Birr', number: '1000976545673', icon: '🏦' },
};

export default function MyOrderView({
    table,
    order,
    orders = [],
    menuPath,
}: Props) {
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
    const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
    const prevOrderStatusRef = useRef<string | null>(null);
    const prevPaymentStatusRef = useRef<string | null>(null);

    // Poll for order updates every 2 seconds for real-time sync
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['order', 'orders'],
            });
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Detect when the order becomes ready and notify the customer.
    useEffect(() => {
        if (!order) {
            return;
        }

        const prevStatus = prevOrderStatusRef.current;
        const currentStatus = order.status;

        if (prevStatus && prevStatus !== 'ready' && currentStatus === 'ready') {
            toast.success('Your order is ready!', {
                duration: 5000,
            });
        }

        prevOrderStatusRef.current = currentStatus;
    }, [order?.status]);

    // Detect when payment is verified and a receipt is generated.
    useEffect(() => {
        if (!order) {
            return;
        }

        const currentStatus = order.payment_status;
        const hasReceipt = !!order.receipt;

        if (
            prevPaymentStatusRef.current === 'pending' &&
            currentStatus === 'paid' &&
            hasReceipt
        ) {
            toast.success('Payment verified successfully. Your receipt is ready.', {
                duration: 5000,
            });
            setReceiptOrder(order);
            setShowReceipt(true);
        }

        prevPaymentStatusRef.current = currentStatus;
    }, [order?.payment_status, order?.receipt]);

    // Check if a verification request has already been sent for this order
    const hasVerificationBeenSent = order?.payment_status === 'pending' || verificationSent;

    // Copy the account number AND submit the verification request
    const handleCopyAndVerify = async () => {
        if (!order || !selectedPaymentMethod) {
            return;
        }

        if (hasVerificationBeenSent) {
            toast.info('A payment verification request has already been sent.');

            return;
        }

        setIsSendingVerification(true);

        const accountNumber = paymentAccounts[selectedPaymentMethod].number;
        let copySuccess = false;

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
                toast.error('Unable to copy the account number. Please copy it manually.');
                copySuccess = false;
            }
        }

        router.post(
            `/orders/${order.id}/payment`,
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
                        { duration: 8000 }
                    );
                },
                onError: () => {
                    setIsSendingVerification(false);

                    if (copySuccess) {
                        toast.error('Account number copied, but the verification request could not be sent. Please try again.');
                    } else {
                        toast.error('Unable to copy the account number. Please copy it manually.');
                    }
                },
            }
        );
    };

    // Cancel order
    const cancelOrder = (orderToCancel: Order) => {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        setIsCancelling(true);

        router.post(
            `/api/orders/${orderToCancel.id}/cancel`,
            {},
            {
                onSuccess: () => {
                    setIsCancelling(false);
                    toast.success('Order cancelled successfully.');
                },
                onError: () => {
                    setIsCancelling(false);
                    toast.error('Failed to cancel order.');
                },
            }
        );
    };

    // Determine the order action button state based on the most recent order
    const canAddToOrder = order
        ? ['pending', 'received', 'confirmed'].includes(order.status)
        : false;

    const showOrderActionButton = order && order.status !== 'cancelled';

    const orderActionHref = canAddToOrder && order
        ? `${menuPath}?table=${table.table_number}&order_id=${order.id}`
        : `${menuPath}?table=${table.table_number}`;

    const orderActionLabel = canAddToOrder ? '+ Add Order' : '+ New Order';

    // All orders to display (newest first - already sorted by backend)
    const displayOrders = orders.length > 0 ? orders : (order ? [order] : []);

    const handleToggle = (orderId: number) => {
        setExpandedOrderId((current) => (current === orderId ? null : orderId));
    };

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">

            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">

                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">

                    {/* Restaurant Logo */}
                    <Link href={menuPath} className="group">
                        <h1 className="text-2xl font-black tracking-tight transition group-hover:text-orange-600">
                            DINE<span className="text-orange-500">.</span>
                        </h1>

                        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                            Digital Menu
                        </p>
                    </Link>

                    {/* Table Information */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 rounded-full bg-orange-50 px-4 py-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
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

                        <Link href={menuPath}>
                            <Button size="sm" className="rounded-full">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">Back to</span>
                                Menu
                            </Button>
                        </Link>
                    </div>

                </div>

            </header>

            {/* ================= MAIN ================= */}
            <main className="mx-auto max-w-3xl px-5 py-12">

                {/* Page Header */}
                <div className="mb-10 text-center">

                    <p className="font-semibold uppercase tracking-widest text-orange-500">
                        Order Tracking
                    </p>

                    <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                        My Order
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Track your order and enjoy your meal.
                    </p>

                </div>

                {/* ================= NO ORDER ================= */}
                {displayOrders.length === 0 && (
                    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
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
                            className="mt-7 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-4 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                        >
                            Browse Menu →
                        </Link>

                    </div>
                )}

                {/* ================= ORDER LIST ================= */}
                {displayOrders.length > 0 && (
                    <div className="space-y-5">

                        {displayOrders.map((orderItem) => (
                            <MenuOrderCard
                                key={orderItem.id}
                                order={orderItem}
                                isExpanded={expandedOrderId === orderItem.id}
                                onToggle={() => handleToggle(orderItem.id)}
                                onCancel={cancelOrder}
                                isCancelling={isCancelling}
                                onPaymentClick={(method) => {
                                    setSelectedPaymentMethod(method);
                                    setShowPaymentModal(true);
                                }}
                                onReceiptClick={(orderToShow) => {
                                    setReceiptOrder(orderToShow);
                                    setShowReceipt(true);
                                }}
                                onFeedbackClick={(orderToShow) => {
                                    setFeedbackOrder(orderToShow);
                                    setShowFeedbackModal(true);
                                }}
                            />
                        ))}

                        {/* ================= ACTION BUTTONS (Below Order List) ================= */}
                        <div className="space-y-3 pt-2">
                            {showOrderActionButton && (
                                <Link
                                    key={orderActionLabel}
                                    href={orderActionHref}
                                    className="block w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                                >
                                    {orderActionLabel}
                                </Link>
                            )}

                            <Link
                                href={`${menuPath}?table=${table.table_number}`}
                                className="block w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
                            >
                                ← Back to Menu
                            </Link>
                        </div>

                    </div>
                )}

            </main>

            {/* ================= PAYMENT METHOD MODAL ================= */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-sm gap-5 rounded-3xl p-6 sm:max-w-sm">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-center text-lg font-black">
                            Pay with {selectedPaymentMethod ? paymentAccounts[selectedPaymentMethod].label : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Copy the account number below and complete your payment.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPaymentMethod && (
                        <div className="space-y-5">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                                    {paymentAccounts[selectedPaymentMethod].icon}
                                </span>
                                <p className="text-base font-black text-stone-800">
                                    {paymentAccounts[selectedPaymentMethod].label}
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-4 text-center">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                    Account Number
                                </p>
                                <p className="mt-2 select-all font-mono text-xl font-black tracking-wider text-stone-900">
                                    {paymentAccounts[selectedPaymentMethod].number}
                                </p>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
                                <p className="text-sm font-semibold text-gray-500">
                                    Amount
                                </p>
                                <p className="text-lg font-black text-orange-500">
                                    {Number(order?.total_amount || 0).toFixed(2)} ETB
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopyAndVerify}
                                disabled={isSendingVerification || hasVerificationBeenSent}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98] disabled:opacity-60"
                            >
                                {isSendingVerification ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Sending...
                                    </>
                                ) : hasVerificationBeenSent ? (
                                    <>
                                        <CheckCircle2 className="size-4" />
                                        ✓ Verification Requested
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        Copy & Send for Verification
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                After copying, make your payment using the selected method.
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================= RECEIPT MODAL ================= */}
            <ReceiptModal
                open={showReceipt}
                onOpenChange={setShowReceipt}
                order={receiptOrder}
            />

            {/* ================= FEEDBACK MODAL ================= */}
            {feedbackOrder && (
                <FeedbackModal
                    open={showFeedbackModal}
                    onOpenChange={setShowFeedbackModal}
                    onSubmitted={() => {
                        router.reload({ only: ['order', 'orders'] });
                    }}
                    order={feedbackOrder}
                />
            )}

            {/* ================= FOOTER ================= */}
            <footer className="mt-12 border-t border-gray-200 bg-white">

                <div className="mx-auto max-w-5xl px-5 py-8 text-center">

                    <p className="font-black">
                        DINE<span className="text-orange-500">.</span>
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                        Thank you for dining with us.
                    </p>

                </div>

            </footer>

        </div>
    );
}
