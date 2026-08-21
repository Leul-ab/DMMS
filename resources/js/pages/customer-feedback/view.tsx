import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, User } from 'lucide-react';
import { StarRating } from '@/components/star-rating';

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: string;
    created_at: string;
    table: { id: number; table_number: number };
    order_items: {
        id: number;
        quantity: number;
        special_preferences?: string[];
        menu_item: { id: number; name: string };
    }[];
};

type Feedback = {
    id: number;
    overall_rating: number;
    comment: string | null;
    anonymous: boolean;
    created_at: string;
    customer: { id: number; name: string } | null;
};

type Props = {
    order: Order;
    feedback: Feedback;
};

export default function CustomerFeedbackView({ order, feedback }: Props) {
    const primaryItem = order.order_items[0]?.menu_item.name ?? 'Your Order';
    const customerName = feedback.anonymous
        ? 'Anonymous Customer'
        : (feedback.customer?.name ?? 'Customer');

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title="Your Feedback" />

            <div className="min-h-screen bg-stone-50 text-gray-900">
                <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
                        <Link href="/customer-my-order" className="group">
                            <h1 className="text-2xl font-black tracking-tight transition group-hover:text-red-600">
                                DINE<span className="text-red-500">.</span>
                            </h1>
                            <p className="text-xs font-medium tracking-widest text-gray-500 uppercase">
                                Digital Menu
                            </p>
                        </Link>

                        <Link href="/customer-my-order">
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Orders
                            </span>
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-2xl px-5 py-10">
                    {/* Page Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                            Your Review
                        </h1>
                        <p className="mt-2 text-gray-500">{primaryItem}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-400">
                            Order {order.order_number} · Table{' '}
                            {order.table.table_number}
                        </p>
                    </div>

                    <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                        {/* Overall Service Rating */}
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
                            <p className="text-lg font-black text-red-800">
                                Overall Service Rating
                            </p>
                            <StarRating
                                value={feedback.overall_rating}
                                readOnly
                                size="lg"
                            />
                            <p className="text-2xl font-black text-stone-800">
                                {feedback.overall_rating}.0 / 5.0
                            </p>
                        </div>

                        {/* Comment */}
                        {feedback.comment && (
                            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5">
                                <p className="text-sm font-bold text-stone-700">
                                    Comment
                                </p>
                                <p className="mt-2 text-stone-600">
                                    "{feedback.comment}"
                                </p>
                            </div>
                        )}

                        {/* Submitted By */}
                        <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <User className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-stone-700">
                                    Submitted By: {customerName}
                                </p>
                                <p className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    Submitted On:{' '}
                                    {formatDateTime(feedback.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* Back Button */}
                        <Link
                            href="/customer-my-order"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 font-black text-white shadow-lg shadow-red-500/25 transition hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 active:scale-[0.98]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to My Orders
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}
