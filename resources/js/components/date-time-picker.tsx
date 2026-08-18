import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
} from 'lucide-react';
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { cn } from '@/lib/utils';

import {
    Dialog,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    id?: string;
    minDate?: string;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS = ['AM', 'PM'] as const;

function pad2(value: number) {
    return String(value).padStart(2, '0');
}

function formatDate(date: Date) {
    return [
        date.getFullYear(),
        pad2(date.getMonth() + 1),
        pad2(date.getDate()),
    ].join('-');
}

function parseValue(value: string) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function toDisplay(value: string) {
    const date = parseValue(value);

    if (!date) {
        return '';
    }

    const month = date.toLocaleString('en-US', { month: 'short' });
    const time = date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return `${month} ${date.getDate()}, ${date.getFullYear()} ${time}`;
}

function DateTimePicker({
    value,
    onChange,
    placeholder = 'Select date & time',
    className,
    error,
    id,
    minDate,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);

    const parsedValue = React.useMemo(() => parseValue(value), [value]);

    const [draftDate, setDraftDate] = React.useState('');
    const [draftHour, setDraftHour] = React.useState(12);
    const [draftMinute, setDraftMinute] = React.useState(0);
    const [draftPeriod, setDraftPeriod] =
        React.useState<(typeof PERIODS)[number]>('AM');

    const [currentMonth, setCurrentMonth] = React.useState(() => {
        const date = parsedValue ?? new Date();

        return new Date(date.getFullYear(), date.getMonth(), 1);
    });

    const [showMonthPicker, setShowMonthPicker] = React.useState(false);

    const hourColRef = React.useRef<HTMLDivElement>(null);
    const minuteColRef = React.useRef<HTMLDivElement>(null);

    const initializeDraft = React.useCallback(() => {
        const date = parsedValue ?? new Date();

        setDraftDate(formatDate(date));

        let hour = date.getHours();

        const period = hour >= 12 ? 'PM' : 'AM';

        hour = hour % 12;

        if (hour === 0) {
            hour = 12;
        }

        setDraftHour(hour);

        const roundedMinute = Math.round(date.getMinutes() / 5) * 5;

        setDraftMinute(roundedMinute >= 60 ? 55 : roundedMinute);

        setDraftPeriod(period);

        setCurrentMonth(
            new Date(date.getFullYear(), date.getMonth(), 1),
        );

        setShowMonthPicker(false);
    }, [parsedValue]);

    const handleOpen = () => {
        initializeDraft();
        setOpen(true);
    };

    const isDateDisabled = (date: Date) => {
        const check = new Date(date);

        check.setHours(0, 0, 0, 0);

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (check < today && formatDate(check) !== draftDate) {
            return true;
        }

        if (minDate) {
            const min = new Date(minDate);

            min.setHours(0, 0, 0, 0);

            if (check < min) {
                return true;
            }
        }

        return false;
    };

    const handleDateSelect = (date: Date) => {
        if (isDateDisabled(date)) {
            return;
        }

        setDraftDate(formatDate(date));
    };

    const handleOk = () => {
        if (!draftDate) {
            return;
        }

        let hour24 = draftHour % 12;

        if (draftPeriod === 'PM') {
            hour24 += 12;
        }

        const [year, month, day] = draftDate.split('-').map(Number);

        const date = new Date(
            year,
            month - 1,
            day,
            hour24,
            draftMinute,
            0,
            0,
        );

        const timezoneOffset = date.getTimezoneOffset() * 60000;

        const localISO = new Date(
            date.getTime() - timezoneOffset,
        )
            .toISOString()
            .slice(0, 16);

        onChange(localISO);

        setOpen(false);
    };

    const handleCancel = () => {
        setOpen(false);
    };

    const generateCalendarDays = () => {
        const days: {
            date: Date;
            isCurrentMonth: boolean;
        }[] = [];

        const firstDay = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1,
        );

        const startDate = new Date(firstDay);

        startDate.setDate(startDate.getDate() - startDate.getDay());

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);

            date.setDate(startDate.getDate() + i);

            days.push({
                date,
                isCurrentMonth:
                    date.getMonth() === currentMonth.getMonth(),
            });
        }

        return days;
    };

    const isSelectedDate = (date: Date) => {
        if (!draftDate) {
            return false;
        }

        return formatDate(date) === draftDate;
    };

    const prevMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1,
            ),
        );
    };

    const nextMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1,
            ),
        );
    };

    const prevYear = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear() - 1,
                currentMonth.getMonth(),
                1,
            ),
        );
    };

    const nextYear = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear() + 1,
                currentMonth.getMonth(),
                1,
            ),
        );
    };

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const itemHeight = 36;

        const frame = requestAnimationFrame(() => {
            if (hourColRef.current) {
                hourColRef.current.scrollTop =
                    (draftHour - 1) * itemHeight - 80;
            }

            if (minuteColRef.current) {
                minuteColRef.current.scrollTop =
                    (draftMinute / 5) * itemHeight - 80;
            }
        });

        return () => cancelAnimationFrame(frame);
    }, [open, draftHour, draftMinute]);

    const displayValue = parsedValue ? toDisplay(value) : placeholder;

    return (
        <div className="relative w-full">
            <button
                type="button"
                id={id}
                onClick={handleOpen}
                className={cn(
                    'flex h-10 w-full min-w-0 items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm outline-none transition-colors',
                    error
                        ? 'border-red-500'
                        : 'border-input',
                    'hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
                    className,
                )}
            >
                <CalendarIcon className="h-4 w-4 shrink-0 text-red-600" />

                <span
                    className={cn(
                        'flex-1 truncate text-left',
                        !value && 'text-muted-foreground',
                    )}
                >
                    {displayValue}
                </span>
            </button>

            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogPortal>
                    <DialogOverlay className="z-[100] bg-black/60" />

                    <DialogPrimitive.Content
                        onOpenAutoFocus={(event) =>
                            event.preventDefault()
                        }
                        className={cn(
                            'fixed left-1/2 top-1/2 z-[100] flex max-h-[92vh] w-[92vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl focus:outline-none',
                        )}
                    >
                        <DialogTitle className="sr-only">
                            Select date and time
                        </DialogTitle>

                        <div className="flex flex-col sm:flex-row">
                            {/* =====================================
                                CALENDAR
                            ===================================== */}
                            <div className="relative w-full border-b border-gray-200 p-4 sm:w-[320px] sm:border-r sm:border-b-0">
                                {/* Month header */}
                                <div className="mb-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={prevMonth}
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-900 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowMonthPicker(
                                                (prev) => !prev,
                                            )
                                        }
                                        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-red-50 hover:text-red-600"
                                    >
                                        {currentMonth.toLocaleString(
                                            'en-US',
                                            {
                                                month: 'long',
                                                year: 'numeric',
                                            },
                                        )}
                                        <ChevronDown className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={nextMonth}
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-900 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Month / Year picker */}
                                {showMonthPicker && (
                                    <div className="absolute left-4 right-4 top-14 z-10 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
                                        <div className="mb-2 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={prevYear}
                                                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-900 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {
                                                    currentMonth.getFullYear()
                                                }
                                            </span>
                                            <button
                                                type="button"
                                                onClick={nextYear}
                                                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-900 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-1">
                                            {MONTHS.map((month, index) => (
                                                <button
                                                    key={month}
                                                    type="button"
                                                    onClick={() => {
                                                        setCurrentMonth(
                                                            new Date(
                                                                currentMonth.getFullYear(),
                                                                index,
                                                                1,
                                                            ),
                                                        );
                                                        setShowMonthPicker(
                                                            false,
                                                        );
                                                    }}
                                                    className={cn(
                                                        'rounded px-1 py-1.5 text-xs font-medium transition-colors',
                                                        index ===
                                                            currentMonth.getMonth()
                                                            ? 'bg-red-600 text-white'
                                                            : 'text-gray-900 hover:bg-red-50 hover:text-red-600',
                                                    )}
                                                >
                                                    {month}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Weekdays */}
                                <div className="mb-1 grid grid-cols-7">
                                    {DAYS.map((day) => (
                                            <div
                                                key={day}
                                                className="py-1 text-center text-xs font-semibold text-gray-500"
                                            >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar days */}
                                <div className="grid grid-cols-7">
                                    {generateCalendarDays().map(
                                        (item, index) => {
                                            const disabled =
                                                !item.isCurrentMonth ||
                                                isDateDisabled(item.date);

                                            const selected = isSelectedDate(
                                                item.date,
                                            );

                                            return (
                                                <div
                                                    key={`${formatDate(
                                                        item.date,
                                                    )}-${index}`}
                                                    className="flex items-center justify-center py-1"
                                                >
                                                    <button
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() => {
                                                            if (!disabled) {
                                                                handleDateSelect(
                                                                    item.date,
                                                                );
                                                            }
                                                        }}
                                                        className={cn(
                                                            'flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                                                            disabled &&
                                                                'cursor-not-allowed text-gray-300',
                                                            !disabled &&
                                                                !selected &&
                                                                'text-gray-900 hover:bg-red-50 hover:text-red-600',
                                                            selected &&
                                                                'bg-red-600 font-semibold text-white',
                                                        )}
                                                    >
                                                        {item.date.getDate()}
                                                    </button>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>

                            {/* =====================================
                                TIME
                            ===================================== */}
                            <div className="w-full p-4 sm:w-[230px]">
                                {/* Column headers */}
                                <div className="mb-2 grid grid-cols-3 border-b border-gray-200 pb-2">
                                    <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                        Hr
                                    </div>
                                    <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                        Min
                                    </div>
                                    <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                        AM/PM
                                    </div>
                                </div>

                                <div className="grid h-64 grid-cols-3 divide-x divide-gray-200">
                                    {/* Hours */}
                                    <div
                                        ref={hourColRef}
                                        className="no-scrollbar overflow-y-auto"
                                    >
                                        {HOURS.map((hour) => (
                                            <button
                                                key={hour}
                                                type="button"
                                                onClick={() =>
                                                    setDraftHour(hour)
                                                }
                                                className={cn(
                                                    'flex h-9 w-full items-center justify-center text-sm font-medium transition-colors',
                                                    draftHour === hour
                                                        ? 'bg-red-600 font-semibold text-white'
                                                        : 'text-gray-900 hover:bg-red-50 hover:text-red-600',
                                                )}
                                            >
                                                {pad2(hour)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Minutes */}
                                    <div
                                        ref={minuteColRef}
                                        className="no-scrollbar overflow-y-auto"
                                    >
                                        {MINUTES.map((minute) => (
                                            <button
                                                key={minute}
                                                type="button"
                                                onClick={() =>
                                                    setDraftMinute(minute)
                                                }
                                                className={cn(
                                                    'flex h-9 w-full items-center justify-center text-sm font-medium transition-colors',
                                                    draftMinute === minute
                                                        ? 'bg-red-600 font-semibold text-white'
                                                        : 'text-gray-900 hover:bg-red-50 hover:text-red-600',
                                                )}
                                            >
                                                {pad2(minute)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* AM / PM */}
                                    <div className="no-scrollbar overflow-y-auto">
                                        {PERIODS.map((period) => (
                                            <button
                                                key={period}
                                                type="button"
                                                onClick={() =>
                                                    setDraftPeriod(period)
                                                }
                                                className={cn(
                                                    'flex h-9 w-full items-center justify-center text-sm font-medium transition-colors',
                                                    draftPeriod === period
                                                        ? 'bg-red-600 font-semibold text-white'
                                                        : 'text-gray-900 hover:bg-red-50 hover:text-red-600',
                                                )}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =====================================
                            FOOTER
                        ===================================== */}
                        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-900 hover:bg-red-50 hover:text-red-600"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleOk}
                                disabled={!draftDate}
                                className="rounded-md bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                OK
                            </button>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPortal>
            </Dialog>
        </div>
    );
}

export { DateTimePicker };
