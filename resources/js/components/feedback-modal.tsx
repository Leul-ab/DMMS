import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { StarRating } from '@/components/star-rating';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type FeedbackModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmitted?: () => void;
    order: {
        id: number;
        order_number: string;
        order_items: {
            id: number;
            quantity: number;
            menu_item: { id: number; name: string };
        }[];
    };
};

export function FeedbackModal({ open, onOpenChange, onSubmitted, order }: FeedbackModalProps) {
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
                    onOpenChange(false);
                    toast.success('Thank you for your feedback! Your overall service rating has been submitted successfully.');
                    // Notify parent so the Rate Service button disappears immediately
                    onSubmitted?.();
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-center text-2xl font-black">
                        Rate Overall Service
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {primaryItem}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
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
            </DialogContent>
        </Dialog>
    );
}
