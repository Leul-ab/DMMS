import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    id?: string;
    minDate?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    const [view, setView] = React.useState<'date' | 'time'>('date');
    const [selectedDate, setSelectedDate] = React.useState<string>('');

    const today = new Date();

    const [currentMonth, setCurrentMonth] = React.useState(() => {
        const d = value ? new Date(value) : today;

        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const displayValue = value
        ? new Date(value).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
          })
        : placeholder;

    const handleDateSelect = (day: number, monthDate: Date) => {
        const selected = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            day,
        );
        const dateStr = selected.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        setView('time');
    };

    const handleTimeSelect = (hour: number, minute: number) => {
        if (!selectedDate) {
            return;
        }

        const selected = new Date(selectedDate);
        selected.setHours(hour, minute, 0, 0);
        const tzOffset = selected.getTimezoneOffset() * 60000;
        const localISO = new Date(selected.getTime() - tzOffset)
            .toISOString()
            .slice(0, 16);

        onChange(localISO);
        setOpen(false);
        setView('date');
    };

    const handleOpen = () => {
        setOpen(!open);
        setView('date');

        if (value) {
            const d = new Date(value);

            if (!isNaN(d.getTime())) {
                setSelectedDate(d.toISOString().split('T')[0]);
                setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
            }
        } else {
            setCurrentMonth(
                new Date(today.getFullYear(), today.getMonth(), 1),
            );
        }
    };

    const generateCalendarDays = () => {
        const days: { date: Date; isCurrentMonth: boolean }[] = [];
        const firstDay = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1,
        );
        const startDate = new Date(firstDay);
        startDate.setDate(
            startDate.getDate() -
                (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1),
        );

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push({
                date,
                isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
            });
        }

        return days;
    };

    const isDateDisabled = (date: Date) => {
        if (minDate) {
            const min = new Date(minDate);

            if (date < min) {
                return true;
            }
        }

        const check = new Date(date);
        check.setHours(0, 0, 0, 0);
        const todayCheck = new Date();
        todayCheck.setHours(0, 0, 0, 0);

        return check < todayCheck;
    };

    const isSelectedDate = (date: Date) => {
        if (!selectedDate) {
            return false;
        }

        const d = new Date(selectedDate);

        return (
            d.getFullYear() === date.getFullYear() &&
            d.getMonth() === date.getMonth() &&
            d.getDate() === date.getDate()
        );
    };

    const prevMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
        );
    };

    const nextMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
        );
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    return (
        <div className="relative">
            <div
                onClick={handleOpen}
                className={cn(
                    'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors',
                    error ? 'border-destructive' : 'border-input',
                    'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                    className,
                )}
                id={id}
            >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span
                    className={cn(
                        'flex-1 truncate',
                        value ? '' : 'text-muted-foreground',
                    )}
                >
                    {displayValue}
                </span>
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
            {open && (
                <div className="absolute top-12 z-50 w-full min-w-[280px] max-w-[340px]">
                    <div className="rounded-md border bg-popover p-3 shadow-lg">
                        {view === 'date' && (
                            <>
                                <div className="mb-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={prevMonth}
                                        className="rounded p-1 hover:bg-accent"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm font-medium">
                                        {currentMonth.toLocaleString('default', {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={nextMonth}
                                        className="rounded p-1 hover:bg-accent"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                                    {DAYS.map((day) => (
                                        <div key={day}>{day}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {generateCalendarDays().map((d, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                if (d.isCurrentMonth && !isDateDisabled(d.date)) {
                                                    handleDateSelect(
                                                        d.date.getDate(),
                                                        currentMonth,
                                                    );
                                                }
                                            }}
                                            disabled={
                                                !d.isCurrentMonth ||
                                                isDateDisabled(d.date)
                                            }
                                            className={cn(
                                                'relative h-8 w-8 rounded text-sm font-medium transition-colors',
                                                d.isCurrentMonth
                                                    ? 'hover:bg-accent'
                                                    : 'text-muted-foreground opacity-40',
                                                isDateDisabled(d.date)
                                                    ? 'cursor-not-allowed opacity-30'
                                                    : '',
                                                isSelectedDate(d.date)
                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                    : '',
                                            )}
                                        >
                                            {d.date.getDate()}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                        {view === 'time' && (
                            <>
                                <div className="mb-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setView('date')}
                                        className="rounded p-1 hover:bg-accent"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="ml-2 text-sm font-medium">
                                        Select Time
                                    </span>
                                </div>
                                <div className="mb-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>
                                        {selectedDate || 'No date selected'}
                                    </span>
                                </div>
                                <div className="grid max-h-60 grid-cols-4 gap-1 overflow-y-auto">
                                    {hours.map((h) =>
                                        minutes.map((m) => {
                                            const time24 = `${h
                                                .toString()
                                                .padStart(2, '0')}:${m
                                                .toString()
                                                .padStart(2, '0')}`;
                                            const isAM = h < 12;
                                            const displayHour =
                                                h === 0
                                                    ? 12
                                                    : h > 12
                                                      ? h - 12
                                                      : h;
                                            const time12 = `${displayHour.toString()}:${m
                                                .toString()
                                                .padStart(2, '0')} ${
                                                isAM ? 'AM' : 'PM'
                                            }`;

                                            return (
                                                <button
                                                    key={time24}
                                                    type="button"
                                                    onClick={() =>
                                                        handleTimeSelect(h, m)
                                                    }
                                                    className="rounded p-2 text-left text-sm font-medium hover:bg-accent"
                                                >
                                                    {time12}
                                                </button>
                                            );
                                        }),
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export { DateTimePicker };
