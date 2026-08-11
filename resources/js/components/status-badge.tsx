import { cn } from '@/lib/utils';

type StatusBadgeProps = {
    positive: boolean;
    positiveLabel: string;
    negativeLabel: string;
    className?: string;
};

/** A compact, consistent badge for binary positive/negative statuses. */
export default function StatusBadge({
    positive,
    positiveLabel,
    negativeLabel,
    className,
}: StatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                positive
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
                className,
            )}
        >
            {positive ? positiveLabel : negativeLabel}
        </span>
    );
}
