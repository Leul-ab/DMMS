import {
    Clock,
    Table2,
    X,
    User,
    Calendar,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Loader2,
    SearchX,
    Copy,
    Check,
    AlertTriangle,
    ArrowRight,
    Upload,
    Image,
    Trash2,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BookingTable = {
    id: number;
    table_number: number;
};

type BookingData = {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_id: number;
    tables: BookingTable[];
    status: string;
    payment_status: string;
    payment_method?: string | null;
    transaction_number?: string | null;
    amount?: string | number | null;
    booked_at: string;
    expires_at: string | null;
    cancelled_at: string | null;
    paid_at: string | null;
    time_remaining_seconds: number | null;
    is_expired: boolean;
    extension_payment_status?: string | null;
    booking_amount?: string | number | null;
    verification_status?: string | null;
    rejection_reason?: string | null;
};

type Props = {
    onClose: () => void;
};

export default function MyBooking({ onClose }: Props) {
    const [step, setStep] = useState<'phone' | 'booking'>('phone');
    const [phoneInput, setPhoneInput] = useState('');
    const [codeError, setCodeError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const [booking, setBooking] = useState<BookingData | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [paymentStep, setPaymentStep] = useState<'idle' | 'select' | 'account' | 'verification' | 'success'>('idle');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    const [extensionStep, setExtensionStep] = useState<'idle' | 'select' | 'account' | 'verification' | 'success' | 'rejected'>('idle');
    const [extensionPaymentMethod, setExtensionPaymentMethod] = useState<string | null>(null);
    const [extensionTransactionNumber, setExtensionTransactionNumber] = useState('');
    const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
    const [extensionCopySuccess, setExtensionCopySuccess] = useState(false);
    const [extensionAmount, setExtensionAmount] = useState<number | null>(null);
    const [extensionPaymentId, setExtensionPaymentId] = useState<number | null>(null);
    const [isCheckingExtension, setIsCheckingExtension] = useState(false);

    const bookingPaymentAccounts: Record<string, { label: string; number: string }> = {
        telebirr: { label: 'Telebirr', number: '0912345678' },
        cbe_birr: { label: 'CBE', number: '100012345678' },
    };

    const fetchActiveBooking = useCallback(
        async (showRefreshIndicator = false) => {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            }

            try {
                const getXsrfToken = () => {
                    const match = document.cookie.match(
                        new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                    );

                    return match ? decodeURIComponent(match[3]) : '';
                };

                const response = await fetch('/api/active-booking', {
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                });
                const data = await response.json();

                if (data.booking) {
                    setBooking(data.booking);
                    setIsExpired(data.booking.is_expired || false);
                    setError(null);
                } else {
                    if (data.expired) {
                        setIsExpired(true);

                        if (booking) {
                            setBooking({ ...booking, status: 'expired' });
                        }
                    } else {
                        setBooking(null);
                        setError('No active booking found.');
                    }
                }
            } catch {
                setError('Failed to load booking. Please try again.');
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [booking],
    );

    useEffect(() => {
        // Don't fetch on mount - wait for code verification
        setIsLoading(false);
    }, []);

    // Lock background scroll while the modal is open.
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const handleVerifyCode = async () => {
        const trimmedPhone = phoneInput.trim();

        if (!trimmedPhone) {
            setCodeError('Phone number is required.');

            return;
        }

        setCodeError(null);
        setIsVerifying(true);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch('/api/bookings/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ phone: trimmedPhone }),
            });

            const data = await response.json();

            if (data.found && data.booking) {
                setBooking(data.booking);
                setIsExpired(data.booking.is_expired || false);
                setError(null);
                setStep('booking');
                setIsLoading(false);
            } else {
                setIsLoading(false);

                if (data.found && !data.booking) {
                    setError('No active booking found for this phone number.');
                    setStep('booking');
                } else {
                    setCodeError(
                        'No booking found. Please check your phone number.',
                    );
                }
            }
        } catch {
            setCodeError('Failed to verify phone number. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Real-time countdown
    useEffect(() => {
        if (!booking || !booking.expires_at) {
            return;
        }

        if (booking.payment_status === 'paid') {
            const expiresAt = new Date(booking.expires_at!).getTime();
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

            if (diff <= 0 && booking.status === 'active') {
                setIsExpired(true);
            }

            return;
        }

        const calculateTime = () => {
            const expiresAt = new Date(booking.expires_at!).getTime();
            const now = Date.now();
            const diff = Math.floor((expiresAt - now) / 1000);

            if (diff <= 0) {
                setIsExpired(true);
                setTimeRemaining('00:00:00');

                return;
            }

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;
            setTimeRemaining(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            );
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    }, [booking]);

    useEffect(() => {
        if (extensionStep !== 'verification') {
            return;
        }

        const interval = setInterval(() => {
            handleCheckExtensionStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [extensionStep, booking]);

    const handleCancel = async () => {
        if (!booking) {
            return;
        }

        setIsCancelling(true);

        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const response = await fetch(`/booking/${booking.id}/cancel`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.ok) {
                toast.success('Booking cancelled successfully.');
                setBooking({ ...booking, status: 'cancelled' });
                setIsExpired(true);
            } else {
                toast.error('Failed to cancel booking.');
            }
        } catch {
            toast.error('Failed to cancel booking. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleRefresh = () => {
        fetchActiveBooking(true);
        toast.success('Booking status refreshed.');
    };

    const handlePayNow = () => {
        setPaymentStep('select');
    };

    const handleSelectMethod = (method: string) => {
        setSelectedPaymentMethod(method);
        setPaymentStep('account');
    };

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
                toast.error('Please upload a valid payment screenshot (JPG, PNG, or WEBP).');

                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Payment screenshot must not exceed 5 MB.');

                return;
            }
        }

        setPaymentScreenshot(file);
        setScreenshotPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleRemoveScreenshot = () => {
        setPaymentScreenshot(null);
        setScreenshotPreview(null);
    };

    const handleCopyAccount = async () => {
        if (!selectedPaymentMethod || !booking || copySuccess || isCopying) {
            return;
        }

        const accountNumber = bookingPaymentAccounts[selectedPaymentMethod].number;

        setIsCopying(true);

        try {
            await navigator.clipboard.writeText(accountNumber);
            setCopySuccess(true);

            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(`/customer/bookings/${booking.id}/copy-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    payment_method: selectedPaymentMethod,
                }),
            });

            const data = await response.json();

            const paymentMethodLabel = bookingPaymentAccounts[selectedPaymentMethod]?.label || 'Payment';

            if (data.success) {
                if (data.notification_error) {
                    toast.success(`${paymentMethodLabel} account number copied successfully.`);
                    toast.error(data.notification_error_message || 'The payment notification could not be created. Please try again.');
                } else {
                    toast.success(`${paymentMethodLabel} account number copied successfully.\nPayment verification request submitted.\nPlease wait for manager approval.`);
                }

                if (data.booking) {
                    setBooking({
                        ...booking,
                        payment_status: data.booking.payment_status || 'pending_verification',
                        status: data.booking.status || 'active',
                        expires_at: data.booking.expires_at || new Date(Date.now() + 7200000).toISOString(),
                        payment_method: data.booking.payment_method || selectedPaymentMethod,
                    });
                } else {
                    setBooking({
                        ...booking,
                        payment_status: 'pending_verification',
                        status: 'active',
                        expires_at: new Date(Date.now() + 7200000).toISOString(),
                        payment_method: selectedPaymentMethod,
                    });
                }
            } else if (data.already_exists) {
                toast.success(data.message || 'Account number copied.\nThis booking has already been paid.');

                if (data.booking) {
                    setBooking({
                        ...booking,
                        payment_status: data.booking.payment_status || 'pending_verification',
                        status: data.booking.status || 'active',
                        expires_at: data.booking.expires_at || new Date(Date.now() + 7200000).toISOString(),
                        payment_method: data.booking.payment_method || selectedPaymentMethod,
                    });
                }
            } else {
                toast.error(data.message || 'Account number copied. However, we could not submit your payment verification request. Please try again.');
            }

            setTimeout(() => {
                setCopySuccess(false);
                setIsCopying(false);
            }, 2000);
        } catch {
            toast.error('Unable to copy account number.');
            setCopySuccess(false);
            setIsCopying(false);
        }
    };

    const handleSubmitVerification = async () => {
        if (!booking || !selectedPaymentMethod || !paymentScreenshot) {
            return;
        }

        setIsSubmittingVerification(true);

        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const formData = new FormData();
            formData.append('payment_method', selectedPaymentMethod);
            formData.append('payment_screenshot', paymentScreenshot);

            const response = await fetch(`/booking/${booking.id}/submit-payment`, {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Payment verification submitted. Please wait for manager approval.');
                setBooking({
                    ...booking,
                    payment_status: 'pending_verification',
                    payment_method: data.booking?.payment_method || selectedPaymentMethod,
                });
                setPaymentStep('success');
            } else {
                toast.error(data.message || 'Payment verification failed.');
            }
        } catch {
            toast.error('Payment verification failed. Please try again.');
        } finally {
            setIsSubmittingVerification(false);
        }
    };

    const handleClosePayment = () => {
        setPaymentStep('idle');
        setSelectedPaymentMethod(null);
        setPaymentScreenshot(null);
        setScreenshotPreview(null);
        setCopySuccess(false);
    };

    const handleRequestExtension = async () => {
        if (!booking) {
return;
}

        const method = extensionPaymentMethod || 'cbe_birr';
        setIsSubmittingExtension(true);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(`/api/booking/${booking.id}/request-extension`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ payment_method: method }),
            });

            const data = await response.json();

            if (data.success) {
                setExtensionAmount(data.payment.amount);
                setExtensionPaymentId(data.payment.id);
                setExtensionStep('verification');
            } else {
                toast.error(data.message || 'Failed to request extension.');
            }
        } catch {
            toast.error('Failed to request extension. Please try again.');
        } finally {
            setIsSubmittingExtension(false);
        }
    };

    const handleSelectExtensionMethod = (method: string) => {
        setExtensionPaymentMethod(method);
        setExtensionStep('account');
    };

    const handleCopyExtensionAccount = async () => {
        if (!extensionPaymentMethod) {
return;
}

        const accountNumber = bookingPaymentAccounts[extensionPaymentMethod].number;

        try {
            await navigator.clipboard.writeText(accountNumber);
            setExtensionCopySuccess(true);
            toast.success('Account number copied.');

            setTimeout(() => {
                setExtensionStep('verification');
                setExtensionCopySuccess(false);
            }, 800);
        } catch {
            toast.error('Failed to copy account number.');
        }
    };

    const handleSubmitExtensionVerification = async () => {
        if (!booking || !extensionPaymentMethod || !extensionTransactionNumber.trim()) {
return;
}

        setIsSubmittingExtension(true);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(`/manager/payment-verification/extensions/${extensionPaymentId}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ transaction_number: extensionTransactionNumber }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Extension payment verified successfully!');
                setExtensionStep('success');
                fetchActiveBooking();
            } else {
                toast.error(data.message || 'Extension verification failed.');
            }
        } catch {
            toast.error('Extension verification failed. Please try again.');
        } finally {
            setIsSubmittingExtension(false);
        }
    };

    const handleCheckExtensionStatus = async () => {
        if (!booking) {
return;
}

        setIsCheckingExtension(true);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch(`/api/booking/${booking.id}/extension-status`, {
                headers: {
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            const data = await response.json();

            if (data.booking) {
                setBooking(data.booking);
                setIsExpired(data.booking.is_expired || false);

                if (data.booking.extension_payment_status === 'paid') {
                    setExtensionStep('idle');
                } else if (data.booking.extension_payment_status === 'cancelled') {
                    setExtensionStep('rejected');
                }
            }
        } catch {
            // Silently fail
        } finally {
            setIsCheckingExtension(false);
        }
    };

    const handleCloseExtension = () => {
        setExtensionStep('idle');
        setExtensionPaymentMethod(null);
        setExtensionTransactionNumber('');
        setExtensionCopySuccess(false);
        setExtensionAmount(null);
        setExtensionPaymentId(null);
    };

    const getStatusBadge = () => {
        if (!booking) {
            return null;
        }

        if (
            isExpired ||
            booking.status === 'cancelled' ||
            booking.status === 'expired'
        ) {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    {booking.status === 'cancelled' ? 'Cancelled' : 'Expired'}
                </Badge>
            );
        }

        if (booking.status === 'active') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Reserved
                </Badge>
            );
        }

        if (booking.status === 'completed') {
            return (
                <Badge
                    variant="secondary"
                    className="bg-blue-100 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Completed
                </Badge>
            );
        }

        if (booking.status === 'confirmed') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Confirmed
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
                {booking.status}
            </Badge>
        );
    };

    const getPaymentBadge = () => {
        if (!booking) {
            return null;
        }

        if (booking.payment_status === 'paid') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Paid
                </Badge>
            );
        }

        if (booking.payment_status === 'pending_verification' || booking.payment_status === 'pending') {
            return (
                <Badge
                    variant="secondary"
                    className="bg-yellow-100 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100"
                >
                    <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                    Pending Verification
                </Badge>
            );
        }

        if (booking.payment_status === 'expired' || isExpired) {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Expired
                </Badge>
            );
        }

        return (
            <Badge
                variant="secondary"
                className="bg-yellow-100 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100"
            >
                Unpaid
            </Badge>
        );
    };

    const getVerificationBadge = () => {
        if (!booking || !booking.verification_status) {
            return null;
        }

        const status = booking.verification_status;

        if (status === 'verified') {
            return (
                <Badge
                    variant="default"
                    className="bg-green-100 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100"
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Verified
                </Badge>
            );
        }

        if (status === 'rejected') {
            return (
                <Badge
                    variant="destructive"
                    className="bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Rejected
                </Badge>
            );
        }

        if (status === 'pending' || status === 'read') {
            return (
                <Badge
                    variant="secondary"
                    className="bg-yellow-100 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100"
                >
                    <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                    Pending Verification
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="px-3 py-1.5 text-sm capitalize">
                {status}
            </Badge>
        );
    };

    const handlePay = async () => {
        if (!booking) {
            return;
        }

        setIsPaying(true);

        try {
            const csrfToken =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            const response = await fetch(`/booking/${booking.id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    payment_method: selectedPaymentMethod || undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Payment verification request submitted.\nPlease wait for manager approval.');
                setBooking({
                    ...booking,
                    payment_status: data.booking?.payment_status || 'pending_verification',
                    status: data.booking?.status || 'active',
                    expires_at: data.booking?.expires_at || new Date(Date.now() + 7200000).toISOString(),
                });
            } else {
                toast.error(data.message || 'Payment failed.');
            }
        } catch {
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsPaying(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const progressPercent =
        booking?.time_remaining_seconds && booking?.time_remaining_seconds > 0
            ? (booking.time_remaining_seconds / 7200) * 100
            : 0;

    const showCancelButton =
        booking && !isExpired && booking.status === 'active';

    const showExtendButton =
        booking &&
        isExpired &&
        booking.status === 'expired' &&
        booking.payment_status === 'paid' &&
        booking.extension_payment_status !== 'pending' &&
        booking.extension_payment_status !== 'paid';

    const showExpirationWarning =
        booking &&
        !isExpired &&
        booking.payment_status === 'paid' &&
        booking.time_remaining_seconds !== null &&
        booking.time_remaining_seconds <= 900 &&
        booking.time_remaining_seconds > 0;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between rounded-t-3xl border-b border-gray-100 bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <h2 className="text-lg font-black">My Booking</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Enter Phone Number */}
                    {step === 'phone' && (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <User className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="mt-4 text-xl font-black text-gray-900">
                                    Enter Your Phone Number
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Please enter your phone number to view your
                                    booking.
                                </p>
                            </div>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => {
                                        setPhoneInput(e.target.value);
                                        setCodeError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleVerifyCode();
                                        }
                                    }}
                                    placeholder="Enter your phone number"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-red-500"
                                    autoFocus
                                />
                                {codeError && (
                                    <p className="mt-2 text-sm text-red-500">
                                        {codeError}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl py-3.5 font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={isVerifying}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                                >
                                    {isVerifying ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Verifying...
                                        </span>
                                    ) : (
                                        'View Booking'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Show Booking Details */}
                    {step === 'booking' && isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            <p className="mt-3 text-sm text-gray-500">
                                Loading your booking...
                            </p>
                        </div>
                    ) : step === 'booking' && error && !booking ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <SearchX className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="mt-4 text-xl font-black text-gray-900">
                                No Active Booking
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {error}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep('phone');
                                    setPhoneInput('');
                                    setCodeError(null);
                                }}
                                className="mt-4 rounded-xl px-6 py-3.5 font-bold"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="mt-2 rounded-xl px-6 py-3.5 font-bold text-gray-500"
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        step === 'booking' &&
                        booking && (
                            <div className="space-y-5">
                                {/* Timer Section */}
                                {booking.status === 'active' && !isExpired ? (
                                    <div className={`rounded-2xl p-5 text-center ${booking.payment_status === 'paid' ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <Clock className={`mx-auto h-8 w-8 ${booking.payment_status === 'paid' ? 'text-green-500' : 'text-red-500'}`} />
                                        <p className={`mt-2 text-sm font-semibold ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                            {booking.payment_status === 'paid' ? 'Booking Time Remaining' : 'Time Remaining'}
                                        </p>
                                        <p className={`mt-1 text-4xl font-black ${booking.payment_status === 'paid' ? 'text-green-500' : 'text-red-500'}`}>
                                            {timeRemaining}
                                        </p>

                                        {showExpirationWarning && (
                                            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                                <p className="text-sm font-semibold text-yellow-700">
                                                    Booking Time Ending Soon - {timeRemaining} remaining
                                                </p>
                                            </div>
                                        )}

                                        {/* Progress Bar */}
                                        {booking.payment_status !== 'paid' && (
                                            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-red-200">
                                                <div
                                                    className="h-full rounded-full bg-red-500 transition-all duration-1000"
                                                    style={{
                                                        width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : booking.status === 'expired' ? (
                                    <div className="rounded-2xl bg-red-50 p-5 text-center">
                                        <XCircle className="mx-auto h-8 w-8 text-red-500" />
                                        <p className="mt-2 text-sm font-semibold text-red-600">
                                            Booking Time Expired
                                        </p>
                                        <p className="mt-1 text-3xl font-black text-red-500">
                                            00:00:00
                                        </p>
                                    </div>
                                ) : null}

                                {/* Status */}
                                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                                    <p className="text-sm font-semibold text-gray-500">
                                        Booking Status
                                    </p>
                                    {getStatusBadge()}
                                </div>

                                {/* Payment Status */}
                                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                                    <p className="text-sm font-semibold text-gray-500">
                                        Payment Status
                                    </p>
                                    {getPaymentBadge()}
                                </div>

                                {/* Verification Status */}
                                {booking.verification_status && (
                                    <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                                        <p className="text-sm font-semibold text-gray-500">
                                            Verification Status
                                        </p>
                                        {getVerificationBadge()}
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {booking.rejection_reason && (
                                    <div className="rounded-2xl bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-600">
                                            Rejection Reason
                                        </p>
                                        <p className="mt-1 text-sm text-red-700">
                                            {booking.rejection_reason}
                                        </p>
                                    </div>
                                )}

                                {/* Extension Status */}
                                {booking.extension_payment_status && (
                                    <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
                                        <p className="text-sm font-semibold text-gray-500">
                                            Extension Status
                                        </p>
                                        {booking.extension_payment_status === 'paid' ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Applied
                                            </span>
                                        ) : booking.extension_payment_status === 'pending' ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-yellow-600">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Pending
                                            </span>
                                        ) : booking.extension_payment_status === 'rejected' ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                Not Applied
                                            </span>
                                        ) : (
                                            <span className="text-sm font-bold text-gray-900">
                                                {booking.extension_payment_status}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Extend Time Button */}
                                {showExtendButton && extensionStep === 'idle' && (
                                    <Button
                                        onClick={() => setExtensionStep('select')}
                                        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 font-bold text-white hover:from-blue-600 hover:to-blue-700"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <ArrowRight className="mr-2 h-4 w-4" />
                                            Extend Time
                                        </span>
                                    </Button>
                                )}

                                {/* Extension Payment Flow UI */}
                                {extensionStep === 'select' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-black text-gray-900">Extend Booking Time</h3>
                                        <p className="text-sm text-gray-500">Select Payment Method</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(bookingPaymentAccounts).map(([key, account]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => handleSelectExtensionMethod(key)}
                                                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-blue-100 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                                                >
                                                    <span className="text-2xl">
                                                        {key === 'telebirr' ? '📱' : '🏦'}
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {account.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={handleCloseExtension}
                                            className="w-full text-gray-500"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}

                                {extensionStep === 'account' && extensionPaymentMethod && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-black text-gray-900">
                                            {bookingPaymentAccounts[extensionPaymentMethod].label} Payment
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {bookingPaymentAccounts[extensionPaymentMethod].label} Account Number
                                        </p>
                                        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-4 text-center">
                                            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                                                Account Number
                                            </p>
                                            <p className="mt-2 font-mono text-xl font-black tracking-wider text-stone-900 select-all">
                                                {bookingPaymentAccounts[extensionPaymentMethod].number}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleCopyExtensionAccount}
                                            disabled={extensionCopySuccess}
                                            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 font-bold text-white hover:from-blue-600 hover:to-blue-700"
                                        >
                                            {extensionCopySuccess ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Check className="h-4 w-4" />
                                                    Copied
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Copy className="h-4 w-4" />
                                                    Copy
                                                </span>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleCloseExtension}
                                            className="w-full text-gray-500"
                                        >
                                            Back
                                        </Button>
                                    </div>
                                )}

                                {extensionStep === 'verification' && extensionPaymentMethod && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-black text-gray-900">
                                            Extension Payment Verification
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Booking</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    #{String(booking.id).padStart(6, '0')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Table</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    Table {booking.tables.map(t => t.table_number).join(', ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Payment Method</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {bookingPaymentAccounts[extensionPaymentMethod].label}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Amount</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {extensionAmount ? extensionAmount.toFixed(2) : '0.00'} ETB
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                                Transaction Number
                                            </label>
                                            <input
                                                type="text"
                                                value={extensionTransactionNumber}
                                                onChange={(e) => setExtensionTransactionNumber(e.target.value)}
                                                placeholder="Enter transaction number"
                                                className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleSubmitExtensionVerification}
                                            disabled={isSubmittingExtension || !extensionTransactionNumber.trim()}
                                            className="w-full rounded-xl bg-green-600 py-3.5 font-bold text-white hover:bg-green-700"
                                        >
                                            {isSubmittingExtension ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Verifying...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Submit Extension Verification
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {extensionStep === 'success' && (
                                    <div className="text-center space-y-3">
                                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                                        <h3 className="text-lg font-black text-gray-900">Booking Extended Successfully</h3>
                                        <div className="space-y-2 text-left">
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Booking</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    #{String(booking.id).padStart(6, '0')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Table</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    Table {booking.tables.map(t => t.table_number).join(', ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Extension Payment</span>
                                                <span className="text-sm font-bold text-green-600">
                                                    {extensionAmount ? extensionAmount.toFixed(2) : '0.00'} ETB
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Extension Status</span>
                                                <span className="text-sm font-bold text-green-600">Paid</span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                <span className="text-sm font-semibold text-gray-500">Time Remaining</span>
                                                <span className="text-sm font-bold text-gray-900">{timeRemaining}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {extensionStep === 'rejected' && (
                                    <div className="text-center space-y-3">
                                        <XCircle className="mx-auto h-12 w-12 text-red-500" />
                                        <h3 className="text-lg font-black text-gray-900">Extension Payment Rejected</h3>
                                        <p className="text-sm text-gray-500">
                                            Your extension payment could not be verified. The booking extension was not applied.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={handleCloseExtension}
                                            className="w-full rounded-xl py-3.5"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                )}

                                {/* Customer Info */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                        Customer
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {booking.customer_name}
                                    </p>
                                    <p className="mt-0.5 text-sm text-gray-500">
                                        Phone:{' '}
                                        <span className="font-bold text-gray-900">
                                            {booking.customer_phone}
                                        </span>
                                    </p>
                                </div>

                                {/* Booking ID */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                        Booking ID
                                    </p>
                                    <p className="font-bold text-gray-900">
                                        BK-{String(booking.id).padStart(6, '0')}
                                    </p>
                                </div>

                                {/* Booked Tables */}
                                <div className="rounded-2xl bg-stone-50 p-4">
                                    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                        Reserved Tables
                                    </p>
                                    <div className="space-y-2">
                                        {booking.tables.map((table) => (
                                            <div
                                                key={table.id}
                                                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                                    <Table2 className="h-5 w-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        Table{' '}
                                                        {table.table_number}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Reserved
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="default"
                                                    className="ml-auto bg-red-500"
                                                >
                                                    Reserved
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Booking Time & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-stone-50 p-4">
                                        <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            Booking Time
                                        </p>
                                        <p className="font-bold text-gray-900">
                                            {formatTime(booking.booked_at)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-stone-50 p-4">
                                        <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            Booking Date
                                        </p>
                                        <p className="font-bold text-gray-900">
                                            {formatDate(booking.booked_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 pt-2">
                                    {showCancelButton && paymentStep === 'idle' && extensionStep === 'idle' && (
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={isCancelling}
                                            className="w-full rounded-xl border-red-200 py-3.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            {isCancelling ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Cancelling...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <XCircle className="h-4 w-4" />
                                                    Cancel Booking
                                                </span>
                                            )}
                                        </Button>
                                    )}

                                    {paymentStep === 'idle' && booking && !isExpired && booking.status === 'active' && booking.payment_status !== 'paid' && (
                                        <Button
                                            onClick={handlePayNow}
                                            disabled={isPaying}
                                            className="w-full rounded-xl bg-green-600 py-3.5 text-white hover:bg-green-700"
                                        >
                                            {isPaying ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Pay Now
                                                </span>
                                            )}
                                        </Button>
                                    )}

                                    {/* Payment Flow UI */}
                                    {paymentStep === 'select' && (
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-black text-gray-900">Make Payment</h3>
                                            <p className="text-sm text-gray-500">Select Payment Method</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.entries(bookingPaymentAccounts).map(([key, account]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => handleSelectMethod(key)}
                                                        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-red-100 p-4 transition hover:border-red-300 hover:bg-red-50"
                                                    >
                                                        <span className="text-2xl">
                                                            {key === 'telebirr' ? '📱' : '🏦'}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {account.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                onClick={handleClosePayment}
                                                className="w-full text-gray-500"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}

                                    {paymentStep === 'account' && selectedPaymentMethod && (
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-black text-gray-900">
                                                {bookingPaymentAccounts[selectedPaymentMethod].label} Payment
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {bookingPaymentAccounts[selectedPaymentMethod].label} Account Number
                                            </p>
                                            <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50 p-4 text-center">
                                                <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                                                    Account Number
                                                </p>
                                                <p className="mt-2 font-mono text-xl font-black tracking-wider text-stone-900 select-all">
                                                    {bookingPaymentAccounts[selectedPaymentMethod].number}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleCopyAccount}
                                                disabled={copySuccess || isCopying}
                                                className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3.5 font-bold text-white hover:from-red-600 hover:to-red-700"
                                            >
                                                {isCopying ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        Submitting...
                                                    </span>
                                                ) : copySuccess ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Check className="h-4 w-4" />
                                                        Copied
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Copy className="h-4 w-4" />
                                                        Copy
                                                    </span>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={handleClosePayment}
                                                className="w-full text-gray-500"
                                            >
                                                Back
                                            </Button>
                                        </div>
                                    )}

                                    {paymentStep === 'verification' && selectedPaymentMethod && booking && (
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-black text-gray-900">
                                                Payment Verification
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Booking</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        #{String(booking.id).padStart(6, '0')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Table</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        Table {booking.tables.map(t => t.table_number).join(', ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Payment Method</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {bookingPaymentAccounts[selectedPaymentMethod].label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Amount</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        0.00 ETB
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                                    Upload Payment Screenshot
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={handleScreenshotChange}
                                                    className="hidden"
                                                    id="payment-screenshot"
                                                />
                                                {!screenshotPreview ? (
                                                    <label
                                                        htmlFor="payment-screenshot"
                                                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition hover:border-red-400"
                                                    >
                                                        <Upload className="mb-2 h-8 w-8 text-gray-400" />
                                                        <span className="text-sm font-semibold text-gray-600">
                                                            Choose Screenshot
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            JPG, PNG, WEBP up to 5MB
                                                        </span>
                                                    </label>
                                                ) : (
                                                    <div className="relative rounded-xl border border-gray-200 p-2">
                                                        <img
                                                            src={screenshotPreview}
                                                            alt="Payment screenshot preview"
                                                            className="mx-auto max-h-48 rounded-lg object-contain"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveScreenshot}
                                                            className="absolute right-3 top-3 rounded-full bg-red-600 p-1 text-white transition hover:bg-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                onClick={handleSubmitVerification}
                                                disabled={isSubmittingVerification || !paymentScreenshot}
                                                className="w-full rounded-xl bg-green-600 py-3.5 font-bold text-white hover:bg-green-700"
                                            >
                                                {isSubmittingVerification ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Submitting...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Submit Payment
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {paymentStep === 'success' && booking && (
                                        <div className="text-center space-y-3">
                                            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                                            <h3 className="text-lg font-black text-gray-900">Payment Successful</h3>
                                            <div className="space-y-2 text-left">
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Booking</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        #{String(booking.id).padStart(6, '0')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Table</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        Table {booking.tables.map(t => t.table_number).join(', ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Payment Status</span>
                                                    <span className="text-sm font-bold text-green-600">Paid</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                                                    <span className="text-sm font-semibold text-gray-500">Time Remaining</span>
                                                    <span className="text-sm font-bold text-gray-900">{timeRemaining}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        variant="ghost"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="w-full rounded-xl py-3.5 text-gray-500 hover:bg-gray-50"
                                    >
                                        {isRefreshing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Refresh Booking Status
                                    </Button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
