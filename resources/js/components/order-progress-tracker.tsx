import { CheckCircle2, Clock, ChefHat, PackageCheck, PartyPopper } from 'lucide-react';
import { useEffect, useState } from 'react';

type OrderProgressTrackerProps = {
    status: string;
    preparationStartedAt?: string | null;
    preparationTime?: number | null;
    estimatedMinutes?: number | null;
    size?: 'sm' | 'lg';
    showCountdown?: boolean;
};

const STAGES = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: PackageCheck },
    { key: 'completed', label: 'Completed', icon: PartyPopper },
] as const;

const STATUS_INDEX: Record<string, number> = {
    pending: 0,
    received: 0,
    confirmed: 1,
    preparing: 2,
    ready: 3,
    served: 3,
    completed: 4,
    cancelled: 0,
};

function getStageIndex(status: string): number {
    return STATUS_INDEX[status] ?? 0;
}

function formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function OrderProgressTracker({
    status,
    preparationStartedAt,
    preparationTime,
    estimatedMinutes,
    size = 'sm',
    showCountdown = true,
}: OrderProgressTrackerProps) {
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [elapsedPercent, setElapsedPercent] = useState(0);

    const stageIndex = getStageIndex(status);
    const isFinished = status === 'ready' || status === 'served' || status === 'completed';
    const isCancelled = status === 'cancelled';
    const hasActiveTimer = status === 'preparing' && Boolean(preparationStartedAt && preparationTime);

    const totalPrepMinutes = preparationTime || estimatedMinutes || 0;
    const displayPrepTime = preparationTime || estimatedMinutes;

    // Live countdown timer. Calculate immediately as well as every second, so
    // the first render never shows a misleading empty countdown.
    useEffect(() => {
        if (!hasActiveTimer) {
            setRemainingSeconds(null);
            setElapsedPercent(0);
            return;
        }

        const updateTimer = () => {
            const startedAt = new Date(preparationStartedAt!).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startedAt) / 1000);
            const total = preparationTime! * 60;
            const remaining = Math.max(0, total - elapsed);
            const progress = Math.min(100, Math.round((elapsed / total) * 100));

            setRemainingSeconds(remaining);
            setElapsedPercent(progress);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [hasActiveTimer, preparationStartedAt, preparationTime, status]);

    const stagePercent = stageIndex * 25;
    const effectivePercent = isCancelled
        ? 0
        : isFinished
            ? 100
            : status === 'preparing'
                ? Math.max(stagePercent, Math.min(75, 50 + Math.round(elapsedPercent * 0.25)))
                : stagePercent;
    const effectiveRemaining = isFinished ? 0 : remainingSeconds;
    const isTimerRunning = hasActiveTimer && remainingSeconds !== null && remainingSeconds > 0;
    const isTimerExpired = effectiveRemaining !== null && effectiveRemaining <= 0;

    const isLarge = size === 'lg';

    return (
        <div className="w-full">
            {/* ===== Stage Tracker ===== */}
            <div className="flex items-center">
                {STAGES.map((stage, index) => {
                    const isCompleted = index < stageIndex;
                    const isCurrent = index === stageIndex;
                    const Icon = stage.icon;

                    return (
                        <div key={stage.key} className="flex flex-1 items-center last:flex-none">
                            {/* Stage Node */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex items-center justify-center rounded-full transition-all duration-500 ${
                                        isLarge ? 'h-12 w-12' : 'h-9 w-9'
                                    } ${
                                        isCompleted
                                            ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                                            : isCurrent
                                                ? isCancelled
                                                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                                                    : 'bg-green-600 text-white shadow-md shadow-green-600/30 ring-4 ring-green-100'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className={isLarge ? 'h-6 w-6' : 'h-4 w-4'} />
                                    ) : (
                                        <Icon className={isLarge ? 'h-5 w-5' : 'h-4 w-4'} />
                                    )}
                                </div>

                                <span
                                    className={`mt-2 font-semibold ${
                                        isLarge ? 'text-sm' : 'text-[11px]'
                                    } ${
                                        isCompleted
                                            ? 'text-green-600'
                                            : isCurrent
                                                ? isCancelled
                                                    ? 'text-red-600'
                                                    : 'text-green-700'
                                                : 'text-gray-400'
                                    }`}
                                >
                                    {stage.label}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < STAGES.length - 1 && (
                                <div
                                    className={`mx-1 flex-1 rounded-full transition-all duration-700 ${
                                        isLarge ? 'h-1.5' : 'h-1'
                                    } ${
                                        index < stageIndex
                                            ? 'bg-green-500'
                                            : index === stageIndex && !isCancelled
                                                ? 'bg-green-200'
                                                : 'bg-gray-200'
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ===== Progress Bar ===== */}
            <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                    <span className={`font-semibold ${isLarge ? 'text-sm' : 'text-xs'} text-gray-500`}>
                        {isCancelled
                            ? 'Order Cancelled'
                            : isFinished
                                ? status === 'completed'
                                    ? 'Order Completed'
                                    : 'Ready for Pickup/Service'
                                : isTimerRunning
                                    ? 'Preparing Your Order'
                                    : 'Order Progress'}
                    </span>
                    <span
                        className={`font-bold ${
                            isLarge ? 'text-sm' : 'text-xs'
                        } ${
                            isCancelled
                                ? 'text-red-600'
                                : effectivePercent >= 100
                                    ? 'text-green-600'
                                    : 'text-green-700'
                        }`}
                    >
                        {isCancelled ? '0%' : `${effectivePercent}%`}
                    </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                            isCancelled ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${isCancelled ? 0 : effectivePercent}%` }}
                    />
                </div>
            </div>

            {/* ===== Countdown / Prep Info ===== */}
            {showCountdown && displayPrepTime && !isCancelled && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    {isTimerRunning && remainingSeconds !== null && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                            <Clock className="h-3.5 w-3.5" />
                            {formatCountdown(remainingSeconds)} remaining
                        </span>
                    )}

                    {isTimerExpired && !isFinished && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                            <Clock className="h-3.5 w-3.5" />
                            Preparation time reached
                        </span>
                    )}

                    {isFinished && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {status === 'completed' ? 'Completed' : 'Ready for Pickup/Service'}
                        </span>
                    )}

                    {!isTimerRunning && !isFinished && !isTimerExpired && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            Est. {totalPrepMinutes} min
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
