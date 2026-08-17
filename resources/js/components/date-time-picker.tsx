import { CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import * as React from 'react';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// TimeSpinner – stepper buttons (no native input, no select)
// ---------------------------------------------------------------------------
interface TimeSpinnerProps {
    value: string; // HH:MM 24-h
    onChange: (val: string) => void;
    label?: string;
}

function TimeSpinner({ value, onChange, label }: TimeSpinnerProps) {
    const parts = value.split(':');
    const h24Raw = parseInt(parts[0] ?? '9', 10);
    const mRaw = parseInt(parts[1] ?? '0', 10);
    const h24 = isNaN(h24Raw) ? 9 : Math.min(23, Math.max(0, h24Raw));
    const minute = isNaN(mRaw) ? 0 : Math.min(59, Math.max(0, mRaw));
    const isPM = h24 >= 12;
    const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;

    function emit(h: number, m: number) {
        onChange(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
    }
    function stepHour(dir: 1 | -1) {
        const next12 = ((hour12 - 1 + dir + 12) % 12) + 1;
        let h = next12 % 12;
        if (isPM) h += 12;
        emit(h, minute);
    }
    function stepMinute(dir: 1 | -1) {
        emit(h24, (minute + dir + 60) % 60);
    }
    function togglePeriod() {
        emit(isPM ? h24 - 12 : h24 + 12, minute);
    }

    const sp = (e: React.PointerEvent) => e.stopPropagation();

    const stepBtn =
        'flex h-7 w-7 items-center justify-center rounded border border-input bg-white ' +
        'text-muted-foreground hover:border-red-400 hover:bg-red-50 hover:text-red-600 ' +
        'active:bg-red-100 transition-colors text-xs font-bold select-none';
    const numDisplay =
        'min-w-[2.5rem] text-center text-lg font-semibold tabular-nums text-foreground select-none';

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                    <Clock className="h-3.5 w-3.5 text-red-600" />
                    {label}
                </span>
            )}
            <div className="flex items-center gap-3 rounded-lg border border-input bg-white px-4 py-3">
                {/* Hour */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" aria-label="Increase hour" className={stepBtn}
                        onPointerDown={sp} onClick={(e) => { e.stopPropagation(); stepHour(1); }}>▲</button>
                    <span className={numDisplay}>{String(hour12).padStart(2, '0')}</span>
                    <button type="button" aria-label="Decrease hour" className={stepBtn}
                        onPointerDown={sp} onClick={(e) => { e.stopPropagation(); stepHour(-1); }}>▼</button>
                </div>

                <span className="select-none text-2xl font-bold text-muted-foreground/40">:</span>

                {/* Minute */}
                <div className="flex flex-col items-center gap-1">
                    <button type="button" aria-label="Increase minute" className={stepBtn}
                        onPointerDown={sp} onClick={(e) => { e.stopPropagation(); stepMinute(1); }}>▲</button>
                    <span className={numDisplay}>{String(minute).padStart(2, '0')}</span>
                    <button type="button" aria-label="Decrease minute" className={stepBtn}
                        onPointerDown={sp} onClick={(e) => { e.stopPropagation(); stepMinute(-1); }}>▼</button>
                </div>

                {/* AM / PM */}
                <button
                    type="button"
                    aria-label="Toggle AM/PM"
                    onPointerDown={sp}
                    onClick={(e) => { e.stopPropagation(); togglePeriod(); }}
                    className={
                        'ml-1 rounded-lg border px-3 py-2 text-sm font-bold tracking-wide transition-colors ' +
                        (isPM
                            ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                            : 'border-input bg-white text-foreground hover:border-red-400 hover:bg-red-50 hover:text-red-600')
                    }
                >
                    {isPM ? 'PM' : 'AM'}
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// TimePickerDropdown
// A self-contained trigger + dropdown that opens a TimeSpinner inline.
// Uses a plain positioned div (no nested Radix Popover) so it works reliably
// inside the outer Radix PopoverContent without event conflicts.
// ---------------------------------------------------------------------------
interface TimePickerDropdownProps {
    value: string;           // HH:MM 24-h
    onChange: (val: string) => void;
    label: string;           // "Start" | "End"
    align?: 'left' | 'right';
}

function TimePickerDropdown({ value, onChange, label, align = 'left' }: TimePickerDropdownProps) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close on click-outside
    React.useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    // Close on Escape
    React.useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <div ref={containerRef} className="relative inline-block">
            {/* Trigger — the red time text */}
            <button
                type="button"
                aria-label={`Edit ${label.toLowerCase()} time`}
                aria-expanded={open}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className={cn(
                    'cursor-pointer rounded px-1 font-medium text-red-600 transition-colors',
                    'underline decoration-red-300 decoration-dotted underline-offset-2',
                    'hover:bg-red-50 hover:text-red-700',
                    'focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1',
                    open && 'bg-red-50',
                )}
            >
                {formatTime12(value)}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className={cn(
                        'absolute z-[9999] mt-1 rounded-xl border border-border bg-white p-4 shadow-xl',
                        align === 'right' ? 'right-0' : 'left-0',
                    )}
                    // min-width keeps it from being clipped
                    style={{ minWidth: '13rem' }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Panel header */}
                    <div className="mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/70">
                            <Clock className="h-3.5 w-3.5 text-red-600" />
                            {label} Time
                        </span>
                        <button
                            type="button"
                            aria-label="Close time picker"
                            onClick={() => setOpen(false)}
                            className="rounded p-0.5 text-muted-foreground/50 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Spinner */}
                    <TimeSpinner value={value} onChange={onChange} />

                    {/* Done */}
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// TimeSectionView – proper React.memo component (not a plain render function)
// ---------------------------------------------------------------------------
interface TimeSectionViewProps {
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
    onStartTimeChange: (val: string) => void;
    onEndTimeChange: (val: string) => void;
    onBack: () => void;
    onSave: () => void;
    onCancel: () => void;
}

const TimeSectionView = React.memo(function TimeSectionView({
    startTime,
    endTime,
    startDate,
    endDate,
    onStartTimeChange,
    onEndTimeChange,
    onBack,
    onSave,
    onCancel,
}: TimeSectionViewProps) {
    const timeError = React.useMemo(() => {
        if (!startDate || !endDate || !startTime || !endTime) return '';
        const start = new Date(startDate + 'T' + startTime);
        const end = new Date(endDate + 'T' + endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
        if (end <= start) return 'End date/time must be after the start date/time.';
        return '';
    }, [startDate, endDate, startTime, endTime]);

    const canSave = !!startDate && !!endDate && !timeError;

    return (
        <div
            className="flex flex-col p-6"
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600"
                    aria-label="Back to calendar"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-red-600" />
                    <span className="text-lg font-semibold text-foreground">Select Time</span>
                </div>
            </div>

            <p className="mb-5 text-sm text-muted-foreground/60">
                Choose when this discount is active.
            </p>

            {/* Primary time spinners — always visible */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <TimeSpinner label="Start Time" value={startTime} onChange={onStartTimeChange} />
                <TimeSpinner label="End Time"   value={endTime}   onChange={onEndTimeChange} />
            </div>

            {/* Validation error */}
            {timeError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {timeError}
                </div>
            )}

            {/* Schedule summary card */}
            {startDate && endDate && (
                <div
                    className="mb-6 rounded-lg border border-border bg-white p-5 shadow-sm"
                    style={{ overflow: 'visible' }}
                >
                    <p className="mb-3 text-xs font-medium text-muted-foreground/70">
                        Discount Schedule
                    </p>
                    <div className="flex flex-col gap-3">
                        {/* Start */}
                        <div>
                            <span className="text-xs font-medium text-muted-foreground/70">Start</span>
                            <p className="text-sm text-foreground">{formatDateVerbose(startDate)}</p>
                            {/* Clicking the red time opens the inline dropdown */}
                            <TimePickerDropdown
                                value={startTime}
                                onChange={onStartTimeChange}
                                label="Start"
                                align="left"
                            />
                        </div>

                        <div className="self-center">
                            <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground/40" />
                        </div>

                        {/* End */}
                        <div className="text-right">
                            <span className="text-xs font-medium text-muted-foreground/70">End</span>
                            <p className="text-sm text-foreground">{formatDateVerbose(endDate)}</p>
                            <TimePickerDropdown
                                value={endTime}
                                onChange={onEndTimeChange}
                                label="End"
                                align="right"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-input bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={!canSave}
                    className={cn(
                        'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white',
                        'transition-colors hover:bg-red-700',
                        'focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:outline-none',
                        !canSave && 'cursor-not-allowed opacity-50',
                    )}
                >
                    Done
                </button>
            </div>
        </div>
    );
});

// ---------------------------------------------------------------------------
// Shared pure helpers
// ---------------------------------------------------------------------------
interface DateTimeRangePickerProps {
    startValue: string;
    endValue: string;
    onStartChange: (val: string) => void;
    onEndChange: (val: string) => void;
    defaultStartTime?: string;
    defaultEndTime?: string;
    placeholder?: string;
    className?: string;
    startError?: string;
    endError?: string;
    id?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseValue = (val: string): { date: string; time: string } => {
    if (!val) return { date: '', time: '' };
    const d = new Date(val);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    return {
        date:
            d.getFullYear() +
            '-' + String(d.getMonth() + 1).padStart(2, '0') +
            '-' + String(d.getDate()).padStart(2, '0'),
        time:
            String(d.getHours()).padStart(2, '0') +
            ':' + String(d.getMinutes()).padStart(2, '0'),
    };
};

const formatDateRange = (start: string, end: string): string => {
    const fmt = (val: string) =>
        val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const s = fmt(start);
    const e = fmt(end);
    if (!s && !e) return '';
    if (s && !e) return s;
    if (!s && e) return e;
    return `${s} – ${e}`;
};

const toLocalISO = (dateStr: string, timeStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T' + timeStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatTime12 = (timeStr: string): string =>
    timeStr
        ? new Date('2000-01-01T' + timeStr + ':00').toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
          })
        : '';

const formatDateVerbose = (dateStr: string): string =>
    dateStr
        ? new Date(dateStr).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : '';

const dateKey = (d: Date) => d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();

// ---------------------------------------------------------------------------
// DateTimeRangePicker
// ---------------------------------------------------------------------------
function DateTimeRangePicker({
    startValue,
    endValue,
    onStartChange,
    onEndChange,
    defaultStartTime = '09:00',
    defaultEndTime = '23:59',
    placeholder = 'Select discount period',
    className,
    startError,
    endError,
    id,
}: DateTimeRangePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [view, setView] = React.useState<'date' | 'time'>('date');
    const [draftStartDate, setDraftStartDate] = React.useState('');
    const [draftEndDate, setDraftEndDate] = React.useState('');
    const [draftStartTime, setDraftStartTime] = React.useState('');
    const [draftEndTime, setDraftEndTime] = React.useState('');

    const today = new Date();

    const startParsed = React.useMemo(() => parseValue(startValue), [startValue]);
    const endParsed   = React.useMemo(() => parseValue(endValue),   [endValue]);

    const effectiveStartDate = draftStartDate || startParsed.date;
    const effectiveEndDate   = draftEndDate   || endParsed.date;
    const effectiveStartTime = draftStartTime || startParsed.time || defaultStartTime;
    const effectiveEndTime   = draftEndTime   || endParsed.time   || defaultEndTime;

    const [currentMonth, setCurrentMonth] = React.useState(() => {
        const seed = effectiveStartDate || effectiveEndDate || today;
        const d = new Date(seed);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const resetDrafts = React.useCallback(() => {
        setDraftStartDate('');
        setDraftEndDate('');
        setDraftStartTime('');
        setDraftEndTime('');
    }, []);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setView('date');
            resetDrafts();
            const d = startValue ? new Date(startValue) : endValue ? new Date(endValue) : today;
            setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        }
    };

    const prevMonth = () =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const month2 = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

    const generateCalendarDays = (monthDate: Date) => {
        const days: { date: Date; isCurrentMonth: boolean }[] = [];
        const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push({ date, isCurrentMonth: date.getMonth() === monthDate.getMonth() });
        }
        return days;
    };

    const isDateDisabled = (date: Date) => {
        const check = new Date(date); check.setHours(0, 0, 0, 0);
        const tc = new Date(); tc.setHours(0, 0, 0, 0);
        return check < tc;
    };

    const isToday = (date: Date) =>
        today.getFullYear() === date.getFullYear() &&
        today.getMonth()    === date.getMonth()    &&
        today.getDate()     === date.getDate();

    const handleDateSelect = (day: number, monthDate: Date) => {
        const selected = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 0, 0, 0);
        const dateStr =
            selected.getFullYear() + '-' +
            String(selected.getMonth() + 1).padStart(2, '0') + '-' +
            String(selected.getDate()).padStart(2, '0');

        if (!effectiveStartDate) {
            setDraftStartDate(dateStr);
        } else if (!effectiveEndDate) {
            if (dateStr < effectiveStartDate) {
                setDraftStartDate(dateStr);
                setDraftEndDate('');
            } else {
                setDraftEndDate(dateStr);
                setView('time');
            }
        } else {
            setDraftStartDate(dateStr);
            setDraftEndDate('');
            setDraftStartTime('');
            setDraftEndTime('');
            setView('time');
        }
    };

    const isInRange = (date: Date) => {
        const check = new Date(date); check.setHours(0, 0, 0, 0);
        if (!effectiveStartDate || !effectiveEndDate) return false;
        const start = new Date(effectiveStartDate); start.setHours(0, 0, 0, 0);
        const end   = new Date(effectiveEndDate);   end.setHours(0, 0, 0, 0);
        return check > start && check < end;
    };

    const handleSave = React.useCallback(() => {
        if (!effectiveStartDate || !effectiveEndDate) return;
        const start = new Date(effectiveStartDate + 'T' + effectiveStartTime);
        const end   = new Date(effectiveEndDate   + 'T' + effectiveEndTime);
        if (end <= start) return;
        onStartChange(toLocalISO(effectiveStartDate, effectiveStartTime));
        onEndChange(toLocalISO(effectiveEndDate, effectiveEndTime));
        resetDrafts();
        setView('date');
        setOpen(false);
    }, [effectiveStartDate, effectiveEndDate, effectiveStartTime, effectiveEndTime,
        onStartChange, onEndChange, resetDrafts]);

    const handleCancel = React.useCallback(() => {
        setOpen(false);
        setView('date');
        resetDrafts();
    }, [resetDrafts]);

    const renderCalendarGrid = (monthDate: Date) => {
        const days = generateCalendarDays(monthDate);
        const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

        return (
            <div key={dateKey(monthDate)} className="flex-1" style={{ pointerEvents: 'auto' }}>
                <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-semibold text-foreground">
                            {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex gap-0.5">
                        <button type="button" onClick={prevMonth} aria-label="Previous month"
                            className="rounded p-1 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={nextMonth} aria-label="Next month"
                            className="rounded p-1 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 px-2 text-center text-xs font-medium text-muted-foreground/60">
                    {DAYS.map((day) => <div key={day}>{day}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1 px-2 pb-2 text-sm">
                    {days.map((d, i) => {
                        const dKey = dateKey(d.date);
                        const isStart = effectiveStartDate === dKey;
                        const isEnd   = effectiveEndDate   === dKey;
                        const inRange = isInRange(d.date);
                        const isDis   = isDateDisabled(d.date);
                        const isTdy   = isToday(d.date);
                        const isRangeEdge  = isStart || isEnd;
                        const isInRangeCell = inRange && !isRangeEdge;

                        return (
                            <button
                                key={dateKey(monthDate) + '-' + i}
                                type="button"
                                onClick={() => {
                                    if (d.isCurrentMonth && !isDis && d.date.getMonth() === monthDate.getMonth())
                                        handleDateSelect(d.date.getDate(), monthDate);
                                }}
                                disabled={!d.isCurrentMonth || isDis}
                                style={{ pointerEvents: 'auto' }}
                                className={cn(
                                    'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-all duration-150',
                                    'focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:outline-none',
                                    'disabled:cursor-not-allowed disabled:opacity-40',
                                    !d.isCurrentMonth && 'cursor-default text-muted-foreground/30',
                                    isDis && 'cursor-not-allowed opacity-40',
                                    isStart && 'border-2 border-red-600 bg-red-600 text-white',
                                    isEnd   && 'border-2 border-red-600 bg-red-600 text-white',
                                    isInRangeCell && 'bg-red-100 text-red-900',
                                    isTdy && !isRangeEdge && !isInRangeCell && 'border border-red-300',
                                    !isStart && !isEnd && !inRange && !isTdy && !isDis && d.isCurrentMonth &&
                                        'hover:bg-red-50 hover:text-red-600',
                                    !d.isCurrentMonth && 'hover:bg-transparent',
                                )}
                            >
                                {d.date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const displayValue = React.useMemo(
        () => formatDateRange(effectiveStartDate, effectiveEndDate) || placeholder,
        [effectiveStartDate, effectiveEndDate, placeholder],
    );

    return (
        <div className="relative inline-block w-full">
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        id={id}
                        style={{ pointerEvents: 'auto' }}
                        className={cn(
                            'flex w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-left text-sm text-foreground ring-offset-background transition-colors outline-none',
                            'focus:border-red-600 focus:ring-2 focus:ring-red-500/30',
                            !open && 'hover:bg-accent/50',
                            startError && 'border-red-500',
                            className,
                        )}
                    >
                        <CalendarIcon className="h-4 w-4 shrink-0 text-red-600" />
                        <span className={cn('flex-1 truncate', startValue || endValue ? '' : 'text-muted-foreground/50')}>
                            {displayValue}
                        </span>
                        <ChevronRight className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform',
                            open && 'rotate-90 text-red-600',
                        )} />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-[640px] max-w-[90vw] border-border p-0 shadow-xl"
                    align="start"
                    sideOffset={10}
                    style={{ pointerEvents: 'auto', overflow: 'visible' }}
                    onInteractOutside={(e) => {
                        if (view === 'time') e.preventDefault();
                    }}
                >
                    <div className="bg-white" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                        {view === 'date' ? (
                            <div className="p-4">
                                <div className="mb-3 flex items-center justify-between px-1">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Select Discount Period
                                    </h3>
                                </div>
                                <div className="flex items-start gap-0" style={{ pointerEvents: 'auto' }}>
                                    {renderCalendarGrid(currentMonth)}
                                    {renderCalendarGrid(month2)}
                                </div>
                                {(effectiveStartDate || effectiveEndDate) && (
                                    <div className="mt-3 flex items-center justify-center gap-2 px-2 text-sm">
                                        <span className="text-muted-foreground/60">Start Date</span>
                                        <div className="flex-1 border-t border-dashed border-border" />
                                        <span className="text-muted-foreground/60">End Date</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <TimeSectionView
                                startTime={effectiveStartTime}
                                endTime={effectiveEndTime}
                                startDate={effectiveStartDate}
                                endDate={effectiveEndDate}
                                onStartTimeChange={setDraftStartTime}
                                onEndTimeChange={setDraftEndTime}
                                onBack={() => setView('date')}
                                onSave={handleSave}
                                onCancel={handleCancel}
                            />
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {startError && <p className="mt-1 text-sm text-red-500">{startError}</p>}
            {endError   && <p className="mt-1 text-sm text-red-500">{endError}</p>}
        </div>
    );
}

export { DateTimeRangePicker };
