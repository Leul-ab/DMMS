import { Head, router } from '@inertiajs/react';
import {
    Bell,
    Table2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
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

type Table = {
    id: number;
    table_number: number;
    section: string | null;
};

type Booking = {
    id: number;
    status: string;
    payment_status: string;
    booked_at: string;
    expires_at: string | null;
    cancelled_at: string | null;
    paid_at: string | null;
};

type Notification = {
    id: number;
    booking_id: number;
    customer_name: string;
    customer_phone: string;
    tables: Table[];
    payment_method: string;
    amount: string;
    status: string;
    notification_type: string;
    read_at: string | null;
    created_at: string;
    booking: Booking | null;
};

type Props = {
    notification: Notification;
};

const paymentMethodLabels: Record<string, string> = {
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    read: 'bg-blue-100 text-blue-800 border-blue-200',
    verified: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending Verification',
    read: 'Read',
    verified: 'Verified',
    rejected: 'Rejected',
};

export default function BookingPaymentShow({ notification }: Props) {
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [transactionNumber, setTransactionNumber] = useState('');

    const isResolved = notification.status === 'verified' || notification.status === 'rejected';
    const isExpired = notification.booking?.status === 'cancelled' || notification.booking?.status === 'expired';

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);

        return (
            d.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }) +
            ' ' +
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);

        return d.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);

        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleApprove = async () => {
        setApproving(true);
        router.patch(
            `/manager/booking-payment/${notification.id}/approve`,
            { transaction_number: transactionNumber.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Booking payment approved successfully.');
                    setShowApproveDialog(false);
                    setApproving(false);
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to approve booking payment.');
                    setApproving(false);
                },
            }
        );
    };

    const handleReject = async () => {
        setRejecting(true);
        router.patch(
            `/manager/booking-payment/${notification.id}/reject`,
            { rejection_reason: rejectionReason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Booking payment rejected.');
                    setShowRejectDialog(false);
                    setRejecting(false);
                    setRejectionReason('');
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to reject booking payment.');
                    setRejecting(false);
                },
            }
        );
    };

    return (
        <>
            <Head title={`Booking Payment #${String(notification.id).padStart(6, '0')}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Booking Payment Verification"
                    description="Review booking payment details and approve or reject the payment."
                    icon={Bell}
                />

                {isExpired && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex items-center gap-3 p-4">
                            <AlertTriangle className="size-5 text-red-600" />
                            <p className="text-sm font-semibold text-red-700">
                                This booking has been expired or cancelled. Approval may not be possible.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Booking Information */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="mb-4 text-lg font-black text-gray-900">Booking Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Booking ID</span>
                                    <span className="font-mono text-sm font-bold">
                                        BK-{String(notification.booking_id).padStart(6, '0')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Customer</span>
                                    <span className="text-sm font-bold">{notification.customer_name}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Phone</span>
                                    <span className="text-sm font-bold">{notification.customer_phone}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Table</span>
                                    <div className="flex flex-wrap gap-1">
                                        {notification.tables.map((t) => (
                                            <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                                <Table2 className="size-3" />
                                                T-{String(t.table_number).padStart(2, '0')}
                                                {t.section && ` (${t.section})`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Booking Date</span>
                                    <span className="text-sm font-bold">
                                        {notification.booking?.booked_at ? formatDate(notification.booking.booked_at) : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Booking Time</span>
                                    <span className="text-sm font-bold">
                                        {notification.booking?.booked_at ? formatTime(notification.booking.booked_at) : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Duration</span>
                                    <span className="text-sm font-bold">2 Hours</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Booking Status</span>
                                    <span className="text-sm font-bold capitalize">
                                        {notification.booking?.status || '—'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="mb-4 text-lg font-black text-gray-900">Payment Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Payment Method</span>
                                    <span className="text-sm font-bold capitalize">
                                        {paymentMethodLabels[notification.payment_method] || notification.payment_method}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Account Number</span>
                                    <span className="font-mono text-sm font-bold">
                                        {notification.payment_method === 'telebirr' ? '0912345678' : '100012345678'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Amount</span>
                                    <span className="text-sm font-bold text-green-700">
                                        {Number(notification.amount || 0).toFixed(2)} ETB
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Payment Status</span>
                                    <Badge className={`border ${statusColors[notification.status] || ''}`}>
                                        {statusLabels[notification.status] || notification.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Received</span>
                                    <span className="text-sm font-bold">{formatDateTime(notification.created_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                {!isResolved && (
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.get('/manager/booking-payment')}
                        >
                            Back to List
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowRejectDialog(true)}
                            disabled={rejecting || approving}
                        >
                            {rejecting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="size-4 animate-spin" />
                                    Rejecting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <XCircle className="size-4" />
                                    Reject Payment
                                </span>
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowApproveDialog(true)}
                            disabled={rejecting || approving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {approving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="size-4 animate-spin" />
                                    Approving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4" />
                                    Approve Payment
                                </span>
                            )}
                        </Button>
                    </div>
                )}

                {isResolved && (
                    <div className="flex items-center justify-end">
                        <Button
                            variant="outline"
                            onClick={() => router.get('/manager/booking-payment')}
                        >
                            Back to List
                        </Button>
                    </div>
                )}

                {/* Approve Confirmation Dialog */}
                <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">
                                Approve Booking Payment?
                            </DialogTitle>
                            <DialogDescription>
                                Booking: BK-{String(notification.booking_id).padStart(6, '0')}<br />
                                Customer: {notification.customer_name}<br />
                                Table: {notification.tables.map(t => `T-${String(t.table_number).padStart(2, '0')}`).join(', ')}<br />
                                Payment Method: {paymentMethodLabels[notification.payment_method] || notification.payment_method}<br />
                                Amount: {Number(notification.amount || 0).toFixed(2)} ETB
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <p className="text-sm text-gray-600">
                                Are you sure you have confirmed this payment? This will mark the booking as confirmed and reserve the table.
                            </p>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Transaction Number (optional)
                                </label>
                                <Input
                                    value={transactionNumber}
                                    onChange={(e) => setTransactionNumber(e.target.value)}
                                    placeholder="Enter transaction number"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowApproveDialog(false)}
                                disabled={approving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={approving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {approving ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="size-4 animate-spin" />
                                        Approving...
                                    </span>
                                ) : (
                                    'Approve Payment'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject Confirmation Dialog */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">
                                Reject Booking Payment?
                            </DialogTitle>
                            <DialogDescription>
                                Booking: BK-{String(notification.booking_id).padStart(6, '0')}<br />
                                Customer: {notification.customer_name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <p className="text-sm text-gray-600">
                                Are you sure you want to reject this booking payment? The booking will be cancelled and the table will be released.
                            </p>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Reason
                                </label>
                                <Input
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectDialog(false)}
                                disabled={rejecting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={rejecting}
                            >
                                {rejecting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="size-4 animate-spin" />
                                        Rejecting...
                                    </span>
                                ) : (
                                    'Reject Payment'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

BookingPaymentShow.layout = {
    breadcrumbs: [
        { title: 'Verification', href: '/manager/payment-verification' },
        { title: 'Booking Payment', href: '/manager/booking-payment' },
    ],
};
