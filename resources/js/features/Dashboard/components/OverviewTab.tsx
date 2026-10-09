import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { ChipIcon } from '@/components/ui/feedback/ChipIcon';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    Archive,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    FilePlus,
    FileText,
    Layers,
    RotateCcw,
    Shield,
    Timer,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface OverviewTabProps {
    data: any;
    onNavigate: (view: string, params?: any) => void;
    meUser?: any;
    onCreateContract?: () => void;
    scope?: string;
}

export function OverviewTab({ data, onNavigate, meUser, onCreateContract, scope = 'all' }: OverviewTabProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [datePreset, setDatePreset] = useState<'7d' | '14d' | 'this_month' | 'last_month' | 'custom'>('7d');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const currentScopeData = useMemo(() => {
        if (!scope || scope === 'all') return null;

        // 1. Direct match by key (e.g. data['contract'], data['contractData'], etc.)
        if (data?.[scope]) return data[scope];
        const camelKey = scope.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) + 'Data';
        if (data?.[camelKey]) return data[camelKey];
        if (data?.[`${scope}Data`]) return data[`${scope}Data`];
        if (data?.scopedCategories?.[scope]) return data.scopedCategories[scope];

        // 2. Search within scopedCategories by typeName or typeId
        if (data?.scopedCategories && typeof data.scopedCategories === 'object') {
            for (const key of Object.keys(data.scopedCategories)) {
                const item = data.scopedCategories[key];
                if (item?.typeName?.toLowerCase() === scope.toLowerCase() || item?.typeId === scope) {
                    return item;
                }
            }
        }

        return null;
    }, [data, scope]);

    const isScoped = Boolean(scope && scope !== 'all' && currentScopeData);
    const parentTab = isScoped ? (currentScopeData?.typeSlug || scope) : undefined;
    const scopeLabel = isScoped
        ? (currentScopeData?.typeName || scope.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
        : 'Dokumen';
    const scopeSubtitle = isScoped
        ? `Ringkasan operasional dan prioritas tugas dokumen ${scopeLabel}`
        : 'Ringkasan operasional dan prioritas tugas dokumen Anda';

    const m = useMemo(() => {
        const raw = isScoped ? currentScopeData?.summary : data?.summary;
        return (
            raw || {
                total: 0,
                in_process: 0,
                completed: 0,
                rejected: 0,
                approved: 0,
                my_total: 0,
                archived_total: 0,
                pending_for_me: 0,
            }
        );
    }, [isScoped, currentScopeData, data]);

    const overviewDailyTrend = useMemo(() => {
        if (isScoped && currentScopeData?.dailyTrend) return currentScopeData.dailyTrend;
        return data?.overviewDailyTrend || [];
    }, [isScoped, currentScopeData, data]);

    const pendingApprovalsList = useMemo(() => {
        if (isScoped && currentScopeData?.pendingApprovalsList) return currentScopeData.pendingApprovalsList;
        return data?.pendingApprovalsList || [];
    }, [isScoped, currentScopeData, data]);

    const upcomingRenewals = useMemo(() => {
        if (isScoped && currentScopeData?.upcomingRenewals) return currentScopeData.upcomingRenewals;
        return data?.upcomingRenewals || [];
    }, [isScoped, currentScopeData, data]);

    const filteredDailyTrend = useMemo(() => {
        if (!overviewDailyTrend || overviewDailyTrend.length === 0) return [];

        if (datePreset === '7d') {
            return overviewDailyTrend.slice(-7);
        }
        if (datePreset === '14d') {
            return overviewDailyTrend.slice(-14);
        }
        if (datePreset === 'this_month') {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const thisMonthKey = `${year}-${month}`;
            return overviewDailyTrend.filter(
                (item: any) => item.month_key === thisMonthKey || (item.raw_date && item.raw_date.startsWith(thisMonthKey)),
            );
        }
        if (datePreset === 'last_month') {
            const now = new Date();
            now.setMonth(now.getMonth() - 1);
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const lastMonthKey = `${year}-${month}`;
            return overviewDailyTrend.filter(
                (item: any) => item.month_key === lastMonthKey || (item.raw_date && item.raw_date.startsWith(lastMonthKey)),
            );
        }
        if (datePreset === 'custom') {
            if (!startDate && !endDate) return overviewDailyTrend;
            return overviewDailyTrend.filter((item: any) => {
                const rawDate = item.raw_date;
                if (!rawDate) return true;
                if (startDate && endDate) {
                    return rawDate >= startDate && rawDate <= endDate;
                }
                if (startDate) {
                    return rawDate >= startDate;
                }
                if (endDate) {
                    return rawDate <= endDate;
                }
                return true;
            });
        }
        return overviewDailyTrend;
    }, [overviewDailyTrend, datePreset, startDate, endDate]);

    const CHART_COLORS = [
        '#0284c7',
        '#8b5cf6',
        '#10b981',
        '#f59e0b',
        '#ec4899',
        '#06b6d4',
        '#6366f1',
        '#14b8a6',
        '#f97316',
        '#84cc16',
        '#a855f7',
        '#3b82f6',
        '#ef4444',
        '#0d9488',
        '#eab308',
        '#64748b',
    ];

    const categoriesList = useMemo(() => {
        if (isScoped && currentScopeData?.categoriesList && Array.isArray(currentScopeData.categoriesList)) {
            return currentScopeData.categoriesList;
        }

        if (Array.isArray(data?.categoriesList) && data.categoriesList.length > 0) {
            return data.categoriesList;
        }

        if (data?.overviewCategoryDistribution) {
            return Object.keys(data.overviewCategoryDistribution);
        }

        return [];
    }, [isScoped, currentScopeData, data]);

    const handleResetDateFilter = () => {
        setDatePreset('7d');
        setStartDate('');
        setEndDate('');
    };

    // Calculate days remaining helper
    const getDaysRemaining = (endDateStr: string) => {
        if (!endDateStr) return null;
        const end = new Date(endDateStr).getTime();
        const now = new Date().setHours(0, 0, 0, 0);
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    // Formatted current date
    const todayFormatted = useMemo(() => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, []);

    // SLA calculation helper for pending approvals (days waiting)
    const getWaitingDurationText = (requestedAt: string) => {
        if (!requestedAt) return null;
        const requested = new Date(requestedAt).getTime();
        const now = new Date().getTime();
        const diffHours = Math.floor((now - requested) / (1000 * 60 * 60));
        if (diffHours < 24) {
            return `${Math.max(1, diffHours)} jam lalu`;
        }
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} hari lalu`;
    };

    const firstUrgentApproval = pendingApprovalsList && pendingApprovalsList.length > 0 ? pendingApprovalsList[0] : null;

    const pendingCount = m.pending_for_me || 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
            {/* 1. Contextual Welcome & Quick Action Hero */}
            <div className="border-surface-border bg-surface-base relative overflow-hidden rounded-lg border p-4 shadow-none">
                <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-text-main text-sm font-bold">Halo, {meUser?.name || 'Rekan Kerja'}</h2>
                            <span className="border-surface-border bg-surface-muted text-text-main rounded-md border px-2 py-0.5 text-[10px] font-semibold">
                                {meUser?.role || 'Pengguna'}
                            </span>
                        </div>
                        <p className="text-text-soft text-[11px]">
                            {todayFormatted} • {scopeSubtitle}
                        </p>
                        <div className="pt-0.5">
                            {pendingCount > 0 ? (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-none">
                                    <Clock size={12} className="text-white" />
                                    <span>
                                        Ada <strong>{pendingCount} dokumen</strong> memerlukan tindakan persetujuan Anda.
                                    </span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-none">
                                    <span>Semua persetujuan yang ditugaskan kepada Anda telah selesai.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Action CTAs */}
                    <div className="flex flex-wrap items-center gap-2">
                        {firstUrgentApproval && (
                            <button
                                type="button"
                                onClick={() => router.get(`/contracts/${firstUrgentApproval.contract_id}`)}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-none transition-all hover:bg-amber-700 active:scale-95"
                                title="Langsung tinjau dokumen prioritas teratas"
                            >
                                <Clock size={14} className="text-white" />
                                <span>Tinjau Dokumen ({pendingCount})</span>
                            </button>
                        )}
                        {onCreateContract && (
                            <button
                                type="button"
                                onClick={onCreateContract}
                                className="bg-primary text-primary-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-none transition-all hover:opacity-90 active:scale-95"
                            >
                                <FilePlus size={14} strokeWidth={2.2} />
                                <span>Buat Pengajuan</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onNavigate('pending', parentTab ? { parent_tab: parentTab } : {})}
                            className="border-surface-border bg-surface-base text-text-main hover:bg-surface-muted inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold shadow-none transition-all active:scale-95"
                        >
                            <span>Daftar Persetujuan</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. 5 KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[
                    {
                        label: `Semua ${scopeLabel}`,
                        value: m.total ?? data?.metrics?.totalContracts ?? 0,
                        icon: Layers,
                        color: 'bg-cyan-600 text-white border-transparent',
                        badge: 'Aktif',
                        badgeColor: 'bg-cyan-600 text-white border-transparent',
                        description: `Total seluruh ${scopeLabel.toLowerCase()} aktif`,
                        nav: () => onNavigate('contracts', parentTab ? { parent_tab: parentTab } : {}),
                    },
                    {
                        label: 'Menunggu Persetujuan',
                        value: pendingCount,
                        icon: Clock,
                        color: pendingCount > 0 ? 'bg-amber-600 text-white border-transparent' : 'bg-slate-700 text-white border-transparent',
                        badge: pendingCount > 0 ? 'Perlu Tindakan' : 'Selesai',
                        badgeColor: pendingCount > 0 ? 'bg-amber-600 text-white border-transparent' : 'bg-slate-700 text-white border-transparent',
                        description: `${scopeLabel} butuh review Anda`,
                        nav: () => onNavigate('pending', parentTab ? { parent_tab: parentTab } : {}),
                    },
                    {
                        label: `${scopeLabel} Saya`,
                        value: m.my_total ?? 0,
                        icon: FileText,
                        color: 'bg-blue-600 text-white border-transparent',
                        badge: 'Dibuat Anda',
                        badgeColor: 'bg-blue-600 text-white border-transparent',
                        description: `${scopeLabel} yang Anda ajukan`,
                        nav: () => onNavigate('mine', parentTab ? { parent_tab: parentTab } : {}),
                    },
                    {
                        label: `${scopeLabel} Arsip`,
                        value: m.archived_total ?? 0,
                        icon: Archive,
                        color: 'bg-emerald-600 text-white border-transparent',
                        badge: 'Tersimpan',
                        badgeColor: 'bg-emerald-600 text-white border-transparent',
                        description: `${scopeLabel} selesai & diarsipkan`,
                        nav: () => onNavigate('archived', parentTab ? { parent_tab: parentTab } : {}),
                    },
                    {
                        label: 'On Progress',
                        value: m.in_process ?? 0,
                        icon: Timer,
                        color: 'bg-purple-600 text-white border-transparent',
                        badge: 'Dalam Proses',
                        badgeColor: 'bg-purple-600 text-white border-transparent',
                        description: 'Sedang tahap review / revisi',
                        nav: () => onNavigate('in_progress', parentTab ? { parent_tab: parentTab } : {}),
                    },
                ].map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={idx}
                            onClick={kpi.nav}
                            className="group border-surface-border bg-surface-base hover:border-primary relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-lg border p-3.5 shadow-none transition-all duration-150 active:scale-[0.99]"
                            title="Klik untuk membuka daftar dokumen"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-text-soft text-[10.5px] font-bold tracking-wider uppercase">{kpi.label}</span>
                                <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-tight', kpi.badgeColor)}>
                                    {kpi.badge}
                                </span>
                            </div>

                            <div className="mt-2.5 flex items-baseline justify-between">
                                <span className="text-text-main text-2xl font-black tracking-tight">{kpi.value}</span>
                                <ChipIcon icon={Icon} size="md" bg={kpi.color} shape="rounded" />
                            </div>

                            <div className="border-surface-border text-text-soft mt-2 flex items-center justify-between border-t pt-1.5 text-[10px]">
                                <span className="truncate">{kpi.description}</span>
                                <ChevronRight
                                    size={11}
                                    className="shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. Action Center Grid: Priority Pending Approvals (50%) & Expiring Contracts (50%) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Column 1: Priority Pending Approvals */}
                <Card className="border-surface-border bg-surface-base flex flex-col justify-between rounded-lg shadow-none">
                    <div>
                        <CardHeader className="border-surface-border flex flex-row items-center justify-between space-y-0 border-b p-4 pb-3">
                            <div className="flex items-center gap-2">
                                <ChipIcon icon={Clock} size="md" bg="bg-amber-600" shape="rounded" />
                                <div>
                                    <CardTitle className="text-text-main text-xs font-bold">Persetujuan Menunggu Aksi</CardTitle>
                                    <p className="text-text-soft text-[10px]">Dokumen yang memerlukan tanda tangan / persetujuan Anda</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onNavigate('pending')}
                                className="text-primary inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold shadow-none hover:underline"
                            >
                                <span>Lihat Semua ({pendingCount})</span>
                                <ArrowUpRight size={12} />
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                            {pendingApprovalsList.length === 0 ? (
                                <div className="flex min-h-[340px] flex-col items-center justify-center py-16 text-center">
                                    <ChipIcon icon={CheckCircle2} size="lg" bg="bg-emerald-600" shape="circle" className="mb-3" />
                                    <p className="text-text-main text-xs font-bold">Tidak Ada Persetujuan Tertunda</p>
                                    <p className="text-text-soft mt-1 max-w-xs text-[10.5px]">
                                        Seluruh pengajuan yang ditujukan ke Anda telah diproses.
                                    </p>
                                </div>
                            ) : (
                                pendingApprovalsList.map((item: any) => {
                                    const waitingText = getWaitingDurationText(item.requested_at);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => router.get(`/contracts/${item.contract_id}`)}
                                            className="group border-surface-border bg-surface-base hover:bg-surface-muted flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 shadow-none transition-all duration-150 hover:border-amber-500"
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="bg-surface-muted border-surface-border text-text-main rounded border px-1.5 py-0.5 text-[9px] font-bold">
                                                        {item.form_no || item.contract_no || 'DOKUMEN'}
                                                    </span>
                                                    {item.type && (
                                                        <span className="border-surface-border bg-surface-base text-text-soft truncate rounded border px-1.5 py-0.5 text-[9px] font-semibold">
                                                            {item.type}
                                                        </span>
                                                    )}
                                                    {waitingText && (
                                                        <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow-none">
                                                            Menunggu {waitingText}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-text-main group-hover:text-primary truncate text-xs font-bold transition-colors">
                                                    {item.title || 'Tanpa Judul'}
                                                </h4>
                                                <div className="text-text-soft flex items-center gap-2 text-[10px]">
                                                    <span className="flex items-center gap-1">
                                                        <User size={10} />
                                                        {item.creator || 'Pembuat'}
                                                    </span>
                                                    {item.step_name && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-semibold text-amber-700 dark:text-amber-300">
                                                                Tahap: {item.step_name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-none transition-all group-hover:bg-amber-700"
                                            >
                                                <span>Review</span>
                                                <ChevronRight size={11} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </div>
                </Card>

                {/* Column 2: Upcoming Expiring Contracts */}
                <Card className="border-surface-border bg-surface-base flex flex-col justify-between rounded-lg shadow-none">
                    <div>
                        <CardHeader className="border-surface-border flex flex-row items-center justify-between space-y-0 border-b p-4 pb-3">
                            <div className="flex items-center gap-2">
                                <ChipIcon icon={Timer} size="md" bg="bg-rose-600" shape="rounded" />
                                <div>
                                    <CardTitle className="text-text-main text-xs font-bold">Mendekati Masa Berakhir</CardTitle>
                                    <p className="text-text-soft text-[10px]">Kontrak yang akan segera jatuh tempo dalam waktu dekat</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onNavigate('expiry')}
                                className="text-primary inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold shadow-none hover:underline"
                            >
                                <span>Lihat Semua</span>
                                <ArrowUpRight size={12} />
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                            {upcomingRenewals.length === 0 ? (
                                <div className="flex min-h-[340px] flex-col items-center justify-center py-16 text-center">
                                    <ChipIcon icon={Calendar} size="lg" bg="bg-slate-600" shape="circle" className="mb-3" />
                                    <p className="text-text-main text-xs font-bold">Tidak Ada Kontrak Mendekati Jatuh Tempo</p>
                                    <p className="text-text-soft mt-1 max-w-xs text-[10.5px]">
                                        Seluruh kontrak aktif memiliki masa berlaku yang masih panjang.
                                    </p>
                                </div>
                            ) : (
                                upcomingRenewals.map((item: any) => {
                                    const daysLeft = getDaysRemaining(item.end_date);
                                    let badgeStyle = 'bg-slate-700 text-white border-transparent';
                                    if (daysLeft !== null && daysLeft <= 14) {
                                        badgeStyle = 'bg-rose-600 text-white border-transparent';
                                    } else if (daysLeft !== null && daysLeft <= 30) {
                                        badgeStyle = 'bg-amber-600 text-white border-transparent';
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => router.get(`/contracts/${item.id}`)}
                                            className="group border-surface-border bg-surface-base hover:border-primary hover:bg-surface-muted flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 shadow-none transition-all duration-150"
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="bg-surface-muted border-surface-border text-text-main rounded border px-1.5 py-0.5 text-[9px] font-bold">
                                                        {item.contract_no || item.form_no || 'KONTRAK'}
                                                    </span>
                                                    {item.vendor_name && (
                                                        <span className="border-surface-border bg-surface-base text-text-soft truncate rounded border px-1.5 py-0.5 text-[9px] font-semibold">
                                                            {item.vendor_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-text-main group-hover:text-primary truncate text-xs font-bold transition-colors">
                                                    {item.title || 'Tanpa Judul'}
                                                </h4>
                                                <div className="text-text-soft flex items-center gap-2 text-[10px]">
                                                    <span>Berakhir: {item.end_date ? new Date(item.end_date).toLocaleDateString('id-ID') : '-'}</span>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                {daysLeft !== null && (
                                                    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold shadow-none', badgeStyle)}>
                                                        {daysLeft <= 0 ? 'Hari Ini' : `Sisa ${daysLeft} Hari`}
                                                    </span>
                                                )}
                                                <span className="text-primary flex items-center gap-0.5 text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                                                    Lihat <ChevronRight size={10} />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </div>
                </Card>
            </div>

            {/* 4. Daily Trend Line Chart */}
            <Card className="border-surface-border bg-surface-base flex flex-col justify-between rounded-lg shadow-none w-full">
                <CardHeader className="border-surface-border flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b p-4 pb-3">
                    <div className="min-w-[200px] flex-1">
                        <CardTitle className="text-text-main text-xs font-bold tracking-wider uppercase">
                            Tren Pembuatan {scope === 'all' ? 'Dokumen' : scopeLabel}
                        </CardTitle>
                        <p className="text-text-soft text-[10px]">
                            Volume pembuatan {scopeLabel.toLowerCase()} per kategori dalam rentang waktu terpilih
                        </p>
                    </div>

                    {/* Filter Presets & Custom Date Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="border-surface-border bg-surface-muted/50 flex items-center gap-1 rounded-md border p-0.5">
                            {[
                                { id: '7d', label: '7 HARI' },
                                { id: '14d', label: '14 HARI' },
                                { id: 'this_month', label: 'BULAN INI' },
                                { id: 'last_month', label: 'BULAN LALU' },
                                { id: 'custom', label: 'CUSTOM' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setDatePreset(tab.id as any)}
                                    className={cn(
                                        'cursor-pointer rounded px-2 py-1 text-[9.5px] font-bold tracking-wider uppercase shadow-none transition-all',
                                        datePreset === tab.id
                                            ? 'bg-surface-base text-text-main border-surface-border border font-extrabold shadow-none'
                                            : 'text-text-soft hover:text-text-main',
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {datePreset === 'custom' && (
                            <div className="animate-in fade-in flex items-center gap-1.5 duration-200">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border-surface-border bg-surface-base text-text-main focus:border-primary h-7 rounded-md border px-2 text-[10px] font-medium shadow-none focus:outline-none"
                                />
                                <span className="text-text-soft text-[10px]">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border-surface-border bg-surface-base text-text-main focus:border-primary h-7 rounded-md border px-2 text-[10px] font-medium shadow-none focus:outline-none"
                                />
                                {(startDate || endDate) && (
                                    <button
                                        type="button"
                                        onClick={handleResetDateFilter}
                                        className="border-surface-border bg-surface-base text-text-soft flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border shadow-none transition-colors hover:text-rose-500"
                                        title="Reset Filter Tanggal"
                                    >
                                        <RotateCcw size={11} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                    <div className="h-[340px] w-full">
                        {!isMounted || filteredDailyTrend.length === 0 ? (
                            <div className="text-text-soft flex h-full flex-col items-center justify-center text-center text-xs font-semibold uppercase">
                                Tidak ada data tren harian untuk rentang tanggal ini
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={filteredDailyTrend} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <RechartsTooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const item = payload[0].payload;
                                                return (
                                                    <div className="border-surface-border bg-surface-base min-w-[180px] space-y-1.5 rounded-md border p-2.5 text-xs shadow-none">
                                                        <p className="text-text-main border-surface-border border-b pb-1 font-bold">
                                                            {item.full_date || item.date}
                                                        </p>
                                                        <div className="space-y-1">
                                                            {payload.map((p: any, idx: number) => (
                                                                <div key={idx} className="flex items-center justify-between gap-3">
                                                                    <span className="text-text-soft flex items-center gap-1.5 text-[10.5px]">
                                                                        <span
                                                                            className="h-2 w-2 rounded-full"
                                                                            style={{ backgroundColor: p.color }}
                                                                        />
                                                                        {p.name}
                                                                    </span>
                                                                    <span className="text-text-main text-[10.5px] font-bold">
                                                                        {p.value} Dokumen
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {categoriesList.map((category: string, idx: number) => {
                                        const strokeColor = CHART_COLORS[idx % CHART_COLORS.length];
                                        return (
                                            <Line
                                                key={category}
                                                type="monotone"
                                                dataKey={category}
                                                name={category}
                                                stroke={strokeColor}
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 1.5 }}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
