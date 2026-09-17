import { Badge } from '@/components/ui/feedback/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';
import { formatDate, parseDateInput } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import {
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    Clock,
    PlayCircle,
    RotateCcw,
    CheckCircle2,
    FileCheck2,
    User,
    UserCheck,
    Columns,
    CalendarDays,
    BarChart3,
    TrendingUp,
    Sparkles,
    CheckCircle,
} from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

export interface CalendarEvent {
    id: string;
    date: Date;
    dateKey: string; // YYYY-MM-DD
    timeStr?: string; // HH:mm
    title: string;
    type: 'submitted' | 'assigned' | 'closed';
    badgeClass: string;
    icon?: any;
    actor?: string;
    description?: string;
}

const ID_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const ID_MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];
const ID_MONTHS_FULL = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function toDateKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimeOnly(d: Date): string {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function addDays(d: Date, days: number): Date {
    const res = new Date(d.getTime());
    res.setDate(res.getDate() + days);
    return res;
}

export function ContractSlaCalendar({ selected }: { selected: Contract }) {
    // 1. Tanggal Pengajuan Dibuat
    const submittedDate = parseDateInput(selected.submitted_at || selected.created_at);

    // 2. Tanggal Di-assign (Assigned PIC)
    const assignedDate = parseDateInput(
        selected.assigned_at ||
        selected.pic_assigned_at ||
        (selected as any).assigned_pic_at ||
        (selected.metadata as any)?.pic_assigned_at ||
        (selected.metadata as any)?.assigned_at
    );

    // 3. Tanggal Selesai Dikerjakan (Finished At)
    const finishedDate = parseDateInput(
        selected.finished_at ||
        (selected as any).finish_at ||
        (selected.metadata as any)?.finished_at ||
        (selected.metadata as any)?.finish_at
    );

    // 4. Tanggal Close At (Selesai / Ditutup)
    const closedDate = parseDateInput(
        selected.closed_at ||
        (selected.metadata as any)?.closed_at
    );

    // View mode: 'weekly' (2-week scrollable window) vs 'monthly' (full month grid)
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

    // Base anchor date
    const initialDate = submittedDate || assignedDate || finishedDate || closedDate || new Date();
    const [anchorDate, setAnchorDate] = useState<Date>(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()));
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

    // Weekly scroll state (14 days default window)
    const [extraPastDays, setExtraPastDays] = useState(2);
    const [extraFutureDays, setExtraFutureDays] = useState(12);
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Filtered to key SLA milestone dates
    const events = useMemo<CalendarEvent[]>(() => {
        const list: CalendarEvent[] = [];

        // 1. Tanggal Pengajuan Dibuat
        if (submittedDate) {
            list.push({
                id: 'event-submitted',
                date: submittedDate,
                dateKey: toDateKey(submittedDate),
                timeStr: formatTimeOnly(submittedDate),
                title: 'Pengajuan Dibuat',
                type: 'submitted',
                badgeClass: 'bg-blue-600 text-white border-transparent',
                icon: PlayCircle,
                actor: selected.initiator?.name || selected.creator?.name || 'Inisiator',
                description: `Pengajuan kontrak dibuat & diajukan oleh ${selected.initiator?.name || selected.creator?.name || 'Inisiator'}`,
            });
        }

        // 2. Tanggal Di-assign PIC
        if (assignedDate) {
            list.push({
                id: 'event-assigned',
                date: assignedDate,
                dateKey: toDateKey(assignedDate),
                timeStr: formatTimeOnly(assignedDate),
                title: 'Assigned PIC',
                type: 'assigned',
                badgeClass: 'bg-sky-600 text-white border-transparent',
                icon: UserCheck,
                actor: selected.assigned_pic?.name || selected.assigned_by?.name || 'Manager',
                description: selected.assigned_pic?.name
                    ? `Ditugaskan kepada PIC: ${selected.assigned_pic.name}`
                    : 'PIC penanggung jawab telah ditugaskan.',
            });
        }

        // 3. Tanggal Selesai Dikerjakan (Finished At)
        if (finishedDate) {
            list.push({
                id: 'event-finished',
                date: finishedDate,
                dateKey: toDateKey(finishedDate),
                timeStr: formatTimeOnly(finishedDate),
                title: 'Selesai Dikerjakan',
                type: 'assigned',
                badgeClass: 'bg-indigo-600 text-white border-transparent',
                icon: FileCheck2,
                actor: selected.assigned_pic?.name || 'PIC',
                description: `Pengerjaan kontrak selesai oleh PIC pada ${formatDate(finishedDate)}`,
            });
        }

        // 4. Tanggal Close At (Selesai / Ditutup)
        if (closedDate) {
            list.push({
                id: 'event-closed',
                date: closedDate,
                dateKey: toDateKey(closedDate),
                timeStr: formatTimeOnly(closedDate),
                title: 'Closed At',
                type: 'closed',
                badgeClass: 'bg-emerald-600 text-white border-transparent',
                icon: CheckCircle2,
                description: `Kontrak dinyatakan selesai dan ditutup (Closed) pada ${formatDate(closedDate)}`,
            });
        }

        return list.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [selected, submittedDate, assignedDate, finishedDate, closedDate]);

    // Map events by dateKey
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach((e) => {
            const arr = map.get(e.dateKey) || [];
            arr.push(e);
            map.set(e.dateKey, arr);
        });
        return map;
    }, [events]);

    const pSubmitted = useMemo(() => submittedDate ? new Date(submittedDate.getFullYear(), submittedDate.getMonth(), submittedDate.getDate()) : null, [submittedDate]);
    const pAssigned = useMemo(() => assignedDate ? new Date(assignedDate.getFullYear(), assignedDate.getMonth(), assignedDate.getDate()) : null, [assignedDate]);
    const pFinished = useMemo(() => finishedDate ? new Date(finishedDate.getFullYear(), finishedDate.getMonth(), finishedDate.getDate()) : null, [finishedDate]);
    const pClosed = useMemo(() => closedDate ? new Date(closedDate.getFullYear(), closedDate.getMonth(), closedDate.getDate()) : null, [closedDate]);

    const buildDayMeta = useCallback((d: Date, isCurrentMonth = true) => {
        const k = toDateKey(d);
        const pureDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayKey = toDateKey(new Date());

        // Phase 1: Submitted -> Assigned
        const inPhase1 = Boolean(pSubmitted && pAssigned && pureDate >= pSubmitted && pureDate <= pAssigned);
        const isPhase1Start = Boolean(pSubmitted && pureDate.getTime() === pSubmitted.getTime());
        const isPhase1End = Boolean(pAssigned && pureDate.getTime() === pAssigned.getTime());

        // Phase 2: Assigned -> Finished (or Closed if no finished)
        const phase2TargetEnd = pFinished || pClosed;
        const inPhase2 = Boolean(pAssigned && phase2TargetEnd && pureDate >= pAssigned && pureDate <= phase2TargetEnd);
        const isPhase2Start = Boolean(pAssigned && pureDate.getTime() === pAssigned.getTime());
        const isPhase2End = Boolean(phase2TargetEnd && pureDate.getTime() === phase2TargetEnd.getTime());

        // Phase 3: Finished -> Closed (if finishedDate exists)
        const inPhase3 = Boolean(pFinished && pClosed && pureDate >= pFinished && pureDate <= pClosed);
        const isPhase3Start = Boolean(pFinished && pureDate.getTime() === pFinished.getTime());
        const isPhase3End = Boolean(pClosed && pureDate.getTime() === pClosed.getTime());

        const isSubmitted = Boolean(submittedDate && k === toDateKey(submittedDate));
        const isAssigned = Boolean(assignedDate && k === toDateKey(assignedDate));
        const isFinished = Boolean(finishedDate && k === toDateKey(finishedDate));
        const isClosed = Boolean(closedDate && k === toDateKey(closedDate));
        const isMilestone = isSubmitted || isAssigned || isFinished || isClosed;

        return {
            date: d,
            dateKey: k,
            dayNumber: d.getDate(),
            monthName: ID_MONTHS_SHORT[d.getMonth()],
            monthFullName: ID_MONTHS_FULL[d.getMonth()],
            year: d.getFullYear(),
            dayName: ID_DAYS_SHORT[d.getDay()],
            dayOfWeek: d.getDay(), // 0 = Sun, 6 = Sat
            isWeekend: d.getDay() === 0 || d.getDay() === 6,
            isToday: k === todayKey,
            isCurrentMonth,
            inPhase1,
            isPhase1Start,
            isPhase1End,
            inPhase2,
            isPhase2Start,
            isPhase2End,
            inPhase3,
            isPhase3Start,
            isPhase3End,
            isSubmitted,
            isAssigned,
            isFinished,
            isClosed,
            isMilestone,
            events: eventsByDate.get(k) || [],
        };
    }, [pSubmitted, pAssigned, pFinished, pClosed, submittedDate, assignedDate, finishedDate, closedDate, eventsByDate]);

    // Weekly Timeline List (dynamic 14+ days range)
    const weeklyDaysList = useMemo(() => {
        const days = [];
        const startDay = addDays(anchorDate, -extraPastDays);
        const totalDaysCount = extraPastDays + extraFutureDays + 1;

        for (let i = 0; i < totalDaysCount; i++) {
            const d = addDays(startDay, i);
            days.push(buildDayMeta(d, true));
        }

        return days;
    }, [anchorDate, extraPastDays, extraFutureDays, buildDayMeta]);

    // Monthly Calendar Grid (7 columns x N weeks with padding days)
    const monthlyGridWeeks = useMemo(() => {
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
        const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

        const allDays = [];

        // Previous month padding days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(viewYear, viewMonth, -i);
            allDays.push(buildDayMeta(d, false));
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(viewYear, viewMonth, i);
            allDays.push(buildDayMeta(d, true));
        }

        // Next month padding days to complete full 7-day rows
        const remaining = 7 - (allDays.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                const d = new Date(viewYear, viewMonth + 1, i);
                allDays.push(buildDayMeta(d, false));
            }
        }

        // Split into weeks (rows of 7)
        const weeks = [];
        for (let i = 0; i < allDays.length; i += 7) {
            weeks.push(allDays.slice(i, i + 7));
        }

        return weeks;
    }, [viewYear, viewMonth, buildDayMeta]);

    // Handlers for weekly mode scroll
    const handleScroll = useCallback(() => {
        if (viewMode !== 'weekly') return;
        const el = scrollContainerRef.current;
        if (!el) return;

        if (el.scrollLeft < 40) {
            setExtraPastDays((prev) => prev + 7);
        }
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 40) {
            setExtraFutureDays((prev) => prev + 7);
        }
    }, [viewMode]);

    const loadMorePast = () => setExtraPastDays((prev) => prev + 7);
    const loadMoreFuture = () => setExtraFutureDays((prev) => prev + 7);

    // Handlers for monthly mode prev/next
    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((prev) => prev - 1);
        } else {
            setViewMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((prev) => prev + 1);
        } else {
            setViewMonth((prev) => prev + 1);
        }
    };

    const jumpToDate = (targetDate: Date | null) => {
        if (!targetDate) return;
        const k = toDateKey(targetDate);
        setSelectedDateKey(k);

        if (viewMode === 'monthly') {
            setViewYear(targetDate.getFullYear());
            setViewMonth(targetDate.getMonth());
        } else {
            const diffDays = Math.round((targetDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < -extraPastDays) {
                setExtraPastDays(Math.abs(diffDays) + 4);
            } else if (diffDays > extraFutureDays) {
                setExtraFutureDays(diffDays + 4);
            }
        }

        setTimeout(() => {
            const dayEl = document.getElementById(`day-cell-${k}`);
            if (dayEl && scrollContainerRef.current) {
                dayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 100);
    };

    // Duration calculation for each phase
    const phase1Days = useMemo(() => {
        if (!submittedDate || !assignedDate) return null;
        const diff = assignedDate.getTime() - submittedDate.getTime();
        return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }, [submittedDate, assignedDate]);

    const phase2Days = useMemo(() => {
        const targetEnd = finishedDate || closedDate;
        if (!assignedDate || !targetEnd) return null;
        const diff = targetEnd.getTime() - assignedDate.getTime();
        return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }, [assignedDate, finishedDate, closedDate]);

    const phase3Days = useMemo(() => {
        if (!finishedDate || !closedDate) return null;
        const diff = closedDate.getTime() - finishedDate.getTime();
        return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }, [finishedDate, closedDate]);

    const totalDays = useMemo(() => {
        if (!submittedDate || !closedDate) return null;
        const diff = closedDate.getTime() - submittedDate.getTime();
        return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }, [submittedDate, closedDate]);

    // Data for Stage SLA Breakdown Chart
    const stageChartData = useMemo(() => {
        const p1 = phase1Days || 2;
        const p2 = phase2Days || 2;
        const p3 = phase3Days || 2;
        const sum = p1 + p2 + p3;

        return [
            {
                id: 'phase1',
                name: '1. Pengajuan',
                fullName: 'Tahap 1: Pengajuan s/d Disposisi PIC',
                days: p1,
                percentage: Math.round((p1 / sum) * 100),
                color: '#2563eb', // Blue
                bgColor: 'bg-blue-600',
                lightBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
                status: submittedDate && assignedDate ? 'Selesai' : submittedDate ? 'Berjalan' : 'Menunggu',
                startDate: submittedDate,
                endDate: assignedDate,
                actor: selected.initiator?.name || selected.creator?.name || 'Inisiator / Pengaju',
            },
            {
                id: 'phase2',
                name: '2. Pengerjaan PIC',
                fullName: 'Tahap 2: Proses Review & Draft oleh PIC',
                days: p2,
                percentage: Math.round((p2 / sum) * 100),
                color: '#4f46e5', // Indigo
                bgColor: 'bg-indigo-600',
                lightBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
                status: assignedDate && (finishedDate || closedDate) ? 'Selesai' : assignedDate ? 'Sedang Dikerjakan' : 'Belum Mulai',
                startDate: assignedDate,
                endDate: finishedDate || closedDate,
                actor: selected.assigned_pic?.name || 'PIC Legal / Penanggung Jawab',
            },
            {
                id: 'phase3',
                name: '3. Selesai s/d Closed',
                fullName: 'Tahap 3: Finalisasi, Penandatanganan & Tutup',
                days: p3,
                percentage: Math.round((p3 / sum) * 100),
                color: '#059669', // Emerald
                bgColor: 'bg-emerald-600',
                lightBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                status: closedDate ? 'Selesai & Closed' : finishedDate ? 'Menunggu Penutupan' : 'Belum Mulai',
                startDate: finishedDate || assignedDate,
                endDate: closedDate,
                actor: selected.creator?.name || 'Admin / PIC / Signer',
            },
        ];
    }, [phase1Days, phase2Days, phase3Days, submittedDate, assignedDate, finishedDate, closedDate, selected]);

    const activeSelectedEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) || [] : [];

    const firstDayVisible = weeklyDaysList[0];
    const lastDayVisible = weeklyDaysList[weeklyDaysList.length - 1];

    return (
        <div className="flex flex-col gap-4">
            {/* Card 1: Diagram Batang Mandiri Durasi SLA */}
            <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            <BarChart3 size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-xs font-bold text-foreground">
                                Diagram Durasi SLA per Tahapan
                            </CardTitle>
                        </div>
                    </div>
                    {totalDays && (
                        <Badge className="px-2.5 py-0.5 text-[11px] font-bold bg-primary text-primary-foreground">
                            Total SLA: {totalDays} Hari
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-4">
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stageChartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                    domain={[0, (dataMax: number) => Math.max(3, Math.ceil(dataMax) + 1)]}
                                    tickFormatter={(v) => `${Math.round(v)}`}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 11, fontWeight: 700 }}
                                    width={140}
                                />
                                <RechartsTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-popover text-popover-foreground border border-border rounded-lg p-2.5 text-xs shadow-md space-y-1">
                                                    <div className="font-bold">{data.fullName}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">Durasi:</span>
                                                        <span className="font-bold text-primary">{data.days} Hari ({data.percentage}%)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">Penanggung Jawab:</span>
                                                        <span className="font-medium">{data.actor}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <span className="font-semibold">{data.status}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="days" radius={[0, 6, 6, 0]} barSize={20}>
                                    {stageChartData.map((entry) => (
                                        <Cell key={`cell-${entry.id}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Kalender & Timeline SLA */}
            <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            <CalendarIcon size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-xs font-bold text-foreground">
                                Timeline Kalender SLA Kontrak
                            </CardTitle>
                        </div>
                    </div>

                    {/* Quick Navigation Shortcuts & View Mode Switcher Dropdowns */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Dropdown 1: View Mode (Weekly vs Monthly) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                                >
                                    {viewMode === 'weekly' ? (
                                        <Columns size={12} className="text-primary" />
                                    ) : (
                                        <CalendarDays size={12} className="text-primary" />
                                    )}
                                    <span>{viewMode === 'weekly' ? 'Weekly (2 Minggu)' : 'Monthly (Grid 4x4)'}</span>
                                    <ChevronDown size={12} className="text-muted-foreground ml-1" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[170px] p-1">
                                <DropdownMenuItem
                                    onClick={() => setViewMode('weekly')}
                                    className={cn(
                                        'cursor-pointer text-xs font-semibold gap-2 py-1.5',
                                        viewMode === 'weekly' && 'bg-muted text-foreground font-bold'
                                    )}
                                >
                                    <Columns size={13} className="text-primary" />
                                    <span>Weekly (2 Minggu)</span>
                                    {viewMode === 'weekly' && <Check size={13} className="ml-auto text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setViewMode('monthly')}
                                    className={cn(
                                        'cursor-pointer text-xs font-semibold gap-2 py-1.5',
                                        viewMode === 'monthly' && 'bg-muted text-foreground font-bold'
                                    )}
                                >
                                    <CalendarDays size={13} className="text-primary" />
                                    <span>Monthly (Grid 4x4)</span>
                                    {viewMode === 'monthly' && <Check size={13} className="ml-auto text-primary" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Dropdown 2: Milestone Data Shortcuts */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                                >
                                    <Clock size={12} className="text-primary" />
                                    <span>Milestone SLA</span>
                                    <ChevronDown size={12} className="text-muted-foreground ml-1" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[210px] p-1">
                                {submittedDate && (
                                    <DropdownMenuItem
                                        onClick={() => jumpToDate(submittedDate)}
                                        className="cursor-pointer text-xs font-medium gap-2 py-1.5"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                        <span className="font-bold text-foreground">1. Pengajuan</span>
                                        <span className="text-muted-foreground text-[10.5px] ml-auto">
                                            {formatDate(submittedDate, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </DropdownMenuItem>
                                )}
                                {assignedDate && (
                                    <DropdownMenuItem
                                        onClick={() => jumpToDate(assignedDate)}
                                        className="cursor-pointer text-xs font-medium gap-2 py-1.5"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-sky-600 shrink-0" />
                                        <span className="font-bold text-foreground">2. Assigned PIC</span>
                                        <span className="text-muted-foreground text-[10.5px] ml-auto">
                                            {formatDate(assignedDate, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </DropdownMenuItem>
                                )}
                                {finishedDate && (
                                    <DropdownMenuItem
                                        onClick={() => jumpToDate(finishedDate)}
                                        className="cursor-pointer text-xs font-medium gap-2 py-1.5"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                                        <span className="font-bold text-foreground">3. Selesai</span>
                                        <span className="text-muted-foreground text-[10.5px] ml-auto">
                                            {formatDate(finishedDate, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </DropdownMenuItem>
                                )}
                                {closedDate && (
                                    <DropdownMenuItem
                                        onClick={() => jumpToDate(closedDate)}
                                        className="cursor-pointer text-xs font-medium gap-2 py-1.5"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                                        <span className="font-bold text-foreground">{finishedDate ? '4' : '3'}. Closed</span>
                                        <span className="text-muted-foreground text-[10.5px] ml-auto">
                                            {formatDate(closedDate, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => jumpToDate(new Date())}
                                    className="cursor-pointer text-xs font-medium gap-2 py-1.5"
                                >
                                    <RotateCcw size={12} className="text-muted-foreground shrink-0" />
                                    <span className="font-bold text-foreground">Hari Ini</span>
                                    <span className="text-muted-foreground text-[10.5px] ml-auto">
                                        {formatDate(new Date(), { day: 'numeric', month: 'short' })}
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                    {/* Timeline Range Indicator & Mode Specific Navigation Controls */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
                                {viewMode === 'weekly' ? (
                                    <>
                                        <span>Rentang Tampil:</span>
                                    <span className="font-semibold text-muted-foreground">
                                        {firstDayVisible?.dayNumber} {firstDayVisible?.monthName} {firstDayVisible?.year} — {lastDayVisible?.dayNumber} {lastDayVisible?.monthName} {lastDayVisible?.year}
                                    </span>
                                    <Badge className="px-2 py-0 text-[10px] font-bold bg-primary text-primary-foreground">
                                        {weeklyDaysList.length} Hari
                                    </Badge>
                                </>
                            ) : (
                                <>
                                    <span>Kalender Bulan:</span>
                                    <span className="font-semibold text-muted-foreground">
                                        {ID_MONTHS_FULL[viewMonth]} {viewYear}
                                    </span>
                                </>
                            )}
                        </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {viewMode === 'weekly' ? (
                            <>
                                <button
                                    type="button"
                                    onClick={loadMorePast}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded-md border border-border/60 bg-background hover:bg-muted text-foreground flex items-center gap-1 transition-all cursor-pointer"
                                    title="Muat 7 Hari Sebelumnya"
                                >
                                    <ChevronLeft size={12} /> +7 Hari Lalu
                                </button>
                                <button
                                    type="button"
                                    onClick={loadMoreFuture}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded-md border border-border/60 bg-background hover:bg-muted text-foreground flex items-center gap-1 transition-all cursor-pointer"
                                    title="Muat 7 Hari Mendatang"
                                >
                                    +7 Hari Depan <ChevronRight size={12} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded-md border border-border/60 bg-background hover:bg-muted text-foreground flex items-center gap-1 transition-all cursor-pointer"
                                    title="Bulan Sebelumnya"
                                >
                                    <ChevronLeft size={12} /> Bulan Lalu
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded-md border border-border/60 bg-background hover:bg-muted text-foreground flex items-center gap-1 transition-all cursor-pointer"
                                    title="Bulan Berikutnya"
                                >
                                    Bulan Depan <ChevronRight size={12} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* VIEW MODE: WEEKLY (Horizontal Linear Strip) */}
                {viewMode === 'weekly' && (
                    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="overflow-x-auto custom-scrollbar p-3"
                        >
                            <div className="inline-flex gap-0 border border-border/50 rounded-lg overflow-hidden bg-card min-w-full">
                                {weeklyDaysList.map((day) => {
                                    const isSelected = selectedDateKey === day.dateKey;
                                    return (
                                        <div
                                            id={`day-cell-${day.dateKey}`}
                                            key={day.dateKey}
                                            onClick={() => setSelectedDateKey(day.dateKey)}
                                            className={cn(
                                                'flex flex-col justify-between py-2 border-r last:border-r-0 border-border/50 cursor-pointer transition-all select-none relative group min-h-[92px] shrink-0 bg-card w-[58px] sm:w-[66px]',
                                                day.isToday && 'bg-muted/50',
                                                isSelected && 'ring-2 ring-inset ring-primary z-20',
                                                'hover:bg-muted/40'
                                            )}
                                        >
                                            {/* Top Day & Month Header */}
                                            <div className="flex flex-col items-center px-0.5">
                                                <span className={cn(
                                                    'text-[9.5px] font-bold uppercase',
                                                    day.isWeekend ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                                                )}>
                                                    {day.dayName}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center justify-center h-5 w-5 rounded-md text-[11px] font-bold mt-0.5',
                                                        day.isToday && 'bg-primary text-primary-foreground font-extrabold',
                                                        !day.isToday && 'text-foreground'
                                                    )}
                                                >
                                                    {day.dayNumber}
                                                </span>
                                                <span className="text-[8.5px] text-muted-foreground font-medium">
                                                    {day.monthName}
                                                </span>
                                            </div>

                                            {/* Middle Solid Connecting Timeline Stream */}
                                            <div className="relative w-full h-7 my-auto flex items-center">
                                                {/* Phase 1 Solid Blue Connecting Bar */}
                                                {day.inPhase1 && (
                                                    <div
                                                        className={cn(
                                                            'absolute inset-y-1.5 bg-blue-600 z-0',
                                                            day.isPhase1Start ? 'left-1/2 rounded-l-md' : 'left-0',
                                                            day.isPhase1End ? 'right-1/2' : 'right-0'
                                                        )}
                                                    />
                                                )}

                                                {/* Phase 2 Solid Indigo Connecting Bar */}
                                                {day.inPhase2 && (
                                                    <div
                                                        className={cn(
                                                            'absolute inset-y-1.5 bg-indigo-600 z-0',
                                                            day.isPhase2Start ? 'left-1/2' : 'left-0',
                                                            day.isPhase2End ? 'right-1/2 rounded-r-md' : 'right-0'
                                                        )}
                                                    />
                                                )}

                                                {/* Phase 3 Solid Emerald Connecting Bar */}
                                                {day.inPhase3 && (
                                                    <div
                                                        className={cn(
                                                            'absolute inset-y-1.5 bg-emerald-600 z-0',
                                                            day.isPhase3Start ? 'left-1/2' : 'left-0',
                                                            day.isPhase3End ? 'right-1/2 rounded-r-md' : 'right-0'
                                                        )}
                                                    />
                                                )}

                                                {/* Milestone Solid Icons */}
                                                {day.isSubmitted && (
                                                    <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center ring-2 ring-card" title="1. Pengajuan Dibuat">
                                                        <PlayCircle size={13} />
                                                    </div>
                                                )}

                                                {day.isAssigned && (
                                                    <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-sky-600 text-white flex items-center justify-center ring-2 ring-card" title="2. Assigned PIC">
                                                        <UserCheck size={13} />
                                                    </div>
                                                )}

                                                {day.isFinished && (
                                                    <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center ring-2 ring-card" title="3. Selesai Dikerjakan">
                                                        <FileCheck2 size={13} />
                                                    </div>
                                                )}

                                                {day.isClosed && (
                                                    <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-emerald-600 text-white flex items-center justify-center ring-2 ring-card" title="4. Closed At">
                                                        <CheckCircle2 size={13} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Label on Cell */}
                                            <div className="px-0.5 text-center min-h-[14px]">
                                                {day.isSubmitted && (
                                                    <span className="text-[8.5px] font-bold text-blue-600 dark:text-blue-400 block truncate">
                                                        Pengajuan
                                                    </span>
                                                )}
                                                {day.isAssigned && (
                                                    <span className="text-[8.5px] font-bold text-sky-600 dark:text-sky-400 block truncate">
                                                        Assigned
                                                    </span>
                                                )}
                                                {day.isFinished && (
                                                    <span className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">
                                                        Selesai
                                                    </span>
                                                )}
                                                {day.isClosed && (
                                                    <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                                                        Closed
                                                    </span>
                                                )}
                                                {!day.isMilestone && day.events[0]?.timeStr && (
                                                    <span className="text-[7.5px] font-mono text-muted-foreground block truncate">
                                                        {day.events[0].timeStr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW MODE: MONTHLY (Full 7-Column Calendar Grid) */}
                {viewMode === 'monthly' && (
                    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                        {/* Day of Week Headers */}
                        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/40 text-center py-2 text-[10.5px] font-bold">
                            {ID_DAYS_SHORT.map((dayName, idx) => (
                                <div
                                    key={dayName}
                                    className={cn(
                                        idx === 0 || idx === 6 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                                    )}
                                >
                                    {dayName}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Week Rows */}
                        <div className="divide-y divide-border/50">
                            {monthlyGridWeeks.map((week, wIdx) => (
                                <div key={`week-${wIdx}`} className="grid grid-cols-7 divide-x divide-border/50">
                                    {week.map((day) => {
                                        const isSelected = selectedDateKey === day.dateKey;
                                        return (
                                            <div
                                                id={`day-cell-${day.dateKey}`}
                                                key={day.dateKey}
                                                onClick={() => day.isCurrentMonth && setSelectedDateKey(day.dateKey)}
                                                className={cn(
                                                    'flex flex-col justify-between p-1.5 min-h-[78px] sm:min-h-[86px] relative transition-all select-none group',
                                                    !day.isCurrentMonth && 'bg-muted/20 opacity-40 cursor-default',
                                                    day.isCurrentMonth && 'cursor-pointer hover:bg-muted/30 bg-card',
                                                    day.isToday && 'bg-muted/50',
                                                    isSelected && 'ring-2 ring-inset ring-primary z-20'
                                                )}
                                            >
                                                {/* Top Date Header */}
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center justify-center h-5 w-5 rounded-md text-[11px] font-bold',
                                                            day.isToday && 'bg-primary text-primary-foreground font-extrabold',
                                                            !day.isToday && day.isWeekend && 'text-rose-600 dark:text-rose-400',
                                                            !day.isToday && !day.isWeekend && (day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground')
                                                        )}
                                                    >
                                                        {day.dayNumber}
                                                    </span>
                                                    {day.isCurrentMonth && day.events[0]?.timeStr && !day.isMilestone && (
                                                        <span className="text-[8px] font-mono text-muted-foreground">
                                                            {day.events[0].timeStr}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Middle Solid Connecting Timeline Stream */}
                                                <div className="relative w-full h-7 my-auto flex items-center">
                                                    {/* Phase 1 Solid Blue Connecting Bar */}
                                                    {day.inPhase1 && day.isCurrentMonth && (
                                                        <div
                                                            className={cn(
                                                                'absolute inset-y-1.5 bg-blue-600 z-0',
                                                                day.isPhase1Start ? 'left-1/2 rounded-l-md' : 'left-0',
                                                                day.isPhase1End ? 'right-1/2' : 'right-0'
                                                            )}
                                                        />
                                                    )}

                                                    {/* Phase 2 Solid Indigo Connecting Bar */}
                                                    {day.inPhase2 && day.isCurrentMonth && (
                                                        <div
                                                            className={cn(
                                                                'absolute inset-y-1.5 bg-indigo-600 z-0',
                                                                day.isPhase2Start ? 'left-1/2' : 'left-0',
                                                                day.isPhase2End ? 'right-1/2 rounded-r-md' : 'right-0'
                                                            )}
                                                        />
                                                    )}

                                                    {/* Phase 3 Solid Emerald Connecting Bar */}
                                                    {day.inPhase3 && day.isCurrentMonth && (
                                                        <div
                                                            className={cn(
                                                                'absolute inset-y-1.5 bg-emerald-600 z-0',
                                                                day.isPhase3Start ? 'left-1/2' : 'left-0',
                                                                day.isPhase3End ? 'right-1/2 rounded-r-md' : 'right-0'
                                                            )}
                                                        />
                                                    )}

                                                    {/* Milestone Solid Icons */}
                                                    {day.isCurrentMonth && day.isSubmitted && (
                                                        <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center ring-2 ring-card" title="1. Pengajuan Dibuat">
                                                            <PlayCircle size={13} />
                                                        </div>
                                                    )}

                                                    {day.isCurrentMonth && day.isAssigned && (
                                                        <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-sky-600 text-white flex items-center justify-center ring-2 ring-card" title="2. Assigned PIC">
                                                            <UserCheck size={13} />
                                                        </div>
                                                    )}

                                                    {day.isCurrentMonth && day.isFinished && (
                                                        <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center ring-2 ring-card" title="3. Selesai Dikerjakan">
                                                            <FileCheck2 size={13} />
                                                        </div>
                                                    )}

                                                    {day.isCurrentMonth && day.isClosed && (
                                                        <div className="relative z-10 mx-auto h-6 w-6 rounded-md bg-emerald-600 text-white flex items-center justify-center ring-2 ring-card" title="4. Closed At">
                                                            <CheckCircle2 size={13} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bottom Label on Cell */}
                                                <div className="text-center min-h-[14px]">
                                                    {day.isCurrentMonth && day.isSubmitted && (
                                                        <span className="text-[8.5px] font-bold text-blue-600 dark:text-blue-400 block truncate">
                                                            Pengajuan
                                                        </span>
                                                    )}
                                                    {day.isCurrentMonth && day.isAssigned && (
                                                        <span className="text-[8.5px] font-bold text-sky-600 dark:text-sky-400 block truncate">
                                                            Assigned
                                                        </span>
                                                    )}
                                                    {day.isCurrentMonth && day.isFinished && (
                                                        <span className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">
                                                            Selesai
                                                        </span>
                                                    )}
                                                    {day.isCurrentMonth && day.isClosed && (
                                                        <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                                                            Closed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Date Details Pill / Popup */}
                {selectedDateKey && activeSelectedEvents.length > 0 && (
                    <div className="p-3 rounded-lg border border-border/60 bg-card text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-bold text-foreground shrink-0 flex items-center gap-1.5">
                                <CalendarIcon size={14} className="text-primary" />
                                {formatDate(selectedDateKey, { day: 'numeric', month: 'short', year: 'numeric' })}:
                            </span>
                            {activeSelectedEvents.map((ev) => (
                                <div key={ev.id} className="flex items-center gap-2 truncate">
                                    <Badge className={cn('px-1.5 py-0 text-[9.5px] font-bold', ev.badgeClass)}>
                                        {ev.title}
                                    </Badge>
                                    <span className="text-[11px] text-muted-foreground truncate">
                                        {ev.actor ? `(${ev.actor})` : ''} {ev.description}
                                    </span>
                                    {ev.timeStr && (
                                        <span className="font-mono text-[10px] font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {ev.timeStr} WIB
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedDateKey(null)}
                            className="text-[10px] text-muted-foreground hover:text-foreground font-bold px-2 py-0.5 rounded hover:bg-muted cursor-pointer shrink-0"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Minimalist Legend Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10.5px] text-muted-foreground border-t border-border/50">
                    <div className="flex items-center gap-3.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-4 rounded-xs bg-blue-600" />
                            <span className="text-foreground font-medium">1. Pengajuan ({phase1Days ? `${phase1Days} Hari` : ''})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-4 rounded-xs bg-indigo-600" />
                            <span className="text-foreground font-medium">2. Pengerjaan PIC ({phase2Days ? `${phase2Days} Hari` : ''})</span>
                        </div>
                        {phase3Days && (
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-4 rounded-xs bg-emerald-600" />
                                <span className="text-foreground font-medium">3. Selesai s/d Closed ({phase3Days} Hari)</span>
                            </div>
                        )}
                    </div>
                    {totalDays && (
                        <span className="text-foreground font-bold ml-auto">
                            Total SLA: {totalDays} Hari
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
    );
}
