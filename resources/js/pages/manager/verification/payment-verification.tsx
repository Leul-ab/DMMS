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

type BookingExtension = {
    id: number;
    booking_id: number;
    amount: string;
    payment_method: string | null;
    payment_status: string;
    transaction_reference: string;
    transaction_number: string | null;
    verified_at: string | null;
    paid_at: string | null;
    extension_period_hours: number | null;
    cashier: { id: number; name: string } | null;
    verifier: { id: number; name: string } | null;
    booking: {
        id: number;
        customer_name: string;
        customer_phone: string;
        tables: { id: number; table_number: number }[];
    } | null;
    payment: {
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
};

type VerificationItem = Order | BookingExtension;

type PaginatedData = {
    data: VerificationItem[];
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
    extensions: BookingExtension[];
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

export default function PaymentVerificationTab({
    orders,
    extensions,
    stats,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || 'pending');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');

    const [verifyingItem, setVerifyingItem] = useState<VerificationItem | null>(null);
    const [transactionNumber, setTransactionNumber] = useState('');
    const [transactionError, setTransactionError] = useState('');
    const [processing, setProcessing] = useState(false);

    const [rejectingItem, setRejectingItem] = useState<VerificationItem | null>(null);
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

    const openVerifyModal = (item: VerificationItem) => {
        setVerifyingItem(item);
        setTransactionNumber('');
        setTransactionError('');
    };

    const submitVerification = () => {
        if (!verifyingItem) {
            return;
        }

        if (!transactionNumber.trim()) {
            setTransactionError('Transaction number is required before verifying the payment.');

            return;
        }

        setProcessing(true);
        const isExtension = 'booking_id' in verifyingItem;
        const url = isExtension
            ? `/manager/payment-verification/extensions/${verifyingItem.id}/verify`
            : `/manager/payment-verification/${verifyingItem.id}/verify`;

        router.patch(
            url,
            { transaction_number: transactionNumber.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment verified successfully!');
                    setVerifyingItem(null);
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

    const rejectPayment = (item: VerificationItem) => {
        setProcessing(true);
        const isExtension = 'booking_id' in item;
        const url = isExtension
            ? `/manager/payment-verification/extensions/${item.id}/reject`
            : `/manager/payment-verification/${item.id}/reject`;

        router.patch(
            url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment rejected.');
                    setRejectingItem(null);
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
                                        <th className="p-3 font-semibold">Type</th>
                                        <th className="p-3 font-semibold">ID / Reference</th>
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
                                            <td colSpan={9} className="p-12 text-center text-gray-500">
                                                No payments found.
                                            </td>
                                        </tr>
                                    ) : (
                                        [...orders.data, ...extensions].map((item) => {
                                            const isExtension = 'booking_id' in item;
                                            const order = isExtension ? null : item as Order;
                                            const extension = isExtension ? item as BookingExtension : null;

                                            return (
                                                <tr key={isExtension ? `ext-${item.id}` : item.id} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="p-3">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                                            {isExtension ? 'Booking Extension' : 'Order'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-mono text-xs font-bold">
                                                        {isExtension
                                                            ? `BK-${String(extension!.booking_id).padStart(6, '0')}`
                                                            : item.order_number}
                                                    </td>
                                                    <td className="p-3">
                                                        <p className="font-medium">
                                                            {isExtension
                                                                ? extension!.booking?.customer_name || 'Unknown'
                                                                : order!.customer?.name || order!.customer_name || 'Walk-in'}
                                                        </p>
                                                        {(isExtension ? extension!.booking?.customer_phone : order!.customer_phone) && (
                                                            <p className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Phone className="size-3" />
                                                                {isExtension
                                                                    ? extension!.booking?.customer_phone
                                                                    : order!.customer_phone}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        {isExtension
                                                            ? extension!.booking?.tables.map((t) => `Table ${t.table_number}`).join(', ') || '—'
                                                            : order!.table ? `Table ${order!.table.table_number}` : '—'}
                                                    </td>
                                                    <td className="p-3">
                                                        {item.payment?.payment_method ? (
                                                            <span className="flex items-center gap-1.5 capitalize">
                                                                {paymentMethodIcons[item.payment.payment_method] || <CreditCard className="size-4" />}
                                                                {paymentMethodLabels[item.payment.payment_method] || item.payment.payment_method}
                                                            </span>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-bold">
                                                        {Number(item.payment?.amount || (isExtension ? 0 : order!.total_amount)).toFixed(2)} ETB
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge className={`border ${paymentStatusColors[item.payment_status] || ''}`}>
                                                            {paymentStatusLabels[item.payment_status] || item.payment_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-500">
                                                        {item.payment?.verified_at
                                                            ? new Date(item.payment.verified_at).toLocaleString()
                                                            : new Date(isExtension ? (item as BookingExtension).paid_at || '' : (item as Order).created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {item.payment_status === 'pending' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => openVerifyModal(item)}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        <CheckCircle2 className="mr-1 size-4" />
                                                                        Verify Payment
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="text-red-600 hover:text-red-700"
                                                                        onClick={() => setRejectingItem(item)}
                                                                    >
                                                                        <Ban className="mr-1 size-4" />
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {item.payment_status === 'paid' && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="flex items-center gap-1 text-xs text-green-700">
                                                                        <CheckCircle2 className="size-4" />
                                                                        {item.payment?.verifier?.name
                                                                            ? `Verified by ${item.payment.verifier.name}`
                                                                            : 'Verified'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
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
                open={!!verifyingItem}
                onOpenChange={(open) => {
                    if (!open) {
                        setVerifyingItem(null);
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
                            Enter the transaction number to verify payment for{' '}
                            {verifyingItem && 'booking_id' in verifyingItem
                                ? `booking BK-${String((verifyingItem as BookingExtension).booking_id).padStart(6, '0')}`
                                : `order ${verifyingItem?.order_number}`}
                            .
                        </DialogDescription>
                    </DialogHeader>

                    {verifyingItem && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</p>
                                        <p className="mt-1 font-bold">
                                            {verifyingItem && 'booking_id' in verifyingItem
                                                ? (verifyingItem as BookingExtension).booking?.customer_name || 'Unknown'
                                                : (verifyingItem as Order).customer?.name || (verifyingItem as Order).customer_name || 'Walk-in'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Table</p>
                                        <p className="mt-1 font-bold">
                                            {verifyingItem && 'booking_id' in verifyingItem
                                                ? (verifyingItem as BookingExtension).booking?.tables.map((t) => `Table ${t.table_number}`).join(', ') || '—'
                                                : (verifyingItem as Order).table ? `Table ${(verifyingItem as Order).table!.table_number}` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Method</p>
                                        <p className="mt-1 flex items-center gap-1 font-bold capitalize">
                                            {verifyingItem.payment?.payment_method
                                                ? (paymentMethodLabels[verifyingItem.payment.payment_method] || verifyingItem.payment.payment_method)
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</p>
                                        <p className="mt-1 font-bold text-green-700">
                                            {Number(verifyingItem.payment?.amount || 0).toFixed(2)} ETB
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
                            onClick={() => setVerifyingItem(null)}
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
                open={!!rejectingItem}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectingItem(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            Reject Payment?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject the payment for{' '}
                            {rejectingItem && 'booking_id' in rejectingItem
                                ? `booking BK-${String((rejectingItem as BookingExtension).booking_id).padStart(6, '0')}`
                                : `order ${rejectingItem?.order_number}`}
                            ?
                            This will mark the payment as rejected.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectingItem(null)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectingItem && rejectPayment(rejectingItem)}
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
