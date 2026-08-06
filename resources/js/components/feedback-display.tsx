import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { StarRating } from '@/components/star-rating';

type FeedbackDisplayProps = {
    feedback: {
        id: number;
        overall_rating: number;
        comment: string | null;
        anonymous: boolean;
        customer: {
            id: number;
            name: string;
        } | null;
    };
    orderId?: number;
};

export function FeedbackDisplay({ feedback, orderId }: FeedbackDisplayProps) {
    const customerName = feedback.anonymous
        ? 'Anonymous Customer'
        : feedback.customer?.name ?? 'Customer';

    return (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-800">
                    Your Rating
                </p>
                <StarRating
                    value={feedback.overall_rating}
                    readOnly
                    size="sm"
                />
            </div>

            {feedback.comment && (
                <div className="mt-4 rounded-lg bg-white/70 p-3">
                    <p className="text-xs font-semibold text-stone-500">
                        Comment
                    </p>
                    <p className="mt-1 text-sm text-stone-700">
                        "{feedback.comment}"
                    </p>
                </div>
            )}

            <p className="mt-3 text-xs font-semibold text-stone-500">
                Customer: {customerName}
            </p>

            {orderId && (
                <Link
                    href={`/customer/orders/${orderId}/feedback/view`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition hover:from-amber-500 hover:to-amber-600 hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98]"
                >
                    <Eye className="h-4 w-4" />
                    View Feedback
                </Link>
            )}
        </div>
    );
}
