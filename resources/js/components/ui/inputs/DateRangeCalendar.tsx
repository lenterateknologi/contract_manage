import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeCalendarProps {
    from: string;   // 'YYYY-MM-DD' or ''
    to: string;     // 'YYYY-MM-DD' or ''
    onChange: (from: string, to: string) => void;
}

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function fmt(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

interface MonthGridProps {
    year: number;
    month: number;  // 0-indexed
    from: Date | null;
    to: Date | null;
    hovered: Date | null;
    selecting: boolean;
    onDayClick: (d: Date) => void;
    onDayHover: (d: Date | null) => void;
}

function MonthGrid({ year, month, from, to, hovered, selecting, onDayClick, onDayHover }: MonthGridProps) {
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [
        ...Array(startOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const rangeEnd = selecting && hovered ? hovered : to;

    const getRangeBounds = () => {
        if (!from || !rangeEnd) return { lo: null, hi: null };
        return from <= rangeEnd
            ? { lo: from, hi: rangeEnd }
            : { lo: rangeEnd, hi: from };
    };

    const { lo, hi } = getRangeBounds();

    const isInRange = (d: Date) => !!lo && !!hi && d > lo && d < hi;
    const isStart = (d: Date) => !!from && isSameDay(d, from);
    const isEnd = (d: Date) => !!rangeEnd && !isSameDay(d, from ?? new Date(0)) && isSameDay(d, rangeEnd);
    const isToday = (d: Date) => isSameDay(d, new Date());

    return (
        <div className="select-none w-full">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-text-desc py-1 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
                {cells.map((d, idx) => {
                    if (!d) return <div key={`e-${idx}`} className="h-9" />;

                    const inRange = isInRange(d);
                    const start = isStart(d);
                    const end = isEnd(d);
                    const today = isToday(d);
                    const highlighted = start || end;
                    const colIdx = idx % 7; // 0=Mon..6=Sun

                    // Determine whether range bg should be capped on edges
                    const rangeCapLeft = (start && rangeEnd && !isSameDay(d, rangeEnd ?? new Date(0))) || (inRange && colIdx === 0);
                    const rangeCapRight = (end) || (inRange && colIdx === 6);
                    const isSingleDay = start && end;

                    return (
                        <div
                            key={`d-${idx}`}
                            className={cn(
                                'relative h-9 flex items-center justify-center',
                                // Range fill strip
                                (inRange) && 'bg-primary/10 dark:bg-primary/15',
                                (start && hi && !isSameDay(d, hi)) && 'bg-primary/10 dark:bg-primary/15 rounded-l-full',
                                (end) && 'bg-primary/10 dark:bg-primary/15 rounded-r-full',
                                (inRange && colIdx === 0) && 'rounded-l-full',
                                (inRange && colIdx === 6) && 'rounded-r-full',
                                isSingleDay && 'rounded-full',
                            )}
                            onMouseEnter={() => onDayHover(d)}
                            onMouseLeave={() => onDayHover(null)}
                        >
                            <button
                                onClick={() => onDayClick(d)}
                                className={cn(
                                    'relative z-10 w-8 h-8 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center',
                                    highlighted
                                        ? 'bg-primary text-white font-bold shadow-lg scale-105'
                                        : 'text-text-main hover:bg-primary/15 dark:hover:bg-primary/25',
                                    today && !highlighted && 'ring-2 ring-primary/40 font-semibold text-primary',
                                )}
                            >
                                {d.getDate()}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function DateRangeCalendar({ from, to, onChange }: DateRangeCalendarProps) {
    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
        const base = fromDate || new Date();
        return { year: base.getFullYear(), month: base.getMonth() };
    });
    const [hovered, setHovered] = useState<Date | null>(null);
    const [pendingFrom, setPendingFrom] = useState<Date | null>(null);

    const goLeft = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentMonth(prev =>
            prev.month === 0
                ? { year: prev.year - 1, month: 11 }
                : { year: prev.year, month: prev.month - 1 }
        );
    };

    const goRight = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentMonth(prev =>
            prev.month === 11
                ? { year: prev.year + 1, month: 0 }
                : { year: prev.year, month: prev.month + 1 }
        );
    };

    const handleDayClick = useCallback((d: Date) => {
        if (!pendingFrom) {
            setPendingFrom(d);
            onChange(fmt(d), '');
        } else {
            const lo = pendingFrom <= d ? pendingFrom : d;
            const hi = pendingFrom <= d ? d : pendingFrom;
            onChange(fmt(lo), fmt(hi));
            setPendingFrom(null);
        }
    }, [pendingFrom, onChange]);

    const selecting = !!pendingFrom;
    const displayFrom = pendingFrom ?? fromDate;

    const formatDisplay = (d: Date | null) => {
        if (!d) return '—';
        return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
    };

    return (
        <div className="flex flex-col gap-2.5 select-none w-full">
            {/* Month Navigator */}
            <div className="flex items-center justify-between px-0.5">
                <button
                    type="button"
                    onClick={goLeft}
                    className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-500"
                >
                    <ChevronLeft size={13} />
                </button>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 text-center">
                    {MONTHS[currentMonth.month]} {currentMonth.year}
                </span>
                <button
                    type="button"
                    onClick={goRight}
                    className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-slate-500"
                >
                    <ChevronRight size={13} />
                </button>
            </div>

            {/* Month Grid */}
            <div className="w-full">
                <MonthGrid
                    year={currentMonth.year}
                    month={currentMonth.month}
                    from={displayFrom}
                    to={toDate}
                    hovered={hovered}
                    selecting={selecting}
                    onDayClick={handleDayClick}
                    onDayHover={setHovered}
                />
            </div>

            {/* Status bar */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-0.5">
                <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 text-xs">
                    <div className={cn(
                        'flex-1 flex flex-col px-2.5 py-1.5 transition-colors',
                        selecting ? 'bg-primary/5' : 'bg-slate-50 dark:bg-slate-900',
                    )}>
                        <span className="text-[8px] font-bold uppercase tracking-wider mb-0.5 text-primary">
                            Mulai
                        </span>
                        <span className={cn(
                            'text-[11px] font-semibold truncate',
                            displayFrom ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
                        )}>
                            {formatDisplay(displayFrom)}
                        </span>
                    </div>
                    <div className="w-px bg-slate-200 dark:bg-slate-800" />
                    <div className={cn(
                        'flex-1 flex flex-col px-2.5 py-1.5 transition-colors',
                        !selecting && toDate ? 'bg-primary/5' : 'bg-slate-50 dark:bg-slate-900',
                    )}>
                        <span className="text-[8px] font-bold uppercase tracking-wider mb-0.5 text-primary">
                            Sampai
                        </span>
                        <span className={cn(
                            'text-[11px] font-semibold truncate',
                            toDate && !selecting ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
                        )}>
                            {toDate && !selecting ? formatDisplay(toDate) : selecting ? 'Pilih...' : '—'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
