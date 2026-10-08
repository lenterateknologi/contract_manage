import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { formatDate, parseDateInput } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import {
    CalendarDays,
    Calendar as CalendarIcon,
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
import { useCallback, useMemo, useRef, useState } from 'react';

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
const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const ID_MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

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
            (selected.metadata as any)?.assigned_at,
    );

    // 3. Tanggal Selesai Dikerjakan (Finished At)
    const finishedDate = parseDateInput(
        selected.finished_at || (selected as any).finish_at || (selected.metadata as any)?.finished_at || (selected.metadata as any)?.finish_at,
    );

    // 4. Tanggal Close At (Selesai / Ditutup)
    const closedDate = parseDateInput(selected.closed_at || (selected.metadata as any)?.closed_at);

    // View mode: 'monthly' (full month grid) vs 'weekly' (2-week scrollable window)
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

    // Base anchor date
    const initialDate = submittedDate || assignedDate || finishedDate || closedDate || new Date();
    const [anchorDate, setAnchorDate] = useState<Date>(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()));
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

    const [extraPastDays] = useState(7);
    const [extraFutureDays] = useState(14);
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

    const pSubmitted = useMemo(
        () => (submittedDate ? new Date(submittedDate.getFullYear(), submittedDate.getMonth(), submittedDate.getDate()) : null),
        [submittedDate],
    );
    const pAssigned = useMemo(
        () => (assignedDate ? new Date(assignedDate.getFullYear(), assignedDate.getMonth(), assignedDate.getDate()) : null),
        [assignedDate],
    );
    const pFinished = useMemo(
        () => (finishedDate ? new Date(finishedDate.getFullYear(), finishedDate.getMonth(), finishedDate.getDate()) : null),
        [finishedDate],
    );
    const pClosed = useMemo(
        () => (closedDate ? new Date(closedDate.getFullYear(), closedDate.getMonth(), closedDate.getDate()) : null),
        [closedDate],
    );

    const buildDayMeta = useCallback(
        (d: Date, isCurrentMonth = true) => {
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
        },
        [pSubmitted, pAssigned, pFinished, pClosed, submittedDate, assignedDate, finishedDate, closedDate, eventsByDate],
    );

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
    const submittedAt = selected.submitted_at_formatted || selected.submitted_at || selected.created_at_formatted || selected.created_at || '—';
    const closedAt = selected.closed_at_formatted || selected.closed_at;
    const isClosed = Boolean(closedAt);
    const submissionAge = selected.submission_age || '—';

    const assignedAt = selected.assigned_at_formatted || selected.assigned_at || (selected as any).pic_assigned_at || '—';
    const finishedAt = selected.finished_at_formatted || selected.finished_at;
    const isFinishedByPic = Boolean(finishedAt);
    const picAge = selected.pic_age || (assignedAt !== '—' ? 'Sedang diproses...' : 'Belum di-assign');

    const picName = selected.assigned_pic?.name || (selected as any).assigned_pic_name || 'Belum ditugaskan';
    const initiatorName = selected.initiator?.name || selected.creator?.name || 'Inisiator';

    const activeSelectedEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) || [] : [];

    return (
        <div className="flex flex-col gap-4">
            {/* 2 Baris Utama: Durasi Total Pengajuan & Durasi Pengerjaan PIC */}
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {/* Baris 1: Durasi Pengajuan (created_at -> closed_at) */}
                <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                    <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-2 space-y-0 border-b p-4 pb-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 font-bold text-blue-600 dark:text-blue-400">
                                <FileText size={16} />
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <CardTitle className="text-foreground truncate text-xs font-bold">1. Durasi Total Pengajuan (Lead Time)</CardTitle>
                                <span className="text-muted-foreground truncate text-[10px]">Waktu pengajuan hingga dokumen ditutup</span>
                            </div>
                        </div>
                        <Badge variant={isClosed ? 'default' : 'secondary'} className="shrink-0 px-2 py-0.5 text-[9.5px] font-bold">
                            {isClosed ? 'Selesai & Ditutup' : 'Sedang Berjalan'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-muted-foreground text-xs font-medium">Durasi Total:</span>
                            <span className="text-foreground bg-muted/50 border-border/40 rounded-md border px-2.5 py-1 font-mono text-sm font-bold">
                                {submissionAge}
                            </span>
                        </div>
                        <div className="border-border/40 grid grid-cols-2 gap-2 border-t pt-2 text-[11px]">
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-medium">Tanggal Dibuat:</span>
                                <span className="text-foreground block truncate font-semibold">{submittedAt}</span>
                                <span className="text-muted-foreground block truncate text-[10px]">Oleh: {initiatorName}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-medium">Tanggal Ditutup:</span>
                                <span className="text-foreground block truncate font-semibold">{closedAt || 'Masih Berjalan'}</span>
                                <span className="text-muted-foreground block truncate text-[10px]">
                                    {isClosed ? 'Status: Final/Closed' : 'Status: Aktif'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Baris 2: Durasi Pengerjaan PIC (assigned_at -> finished_at) */}
                <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                    <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-2 space-y-0 border-b p-4 pb-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                                <UserCheck size={16} />
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <CardTitle className="text-foreground truncate text-xs font-bold">
                                    2. Durasi Pengerjaan PIC (Processing Time)
                                </CardTitle>
                                <span className="text-muted-foreground truncate text-[10px]">Waktu penugasan PIC hingga pengerjaan selesai</span>
                            </div>
                        </div>
                        <Badge
                            variant={isFinishedByPic ? 'default' : 'outline'}
                            className={`shrink-0 px-2 py-0.5 text-[9.5px] font-bold ${
                                isFinishedByPic
                                    ? 'bg-emerald-600 text-white'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            }`}
                        >
                            {isFinishedByPic ? 'Selesai di PIC' : assignedAt !== '—' ? 'Sedang di PIC' : 'Belum di-assign'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-muted-foreground text-xs font-medium">Durasi PIC:</span>
                            <span className="text-foreground bg-muted/50 border-border/40 rounded-md border px-2.5 py-1 font-mono text-sm font-bold">
                                {picAge}
                            </span>
                        </div>
                        <div className="border-border/40 grid grid-cols-2 gap-2 border-t pt-2 text-[11px]">
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-medium">PIC Ditugaskan:</span>
                                <span className="text-foreground block truncate font-semibold">{picName}</span>
                                <span className="text-muted-foreground block truncate text-[10px]">
                                    {assignedAt !== '—' ? `Waktu: ${assignedAt}` : 'Belum ditugaskan'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px] font-medium">Waktu Selesai:</span>
                                <span className="text-foreground block truncate font-semibold">{finishedAt || 'Dalam Proses'}</span>
                                <span className="text-muted-foreground block truncate text-[10px]">
                                    {isFinishedByPic ? 'Pengerjaan draf selesai' : 'Sedang ditangani PIC'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kalender SLA Kontrak Interaktif */}
            <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                <CardHeader className="border-border/50 bg-muted/20 flex flex-col justify-between gap-3 space-y-0 border-b p-4 pb-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                            <CalendarIcon size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-foreground text-xs font-bold">Kalender Timeline Dokumen</CardTitle>
                            <span className="text-muted-foreground text-[10px]">Visualisasi tanggal tahapan pengajuan pada kalender</span>
                        </div>
                    </div>

                    {/* Quick Navigation Shortcuts & View Mode Switcher */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Dropdown 1: View Mode (Monthly vs Weekly) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="border-border/60 bg-background hover:bg-muted text-foreground flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all"
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
                                        'cursor-pointer gap-2 py-1.5 text-xs font-semibold',
                                        viewMode === 'monthly' && 'bg-muted text-foreground font-bold',
                                    )}
                                >
                                    <CalendarDays size={13} className="text-primary" />
                                    <span>Bulanan (Grid Kalender)</span>
                                    {viewMode === 'monthly' && <Check size={13} className="text-primary ml-auto" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setViewMode('weekly')}
                                    className={cn(
                                        'cursor-pointer gap-2 py-1.5 text-xs font-semibold',
                                        viewMode === 'weekly' && 'bg-muted text-foreground font-bold',
                                    )}
                                >
                                    <Columns size={13} className="text-primary" />
                                    <span>Mingguan (Timeline Bar)</span>
                                    {viewMode === 'weekly' && <Check size={13} className="text-primary ml-auto" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Dropdown 2: Quick Jump Milestones */}
                        {events.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="border-border/60 bg-background hover:bg-muted text-foreground flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all"
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
                                                className="flex cursor-pointer items-center gap-2 py-1.5 text-xs"
                                            >
                                                <IconComponent size={13} className="text-primary shrink-0" />
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="text-foreground truncate font-semibold">{ev.title}</span>
                                                    <span className="text-muted-foreground text-[10px]">{formatDate(ev.date)}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4 p-4">
                    {/* Navigation Bar */}
                    <div className="bg-muted/30 border-border/50 flex items-center justify-between gap-3 rounded-xl border p-2.5">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="border-border/60 bg-card hover:bg-muted text-foreground flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-all active:scale-95"
                                title="Bulan Sebelumnya"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-foreground min-w-[130px] px-2 text-center text-xs font-bold">
                                {ID_MONTHS_FULL[viewMonth]} {viewYear}
                            </span>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="border-border/60 bg-card hover:bg-muted text-foreground flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-all active:scale-95"
                                title="Bulan Berikutnya"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleResetToToday}
                            className="border-border/60 bg-card hover:bg-muted text-foreground flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95"
                        >
                            <RotateCcw size={11} className="text-muted-foreground" />
                            <span>Hari Ini</span>
                        </button>
                    </div>

                    {/* VIEW MODE: MONTHLY (Full 7-Column Calendar Grid) */}
                    {viewMode === 'monthly' && (
                        <div className="border-border/60 bg-card overflow-hidden rounded-xl border">
                            {/* Day Header Row */}
                            <div className="border-border/50 bg-muted/40 grid grid-cols-7 border-b text-center">
                                {ID_DAYS_SHORT.map((dayName, idx) => (
                                    <div
                                        key={dayName}
                                        className={cn(
                                            'py-2 text-[11px] font-bold',
                                            idx === 0 || idx === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground',
                                        )}
                                    >
                                        {dayName}
                                    </div>
                                ))}
                            </div>

                            {/* Weeks Grid */}
                            <div className="divide-border/50 divide-y">
                                {monthlyGridWeeks.map((week, weekIdx) => (
                                    <div key={weekIdx} className="divide-border/50 grid min-h-[64px] grid-cols-7 divide-x">
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
                                                        'relative flex flex-col justify-between p-1.5 transition-colors',
                                                        !day.isCurrentMonth && 'bg-muted/10 opacity-40',
                                                        day.isCurrentMonth && 'bg-card hover:bg-muted/20',
                                                        day.isWeekend && day.isCurrentMonth && 'bg-muted/15',
                                                        isSelected && 'ring-primary z-10 ring-2 ring-inset',
                                                        (day.events.length > 0 || day.isMilestone) && 'cursor-pointer',
                                                    )}
                                                >
                                                    {/* Day Number Header */}
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className={cn(
                                                                'inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold',
                                                                day.isToday && 'bg-primary text-primary-foreground font-extrabold',
                                                                !day.isToday && day.isWeekend && 'font-semibold text-rose-500 dark:text-rose-400',
                                                                !day.isToday && !day.isWeekend && 'text-foreground font-semibold',
                                                            )}
                                                        >
                                                            {day.dayNumber}
                                                        </span>
                                                        {day.isToday && (
                                                            <span className="text-primary bg-primary/10 rounded px-1 text-[8px] font-bold">
                                                                Hari Ini
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Event Markers on Grid */}
                                                    <div className="my-1 flex min-h-[22px] flex-col justify-center gap-1">
                                                        {day.isCurrentMonth && day.isSubmitted && (
                                                            <div className="flex items-center gap-1 truncate rounded border border-blue-600/20 bg-blue-600/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-300">
                                                                <PlayCircle size={10} className="shrink-0 text-blue-600" />
                                                                <span className="truncate">Pengajuan</span>
                                                            </div>
                                                        )}
                                                        {day.isCurrentMonth && day.isAssigned && (
                                                            <div className="flex items-center gap-1 truncate rounded border border-sky-600/20 bg-sky-600/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300">
                                                                <UserCheck size={10} className="shrink-0 text-sky-600" />
                                                                <span className="truncate">Assigned</span>
                                                            </div>
                                                        )}
                                                        {day.isCurrentMonth && day.isFinished && (
                                                            <div className="flex items-center gap-1 truncate rounded border border-indigo-600/20 bg-indigo-600/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                                                                <FileCheck2 size={10} className="shrink-0 text-indigo-600" />
                                                                <span className="truncate">Selesai</span>
                                                            </div>
                                                        )}
                                                        {day.isCurrentMonth && day.isClosed && (
                                                            <div className="flex items-center gap-1 truncate rounded border border-emerald-600/20 bg-emerald-600/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
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
                        <div ref={scrollContainerRef} className="custom-scrollbar border-border/60 bg-card overflow-x-auto rounded-xl border p-2">
                            <div className="flex min-w-max gap-1.5">
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
                                                'relative flex w-[76px] shrink-0 flex-col items-center justify-between gap-1.5 rounded-lg border p-2 transition-all',
                                                day.isToday && 'border-primary/60 bg-primary/5',
                                                !day.isToday && 'border-border/50 bg-muted/20 hover:bg-muted/40',
                                                isSelected && 'ring-primary ring-2 ring-inset',
                                                (day.events.length > 0 || day.isMilestone) && 'cursor-pointer',
                                            )}
                                        >
                                            <span className="text-muted-foreground text-[9.5px] font-bold uppercase">{day.dayName}</span>
                                            <span
                                                className={cn(
                                                    'flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold',
                                                    day.isToday && 'bg-primary text-primary-foreground',
                                                    !day.isToday && 'text-foreground font-semibold',
                                                )}
                                            >
                                                {day.dayNumber}
                                            </span>
                                            <span className="text-muted-foreground text-[8.5px]">{day.monthName}</span>

                                            <div className="flex min-h-[20px] w-full items-center justify-center">
                                                {day.isSubmitted && (
                                                    <span className="block w-full truncate rounded border border-blue-500/20 bg-blue-500/10 px-1 py-0.5 text-center text-[8.5px] font-bold text-blue-600">
                                                        Diajukan
                                                    </span>
                                                )}
                                                {day.isAssigned && (
                                                    <span className="block w-full truncate rounded border border-sky-500/20 bg-sky-500/10 px-1 py-0.5 text-center text-[8.5px] font-bold text-sky-600">
                                                        Assigned
                                                    </span>
                                                )}
                                                {day.isFinished && (
                                                    <span className="block w-full truncate rounded border border-indigo-500/20 bg-indigo-500/10 px-1 py-0.5 text-center text-[8.5px] font-bold text-indigo-600">
                                                        Selesai
                                                    </span>
                                                )}
                                                {day.isClosed && (
                                                    <span className="block w-full truncate rounded border border-emerald-500/20 bg-emerald-500/10 px-1 py-0.5 text-center text-[8.5px] font-bold text-emerald-600">
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
                        <div className="border-border/60 bg-muted/40 animate-in fade-in flex items-center justify-between gap-3 rounded-lg border p-3 text-xs duration-150">
                            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                                <span className="text-foreground flex shrink-0 items-center gap-1.5 font-bold">
                                    <CalendarIcon size={14} className="text-primary" />
                                    {formatDate(selectedDateKey, { day: 'numeric', month: 'short', year: 'numeric' })}:
                                </span>
                                {activeSelectedEvents.map((ev) => (
                                    <div key={ev.id} className="flex items-center gap-2 truncate">
                                        <Badge className={cn('px-1.5 py-0 text-[9.5px] font-bold', ev.badgeClass)}>{ev.title}</Badge>
                                        <span className="text-muted-foreground truncate text-[11px]">
                                            {ev.actor ? `(${ev.actor})` : ''} {ev.description}
                                        </span>
                                        {ev.timeStr && (
                                            <span className="text-foreground bg-muted rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">
                                                {ev.timeStr} WIB
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDateKey(null)}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Legend Footer */}
                    <div className="text-muted-foreground border-border/50 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-[10.5px]">
                        <div className="flex flex-wrap items-center gap-3.5">
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
