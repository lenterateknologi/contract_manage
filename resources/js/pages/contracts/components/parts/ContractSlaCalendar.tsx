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
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Columns,
    FileCheck2,
    FileText,
    PlayCircle,
    RotateCcw,
    UserCheck,
} from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

export interface CalendarEvent {
    id: string;
    date: Date;
    dateKey: string; // YYYY-MM-DD
    timeStr?: string; // HH:mm
    title: string;
    type: 'submitted' | 'assigned' | 'finished' | 'closed';
    badgeClass: string;
    icon?: any;
    actor?: string;
    description?: string;
}

const ID_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const ID_MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];
const ID_MONTHS_FULL = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
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

    // View mode: 'monthly' (full month grid) vs 'weekly' (2-week scrollable window)
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

    // Base anchor date
    const initialDate = submittedDate || assignedDate || finishedDate || closedDate || new Date();
    const [anchorDate, setAnchorDate] = useState<Date>(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()));
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

    const [extraPastDays, setExtraPastDays] = useState(7);
    const [extraFutureDays, setExtraFutureDays] = useState(14);
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
                type: 'finished',
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

    const pSubmitted = useMemo(() => (submittedDate ? new Date(submittedDate.getFullYear(), submittedDate.getMonth(), submittedDate.getDate()) : null), [submittedDate]);
    const pAssigned = useMemo(() => (assignedDate ? new Date(assignedDate.getFullYear(), assignedDate.getMonth(), assignedDate.getDate()) : null), [assignedDate]);
    const pFinished = useMemo(() => (finishedDate ? new Date(finishedDate.getFullYear(), finishedDate.getMonth(), finishedDate.getDate()) : null), [finishedDate]);
    const pClosed = useMemo(() => (closedDate ? new Date(closedDate.getFullYear(), closedDate.getMonth(), closedDate.getDate()) : null), [closedDate]);

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
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(viewYear, viewMonth, day);
            allDays.push(buildDayMeta(d, true));
        }

        // Next month padding days to fill 35 or 42 grid slots
        const totalSlots = Math.ceil(allDays.length / 7) * 7;
        const remainingSlots = totalSlots - allDays.length;
        for (let i = 1; i <= remainingSlots; i++) {
            const d = new Date(viewYear, viewMonth + 1, i);
            allDays.push(buildDayMeta(d, false));
        }

        // Chunk into weeks of 7 days
        const weeks = [];
        for (let i = 0; i < allDays.length; i += 7) {
            weeks.push(allDays.slice(i, i + 7));
        }
        return weeks;
    }, [viewYear, viewMonth, buildDayMeta]);

    // Navigation Handlers
    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleResetToToday = () => {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        setAnchorDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    };

    const handleJumpToEvent = (date: Date) => {
        setViewYear(date.getFullYear());
        setViewMonth(date.getMonth());
        setAnchorDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        setSelectedDateKey(toDateKey(date));
    };

    // Calculate days differences for 2 metrics
    const submittedAt =
        selected.submitted_at_formatted ||
        selected.submitted_at ||
        selected.created_at_formatted ||
        selected.created_at ||
        '—';
    const closedAt = selected.closed_at_formatted || selected.closed_at;
    const isClosed = Boolean(closedAt);
    const submissionAge = selected.submission_age || '—';

    const assignedAt =
        selected.assigned_at_formatted ||
        selected.assigned_at ||
        (selected as any).pic_assigned_at ||
        '—';
    const finishedAt = selected.finished_at_formatted || selected.finished_at;
    const isFinishedByPic = Boolean(finishedAt);
    const picAge = selected.pic_age || (assignedAt !== '—' ? 'Sedang diproses...' : 'Belum di-assign');

    const picName = selected.assigned_pic?.name || (selected as any).assigned_pic_name || 'Belum ditugaskan';
    const initiatorName = selected.initiator?.name || selected.creator?.name || 'Inisiator';

    const activeSelectedEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) || [] : [];

    return (
        <div className="flex flex-col gap-4">
            {/* 2 Baris Utama: Durasi Total Pengajuan & Durasi Pengerjaan PIC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Baris 1: Durasi Pengajuan (created_at -> closed_at) */}
                <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                    <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-2 space-y-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                                <FileText size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <CardTitle className="text-xs font-bold text-foreground truncate">
                                    1. Durasi Total Pengajuan (Lead Time)
                                </CardTitle>
                                <span className="text-[10px] text-muted-foreground truncate">
                                    Waktu pengajuan hingga dokumen ditutup
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant={isClosed ? 'default' : 'secondary'}
                            className="text-[9.5px] font-bold px-2 py-0.5 shrink-0"
                        >
                            {isClosed ? 'Selesai & Ditutup' : 'Sedang Berjalan'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Durasi Total:</span>
                            <span className="text-sm font-bold text-foreground font-mono bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
                                {submissionAge}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
                            <div>
                                <span className="text-[10px] text-muted-foreground block font-medium">Tanggal Dibuat:</span>
                                <span className="font-semibold text-foreground truncate block">{submittedAt}</span>
                                <span className="text-[10px] text-muted-foreground truncate block">Oleh: {initiatorName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block font-medium">Tanggal Ditutup:</span>
                                <span className="font-semibold text-foreground truncate block">
                                    {closedAt || 'Masih Berjalan'}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate block">
                                    {isClosed ? 'Status: Final/Closed' : 'Status: Aktif'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Baris 2: Durasi Pengerjaan PIC (assigned_at -> finished_at) */}
                <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                    <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-2 space-y-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                <UserCheck size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <CardTitle className="text-xs font-bold text-foreground truncate">
                                    2. Durasi Pengerjaan PIC (Processing Time)
                                </CardTitle>
                                <span className="text-[10px] text-muted-foreground truncate">
                                    Waktu penugasan PIC hingga pengerjaan selesai
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant={isFinishedByPic ? 'default' : 'outline'}
                            className={`text-[9.5px] font-bold px-2 py-0.5 shrink-0 ${
                                isFinishedByPic
                                    ? 'bg-emerald-600 text-white'
                                    : 'border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10'
                            }`}
                        >
                            {isFinishedByPic ? 'Selesai di PIC' : (assignedAt !== '—' ? 'Sedang di PIC' : 'Belum di-assign')}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Durasi PIC:</span>
                            <span className="text-sm font-bold text-foreground font-mono bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
                                {picAge}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
                            <div>
                                <span className="text-[10px] text-muted-foreground block font-medium">PIC Ditugaskan:</span>
                                <span className="font-semibold text-foreground truncate block">{picName}</span>
                                <span className="text-[10px] text-muted-foreground truncate block">
                                    {assignedAt !== '—' ? `Waktu: ${assignedAt}` : 'Belum ditugaskan'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block font-medium">Waktu Selesai:</span>
                                <span className="font-semibold text-foreground truncate block">
                                    {finishedAt || 'Dalam Proses'}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate block">
                                    {isFinishedByPic ? 'Pengerjaan draf selesai' : 'Sedang ditangani PIC'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kalender SLA Kontrak Interaktif */}
            <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            <CalendarIcon size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-xs font-bold text-foreground">
                                Kalender Timeline Dokumen
                            </CardTitle>
                            <span className="text-[10px] text-muted-foreground">
                                Visualisasi tanggal tahapan pengajuan pada kalender
                            </span>
                        </div>
                    </div>

                    {/* Quick Navigation Shortcuts & View Mode Switcher */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Dropdown 1: View Mode (Monthly vs Weekly) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                                >
                                    {viewMode === 'monthly' ? (
                                        <CalendarDays size={12} className="text-primary" />
                                    ) : (
                                        <Columns size={12} className="text-primary" />
                                    )}
                                    <span>{viewMode === 'monthly' ? 'Bulanan (Grid Kalender)' : 'Mingguan (Timeline Bar)'}</span>
                                    <ChevronDown size={12} className="text-muted-foreground ml-1" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[170px] p-1">
                                <DropdownMenuItem
                                    onClick={() => setViewMode('monthly')}
                                    className={cn(
                                        'cursor-pointer text-xs font-semibold gap-2 py-1.5',
                                        viewMode === 'monthly' && 'bg-muted text-foreground font-bold'
                                    )}
                                >
                                    <CalendarDays size={13} className="text-primary" />
                                    <span>Bulanan (Grid Kalender)</span>
                                    {viewMode === 'monthly' && <Check size={13} className="ml-auto text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setViewMode('weekly')}
                                    className={cn(
                                        'cursor-pointer text-xs font-semibold gap-2 py-1.5',
                                        viewMode === 'weekly' && 'bg-muted text-foreground font-bold'
                                    )}
                                >
                                    <Columns size={13} className="text-primary" />
                                    <span>Mingguan (Timeline Bar)</span>
                                    {viewMode === 'weekly' && <Check size={13} className="ml-auto text-primary" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Dropdown 2: Quick Jump Milestones */}
                        {events.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted text-foreground transition-all cursor-pointer"
                                    >
                                        <CalendarIcon size={12} className="text-primary" />
                                        <span>Lompat ke Tanggal</span>
                                        <ChevronDown size={12} className="text-muted-foreground ml-1" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[200px] p-1">
                                    {events.map((ev) => {
                                        const IconComponent = ev.icon || CalendarIcon;
                                        return (
                                            <DropdownMenuItem
                                                key={ev.id}
                                                onClick={() => handleJumpToEvent(ev.date)}
                                                className="cursor-pointer text-xs flex items-center gap-2 py-1.5"
                                            >
                                                <IconComponent size={13} className="text-primary shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-foreground truncate">{ev.title}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDate(ev.date)}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 flex flex-col gap-4">
                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="h-7 w-7 rounded-lg border border-border/60 bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="Bulan Sebelumnya"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-bold text-foreground px-2 min-w-[130px] text-center">
                                {ID_MONTHS_FULL[viewMonth]} {viewYear}
                            </span>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="h-7 w-7 rounded-lg border border-border/60 bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="Bulan Berikutnya"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleResetToToday}
                            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-border/60 bg-card hover:bg-muted text-foreground transition-all cursor-pointer active:scale-95"
                        >
                            <RotateCcw size={11} className="text-muted-foreground" />
                            <span>Hari Ini</span>
                        </button>
                    </div>

                    {/* VIEW MODE: MONTHLY (Full 7-Column Calendar Grid) */}
                    {viewMode === 'monthly' && (
                        <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                            {/* Day Header Row */}
                            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/40 text-center">
                                {ID_DAYS_SHORT.map((dayName, idx) => (
                                    <div
                                        key={dayName}
                                        className={cn(
                                            'py-2 text-[11px] font-bold',
                                            idx === 0 || idx === 6
                                                ? 'text-rose-500 dark:text-rose-400'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {dayName}
                                    </div>
                                ))}
                            </div>

                            {/* Weeks Grid */}
                            <div className="divide-y divide-border/50">
                                {monthlyGridWeeks.map((week, weekIdx) => (
                                    <div key={weekIdx} className="grid grid-cols-7 divide-x divide-border/50 min-h-[64px]">
                                        {week.map((day) => {
                                            const isSelected = selectedDateKey === day.dateKey;
                                            return (
                                                <div
                                                    key={day.dateKey}
                                                    onClick={() => {
                                                        if (day.events.length > 0 || day.isMilestone) {
                                                            setSelectedDateKey(isSelected ? null : day.dateKey);
                                                        }
                                                    }}
                                                    className={cn(
                                                        'p-1.5 flex flex-col justify-between transition-colors relative',
                                                        !day.isCurrentMonth && 'bg-muted/10 opacity-40',
                                                        day.isCurrentMonth && 'bg-card hover:bg-muted/20',
                                                        day.isWeekend && day.isCurrentMonth && 'bg-muted/15',
                                                        isSelected && 'ring-2 ring-primary ring-inset z-10',
                                                        (day.events.length > 0 || day.isMilestone) && 'cursor-pointer'
                                                    )}
                                                >
                                                    {/* Day Number Header */}
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-bold',
                                                                day.isToday && 'bg-primary text-primary-foreground font-extrabold',
                                                                !day.isToday && day.isWeekend && 'text-rose-500 dark:text-rose-400 font-semibold',
                                                                !day.isToday && !day.isWeekend && 'text-foreground font-semibold'
                                                            )}
                                                        >
                                                            {day.dayNumber}
                                                        </span>
                                                        {day.isToday && (
                                                            <span className="text-[8px] font-bold text-primary px-1 bg-primary/10 rounded">
                                                                Hari Ini
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Event Markers on Grid */}
                                                    <div className="flex flex-col gap-1 my-1 min-h-[22px] justify-center">
                                                        {day.isCurrentMonth && day.isSubmitted && (
                                                            <div className="flex items-center gap-1 bg-blue-600/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-600/20 truncate">
                                                                <PlayCircle size={10} className="shrink-0 text-blue-600" />
                                                                <span className="truncate">Pengajuan</span>
                                                            </div>
                                                        )}
                                                        {day.isCurrentMonth && day.isAssigned && (
                                                            <div className="flex items-center gap-1 bg-sky-600/10 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-sky-600/20 truncate">
                                                                <UserCheck size={10} className="shrink-0 text-sky-600" />
                                                                <span className="truncate">Assigned</span>
                                                            </div>
                                                        )}
                                                        {day.isCurrentMonth && day.isFinished && (
                                                            <div className="flex items-center gap-1 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-600/20 truncate">
                                                                <FileCheck2 size={10} className="shrink-0 text-indigo-600" />
                                                                <span className="truncate">Selesai</span>
                                                            </div>
                                                        )}
                                                        {day.isCurrentMonth && day.isClosed && (
                                                            <div className="flex items-center gap-1 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-600/20 truncate">
                                                                <CheckCircle2 size={10} className="shrink-0 text-emerald-600" />
                                                                <span className="truncate">Closed</span>
                                                            </div>
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

                    {/* VIEW MODE: WEEKLY (Scrollable Horizontal Strip) */}
                    {viewMode === 'weekly' && (
                        <div
                            ref={scrollContainerRef}
                            className="overflow-x-auto custom-scrollbar border border-border/60 rounded-xl bg-card p-2"
                        >
                            <div className="flex gap-1.5 min-w-max">
                                {weeklyDaysList.map((day) => {
                                    const isSelected = selectedDateKey === day.dateKey;
                                    return (
                                        <div
                                            key={day.dateKey}
                                            onClick={() => {
                                                if (day.events.length > 0 || day.isMilestone) {
                                                    setSelectedDateKey(isSelected ? null : day.dateKey);
                                                }
                                            }}
                                            className={cn(
                                                'w-[76px] shrink-0 rounded-lg p-2 flex flex-col items-center justify-between gap-1.5 border transition-all relative',
                                                day.isToday && 'border-primary/60 bg-primary/5',
                                                !day.isToday && 'border-border/50 bg-muted/20 hover:bg-muted/40',
                                                isSelected && 'ring-2 ring-primary ring-inset',
                                                (day.events.length > 0 || day.isMilestone) && 'cursor-pointer'
                                            )}
                                        >
                                            <span className="text-[9.5px] font-bold text-muted-foreground uppercase">
                                                {day.dayName}
                                            </span>
                                            <span
                                                className={cn(
                                                    'h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold',
                                                    day.isToday && 'bg-primary text-primary-foreground',
                                                    !day.isToday && 'text-foreground font-semibold'
                                                )}
                                            >
                                                {day.dayNumber}
                                            </span>
                                            <span className="text-[8.5px] text-muted-foreground">{day.monthName}</span>

                                            <div className="min-h-[20px] flex items-center justify-center w-full">
                                                {day.isSubmitted && (
                                                    <span className="text-[8.5px] font-bold text-blue-600 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20 truncate block w-full text-center">
                                                        Diajukan
                                                    </span>
                                                )}
                                                {day.isAssigned && (
                                                    <span className="text-[8.5px] font-bold text-sky-600 bg-sky-500/10 px-1 py-0.5 rounded border border-sky-500/20 truncate block w-full text-center">
                                                        Assigned
                                                    </span>
                                                )}
                                                {day.isFinished && (
                                                    <span className="text-[8.5px] font-bold text-indigo-600 bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20 truncate block w-full text-center">
                                                        Selesai
                                                    </span>
                                                )}
                                                {day.isClosed && (
                                                    <span className="text-[8.5px] font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 truncate block w-full text-center">
                                                        Closed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selected Date Details Pill / Popup */}
                    {selectedDateKey && activeSelectedEvents.length > 0 && (
                        <div className="p-3 rounded-lg border border-border/60 bg-muted/40 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
                            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
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

                    {/* Legend Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10.5px] text-muted-foreground border-t border-border/50">
                        <div className="flex items-center gap-3.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                <span className="text-foreground font-medium">1. Pengajuan Dibuat</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                                <span className="text-foreground font-medium">2. Di-Assign ke PIC</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                                <span className="text-foreground font-medium">3. Selesai Dikerjakan</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                                <span className="text-foreground font-medium">4. Selesai / Closed</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
