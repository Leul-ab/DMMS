import { Head, router, usePage } from '@inertiajs/react';
import { Bell, ShieldCheck } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import BookingVerificationTab from '@/pages/manager/verification/booking-verification';
import PaymentVerificationTab from '@/pages/manager/verification/payment-verification';
import type { PaginatedData } from '@/types';

type Stats = {
    pending: number;
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

type BookingVerificationProps = {
    notifications: PaginatedData<any>;
    stats: {
        pending: number;
        verified: number;
        rejected: number;
        expired: number;
        cancelled: number;
    };
    filters: {
        search?: string;
        status?: string;
        payment_method?: string;
        verification_type?: string;
    };
};

type PageProps = {
    activeTab: 'payment' | 'booking';
} & (PaymentProps | BookingVerificationProps);

export default function VerificationIndex() {
    const { activeTab, ...rest } = usePage<PageProps>().props;

    const isPayment = activeTab === 'payment';

    const paymentProps = rest as PaymentProps;
    const bookingProps = rest as BookingVerificationProps;

    const switchToPayment = () => {
        router.get('/manager/payment-verification', {}, { preserveState: true });
    };

    const switchToBooking = () => {
        router.get('/manager/booking-verification', {}, { preserveState: true });
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
                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-bold transition-all ${isPayment
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
                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-bold transition-all ${!isPayment
                                ? 'border-b-2 border-red-600 bg-white text-red-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        {!isPayment && <Bell className="mr-2 size-4" />}
                        {!isPayment ? 'BOOKING VERIFICATION' : 'Booking Verification'}
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
                    <BookingVerificationTab
                        notifications={bookingProps.notifications}
                        stats={bookingProps.stats}
                        filters={bookingProps.filters}
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
