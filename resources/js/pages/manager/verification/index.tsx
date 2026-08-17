import { Head, router, usePage } from '@inertiajs/react';
import { Bell, ShieldCheck } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import BookingPaymentTab from '@/pages/manager/verification/booking-payment';
import PaymentVerificationTab from '@/pages/manager/verification/payment-verification';
import type { PaginatedData } from '@/types';

type Stats = {
    pending: number;
    verified: number;
    rejected: number;
};

type BookingPaymentStats = {
    pending: number;
    read: number;
    verified: number;
    rejected: number;
};

type PaymentFilters = {
    search?: string;
    payment_status?: string;
    payment_method?: string;
};

type PaymentProps = {
    orders: PaginatedData<any>;
    extensions: any[];
    stats: Stats;
    filters: PaymentFilters;
};

type BookingPaymentProps = {
    notifications: PaginatedData<any>;
    stats: BookingPaymentStats;
    filters: {
        search?: string;
        status?: string;
    };
};

type PageProps = {
    activeTab: 'payment' | 'booking';
} & (PaymentProps | BookingPaymentProps);

export default function VerificationIndex() {
    const { activeTab, ...rest } = usePage<PageProps>().props;

    const isPayment = activeTab === 'payment';

    const paymentProps = (rest as PaymentProps);
    const bookingPaymentProps = (rest as BookingPaymentProps);

    const switchToPayment = () => {
        router.get('/manager/payment-verification', {}, { preserveState: true });
    };

    const switchToBooking = () => {
        router.get('/manager/booking-payment', {}, { preserveState: true });
    };

    return (
        <>
            <Head title="Verification" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Verification"
                    description="Verify and manage customer payments and table bookings."
                    icon={ShieldCheck}
                />

                {/* Horizontal Tabs */}
                <div className="flex w-full overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
                    <Button
                        variant="ghost"
                        onClick={switchToPayment}
                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-bold transition-all ${
                            isPayment
                                ? 'border-b-2 border-red-600 bg-white text-red-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        {isPayment && <ShieldCheck className="mr-2 size-4" />}
                        {isPayment ? 'PAYMENT VERIFICATION' : 'Payment Verification'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={switchToBooking}
                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-bold transition-all ${
                            !isPayment
                                ? 'border-b-2 border-red-600 bg-white text-red-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        <Bell className="mr-2 size-4" />
                        {!isPayment ? 'BOOKING PAYMENT' : 'Booking Payment'}
                        {!isPayment && bookingPaymentProps.stats.pending > 0 && (
                            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] leading-none font-semibold text-white">
                                {bookingPaymentProps.stats.pending > 99 ? '99+' : bookingPaymentProps.stats.pending}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Tab Content */}
                {isPayment ? (
                    <PaymentVerificationTab
                        orders={paymentProps.orders}
                        extensions={paymentProps.extensions}
                        stats={paymentProps.stats}
                        filters={paymentProps.filters}
                    />
                ) : (
                    <BookingPaymentTab
                        notifications={bookingPaymentProps.notifications}
                        stats={bookingPaymentProps.stats}
                        filters={bookingPaymentProps.filters}
                    />
                )}
            </div>
        </>
    );
}

VerificationIndex.layout = {
    breadcrumbs: [
        { title: 'Verification', href: '/manager/payment-verification' },
    ],
};
