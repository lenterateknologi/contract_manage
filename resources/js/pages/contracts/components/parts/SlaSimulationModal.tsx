import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Badge } from '@/components/ui/feedback/Badge';
import { Label } from '@/components/ui/forms/Label';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    Calculator,
    CheckCircle2,
    Clock,
    Info,
    RotateCcw,
    Sliders,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface SlaSimulationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slaConfigs?: any[];
    currentConfig?: {
        name?: string;
        contract_type_id?: string;
        topic?: string;
        sla_drafting_hours?: number;
        sla_review_hours?: number;
        sla_total_hours?: number;
        sla_start_hour?: number;
        sla_cutoff_hour?: number;
        working_days?: string[] | number[];
        warning_threshold_percent?: number;
    };
}

const ID_DAYS = [
    { id: '1', label: 'Senin', short: 'Sen' },
    { id: '2', label: 'Selasa', short: 'Sel' },
    { id: '3', label: 'Rabu', short: 'Rab' },
    { id: '4', label: 'Kamis', short: 'Kam' },
    { id: '5', label: 'Jumat', short: 'Jum' },
    { id: '6', label: 'Sabtu', short: 'Sab', isWeekend: true },
    { id: '7', label: 'Minggu', short: 'Min', isWeekend: true },
];

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatDateTimeID(date: Date): string {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const dayName = ID_DAYS[(date.getDay() + 6) % 7]?.label || '';
    return `${dayName}, ${day} ${month} ${year} pukul ${hours}:${mins} WIB`;
}

function formatDateShort(date: Date): string {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()]?.substring(0, 3);
    const dayName = ID_DAYS[(date.getDay() + 6) % 7]?.short || '';
    return `${dayName}, ${day} ${month}`;
}

export function SlaSimulationModal({
    open,
    onOpenChange,
    slaConfigs = [],
    currentConfig,
}: SlaSimulationModalProps) {
    // Current date formatted for datetime-local (YYYY-MM-DDTHH:mm)
    const getDefaultDateTime = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}`;
    };

    // State
    const [selectedConfigId, setSelectedConfigId] = useState<string>('current');
    const [startDateTime, setStartDateTime] = useState<string>(getDefaultDateTime());

    // Config values (overrideable during simulation)
    const activeConfig = useMemo(() => {
        if (selectedConfigId === 'current' && currentConfig) {
            return {
                name: currentConfig.name || 'Konfigurasi Form Saat Ini',
                sla_stages: Array.isArray(currentConfig.sla_stages) ? currentConfig.sla_stages : [],
                sla_total_hours: Number(currentConfig.sla_total_hours) || 120,
                sla_start_hour: Number(currentConfig.sla_start_hour) ?? 8,
                sla_cutoff_hour: Number(currentConfig.sla_cutoff_hour) ?? 16,
                working_days: currentConfig.working_days ? (Array.isArray(currentConfig.working_days) ? currentConfig.working_days.map(String) : ['1', '2', '3', '4', '5']) : ['1', '2', '3', '4', '5'],
                warning_threshold_percent: Number(currentConfig.warning_threshold_percent) || 80,
            };
        }

        const found = slaConfigs.find((c) => String(c.id) === selectedConfigId);
        if (found) {
            return {
                name: found.name || 'SLA Config',
                sla_stages: Array.isArray(found.sla_stages) ? found.sla_stages : [],
                sla_total_hours: Number(found.sla_total_hours) || 120,
                sla_start_hour: Number(found.sla_start_hour) ?? 8,
                sla_cutoff_hour: Number(found.sla_cutoff_hour) ?? 16,
                working_days: found.working_days ? (Array.isArray(found.working_days) ? found.working_days.map(String) : ['1', '2', '3', '4', '5']) : ['1', '2', '3', '4', '5'],
                warning_threshold_percent: Number(found.warning_threshold_percent) || 80,
            };
        }

        return {
            name: 'Default Standar',
            sla_stages: [],
            sla_total_hours: 120,
            sla_start_hour: 8,
            sla_cutoff_hour: 16,
            working_days: ['1', '2', '3', '4', '5'],
            warning_threshold_percent: 80,
        };
    }, [selectedConfigId, slaConfigs, currentConfig]);

    const [customTotalHours, setCustomTotalHours] = useState<number>(activeConfig.sla_total_hours);
    const [customStartHour, setCustomStartHour] = useState<number>(activeConfig.sla_start_hour);
    const [customCutoffHour, setCustomCutoffHour] = useState<number>(activeConfig.sla_cutoff_hour);
    const [customWorkingDays, setCustomWorkingDays] = useState<string[]>(activeConfig.working_days);

    // Sync state when activeConfig changes
    React.useEffect(() => {
        setCustomTotalHours(activeConfig.sla_total_hours);
        setCustomStartHour(activeConfig.sla_start_hour);
        setCustomCutoffHour(activeConfig.sla_cutoff_hour);
        setCustomWorkingDays(activeConfig.working_days);
    }, [activeConfig]);

    // SLA Business Calculation Engine (Exact match to backend SlaService.php)
    const simulationResult = useMemo(() => {
        const inputDate = new Date(startDateTime);
        if (isNaN(inputDate.getTime())) return null;

        const workingDaysSet = new Set(customWorkingDays.map(String));
        const isNonWorkingDay = (d: Date): boolean => {
            const iso = String((d.getDay() + 6) % 7 + 1); // 1 = Mon, 7 = Sun
            return !workingDaysSet.has(iso);
        };

        const calculateDeadline = (start: Date, durationHours: number, cutoffHour: number, startHour: number) => {
            let cursor = new Date(start.getTime());
            let isCutoffApplied = false;
            let isBeforeStartApplied = false;

            // Before start rule
            if (cursor.getHours() < startHour) {
                isBeforeStartApplied = true;
                cursor.setHours(startHour, 0, 0, 0);
            }

            // Cut-off rule: if submission time is >= cut-off hour, move to next business day at startHour
            if (cursor.getHours() >= cutoffHour) {
                isCutoffApplied = true;
                cursor.setDate(cursor.getDate() + 1);
                cursor.setHours(startHour, 0, 0, 0);
            }

            // Skip non-working days for starting point
            while (isNonWorkingDay(cursor)) {
                cursor.setDate(cursor.getDate() + 1);
                cursor.setHours(startHour, 0, 0, 0);
            }

            const effectiveStart = new Date(cursor.getTime());
            let businessDaysNeeded = Math.ceil(durationHours / 24);
            let calendarSteps: { date: Date; type: 'active' | 'skipped' | 'deadline' | 'start'; note?: string }[] = [];

            let stepCursor = new Date(effectiveStart.getTime());
            calendarSteps.push({
                date: new Date(stepCursor.getTime()),
                type: 'start',
                note: `Mulai Dihitung (${String(startHour).padStart(2, '0')}:00 WIB)`
            });

            let addedDays = 0;
            while (addedDays < businessDaysNeeded) {
                stepCursor.setDate(stepCursor.getDate() + 1);
                if (isNonWorkingDay(stepCursor)) {
                    calendarSteps.push({
                        date: new Date(stepCursor.getTime()),
                        type: 'skipped',
                        note: 'Hari Libur / Non-Kerja'
                    });
                } else {
                    addedDays++;
                    calendarSteps.push({
                        date: new Date(stepCursor.getTime()),
                        type: addedDays === businessDaysNeeded ? 'deadline' : 'active',
                        note: addedDays === businessDaysNeeded ? `Target Deadline (${String(cutoffHour).padStart(2, '0')}:00 WIB)` : `Hari Kerja ke-${addedDays}`
                    });
                }
            }

            const deadline = new Date(stepCursor.getTime());
            deadline.setHours(cutoffHour, 0, 0, 0);

            return {
                isCutoffApplied,
                isBeforeStartApplied,
                effectiveStart,
                deadline,
                businessDays: businessDaysNeeded,
                calendarSteps,
            };
        };

        const total = calculateDeadline(inputDate, customTotalHours, customCutoffHour, customStartHour);

        return {
            inputDate,
            total,
        };
    }, [startDateTime, customTotalHours, customStartHour, customCutoffHour, customWorkingDays]);

    const toggleWorkingDay = (id: string) => {
        let next = [...customWorkingDays];
        if (next.includes(id)) {
            next = next.filter((d) => d !== id);
        } else {
            next.push(id);
        }
        setCustomWorkingDays(next);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl flex flex-col max-h-[92vh]">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-border bg-surface-muted/30 shrink-0 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-foreground">
                                Simulator & Kalkulator SLA Kontrak
                            </DialogTitle>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Uji perhitungan target tenggat waktu (deadline) secara real-time berdasarkan jam cut-off & hari kerja.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {/* Top Row: Preset Selection & Input Date */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Pilih Preset */}
                        {slaConfigs.length > 0 && (
                            <div>
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5 block">
                                    Preset Konfigurasi SLA
                                </Label>
                                <select
                                    value={selectedConfigId}
                                    onChange={(e) => setSelectedConfigId(e.target.value)}
                                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                                >
                                    {currentConfig && <option value="current">Konfigurasi Form Saat Ini</option>}
                                    {slaConfigs.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.name} ({c.contract_type?.name || 'SLA'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 2. Waktu Masuk / Pengajuan */}
                        <div className={slaConfigs.length > 0 ? 'md:col-span-2' : 'col-span-full'}>
                            <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5 flex items-center justify-between">
                                <span>Waktu Pengajuan / Masuk Kontrak</span>
                                <button
                                    type="button"
                                    onClick={() => setStartDateTime(getDefaultDateTime())}
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" /> Set Waktu Sekarang
                                </button>
                            </Label>
                            <input
                                type="datetime-local"
                                value={startDateTime}
                                onChange={(e) => setStartDateTime(e.target.value)}
                                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Interactive Parameters Bar */}
                    <div className="p-4 rounded-xl border border-border/80 bg-surface-muted/20 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                                <Sliders className="w-3.5 h-3.5 text-primary" /> Parameter Perhitungan
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCustomWorkingDays(['1', '2', '3', '4', '5'])}
                                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-surface-muted hover:bg-surface-border text-foreground border border-border/60 transition-all cursor-pointer"
                                >
                                    5 Hari (Sen-Jum)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCustomWorkingDays(['1', '2', '3', '4', '5', '6', '7'])}
                                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer"
                                >
                                    7 Hari (Semua)
                                </button>
                            </div>
                        </div>

                        {/* Working Days Badges */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {ID_DAYS.map((d) => {
                                const isSelected = customWorkingDays.includes(d.id);
                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => toggleWorkingDay(d.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border transition-all cursor-pointer text-center select-none",
                                            isSelected
                                                ? d.isWeekend
                                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold"
                                                    : "bg-primary text-white border-primary font-bold shadow-xs"
                                                : "bg-surface-base border-surface-border text-muted-foreground hover:bg-surface-muted hover:text-foreground font-medium"
                                        )}
                                    >
                                        <span className="text-xs font-bold leading-none">{d.short}</span>
                                        <span className={cn(
                                            "text-[8px] mt-0.5",
                                            isSelected ? (d.isWeekend ? "text-amber-600/80 dark:text-amber-400/80" : "text-white/80") : "text-text-desc"
                                        )}>
                                            {d.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Numeric Sliders / Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <div>
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                                    Durasi Target SLA (Hari / Jam)
                                </Label>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <input
                                        type="number"
                                        value={customTotalHours > 0 ? (customTotalHours / 24).toFixed(1).replace(/\.0$/, '') : ''}
                                        onChange={(e) => {
                                            const days = parseFloat(e.target.value);
                                            setCustomTotalHours(isNaN(days) ? 0 : Math.round(days * 24));
                                        }}
                                        className="h-8 w-16 rounded-md border border-border bg-background px-2 text-xs font-bold text-center"
                                        placeholder="Hari"
                                    />
                                    <span className="text-[11px] text-muted-foreground font-medium">Hari</span>
                                    <span className="text-[11px] text-muted-foreground/60">({customTotalHours}j)</span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                                    Jam Mulai Kerja
                                </Label>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={customStartHour}
                                        onChange={(e) => setCustomStartHour(parseInt(e.target.value, 10) || 0)}
                                        className="h-8 w-16 rounded-md border border-border bg-background px-2 text-xs font-bold text-center font-mono"
                                    />
                                    <span className="text-[11px] text-muted-foreground font-medium font-mono">:00 WIB</span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                                    Jam Cut-Off Masuk
                                </Label>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={customCutoffHour}
                                        onChange={(e) => setCustomCutoffHour(parseInt(e.target.value, 10) || 0)}
                                        className="h-8 w-16 rounded-md border border-border bg-background px-2 text-xs font-bold text-center font-mono"
                                    />
                                    <span className="text-[11px] text-muted-foreground font-medium font-mono">:00 WIB</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    {simulationResult && (
                        <div className="w-full">
                            <div className="p-4 rounded-xl border border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.05] space-y-3 relative overflow-hidden shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" /> Hasil Simulasi Target Batas Waktu (SLA)
                                    </span>
                                    <Badge variant="outline" className="text-[11px] font-bold bg-primary/10 text-primary border-primary/30 px-2.5 py-0.5">
                                        {simulationResult.total.businessDays} Hari Kerja ({customTotalHours} Jam)
                                    </Badge>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                    <p className="text-xs text-muted-foreground font-medium">Perkiraan Target Deadline:</p>
                                    <h4 className="text-base font-extrabold text-foreground tracking-tight">
                                        {formatDateTimeID(simulationResult.total.deadline)}
                                    </h4>
                                </div>

                                {simulationResult.total.isCutoffApplied && (
                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>
                                            Pengajuan masuk melewati jam cut-off <strong>{String(customCutoffHour).padStart(2, '0')}:00 WIB</strong>, perhitungan efektif dimulai pada <strong>{formatDateShort(simulationResult.total.effectiveStart)} pukul {String(customStartHour).padStart(2, '0')}:00 WIB</strong>.
                                        </span>
                                    </div>
                                )}

                                {/* Stages Breakdown if available */}
                                {activeConfig.sla_stages && activeConfig.sla_stages.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                            Rincian Durasi Status Kontrak:
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {activeConfig.sla_stages.map((st: any, idx: number) => {
                                                const h = Number(st.duration_hours) || 0;
                                                const d = (h / 24).toFixed(1).replace(/\.0$/, '');
                                                const statusLabel = st.contract_status || st.status || `Tahap ${idx + 1}`;
                                                const isInactive = st.is_active === false;

                                                return (
                                                    <span
                                                        key={idx}
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all",
                                                            isInactive
                                                                ? "bg-surface-muted/30 border-border/50 text-muted-foreground opacity-60"
                                                                : "bg-surface-muted/60 border-border/80 text-foreground"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            isInactive ? "bg-muted-foreground" : "bg-primary"
                                                        )} />
                                                        <span className="uppercase tracking-wide text-muted-foreground">
                                                            {statusLabel}
                                                        </span>:
                                                        <span className="text-primary font-mono">{d} Hari ({h}j)</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Step Timeline */}
                                <div className="space-y-2 pt-2 border-t border-border/60">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                        Rincian Perjalanan Hari Kerja:
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {simulationResult.total.calendarSteps.map((step, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition-all",
                                                    step.type === 'start' && "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700",
                                                    step.type === 'active' && "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
                                                    step.type === 'skipped' && "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 line-through opacity-70",
                                                    step.type === 'deadline' && "bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs"
                                                )}
                                                title={step.note}
                                            >
                                                <span>{formatDateShort(step.date)}</span>
                                                {step.type === 'deadline' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border bg-surface-muted/30 shrink-0 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-primary" />
                        Formula simulasi sesuai dengan logic engine <code>SlaService.php</code> sistem produksi.
                    </p>
                    <Button
                        type="button"
                        variant="primary"
                        className="h-8 text-xs font-semibold px-4 rounded-lg"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup Simulator
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
export default SlaSimulationModal;
