import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Send, Star } from 'lucide-react';
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
        menu_item: { id: number; name: string };
    }[];
};

type Customer = {
    id: number;
    name: string;
};

type Props = {
    order: Order;
    customer: Customer;
};

export default function CustomerFeedbackCreate({ order, customer }: Props) {
    const [overallRating, setOverallRating] = useState(0);
    const [comment, setComment] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!overallRating) {
            toast.error('Please select an overall rating before submitting.');
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/customer/orders/${order.id}/feedback`,
            {
                overall_rating: overallRating,
                comment: comment.trim() || null,
                anonymous,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    toast.success('Thank you for your feedback! Your overall service rating has been submitted successfully.');
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError || 'Failed to submit feedback. Please try again.');
                },
            }
        );
    };

    const primaryItem = order.order_items[0]?.menu_item.name ?? 'Your Order';

    return (
        <>
            <Head title="Rate Your Experience" />

            <div className="min-h-screen bg-stone-50 text-gray-900">
                <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
                        <Link href="/customer-my-order" className="group">
                            <h1 className="text-2xl font-black tracking-tight transition group-hover:text-orange-600">
                                DINE<span className="text-orange-500">.</span>
                            </h1>
                            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                                Digital Menu
                            </p>
                        </Link>

                        <Link href="/customer-my-order">
                            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-100">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Orders
                            </span>
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-2xl px-5 py-10">
                    {/* Page Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                            <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
                        </div>
                        <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                            Rate Overall Service
                        </h1>
                        <p className="mt-2 text-gray-500">{primaryItem}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-400">
                            Order {order.order_number} · Table {order.table.table_number}
                        </p>
                    </div>

                    <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                        {/* Overall Service Rating */}
                        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
                            <p className="text-lg font-black text-amber-800">
                                Overall Service Rating
                            </p>
                            <StarRating
                                value={overallRating}
                                onChange={setOverallRating}
                                size="lg"
                            />
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-stone-700">
                                Additional Comment (Optional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                placeholder="Tell us about your dining experience..."
                                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            />
                        </div>

                        {/* Anonymous */}
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-orange-200">
                            <input
                                type="checkbox"
                                checked={anonymous}
                                onChange={(e) => setAnonymous(e.target.checked)}
                                className="h-4 w-4 rounded border-stone-300 text-orange-500 focus:ring-orange-400"
                            />
                            <span className="text-sm font-semibold text-stone-700">
                                Submit anonymously
                            </span>
                        </label>

                        {/* Submit */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Submitting...
                                </span>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Rating
                                </>
                            )}
                        </button>
                    </div>
                </main>
            </div>
        </>
    );
}
