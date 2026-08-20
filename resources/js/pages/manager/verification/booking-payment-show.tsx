import { Head, router } from '@inertiajs/react';
import {
    Bell,
    Table2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    Eye,
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
import { Textarea } from '@/components/ui/textarea';

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
    customer_email: string;
    tables: Table[];
    table_numbers: string[];
    payment_method: string;
    payment_account: string | null;
    payment_attempt_reference: string | null;
    transaction_number: string | null;
    payment_screenshot: string | null;
    amount: string;
    status: string;
    notification_type: string;
    read_at: string | null;
    copied_at: string | null;
    expired_at: string | null;
    verified_at: string | null;
    verified_by: string | null;
    rejected_at: string | null;
    rejected_by: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
    booking: {
        id: number;
        status: string;
        payment_status: string;
        booked_at: string;
        booking_amount: string;
        expires_at: string | null;
        cancelled_at: string | null;
        paid_at: string | null;
    } | null;
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
    expired: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending Verification',
    read: 'Read',
    verified: 'Verified',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
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
                                <span className="text-sm font-semibold text-gray-500">Email</span>
                                <span className="text-sm font-bold">{notification.customer_email || '—'}</span>
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
                                    <span className="text-sm font-semibold text-gray-500">Booking Amount</span>
                                    <span className="text-sm font-bold">
                                        {Number(notification.booking?.booking_amount || 0).toFixed(2)} ETB
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Payment Status</span>
                                    <span className="text-sm font-bold capitalize">
                                        {notification.booking?.payment_status || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Verification Status</span>
                                    <Badge className={`border ${statusColors[notification.status] || ''}`}>
                                        {statusLabels[notification.status] || notification.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Booking Status</span>
                                    <span className="text-sm font-bold capitalize">
                                        {notification.booking?.status || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Created</span>
                                    <span className="text-sm font-bold">{formatDateTime(notification.created_at)}</span>
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
                                        {notification.payment_account || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-500">Attempt Reference</span>
                                    <span className="font-mono text-sm font-bold">
                                        {notification.payment_attempt_reference || '—'}
                                    </span>
                                </div>
                                {notification.payment_screenshot && (
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <span className="text-sm font-semibold text-gray-500">Payment Screenshot</span>
                                        <div className="mt-2">
                                            <img
                                                src={`/manager/booking-payment/${notification.id}/screenshot`}
                                                alt="Payment screenshot"
                                                className="mx-auto max-h-48 rounded-lg object-contain"
                                            />
                                            <a
                                                href={`/manager/booking-payment/${notification.id}/screenshot`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Full Image
                                            </a>
                                        </div>
                                    </div>
                                )}
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
                                {notification.verified_by && (
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <span className="text-sm font-semibold text-gray-500">Verified By</span>
                                        <span className="text-sm font-bold">{notification.verified_by}</span>
                                    </div>
                                )}
                                {notification.verified_at && (
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <span className="text-sm font-semibold text-gray-500">Verified At</span>
                                        <span className="text-sm font-bold">{formatDateTime(notification.verified_at)}</span>
                                    </div>
                                )}
                                {notification.rejected_by && (
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <span className="text-sm font-semibold text-gray-500">Rejected By</span>
                                        <span className="text-sm font-bold">{notification.rejected_by}</span>
                                    </div>
                                )}
                                {notification.rejected_at && (
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <span className="text-sm font-semibold text-gray-500">Rejected At</span>
                                        <span className="text-sm font-bold">{formatDateTime(notification.rejected_at)}</span>
                                    </div>
                                )}
                                {notification.rejection_reason && (
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <span className="text-sm font-semibold text-gray-500">Rejection Reason</span>
                                        <p className="mt-1 text-sm font-bold">{notification.rejection_reason}</p>
                                    </div>
                                )}
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
                                Are you sure you want to reject this booking payment? The customer reported the payment as paid, but the verification will be marked as rejected. The booking will remain active.
                            </p>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                    className="resize-none"
                                    rows={3}
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
