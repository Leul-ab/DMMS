import { Head, router } from '@inertiajs/react';
import {
    Search,
    ShieldCheck,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    FileText,
    Hash,
    Phone,
    Smartphone,
    Landmark,
    Ban,
    Receipt,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { ReceiptModal } from '@/components/receipt-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCan } from '@/hooks/use-can';

type Payment = {
    id: number;
    payment_method: string | null;
    payment_status: string;
    amount: string;
    transaction_number: string | null;
    transaction_reference: string | null;
    verified_at: string | null;
    paid_at: string | null;
    cashier: { id: number; name: string } | null;
    verifier: { id: number; name: string } | null;
};

type ReceiptData = {
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

type ReceiptItem = {
    id: number;
    quantity: number;
    price: string;
    menu_item: {
        id: number;
        name: string;
    };
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: string;
    customer_name: string | null;
    customer_phone: string | null;
    created_at: string;
    table: { id: number; table_number: number } | null;
    customer: { id: number; name: string } | null;
    payment: Payment | null;
    receipt: ReceiptData | null;
    order_items: ReceiptItem[];
};

type PaginatedData = {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Stats = {
    pending: number;
    verified: number;
    rejected: number;
};

type Props = {
    orders: PaginatedData;
    stats: Stats;
    filters: {
        search?: string;
        payment_status?: string;
        payment_method?: string;
    };
};

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending Verification',
    paid: 'Verified',
    cancelled: 'Rejected',
};

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
    cash: <FileText className="size-4" />,
    telebirr: <Smartphone className="size-4" />,
    cbe_birr: <Landmark className="size-4" />,
};

export default function PaymentVerificationIndex({
    orders,
    stats,
    filters,
}: Props) {
    const can = useCan();

    const [search, setSearch] = useState(filters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || 'pending');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');

    const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
    const [transactionNumber, setTransactionNumber] = useState('');
    const [transactionError, setTransactionError] = useState('');
    const [processing, setProcessing] = useState(false);

    const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
    const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (search) {
params.search = search;
}

        if (paymentStatus) {
params.payment_status = paymentStatus;
}

        if (paymentMethod) {
params.payment_method = paymentMethod;
}

        router.get('/manager/payment-verification', params, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setPaymentStatus('pending');
        setPaymentMethod('');
        router.get('/manager/payment-verification', {}, { preserveState: true });
    };

    const openVerifyModal = (order: Order) => {
        setVerifyingOrder(order);
        setTransactionNumber('');
        setTransactionError('');
    };

    const submitVerification = () => {
        if (!verifyingOrder) {
return;
}

        if (!transactionNumber.trim()) {
            setTransactionError('Transaction number is required before verifying the payment.');

            return;
        }

        setProcessing(true);
        router.patch(
            `/manager/payment-verification/${verifyingOrder.id}/verify`,
            { transaction_number: transactionNumber.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment verified successfully!');
                    setVerifyingOrder(null);
                    setTransactionNumber('');
                    setProcessing(false);
                },
                onError: (errors) => {
                    if (errors.transaction_number) {
                        setTransactionError(errors.transaction_number);
                    } else {
                        toast.error('Failed to verify payment.');
                    }

                    setProcessing(false);
                },
            }
        );
    };

    const rejectPayment = (order: Order) => {
        setProcessing(true);
        router.patch(
            `/manager/payment-verification/${order.id}/reject`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment rejected.');
                    setRejectingOrder(null);
                    setProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to reject payment.');
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <>
            <Head title="Payment Verification" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Payment Verification"
                    description="Verify customer payments by confirming their transaction numbers."
                    icon={ShieldCheck}
                />

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-yellow-200 bg-yellow-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-yellow-100 p-3 text-yellow-700">
                                <AlertCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-700">Pending Verification</p>
                                <p className="text-2xl font-black text-yellow-900">{stats.pending}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-green-100 p-3 text-green-700">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700">Verified</p>
                                <p className="text-2xl font-black text-green-900">{stats.verified}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-red-100 p-3 text-red-700">
                                <XCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-700">Rejected</p>
                                <p className="text-2xl font-black text-red-900">{stats.rejected}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-wrap gap-3">
                            <div className="min-w-[200px] flex-1">
                                <Input
                                    placeholder="Search order ID, customer, transaction number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
applyFilters();
}
                                    }}
                                    className="w-full"
                                />
                            </div>

                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger className="w-[190px]">
                                    <SelectValue placeholder="Payment Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending Verification</SelectItem>
                                    <SelectItem value="paid">Verified</SelectItem>
                                    <SelectItem value="cancelled">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-[170px]">
                                    <SelectValue placeholder="Payment Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    {Object.entries(paymentMethodLabels).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button onClick={applyFilters}>
                                <Search className="mr-2 size-4" />
                                Search
                            </Button>

                            <Button variant="outline" onClick={clearFilters}>
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left">
                                        <th className="p-3 font-semibold">Order ID</th>
                                        <th className="p-3 font-semibold">Customer</th>
                                        <th className="p-3 font-semibold">Table</th>
                                        <th className="p-3 font-semibold">Payment Method</th>
                                        <th className="p-3 font-semibold">Amount</th>
                                        <th className="p-3 font-semibold">Status</th>
                                        <th className="p-3 font-semibold">Date</th>
                                        <th className="p-3 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-gray-500">
                                                No payments found.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.data.map((order) => (
                                            <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-3 font-mono text-xs font-bold">
                                                    {order.order_number}
                                                </td>
                                                <td className="p-3">
                                                    <p className="font-medium">{order.customer?.name || order.customer_name || 'Walk-in'}</p>
                                                    {order.customer_phone && (
                                                        <p className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Phone className="size-3" />
                                                            {order.customer_phone}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {order.table ? `Table ${order.table.table_number}` : '—'}
                                                </td>
                                                <td className="p-3">
                                                    {order.payment?.payment_method ? (
                                                        <span className="flex items-center gap-1.5 capitalize">
                                                            {paymentMethodIcons[order.payment.payment_method] || <CreditCard className="size-4" />}
                                                            {paymentMethodLabels[order.payment.payment_method] || order.payment.payment_method}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="p-3 font-bold">
                                                    {Number(order.payment?.amount || order.total_amount).toFixed(2)} ETB
                                                </td>
                                                <td className="p-3">
                                                    <Badge className={`border ${paymentStatusColors[order.payment_status] || ''}`}>
                                                        {paymentStatusLabels[order.payment_status] || order.payment_status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {order.payment?.verified_at
                                                        ? new Date(order.payment.verified_at).toLocaleString()
                                                        : new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {order.payment_status === 'pending' && can('verify payments') && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => openVerifyModal(order)}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <CheckCircle2 className="mr-1 size-4" />
                                                                    Verify Payment
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    onClick={() => setRejectingOrder(order)}
                                                                >
                                                                    <Ban className="mr-1 size-4" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {order.payment_status === 'paid' && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex items-center gap-1 text-xs text-green-700">
                                                                    <CheckCircle2 className="size-4" />
                                                                    {order.payment?.verifier?.name
                                                                        ? `Verified by ${order.payment.verifier.name}`
                                                                        : 'Verified'}
                                                                </span>
                                                                {order.receipt && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setViewingReceiptOrder(order)}
                                                                    >
                                                                        <Receipt className="mr-1 size-4" />
                                                                        Receipt
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 border-t p-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={orders.current_page <= 1}
                                    onClick={() => {
                                        const prevUrl = orders.links[0]?.url;

                                        if (prevUrl) {
router.get(prevUrl, {}, { preserveState: true });
}
                                    }}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-500">
                                    Page {orders.current_page} of {orders.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={orders.current_page >= orders.last_page}
                                    onClick={() => {
                                        const nextUrl = orders.links[orders.links.length - 1]?.url;

                                        if (nextUrl) {
router.get(nextUrl, {}, { preserveState: true });
}
                                    }}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ========================= */}
            {/* VERIFY PAYMENT MODAL */}
            {/* ========================= */}

            <Dialog
                open={!!verifyingOrder}
                onOpenChange={(open) => {
                    if (!open) {
                        setVerifyingOrder(null);
                        setTransactionError('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <ShieldCheck className="size-5 text-green-600" />
                            Verify Payment
                        </DialogTitle>
                        <DialogDescription>
                            Enter the transaction number to verify payment for order {verifyingOrder?.order_number}.
                        </DialogDescription>
                    </DialogHeader>

                    {verifyingOrder && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</p>
                                        <p className="mt-1 font-bold">{verifyingOrder.customer?.name || verifyingOrder.customer_name || 'Walk-in'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Table</p>
                                        <p className="mt-1 font-bold">{verifyingOrder.table ? `Table ${verifyingOrder.table.table_number}` : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Method</p>
                                        <p className="mt-1 flex items-center gap-1 font-bold capitalize">
                                            {verifyingOrder.payment?.payment_method
                                                ? (paymentMethodLabels[verifyingOrder.payment.payment_method] || verifyingOrder.payment.payment_method)
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</p>
                                        <p className="mt-1 font-bold text-green-700">
                                            {Number(verifyingOrder.payment?.amount || verifyingOrder.total_amount).toFixed(2)} ETB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Transaction Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        autoFocus
                                        value={transactionNumber}
                                        onChange={(e) => {
                                            setTransactionNumber(e.target.value);

                                            if (transactionError) {
setTransactionError('');
}
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
submitVerification();
}
                                        }}
                                        placeholder="e.g. TXNX8F9A2B"
                                        className="pl-9"
                                    />
                                </div>
                                {transactionError && (
                                    <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                                        <AlertCircle className="size-4" />
                                        {transactionError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setVerifyingOrder(null)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitVerification}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 size-4" />
                                    Verify Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================= */}
            {/* RECEIPT MODAL */}
            {/* ========================= */}

            <ReceiptModal
                open={!!viewingReceiptOrder}
                onOpenChange={(open) => {
                    if (!open) {
setViewingReceiptOrder(null);
}
                }}
                order={viewingReceiptOrder}
            />

            {/* ========================= */}
            {/* REJECT CONFIRMATION */}
            {/* ========================= */}

            <Dialog
                open={!!rejectingOrder}
                onOpenChange={(open) => {
                    if (!open) {
setRejectingOrder(null);
}
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            Reject Payment?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject the payment for order{' '}
                            <strong>{rejectingOrder?.order_number}</strong>?
                            This will mark the payment as rejected.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectingOrder(null)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectingOrder && rejectPayment(rejectingOrder)}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <Ban className="mr-2 size-4" />
                                    Reject Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

PaymentVerificationIndex.layout = {
    breadcrumbs: [
        {
            title: 'Payment Verification',
            href: '/manager/payment-verification',
        },
    ],
};
