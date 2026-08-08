type OrderProgressBarProps = {
    status: string;
    preparationStartedAt?: string | null;
    preparationTime?: number | null;
    estimatedMinutes?: number | null;
    size?: 'sm' | 'lg';
};

const STATUS_PERCENT: Record<string, number> = {
    pending: 20,
    received: 20,
    confirmed: 40,
    preparing: 60,
    ready: 80,
    served: 100,
    completed: 100,
    cancelled: 0,
};

function getProgressPercent(status: string, preparationStartedAt?: string | null, preparationTime?: number | null): number {
    // If preparing with an active timer, interpolate from 60% toward 80% based on elapsed time.
    if (status === 'preparing' && preparationStartedAt && preparationTime) {
        const startedAt = new Date(preparationStartedAt).getTime();
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
        const total = preparationTime * 60;
        const fraction = Math.min(1, elapsed / total);

        return Math.min(80, Math.round(60 + fraction * 20));
    }

    return STATUS_PERCENT[status] ?? 20;
}

// The progress bar uses one consistent color regardless of order status.
// Only the width/percentage changes to reflect different progress levels.
function getBarColor(): string {
    return 'bg-green-500';
}

export function OrderProgressBar({
    status,
    preparationStartedAt,
    preparationTime,
    size = 'sm',
}: OrderProgressBarProps) {
    const percent = getProgressPercent(status, preparationStartedAt, preparationTime);
    const isLarge = size === 'lg';
    const barColor = getBarColor();
    const isCancelled = status === 'cancelled';

    return (
        <div className="w-full">
            <div className="mb-1.5 flex items-center justify-between">
                <span className={`font-semibold ${isLarge ? 'text-sm' : 'text-xs'} text-gray-500`}>
                    Order Progress
                </span>
                <span className={`font-bold ${isLarge ? 'text-sm' : 'text-xs'} ${
                    isCancelled
                        ? 'text-red-600'
                        : percent >= 80
                            ? 'text-green-600'
                            : 'text-gray-700'
                }`}>
                    {isCancelled ? '0%' : `${percent}%`}
                </span>
            </div>

            <div className={`w-full overflow-hidden rounded-full bg-gray-100 ${isLarge ? 'h-3' : 'h-2.5'}`}>
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
                    style={{ width: `${isCancelled ? 0 : percent}%` }}
                />
            </div>
        </div>
    );
}
