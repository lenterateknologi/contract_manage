import AgreementView from '@/components/contracts/AgreementView';
import CompareModal from '@/components/contracts/CompareModal';
import CreateContractModal from '@/components/contracts/CreateContractModal';
import FloatingChat from '@/components/contracts/FloatingChat';
import { FormSubmissionTab } from '@/components/contracts/FormSubmissionTab';
import PreviewModal from '@/components/contracts/PreviewModal';
import RejectModal from '@/components/contracts/RejectModal';
import { ToastProvider, useToast } from '@/components/contracts/Toast';
import UploadRevisionModal from '@/components/contracts/UploadRevisionModal';
import { Avatar, StatusBadge } from '@/components/contracts/ui';
import { FilterDialog } from '@/components/ui/FilterDialog';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract, ContractType, PaginatedData } from '@/types/contracts';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, Clock, FileSearch, FileText, Filter, History, Inbox, LayoutGrid, List as ListIcon, Plus, Search, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ApprovalSteps from '@/components/contracts/ApprovalSteps';
import ContractAttachments from '@/components/contracts/ContractAttachments';
import ContractChat from '@/components/contracts/ContractChat';
import SendApprovalModal from '@/components/contracts/SendApprovalModal';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/use-permissions';
import { BreadcrumbItem } from '@/types';

type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry';

// ─── Table header cell ───────────────────────────────────────────────
function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <th
            style={{
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--muted-foreground)',
                borderBottom: '1px solid var(--border)',
                whiteSpace: 'nowrap',
                background: 'var(--muted)/30',
                ...style,
            }}
        >
            {children}
        </th>
    );
}
function Td({ children, className, style }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return (
        <td
            style={{
                padding: '12px 14px',
                fontSize: 13,
                borderBottom: '1px solid var(--border)',
                verticalAlign: 'middle',
                ...style,
            }}
            className={className}
        >
            {children}
        </td>
    );
}

function ProgressCell({ c }: { c: Contract }) {
    const { done, total, pct } = c.progress;
    return (
        <div style={{ padding: '0 12px', minWidth: 80 }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
                {done}/{total}
            </div>
            <div style={{ height: 4, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden', width: '100%' }}>
                <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 99, width: `${pct}%` }} />
            </div>
        </div>
    );
}
function ExpiryBadge({ endDate }: { endDate: string | null }) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize now to start of day
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = 'bg-green-500/10 text-green-600 border-green-200';
    let icon = 'fa-circle-check';
    let label = `${diffDays} Hari Lagi`;

    if (diffDays < 0) {
        color = 'bg-red-500/10 text-red-600 border-red-200';
        icon = 'fa-circle-exclamation';
        label = `Expired ${Math.abs(diffDays)} Hari`;
    } else if (diffDays <= 30) {
        color = 'bg-red-500/10 text-red-600 border-red-200';
        icon = 'fa-triangle-exclamation';
    } else if (diffDays <= 90) {
        color = 'bg-amber-500/10 text-amber-600 border-amber-200';
        icon = 'fa-clock';
    }

    return (
        <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase', color)}>
            <i className={cn('fa-solid', icon)} />
            {label}
        </div>
    );
}

function Pagination({ data, filters }: { data: PaginatedData<Contract>; filters: any }) {
    if (!data || data.last_page <= 1) return null;

    return (
        <div className="border-border mt-auto flex flex-col items-center justify-between gap-4 border-t px-2 py-6 sm:flex-row">
            <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                    Showing <span className="text-foreground">{data.from}</span> to <span className="text-foreground">{data.to}</span> of{' '}
                    <span className="text-foreground">{data.total}</span> Results
                </div>

                <div className="border-border flex items-center gap-2 border-l pl-4">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Show</span>
                    <select
                        value={data.per_page}
                        onChange={(e) => {
                            const val = e.target.value;
                            router.get(window.location.href, { ...filters, per_page: val, page: 1 }, {
                                preserveState: true,
                                preserveScroll: true,
                            } as any);
                        }}
                        className="bg-muted/50 border-border focus:border-primary/50 rounded border px-1.5 py-0.5 text-[10px] font-bold outline-none"
                    >
                        {[10, 25, 50, 100].map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {data.links.map((link: any, i: number) => {
                    const isPrev = i === 0;
                    const isNext = i === data.links.length - 1;
                    const label = isPrev ? 'Prev' : isNext ? 'Next' : link.label;

                    return (
                        <button
                            key={i}
                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                            disabled={!link.url}
                            className={cn(
                                'h-8 shrink-0 rounded border px-3 text-[10px] font-black tracking-tighter uppercase transition-all',
                                link.active
                                    ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-95',
                                !link.url && 'cursor-not-allowed opacity-30 grayscale',
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function DashboardMetrics({ metrics }: { metrics: any }) {
    if (!metrics) return null;
    const { metrics: m, monthlyTrend } = metrics;

    // Dynamic Y-axis scale calculation
    const allCounts = Array.isArray(monthlyTrend) ? monthlyTrend.flatMap((mo: any) => mo.types?.map((ti: any) => ti.count) || []) : [0];
    const rawMax = Math.max(...allCounts, 5);
    const yMax = Math.ceil(rawMax / 5) * 5 || 5;
    const steps = 5;
    const yLabels = Array.from({ length: steps + 1 }, (_, i) => Math.round(yMax - i * (yMax / steps)));

    const metricsData = m || {
        avgCycleTime: 0,
        totalContracts: 0,
        pendingApprovals: 0,
        approvedThisMonth: 0,
    };

    const CHART_COLORS = [
        { bg: 'bg-sky-400', stroke: 'stroke-sky-400' },
        { bg: 'bg-emerald-400', stroke: 'stroke-emerald-400' },
        { bg: 'bg-amber-400', stroke: 'stroke-amber-400' },
        { bg: 'bg-rose-400', stroke: 'stroke-rose-400' },
        { bg: 'bg-indigo-400', stroke: 'stroke-indigo-400' }
    ];

    const allTypes = Array.from(new Set(monthlyTrend?.flatMap((m: any) => m.types.map((t: any) => t.name)) || []));

    return (
        <div className="animate-in fade-in slide-in-from-top-4 mb-8 space-y-6 duration-700">
            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Rata-rata SLA" value={`${metricsData.avgCycleTime} Hari`} icon="fa-clock" color="blue" />
                <MetricCard title="Total Kontrak" value={String(metricsData.totalContracts)} icon="fa-file-signature" color="green" />
                <MetricCard title="Approval Pending" value={String(metricsData.pendingApprovals)} icon="fa-triangle-exclamation" color="amber" />
                <MetricCard title="Approved (Bulan Ini)" value={String(metricsData.approvedThisMonth)} icon="fa-calendar-check" color="purple" />
            </div>

            {/* Growth Chart */}
            <div className="bg-card border-border flex flex-col overflow-hidden rounded-xl border">
                <div className="border-border bg-muted/20 flex items-center justify-between border-b px-5 py-4 font-semibold">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-chart-line text-muted-foreground mr-1" />
                        <span style={{ fontSize: 13 }}>Tren Pertumbuhan Kontrak</span>
                    </div>
                </div>
                <div className="flex min-h-[380px] flex-col justify-end p-6">
                    <div className="relative flex h-[220px] items-end gap-2">
                        {/* Dynamic Y-Axis Labels */}
                        <div className="text-muted-foreground/60 border-border/50 flex h-full min-w-[24px] flex-col justify-between border-r pr-2 pb-6 text-[10px] font-bold select-none">
                            {yLabels.map((v) => (
                                <span key={v} className="flex h-0 items-center justify-end">
                                    {v}
                                </span>
                            ))}
                        </div>

                        {/* Chart Area with Rules */}
                        <div className="relative flex h-full flex-1 items-end justify-around px-8 pb-6">
                            {/* Horizontal Grid Lines (Rules) */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                                {yLabels.map((_, i) => (
                                    <div key={i} className="border-muted-foreground/5 last:border-muted-foreground/10 w-full border-t" />
                                ))}
                            </div>

                            {/* Data Points (Bars) - Grouped Strategy */}
                            {Array.isArray(monthlyTrend) &&
                                monthlyTrend.map((mo: any) => {
                                    return (
                                        <div
                                            key={mo.month}
                                            className="group relative z-10 mx-2 flex h-full flex-1 flex-col items-center justify-end gap-4"
                                        >
                                            <div className="relative flex h-full w-full items-end justify-center gap-1.5">
                                                {mo.types.map((t: any, idx: number) => {
                                                    const typePct = (t.count / yMax) * 100;
                                                    const colorClass = CHART_COLORS[idx % CHART_COLORS.length].bg;
                                                    return (
                                                        <div
                                                            key={t.name}
                                                            className={cn(
                                                                'w-full max-w-[14px] min-w-[8px] cursor-help rounded-t-sm transition-all duration-300 hover:opacity-80',
                                                                colorClass,
                                                            )}
                                                            style={{ height: `${typePct}%`, minHeight: t.count > 0 ? 4 : 0 }}
                                                            title={`${t.name}: ${t.count}`}
                                                        />
                                                    );
                                                })}
                                                
                                                {/* Tooltip on Hover */}
                                                <div className="pointer-events-none absolute -top-12 left-1/2 z-20 -translate-x-1/2 scale-95 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black whitespace-nowrap text-white opacity-0 shadow-xl transition-all group-hover:scale-100 group-hover:opacity-100">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                            {mo.month}
                                                        </div>
                                                        <div className="text-white">{mo.total} Kontrak Total</div>
                                                    </div>
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-7 flex flex-col items-center">
                                                <span className="group-hover:text-primary text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase transition-colors">
                                                    {mo.month}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-8 flex flex-wrap justify-center gap-4 px-4">
                        {Array.from(new Set(monthlyTrend?.flatMap((m: any) => m.types.map((t: any) => t.name)) || [])).map((name: any, idx) => (
                            <div key={name} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        CHART_COLORS[idx % CHART_COLORS.length].bg,
                                    )}
                                />
                                <span className="text-muted-foreground text-[10px] font-bold uppercase">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
    const bgMap = {
        blue: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
        green: 'bg-green-500/10 text-green-600 border-green-200/50',
        amber: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
        purple: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
    } as any;
    return (
        <div className="bg-card border-border hover:bg-muted/5 group relative overflow-hidden rounded-xl border p-5 transition-colors">
            <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">{title}</p>
                    <p className="text-2xl leading-tight font-black text-gray-900">{value}</p>
                </div>
                <div className={cn('border-border/10 flex h-10 w-10 items-center justify-center rounded-lg border', bgMap[color])}>
                    <i className={cn('fa-solid', icon)} style={{ fontSize: 16 }} />
                </div>
            </div>
        </div>
    );
}

// ─── Profile View ────────────────────────────────────────────────────
function ProfileView({ meUser, showToast }: { meUser: any; showToast: any }) {
    const {
        data: pData,
        setData: setPData,
        patch,
        processing: pProcessing,
    } = useForm({
        name: meUser?.name || '',
        email: meUser?.email || '',
    });

    const {
        data: qData,
        setData: setQData,
        put,
        processing: qProcessing,
        reset: resetQ,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => showToast('Profil diperbarui!', 'success'),
            onError: () => showToast('Gagal memperbarui profil.', 'danger'),
        });
    };

    const updatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Password diperbarui!', 'success');
                resetQ();
            },
            onError: (err: any) => {
                const msg = (Object.values(err)[0] as string) || 'Gagal memperbarui password.';
                showToast(msg, 'danger');
            },
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-4xl space-y-6 duration-500">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Profile Form */}
                <div className="bg-card border-border rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-1 text-lg font-bold">Informasi Profil</h3>
                    <p className="text-muted-foreground mb-6 text-xs tracking-wider uppercase">Kelola data diri dan alamat email Anda</p>

                    <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Nama Lengkap</label>
                            <div className="relative">
                                <i className="fa-solid fa-user absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    value={pData.name}
                                    onChange={(e) => setPData('name', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Alamat Email</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    type="email"
                                    value={pData.email}
                                    onChange={(e) => setPData('email', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={pProcessing}
                            className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {pProcessing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                            {pProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>

                {/* Password Form */}
                <div className="bg-card border-border rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-1 text-lg font-bold">Keamanan Akun</h3>
                    <p className="text-muted-foreground mb-6 text-xs tracking-wider uppercase">Perbarui kata sandi secara berkala</p>

                    <form onSubmit={updatePassword} className="space-y-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Password Saat Ini</label>
                            <div className="relative">
                                <i className="fa-solid fa-key absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    type="password"
                                    value={qData.current_password}
                                    onChange={(e) => setQData('current_password', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Password Baru</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    type="password"
                                    value={qData.password}
                                    onChange={(e) => setQData('password', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 ml-1 block text-xs font-bold uppercase">Konfirmasi Password</label>
                            <div className="relative">
                                <i className="fa-solid fa-shield absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-300" />
                                <input
                                    type="password"
                                    value={qData.password_confirmation}
                                    onChange={(e) => setQData('password_confirmation', e.target.value)}
                                    className="bg-muted/50 border-border focus:bg-card w-full rounded-lg border py-2.5 pr-3 pl-9 text-sm transition-all outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={qProcessing}
                            className="mt-4 w-full rounded-lg bg-gray-900 py-3 text-sm font-bold text-white shadow-lg shadow-gray-100 transition-all hover:bg-black hover:shadow-gray-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {qProcessing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-lock-open mr-2" />}
                            {qProcessing ? 'Memperbarui...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────
interface FormTemplateInfo {
    id: string;
    name: string;
    description: string;
    document_type?: string;
    contract_type_id: string | null;
    contract_type_name: string | null;
    fields_count: number;
}

function ContractPage({
    contracts: contractsPaged,
    meId,
    meUser,
    initialSelected,
    types,
    currentView,
    metrics,
    filters,
    formTemplates = [],
}: {
    contracts: PaginatedData<Contract>;
    meId: string;
    meUser: any;
    initialSelected?: Contract | null;
    types: ContractType[];
    currentView: View;
    metrics: any;
    filters: { search?: string; status?: string; contract_type_id?: string; per_page?: number };
    formTemplates?: FormTemplateInfo[];
}) {
    const contracts = contractsPaged.data;
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('CONTRACTS');
    const [view, setView] = useState<View>(currentView);

    useEffect(() => {
        if (currentView && currentView !== view) {
            setView(currentView);
            setSelected(null);
        }
    }, [currentView, view]);

    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    const [detailTab, setDetailTab] = useState<'form_template' | 'f2' | 'agreement' | 'attachments' | 'audit' | 'chat'>('form_template');

    const [search, setSearch] = useState(filters?.search || '');

    // Multi-select faceted filters
    const [statusFilter, setStatusFilter] = useState<string[]>(
        Array.isArray(filters?.status) ? filters.status : filters?.status && filters.status !== 'all' ? [filters.status] : [],
    );
    const [typeFilter, setTypeFilter] = useState<string[]>(
        Array.isArray(filters?.contract_type_id)
            ? filters.contract_type_id
            : filters?.contract_type_id && filters.contract_type_id !== 'all'
              ? [filters.contract_type_id]
              : [],
    );
    const [layout, setLayout] = useState<'list' | 'card'>('list');
    const [approvalNote, setApprovalNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    // Filter Logic
    const handleFilterChange = useCallback(
        (newFilters: { search?: string; status?: string[]; contract_type_id?: string[] }) => {
            const merged = {
                search: newFilters.search !== undefined ? newFilters.search : search,
                status: newFilters.status !== undefined ? newFilters.status : statusFilter,
                contract_type_id: newFilters.contract_type_id !== undefined ? newFilters.contract_type_id : typeFilter,
            };

            // Clean up empty filters
            const query = Object.fromEntries(
                Object.entries(merged).filter(([_, v]) => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)),
            );

            router.get(window.location.pathname, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            } as any);
        },
        [search, statusFilter, typeFilter],
    );

    // Debounced search
    useEffect(() => {
        if (search === (filters?.search || '')) return;
        const timer = setTimeout(() => {
            handleFilterChange({ search });
        }, 500);
        return () => clearTimeout(timer);
    }, [search, handleFilterChange, filters?.search]);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [revOpen, setRevOpen] = useState(false);
    const [revType, setRevType] = useState<'contract' | 'f1' | 'f2'>('f1');
    const [rejectOpen, setRejectOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewHasFile, setPreviewHasFile] = useState(false);

    const [compareOpen, setCompareOpen] = useState(false);
    const [compareVer, setCompareVer] = useState<number | null>(null);
    const [compareType, setCompareType] = useState<'contract' | 'f1' | 'f2'>('contract');

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // ─── Columns Definition ─────────────────────────────────────────
    const columns = useMemo<Column<Contract>[]>(() => {
        const baseColumns: Column<Contract>[] = [
            {
                header: 'No. Kontrak',
                accessorKey: 'contract_no',
                sortable: true,
                className: 'font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500',
            },
            {
                header: 'Judul Kontrak',
                accessorKey: 'title',
                sortable: true,
                cell: (c) => (
                    <div className="flex flex-col">
                        <span className="line-clamp-1 font-bold text-slate-900">{c.title}</span>
                        <span className="text-[10px] font-medium tracking-tight text-slate-400 uppercase">{c.contract_type}</span>
                    </div>
                ),
            },
            {
                header: 'Dibuat Oleh',
                accessorKey: 'creator.name',
                cell: (c) => (
                    <div className="flex items-center gap-2">
                        <Avatar user={c.creator} size="sm" />
                        <span className="text-[12px] font-medium text-slate-700">{c.creator?.name}</span>
                    </div>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (c) => <StatusBadge status={c.status} />,
            },
            {
                header: 'Versi',
                accessorKey: 'current_version',
                className: 'w-[80px]',
                cell: (c) => (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 uppercase">
                        v{c.current_version}
                    </span>
                ),
            },
            {
                header: 'Progress',
                accessorKey: 'progress.pct',
                cell: (c) => <ProgressCell c={c} />,
            },
        ];

        if (view === 'expiry') {
            baseColumns.push({
                header: 'Masa Berlaku',
                accessorKey: 'end_date',
                cell: (c) => <ExpiryBadge endDate={c.end_date} />,
            });
        }

        baseColumns.push({
            header: 'Tgl Dibuat',
            accessorKey: 'created_at',
            className: 'text-slate-400 text-[11px] font-medium',
            cell: (c) => c.created_at,
        });

        return baseColumns;
    }, [view]);

    const renderRowActions = useCallback((c: Contract) => {
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    openDetail(c);
                }}
                className="hover:text-primary hover:border-primary/30 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-all active:scale-95"
                title="Lihat Detail"
            >
                <i className="fa-solid fa-eye text-[11px]" />
            </button>
        );
    }, []);

    useEffect(() => {
        if (initialSelected) {
            setSelected(initialSelected);
        }
    }, [initialSelected?.id]);

    const updateContract = useCallback(
        (c: Contract) => {
            router.reload({ preserveScroll: true, preserveState: true } as any);
            if (selected?.id === c.id) setSelected(c);
        },
        [selected?.id],
    );

    const openDetail = (c: Contract) => {
        setSelected(c);
        router.get(route('contracts.show', c.id), {}, { preserveState: true, preserveScroll: true });
        setDetailTab('form_template');
        setApprovalNote('');
    };
    const closeDetail = () => {
        setSelected(null);
        router.get(route('contracts'), {}, { preserveState: true, preserveScroll: true });
        setDetailTab('form_template');
    };

    // Computed
    const stats = {
        total: contracts.length,
        pending: contracts.filter((c) => c.status === 'in_review').length,
        approved: contracts.filter((c) => c.status === 'approved').length,
        revision: contracts.filter((c) => c.status === 'revision').length,
        monthCount: contracts.filter((c) => c.created_at.startsWith('2026-04')).length,
    };

    const myPending = contracts.flatMap((c) =>
        c.approvals.filter((a) => a.user_id === meId && a.status === 'pending').map((a) => ({ contract: c, approval: a })),
    );

    const pendingApprovalForMe = selected?.approvals.find((a) => a.status === 'pending' && a.user_id === meId);
    const firstPending = selected?.approvals.find((a) => a.status === 'pending');
    const hasAnyPending = !!firstPending;
    const canApprove = (selected?.status === 'in_review' || selected?.status === 'revision') && !!pendingApprovalForMe;

    const filtered = contracts; // Server handled filtering
    const recentContracts = contracts.slice(0, layout === 'card' ? 6 : 4);
    const myFilteredPending = contracts.filter((c) => c.approvals.some((a) => a.user_id === meId && a.status === 'pending'));

    // Handlers
    const handleCreate = async (fd: FormData) => {
        setLoading(true);
        try {
            await contractApi.create(fd);
            router.reload({ preserveScroll: true } as any);
            showToast('Kontrak berhasil dibuat!', 'success');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || 'Gagal membuat kontrak.';
            showToast(msg, 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selected) return;
        try {
            const c = await contractApi.approve(selected.id, approvalNote);
            updateContract(c);
            setApprovalNote('');
            showToast('Kontrak berhasil disetujui!', 'success');
        } catch {
            showToast('Gagal approve.', 'danger');
        }
    };

    const handleReject = async (reason: string) => {
        if (!selected) return;
        try {
            const c = await contractApi.reject(selected.id, reason);
            updateContract(c);
            showToast('Kontrak ditolak.', 'info');
        } catch {
            showToast('Gagal reject.', 'danger');
        }
    };

    const handleDownload = async (contractId: string, fileName?: string) => {
        try {
            const res = await fetch(contractApi.downloadUrl(contractId), { credentials: 'same-origin' });
            if (!res.ok) {
                showToast('File tidak tersedia. Belum ada dokumen yang diupload.', 'danger');
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName ?? 'dokumen.docx';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            showToast('Gagal mengunduh file.', 'danger');
        }
    };

    const handleRevision = async (fd: FormData) => {
        if (!selected) return;
        try {
            const c = await contractApi.uploadRevision(selected.id, fd);
            updateContract(c);
            showToast('Versi baru berhasil diupload!', 'success');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || 'Gagal upload revisi.';
            showToast(msg, 'danger');
        }
    };

    const handleQuickApprove = async (contractId: string) => {
        try {
            const c = await contractApi.approve(contractId, 'Disetujui.');
            updateContract(c);
            showToast('Berhasil disetujui', 'success');
        } catch {
            showToast('Gagal approve.', 'danger');
        }
    };

    const handleSendForApproval = async () => {
        if (!selected) return;
        setSendOpen(true);
    };

    const handleUpdate = async (data: any) => {
        if (!selected) return;
        setProcessing(true);
        try {
            const c = await contractApi.update(selected.id, data);
            updateContract(c);
            setEditOpen(false);
            showToast('Informasi kontrak diperbarui.', 'success');
        } catch {
            showToast('Gagal memperbarui kontrak.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            await contractApi.delete(selected.id);
            router.reload({ preserveScroll: true } as any);
            setSelected(null);
            setDeleteOpen(false);
            showToast('Kontrak berhasil dihapus.', 'success');
        } catch {
            showToast('Gagal menghapus kontrak.', 'danger');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendSubmit = async (data: any) => {
        if (!selected) return;
        try {
            const c = await contractApi.send(selected.id, data);
            updateContract(c);
            showToast('Kontrak berhasil dikirim untuk approval!', 'success');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || 'Gagal mengirim kontrak.';
            showToast(msg, 'danger');
        }
    };

    const handleChangeVersion = async (vno: number) => {
        if (!selected) return;
        try {
            const c = await contractApi.changeVersion(selected.id, vno);
            updateContract(c);
            showToast(`Versi aktif diubah ke v${vno}`, 'success');
        } catch {
            showToast('Gagal mengubah versi.', 'danger');
        }
    };

    const navTo = (v: View) => {
        setView(v);
        closeDetail();
    };

    const SL: Record<string, string> = {
        dashboard: 'Dashboard',
        contracts: 'Semua Kontrak',
        pending: 'Menunggu Approval',
        audit: 'Audit Trail',
        f1: 'Form F1',
        f2: 'Form F2',
        profile: 'Profil Saya',
        mine: 'Dokumen Saya',
        expiry: 'Monitoring Masa Berlaku',
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(window.location.pathname, { search, status: statusFilter, per_page: filters?.per_page }, {
            preserveState: true,
            preserveScroll: true,
        } as any);
    };

    const handleStatusChange = (val: string) => {
        const next = val === 'all' ? [] : [val];
        setStatusFilter(next);
        router.get(window.location.pathname, { search, status: next, per_page: filters?.per_page }, {
            preserveState: true,
            preserveScroll: true,
        } as any);
    };

    const viewConfig = {
        dashboard: { title: 'Dashboard Kontrak', icon: LayoutGrid, desc: 'Ringkasan aktivitas dan status kontrak terbaru.' },
        contracts: { title: 'Manajemen Kontrak', icon: FileText, desc: 'Kelola semua data kontrak dalam sistem.' },
        mine: { title: 'Kontrak Saya', icon: User, desc: 'Daftar kontrak yang Anda buat.' },
        pending: { title: 'Menunggu Approval', icon: Clock, desc: 'Daftar kontrak yang sedang menunggu persetujuan Anda.' },
        f1: { title: 'Kontrak F1', icon: FileText, desc: 'Kelola draft kontrak dan dokumen F1.' },
        f2: { title: 'Kontrak F2', icon: FileSearch, desc: 'Kelola revisi kontrak dan dokumen F2.' },
        expiry: { title: 'Kontrak Berakhir', icon: AlertCircle, desc: 'Daftar kontrak yang mendekati masa kadaluarsa.' },
        audit: { title: 'Audit Trail', icon: History, desc: 'Riwayat lengkap aktivitas perubahan kontrak.' },
        profile: { title: 'Profil Saya', icon: User, desc: 'Kelola informasi profil dan akun Anda.' },
    };

    const currentViewConfig = viewConfig[view] || viewConfig.contracts;
    const Icon = currentViewConfig.icon;

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Manajemen Kontrak', href: route('contracts'), description: currentViewConfig.desc }];

    return (
        <>
            <Head title={SL[view]} />

            <div className="flex min-h-0 flex-1 flex-col gap-6 bg-slate-50/50 p-6">
                {/* ── View Content ── */}
                {view === 'profile' && !selected && <ProfileView meUser={meUser} showToast={showToast} />}

                {/* ── Dashboard ── */}
                {view === 'dashboard' && !selected && (
                    <div>
                        {/* Stats & Trends */}
                        <DashboardMetrics metrics={metrics} />

                        {/* Recent Contracts Header & Filter */}
                        <div className="mb-4 flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <span className="flex items-center gap-2 font-semibold" style={{ fontSize: 13 }}>
                                    <i className="fa-solid fa-list-ul text-muted-foreground" style={{ fontSize: 12 }} /> Kontrak Terbaru
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="relative max-w-[200px]">
                                        <i
                                            className="fa-solid fa-magnifying-glass text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                                            style={{ fontSize: 11 }}
                                        />
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari..."
                                            className="bg-card border-border focus:border-primary/50 w-full rounded-lg border py-1.5 pr-3 pl-8 text-xs transition-all outline-none"
                                        />
                                    </div>
                                    <div className="border-border bg-card flex overflow-hidden rounded-lg border">
                                        <button
                                            onClick={() => setLayout('list')}
                                            className={`p-1.5 transition-colors ${layout === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                            title="List View"
                                        >
                                            <i className="fa-solid fa-list" style={{ fontSize: 11 }} />
                                        </button>
                                        <button
                                            onClick={() => setLayout('card')}
                                            className={`p-1.5 transition-colors ${layout === 'card' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                            title="Grid View"
                                        >
                                            <i className="fa-solid fa-table-cells-large" style={{ fontSize: 11 }} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navTo('contracts')}
                                        style={{
                                            fontSize: 12,
                                            color: 'var(--primary)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        Lihat Semua <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} />
                                    </button>
                                </div>
                            </div>

                            {/* Dashboard Content */}
                            {layout === 'list' ? (
                                <div className="h-[450px]">
                                    <DataTable
                                        columns={columns}
                                        data={recentContracts}
                                        searchKey="title"
                                        searchPlaceholder="Cari kontrak terbaru..."
                                        onRowClick={openDetail}
                                        rowActions={renderRowActions}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {recentContracts.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => openDetail(c)}
                                            className="bg-card border-border hover:border-primary/50 group cursor-pointer rounded-xl border p-3 shadow-sm transition-all hover:shadow-md"
                                        >
                                            <div className="mb-2 flex items-start justify-between">
                                                <span className="bg-muted text-muted-foreground rounded px-1 py-0.5 font-mono text-[9px] tracking-wider uppercase">
                                                    {c.contract_no}
                                                </span>
                                                <StatusBadge status={c.status} />
                                            </div>
                                            <h3 className="mb-1 line-clamp-1 font-bold text-gray-900" style={{ fontSize: 13 }}>
                                                {c.title}
                                            </h3>
                                            <div className="border-border/50 mt-4 flex items-center gap-2 border-t pt-2">
                                                <Avatar user={c.creator} size="sm" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-medium text-gray-900" style={{ fontSize: 10 }}>
                                                        {c.creator?.name}
                                                    </div>
                                                    <div className="text-muted-foreground" style={{ fontSize: 9 }}>
                                                        v{c.current_version} · {c.created_at}
                                                    </div>
                                                </div>
                                                <div className="w-20">
                                                    <ProgressCell c={c} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {recentContracts.length === 0 && (
                                        <div className="text-muted-foreground bg-card border-border col-span-full rounded-xl border p-12 text-center">
                                            <p style={{ fontSize: 12 }}>Tidak ada kontrak ditemukan.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Bottleneck */}
                            <div className="bg-card border-border overflow-hidden rounded-xl border">
                                <div
                                    className="border-border/50 flex items-center gap-2 border-b font-semibold"
                                    style={{ padding: '12px 16px', fontSize: 13 }}
                                >
                                    <i className="fa-solid fa-triangle-exclamation text-muted-foreground" style={{ fontSize: 12 }} /> Bottleneck
                                    Approval
                                </div>
                                <div style={{ padding: 16 }}>
                                    {['Legal', 'Tax', 'Management', 'Direksi'].map((role) => {
                                        const p = contracts.filter((c) => c.approvals.some((a) => a.role === role && a.status === 'pending')).length;
                                        return (
                                            <div key={role} style={{ marginBottom: 12 }}>
                                                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                                                    <span className="font-medium" style={{ fontSize: 12 }}>
                                                        {role}
                                                    </span>
                                                    <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                                                        {p} pending
                                                    </span>
                                                </div>
                                                <div style={{ height: 4, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div
                                                        style={{
                                                            height: '100%',
                                                            borderRadius: 99,
                                                            width: `${p * 25}%`,
                                                            background: p > 0 ? '#f59e0b' : '#16a34a',
                                                            opacity: 0.8,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Status Overview */}
                            <div className="bg-card border-border overflow-hidden rounded-xl border">
                                <div
                                    className="border-border/50 flex items-center gap-2 border-b font-semibold"
                                    style={{ padding: '12px 16px', fontSize: 13 }}
                                >
                                    <i className="fa-solid fa-chart-pie text-muted-foreground" style={{ fontSize: 12 }} /> Status Overview
                                </div>
                                <div style={{ padding: 16 }}>
                                    {(['draft', 'in_review', 'revision', 'approved'] as const).map((s) => (
                                        <div
                                            key={s}
                                            className="border-border/50 flex items-center justify-between border-b last:border-0"
                                            style={{ paddingTop: 8, paddingBottom: 8 }}
                                        >
                                            <StatusBadge status={s} />
                                            <span className="font-bold" style={{ fontSize: 18 }}>
                                                {contracts.filter((c) => c.status === s).length}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Contracts & Pending View with premium layout ── */}
                {(view === 'contracts' || view === 'f1' || view === 'f2' || view === 'mine' || view === 'expiry' || view === 'pending') &&
                    !selected && (
                        <div className="-mx-6 -mb-6 flex min-w-0 flex-1 flex-col overflow-hidden border-t border-slate-200/60 bg-slate-50/20">
                            {/* Top Action Bar (Premium Ecommerce Style) */}
                            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-white px-5 py-3 lg:flex-row lg:items-center">
                                <div className="flex flex-col gap-0.5">
                                    <h2 className="text-sm leading-none font-black tracking-tight text-slate-900 capitalize">{SL[view]}</h2>
                                    <p className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
                                        {contractsPaged.total} Total Transaksi
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="group relative w-full md:w-60">
                                        <Search className="group-focus-within:text-primary absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors" />
                                        <Input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari nomor atau judul..."
                                            className="focus:border-primary/30 focus:ring-primary/5 h-9 rounded-xl border-slate-200 bg-slate-50/50 pl-9 text-[11px] font-medium transition-all hover:bg-slate-50 focus:ring-2"
                                        />
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => setFilterOpen(true)}
                                        className={cn(
                                            'flex h-9 items-center gap-2 rounded-xl border-slate-200 px-4 text-[10px] font-black tracking-[0.15em] uppercase transition-all active:scale-95',
                                            statusFilter.length > 0 || typeFilter.length > 0
                                                ? 'bg-primary text-primary-foreground border-primary shadow-primary/20 hover:bg-primary/90 shadow-md'
                                                : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50',
                                        )}
                                    >
                                        <Filter
                                            className={cn(
                                                'h-3.5 w-3.5',
                                                statusFilter.length > 0 || typeFilter.length > 0 ? 'text-white' : 'text-slate-400',
                                            )}
                                        />
                                        <span>Filter</span>
                                        {(statusFilter.length > 0 || typeFilter.length > 0) && (
                                            <Badge className="text-primary ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-md border-0 bg-white p-0 text-[9px] font-black">
                                                {statusFilter.length + typeFilter.length}
                                            </Badge>
                                        )}
                                    </Button>

                                    <div className="flex h-9 gap-0.5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-inner">
                                        <button
                                            onClick={() => setLayout('list')}
                                            className={cn(
                                                'flex w-8 items-center justify-center rounded-lg transition-all duration-200',
                                                layout === 'list'
                                                    ? 'text-primary bg-white shadow-sm'
                                                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                                            )}
                                        >
                                            <ListIcon size={14} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => setLayout('card')}
                                            className={cn(
                                                'flex w-8 items-center justify-center rounded-lg transition-all duration-200',
                                                layout === 'card'
                                                    ? 'text-primary bg-white shadow-sm'
                                                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                                            )}
                                        >
                                            <LayoutGrid size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {canCreate && (
                                        <Button
                                            className="h-9 gap-2 rounded-xl bg-slate-950 px-5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-slate-200 transition-all hover:bg-black active:scale-95"
                                            onClick={() => setCreateOpen(true)}
                                        >
                                            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                                            Buat Kontrak
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Active Pills (Simplified and Premium) */}
                            {(statusFilter.length > 0 || typeFilter.length > 0) && (
                                <div className="flex items-center gap-4 border-b border-slate-100/50 bg-slate-50/50 px-8 py-4">
                                    <span className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                                        Filter Aktif:
                                    </span>
                                    <div className="flex flex-1 flex-wrap gap-2">
                                        {statusFilter.map((s) => (
                                            <Badge
                                                key={s}
                                                className="group hover:border-primary/30 flex items-center gap-2 rounded-xl border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-600 uppercase shadow-sm transition-colors"
                                            >
                                                {s.replace('_', ' ')}
                                                <X
                                                    size={12}
                                                    className="cursor-pointer transition-colors hover:text-rose-500"
                                                    onClick={() => {
                                                        const next = statusFilter.filter((v) => v !== s);
                                                        setStatusFilter(next);
                                                        handleFilterChange({ status: next });
                                                    }}
                                                />
                                            </Badge>
                                        ))}
                                        {typeFilter.map((tId) => {
                                            const tName = types.find((t) => String(t.id) === String(tId))?.name || tId;
                                            return (
                                                <Badge
                                                    key={tId}
                                                    className="group flex items-center gap-2 rounded-xl border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-600 uppercase shadow-sm transition-colors hover:border-indigo-300"
                                                >
                                                    {tName}
                                                    <X
                                                        size={12}
                                                        className="cursor-pointer transition-colors hover:text-rose-500"
                                                        onClick={() => {
                                                            const next = typeFilter.filter((v) => v !== tId);
                                                            setTypeFilter(next);
                                                            handleFilterChange({ contract_type_id: next });
                                                        }}
                                                    />
                                                </Badge>
                                            );
                                        })}
                                        <button
                                            onClick={() => {
                                                setStatusFilter([]);
                                                setTypeFilter([]);
                                                handleFilterChange({ status: [], contract_type_id: [] });
                                            }}
                                            className="ml-2 rounded-lg px-2 py-1 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-all hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            Hapus Semua
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* List/Grid Area */}
                            <div className="flex-1 overflow-hidden">
                                {layout === 'list' ? (
                                    <div className="h-full">
                                        <DataTable
                                            columns={
                                                view === 'pending'
                                                    ? [
                                                          ...columns.filter((col) => col.accessorKey !== 'progress.pct'),
                                                          {
                                                              header: 'Role / Seq',
                                                              accessorKey: 'role',
                                                              cell: (c) => {
                                                                  const a = c.approvals.find((ap) => ap.user_id === meId && ap.status === 'pending');
                                                                  return (
                                                                      <div className="flex flex-col">
                                                                          <span className="bg-primary/10 text-primary w-fit rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                                                                              {a?.role}
                                                                          </span>
                                                                          <span className="text-muted-foreground mt-1 text-[10px]">
                                                                              Sequence {a?.sequence}
                                                                          </span>
                                                                      </div>
                                                                  );
                                                              },
                                                          },
                                                      ]
                                                    : columns
                                            }
                                            data={contractsPaged.data}
                                            loading={loading}
                                            onRowClick={openDetail}
                                            rowActions={view === 'pending' ? renderRowActions : undefined}
                                            pagination={{
                                                currentPage: contractsPaged.current_page,
                                                lastPage: contractsPaged.last_page,
                                                total: contractsPaged.total,
                                                from: contractsPaged.from,
                                                to: contractsPaged.to,
                                                perPage: contractsPaged.per_page,
                                                onPageChange: (page) =>
                                                    router.get(
                                                        window.location.href,
                                                        { ...filters, page },
                                                        { preserveState: true, preserveScroll: true },
                                                    ),
                                                onPerPageChange: (perPage) =>
                                                    router.get(
                                                        window.location.href,
                                                        { ...filters, per_page: perPage, page: 1 },
                                                        { preserveState: true, preserveScroll: true },
                                                    ),
                                            }}
                                            getRowId={(c) => c.id}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6 p-6 overflow-y-auto">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {contractsPaged.data.map((c) => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => openDetail(c)}
                                                    className="hover:border-primary/40 group hover:bg-primary/5 animate-in fade-in slide-in-from-bottom-2 cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"
                                                >
                                                    <div className="mb-4 flex items-start justify-between">
                                                        <span className="rounded-md border border-slate-200/50 bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                                                            {c.contract_no}
                                                        </span>
                                                        <StatusBadge status={c.status} />
                                                    </div>
                                                    <h3 className="group-hover:text-primary mb-2 line-clamp-1 text-[15px] font-bold text-slate-900 transition-colors">
                                                        {c.title}
                                                    </h3>
                                                    <p className="mb-5 line-clamp-2 text-[12px] leading-relaxed text-slate-500">
                                                        {c.description || '—'}
                                                    </p>

                                                    <div className="mb-5 flex items-center gap-3">
                                                        <Avatar user={c.creator} size="sm" className="shadow-sm ring-2 ring-white" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-[12px] font-semibold text-slate-900">{c.creator?.name}</div>
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                <Clock size={10} /> {c.created_at}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-2">
                                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase ring-1 ring-slate-200/50">
                                                                    v{c.current_version}
                                                                </span>
                                                                <span className="bg-primary/10 text-primary ring-primary/20 max-w-[100px] truncate rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1">
                                                                    {c.contract_type}
                                                                </span>
                                                            </div>
                                                            {c.end_date && <ExpiryBadge endDate={c.end_date} />}
                                                        </div>
                                                        <div className="w-24">
                                                            <ProgressCell c={c} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {contractsPaged.data.length === 0 && (
                                            <div className="rounded-2xl border border-slate-200 bg-white p-20 text-center text-slate-400 shadow-sm">
                                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
                                                    <Inbox size={32} className="text-slate-300" />
                                                </div>
                                                <h3 className="mb-1 text-lg font-bold text-slate-900">Tidak ada kontrak</h3>
                                                <p className="text-sm">Tidak ada kontrak yang sesuai dengan kriteria filter Anda.</p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-6 text-xs font-bold uppercase"
                                                    onClick={() => {
                                                        setStatusFilter([]);
                                                        setTypeFilter([]);
                                                        handleFilterChange({ status: [], contract_type_id: [] });
                                                    }}
                                                >
                                                    Reset Semua Filter
                                                </Button>
                                            </div>
                                        )}
                                        <div className="mt-8 flex justify-center">
                                            <Pagination data={contractsPaged} filters={filters} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                {/* ── Audit ── */}
                {view === 'audit' && !selected && meUser?.role !== 'Admin' && (
                    <div className="bg-card border-border text-muted-foreground rounded-xl border p-12 text-center">
                        <i className="fa-solid fa-lock mb-4 block" style={{ fontSize: 32 }} />
                        <h3 className="mb-2 font-bold text-gray-900" style={{ fontSize: 16 }}>
                            Akses Terbatas
                        </h3>
                        <p style={{ fontSize: 13 }}>Halaman Audit Trail hanya dapat diakses oleh Administrator.</p>
                    </div>
                )}


                {/* ── Detail ── */}
                {selected && (
                    <div>
                        {/* Breadcrumb */}
                        <nav className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: 12, marginBottom: 16 }}>
                            <a style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={closeDetail}>
                                Kontrak
                            </a>
                            <i className="fa-solid fa-chevron-right text-gray-300" style={{ fontSize: 12 }} />
                            <span className="text-muted-foreground">{selected.contract_no}</span>
                        </nav>

                        {/* Header */}
                        <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                            <div>
                                <h2 className="font-bold text-gray-900" style={{ fontSize: 16 }}>
                                    {selected.title}
                                </h2>
                                <p className="text-gray-400" style={{ fontSize: 11, marginTop: 2 }}>
                                    {selected.contract_no} · {selected.status.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {selected.status === 'draft' && (
                                    <>
                                        {(canUpdate || meUser?.role === 'Admin') && (
                                            <>
                                                <button
                                                    onClick={handleSendForApproval}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '6px 12px',
                                                        background: '#2563eb',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        borderRadius: 6,
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                    onMouseOver={(e) => ((e.currentTarget as any).style.background = '#1d4ed8')}
                                                    onMouseOut={(e) => ((e.currentTarget as any).style.background = '#2563eb')}
                                                >
                                                    <i className="fa-solid fa-paper-plane" style={{ fontSize: 11 }} /> Kirim
                                                </button>
                                            </>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => setDeleteOpen(true)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '6px 12px',
                                                    background: 'var(--destructive)',
                                                    color: 'var(--destructive-foreground)',
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    borderRadius: 6,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <i className="fa-solid fa-trash-can" style={{ fontSize: 11 }} /> Hapus
                                            </button>
                                        )}
                                    </>
                                )}
                                {/* <button onClick={() => handleDownload(selected.id, selected.versions.find(v => v.version_no === selected.current_version)?.file_name)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                    <i className="fa-solid fa-download" style={{ fontSize: 11 }} /> Download
                                </button>
                                {canUpdate && (
                                    <button onClick={() => setRevOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                        <i className="fa-solid fa-upload" style={{ fontSize: 11 }} /> Upload Revisi
                                    </button>
                                )} */}
                            </div>
                        </div>

                        {/* Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
                            {/* Left */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Info Card - Inline Editable for Draft */}
                                <DraftEditableInfoCard
                                    selected={selected}
                                    types={types}
                                    formTemplates={formTemplates}
                                    canUpdate={!!canUpdate}
                                    onUpdate={handleUpdate}
                                    processing={processing}
                                    setPreviewTitle={setPreviewTitle}
                                    setPreviewUrl={setPreviewUrl}
                                    setPreviewHasFile={setPreviewHasFile}
                                    setPreviewOpen={setPreviewOpen}
                                />

                                {/* Tabs Card */}
                                <div className="bg-card border-border overflow-hidden rounded-xl border">
                                    <div className="border-border flex gap-1 border-b px-4 pt-2">
                                        {(
                                            [
                                                {
                                                    id: 'form_template',
                                                    icon: 'fa-file-lines',
                                                    label: 'F1',
                                                    badge: selected.form_submissions?.find((s) => s.document_type === 'f1')
                                                        ? selected.form_submissions.find((s) => s.document_type === 'f1')!.current_version
                                                        : 0,
                                                },
                                                {
                                                    id: 'agreement',
                                                    icon: 'fa-file-word',
                                                    label: 'Agreement',
                                                    badge: (selected.versions ?? []).filter((v) => v.document_type === 'agreement').length,
                                                },

                                                {
                                                    id: 'f2',
                                                    icon: 'fa-file-shield',
                                                    label: 'F2',
                                                    badge: selected.form_submissions?.find((s) => s.document_type === 'f2')
                                                        ? selected.form_submissions.find((s) => s.document_type === 'f2')!.current_version
                                                        : 0,
                                                },
                                                {
                                                    id: 'attachments',
                                                    icon: 'fa-paperclip',
                                                    label: 'Lampiran',
                                                    badge: selected.attachments?.length ?? 0,
                                                },
                                                { id: 'audit', icon: 'fa-list-check', label: 'Audit Trail', badge: 0 },
                                                {
                                                    id: 'chat',
                                                    icon: 'fa-comments',
                                                    label: 'Diskusi',
                                                    badge: (selected.messages ?? []).filter((m) => !m.read_by.includes(meId)).length,
                                                },
                                            ] as const
                                        ).map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setDetailTab(tab.id as any)}
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    padding: '8px 12px',
                                                    color: detailTab === tab.id ? 'var(--primary)' : 'var(--muted-foreground)',
                                                    background: 'none',
                                                    border: 'none',
                                                    borderBottom: detailTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    marginBottom: -1,
                                                    transition: 'color .15s',
                                                }}
                                            >
                                                <i className={`fa-solid ${tab.icon}`} /> {tab.label}
                                                {tab.badge > 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            background: 'var(--primary)',
                                                            color: 'var(--primary-foreground)',
                                                            padding: '1px 6px',
                                                            borderRadius: 99,
                                                            lineHeight: 1.4,
                                                        }}
                                                    >
                                                        {tab.badge}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        {/* F1 Tab (Persistence via hidden div) */}
                                        <div style={{ display: detailTab === 'form_template' ? 'block' : 'none' }}>
                                            <FormSubmissionTab
                                                docType="f1"
                                                selected={selected}
                                                formTemplates={formTemplates}
                                                onContractUpdated={updateContract}
                                            />
                                        </div>

                                        {/* Agreement Tab */}
                                        {detailTab === 'agreement' && <AgreementView contract={selected} onUpdate={updateContract} />}

                                        {/* F2 Tab (Persistence via hidden div) */}
                                        <div style={{ display: detailTab === 'f2' ? 'block' : 'none' }}>
                                            <FormSubmissionTab
                                                docType="f2"
                                                selected={selected}
                                                formTemplates={formTemplates}
                                                onContractUpdated={updateContract}
                                            />
                                        </div>

                                        {/* Lampiran tab */}
                                        {detailTab === 'attachments' && (
                                            <ContractAttachments
                                                contract={selected}
                                                onUpdated={updateContract}
                                                showToast={showToast}
                                                onPreview={(at) => {
                                                    setPreviewTitle(at.label);
                                                    setPreviewUrl(contractApi.attachmentPdfPreviewUrl(selected.id, at.id));
                                                    setPreviewHasFile(true);
                                                    setPreviewOpen(true);
                                                }}
                                            />
                                        )}

                                        {/* Audit tab */}
                                        {detailTab === 'audit' && (
                                            <div>
                                                {[...selected.histories].reverse().map((h, i) => {
                                                    const colors: Record<string, string> = {
                                                        CONTRACT_CREATED: 'var(--chart-1)',
                                                        FILE_UPLOADED: 'var(--chart-2)',
                                                        APPROVAL_APPROVED: 'var(--chart-3)',
                                                        APPROVAL_REJECTED: 'var(--destructive)',
                                                        CONTRACT_APPROVED: 'var(--chart-4)',
                                                    };
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="border-border/50 flex gap-2.5 border-b last:border-0"
                                                            style={{ paddingTop: 8, paddingBottom: 8 }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: '50%',
                                                                    flexShrink: 0,
                                                                    marginTop: 6,
                                                                    background: colors[h.action] ?? 'var(--muted-foreground)',
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="font-medium" style={{ fontSize: 12 }}>
                                                                    {h.description}
                                                                </div>
                                                                <div
                                                                    className="text-muted-foreground flex items-center gap-1.5"
                                                                    style={{ fontSize: 12, marginTop: 2 }}
                                                                >
                                                                    <Avatar user={h.actor} size="sm" /> {h.actor?.name} · {h.actor?.role}
                                                                </div>
                                                                <div className="text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>
                                                                    {h.created_at}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Chat tab */}
                                        {detailTab === 'chat' && <ContractChat contract={selected} meId={meId} onNewMessage={updateContract} />}
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Approval Flow */}
                                <div className="bg-card border-border overflow-hidden rounded-xl border">
                                    <div
                                        className="border-border/50 flex items-center gap-2 border-b font-semibold"
                                        style={{ padding: '12px 16px', fontSize: 13 }}
                                    >
                                        <i className="fa-solid fa-arrow-right-arrow-left text-muted-foreground" style={{ fontSize: 12 }} /> Alur
                                        Approval
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        <ApprovalSteps
                                            approvals={selected.approvals}
                                            creator={selected.creator}
                                            submittedAt={selected.submitted_at ?? undefined}
                                        />
                                    </div>
                                </div>

                                {/* Action Card — only shown if there's a pending approval */}
                                {hasAnyPending && (
                                    <div className="bg-card border-border overflow-hidden rounded-xl border">
                                        <div
                                            className="border-border/50 flex items-center gap-2 border-b font-semibold"
                                            style={{ padding: '12px 16px', fontSize: 13 }}
                                        >
                                            <i className="fa-solid fa-bolt text-muted-foreground" style={{ fontSize: 12 }} /> Aksi Approval
                                        </div>
                                        <div style={{ padding: 16 }}>
                                            {canApprove ? (
                                                <>
                                                    <p className="text-muted-foreground" style={{ fontSize: 12, marginBottom: 12 }}>
                                                        Kamu adalah approver berikutnya untuk kontrak ini.
                                                    </p>
                                                    <div style={{ marginBottom: 12 }}>
                                                        <label
                                                            style={{
                                                                display: 'block',
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                color: 'var(--muted-foreground)',
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            Catatan
                                                        </label>
                                                        <textarea
                                                            value={approvalNote}
                                                            onChange={(e) => setApprovalNote(e.target.value)}
                                                            rows={3}
                                                            placeholder="Tambahkan catatan..."
                                                            style={{
                                                                width: '100%',
                                                                fontSize: 12,
                                                                border: '1px solid var(--border)',
                                                                borderRadius: 6,
                                                                padding: '8px 12px',
                                                                outline: 'none',
                                                                resize: 'none',
                                                                boxSizing: 'border-box',
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleApprove}
                                                            style={{
                                                                flex: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: 6,
                                                                padding: '8px',
                                                                background: 'var(--primary)',
                                                                color: 'var(--primary-foreground)',
                                                                fontSize: 12,
                                                                fontWeight: 500,
                                                                borderRadius: 6,
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-check" style={{ fontSize: 12 }} /> Setujui
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectOpen(true)}
                                                            style={{
                                                                flex: 1,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: 6,
                                                                padding: '8px',
                                                                background: 'var(--destructive)',
                                                                color: 'var(--destructive-foreground)',
                                                                fontSize: 12,
                                                                fontWeight: 500,
                                                                borderRadius: 6,
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-xmark" style={{ fontSize: 12 }} /> Tolak
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-muted-foreground text-center" style={{ fontSize: 12, padding: '8px 0' }}>
                                                    Menunggu approval dari{' '}
                                                    <strong>{firstPending?.approver?.name || firstPending?.approver_name}</strong>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            <CreateContractModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} types={types} />
            <UploadRevisionModal open={revOpen} onClose={() => setRevOpen(false)} onSubmit={handleRevision} initialType={revType} />
            <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={handleReject} />
            <SendApprovalModal
                open={sendOpen}
                onClose={() => setSendOpen(false)}
                onSubmit={handleSendSubmit}
                contractType={selected?.contract_type ?? undefined}
            />
            <EditContractModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onSubmit={handleUpdate}
                contract={selected}
                types={types}
                processing={processing}
            />
            <FilterDialog
                open={filterOpen}
                onOpenChange={(setOpen) => setFilterOpen(setOpen)}
                types={types}
                activeFilters={{ status: statusFilter, contract_type_id: typeFilter }}
                onFilterChange={(fs) => {
                    if (fs.status) setStatusFilter(fs.status);
                    if (fs.contract_type_id) setTypeFilter(fs.contract_type_id);
                    handleFilterChange(fs);
                }}
                onClearAll={() => {
                    setStatusFilter([]);
                    setTypeFilter([]);
                    handleFilterChange({ status: [], contract_type_id: [] });
                }}
            />
            <DeleteConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} processing={processing} />
            <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={previewTitle} url={previewUrl} hasFile={previewHasFile} />

            <CompareModal
                open={compareOpen}
                onClose={() => setCompareOpen(false)}
                contract={selected}
                initialVersion={compareVer}
                type={compareType}
            />

            {/* ── Floating Chat ── */}
            <FloatingChat contracts={contracts} meId={meId} onContractUpdated={updateContract} />
        </>
    );
}

// ─── Inline-Editable Info Card for Draft Contracts ──────────────────
function DraftEditableInfoCard({
    selected,
    types,
    formTemplates,
    canUpdate,
    onUpdate,
    processing,
    setPreviewTitle,
    setPreviewUrl,
    setPreviewHasFile,
    setPreviewOpen,
}: {
    selected: Contract;
    types: ContractType[];
    formTemplates: FormTemplateInfo[];
    canUpdate: boolean;
    onUpdate: (data: any) => void;
    processing: boolean;
    setPreviewTitle: (v: string) => void;
    setPreviewUrl: (v: string) => void;
    setPreviewHasFile: (v: boolean) => void;
    setPreviewOpen: (v: boolean) => void;
}) {
    const isDraft = selected.status === 'draft' && canUpdate;
    const [title, setTitle] = useState(selected.title);
    const [description, setDescription] = useState(selected.description || '');
    const [typeId, setTypeId] = useState(() => {
        const t = types.find((x) => x.name === selected.contract_type);
        return t ? String(t.id) : '';
    });

    useEffect(() => {
        setTitle(selected.title);
        setDescription(selected.description || '');
        const t = types.find((x) => x.name === selected.contract_type);
        setTypeId(t ? String(t.id) : '');
    }, [selected.id, selected.title, selected.description, selected.contract_type, types]);

    const hasChanges = useMemo(() => {
        const origType = types.find((x) => x.name === selected.contract_type);
        const origTypeId = origType ? String(origType.id) : '';
        return title !== selected.title || description !== (selected.description || '') || typeId !== origTypeId;
    }, [title, description, typeId, selected, types]);

    const handleSave = () => {
        onUpdate({ title, description, contract_type_id: typeId || undefined });
    };

    const inputCls =
        'w-full bg-white dark:bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all';

    const f2Version = selected.versions?.filter((x) => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];

    // Improved template lookup
    const filterTypeId = isDraft ? typeId : selected.contract_type_id ? String(selected.contract_type_id) : '';
    const tpl = formTemplates.find(
        (ft) => ft.document_type === 'f1' && (ft.contract_type_id === filterTypeId || ft.contract_type_name === selected.contract_type),
    );

    return (
        <div className="bg-card border-border overflow-hidden rounded-xl border">
            <div className="border-border/50 flex items-center justify-between border-b" style={{ padding: '12px 16px' }}>
                <div className="flex items-center gap-2 font-semibold" style={{ fontSize: 13 }}>
                    <i className="fa-solid fa-circle-info text-muted-foreground" style={{ fontSize: 12 }} /> Informasi Kontrak
                    {isDraft && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
                            Editable
                        </span>
                    )}
                </div>
                {isDraft && hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={processing || !title.trim()}
                        className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        {processing ? (
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 10 }} />
                        ) : (
                            <i className="fa-solid fa-save" style={{ fontSize: 10 }} />
                        )}
                        Simpan
                    </button>
                )}
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Title - full width if draft */}
                {isDraft ? (
                    <div style={{ gridColumn: '1/-1' }}>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Judul Kontrak
                        </div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nama kontrak..."
                            className={inputCls + ' font-medium'}
                        />
                    </div>
                ) : null}

                {/* No. Kontrak */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        No. Kontrak
                    </div>
                    <span className="bg-muted text-foreground/80 rounded px-2 py-0.5 font-mono" style={{ fontSize: 12 }}>
                        {selected.contract_no}
                    </span>
                </div>

                {/* Status */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Status
                    </div>
                    <StatusBadge status={selected.status} />
                </div>

                {/* Tipe Kontrak */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Tipe Kontrak
                    </div>
                    {isDraft ? (
                        <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls}>
                            <option value="">Pilih Tipe</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-bold tracking-wider text-blue-700 uppercase dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
                            {selected.contract_type}
                        </span>
                    )}
                </div>

                {/* Dibuat Oleh */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Dibuat Oleh
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Avatar user={selected.creator} size="sm" />
                        <span style={{ fontSize: 12 }}>{selected.creator?.name}</span>
                    </div>
                </div>

                {/* Tgl Dibuat */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Tgl Dibuat
                    </div>
                    <span style={{ fontSize: 12 }}>{selected.created_at}</span>
                </div>

                {/* Form Template */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Form Template
                    </div>
                    {tpl ? (
                        <div className="flex items-center gap-2">
                            <span className="max-w-[160px] truncate font-medium text-blue-600" style={{ fontSize: 12 }} title={tpl.name}>
                                {tpl.name}
                            </span>
                            <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                                ({tpl.fields_count} fields)
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground italic" style={{ fontSize: 12 }}>
                            Belum ada template
                        </span>
                    )}
                </div>

                {/* Dokumen F2 */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Dokumen F2
                    </div>
                    {f2Version ? (
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <span className="font-mono font-bold text-cyan-600" style={{ fontSize: 12 }}>
                                    v{f2Version.version_no}
                                </span>
                                <span className="text-muted-foreground max-w-[140px] truncate" style={{ fontSize: 12 }} title={f2Version.file_name}>
                                    {f2Version.file_name}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        setPreviewTitle('F2 - v' + f2Version.version_no);
                                        setPreviewUrl(contractApi.pdfPreviewUrl(selected.id, f2Version.version_no, 'f2'));
                                        setPreviewHasFile(f2Version.has_file);
                                        setPreviewOpen(true);
                                    }}
                                    className="bg-muted/50 border-border/50 text-muted-foreground hover:bg-card flex h-5 w-5 items-center justify-center rounded border shadow-sm transition-all hover:text-cyan-600"
                                >
                                    <i className="fa-solid fa-eye" style={{ fontSize: 12 }} />
                                </button>
                                <a
                                    href={contractApi.downloadUrl(selected.id, 'f2', f2Version.version_no)}
                                    download
                                    className="bg-muted/50 border-border/50 text-muted-foreground hover:bg-card flex h-5 w-5 items-center justify-center rounded border shadow-sm transition-all hover:text-cyan-600"
                                >
                                    <i className="fa-solid fa-download" style={{ fontSize: 12 }} />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground italic" style={{ fontSize: 12 }}>
                            -
                        </span>
                    )}
                </div>

                {/* Total Versi */}
                <div>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Total Versi
                    </div>
                    <span style={{ fontSize: 12 }}>{selected.versions?.length ?? 0} versi</span>
                </div>

                {/* Deskripsi - full width */}
                <div style={{ gridColumn: '1/-1' }}>
                    <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                        Deskripsi
                    </div>
                    {isDraft ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Deskripsi kontrak (opsional)..."
                            className={inputCls + ' resize-none'}
                        />
                    ) : (
                        <div style={{ fontSize: 12 }}>{selected.description || <span className="text-muted-foreground italic">-</span>}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EditContractModal({
    open,
    onClose,
    onSubmit,
    contract,
    types,
    processing,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    contract: Contract | null;
    types: ContractType[];
    processing: boolean;
}) {
    const [title, setTitle] = useState('');
    const [contractNo, setContractNo] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [typeId, setTypeId] = useState('');

    useEffect(() => {
        if (open && contract) {
            setTitle(contract.title);
            setContractNo(contract.contract_no);
            setDescription(contract.description || '');
            setDate(contract.contract_date || '');
            const t = types.find((x) => x.name === contract.contract_type);
            setTypeId(t ? String(t.id) : '');
        }
    }, [open, contract, types]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-card border-border scale-in-center w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl">
                <div className="border-border/50 flex items-center justify-between border-b" style={{ padding: '16px 20px' }}>
                    <h3 className="font-bold text-gray-900" style={{ fontSize: 16 }}>
                        Edit Informasi Kontrak
                    </h3>
                    <button
                        onClick={onClose}
                        className="hover:bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div style={{ padding: 20 }}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Judul Kontrak</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Contoh: Perjanjian Kerjasama Jasa IT"
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm font-medium transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">No. Kontrak</label>
                                <input
                                    value={contractNo}
                                    onChange={(e) => setContractNo(e.target.value)}
                                    placeholder="CTR/2026/..."
                                    className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 font-mono text-sm transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Tanggal</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Tipe Kontrak</label>
                            <select
                                value={typeId}
                                onChange={(e) => setTypeId(e.target.value)}
                                className="bg-muted/30 border-border focus:border-primary/50 w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                            >
                                <option value="">Pilih Tipe</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-muted-foreground mb-1.5 block text-xs font-bold uppercase">Deskripsi</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Penjelasan singkat kontrak..."
                                className="bg-muted/30 border-border focus:border-primary/50 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            className="border-border hover:bg-muted flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => onSubmit({ title, contract_no: contractNo, description, contract_date: date, contract_type_id: typeId })}
                            disabled={processing || !title}
                            className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 flex-1 rounded-xl py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-save mr-2" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    processing,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    processing: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-card border-border scale-in-center w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl">
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                    <div className="bg-destructive/10 text-destructive mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                        <i className="fa-solid fa-trash-can" style={{ fontSize: 24 }} />
                    </div>
                    <h3 className="mb-2 font-bold text-gray-900" style={{ fontSize: 18 }}>
                        Hapus Kontrak?
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Seluruh data dokumen, riwayat, dan chat terkait kontrak ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="border-border flex border-t">
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:bg-muted border-border flex-1 border-r py-4 text-sm font-bold transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className="text-destructive hover:bg-destructive/5 flex-1 py-4 text-sm font-bold transition-colors"
                    >
                        {processing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : null}
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page Entry ──────────────────────────────────────────────────────
export default function ContractsIndex({
    currentView = 'dashboard',
    contracts: initialContractsPaged = {
        data: [],
        links: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        first_page_url: '',
        last_page_url: '',
        prev_page_url: null,
        next_page_url: null,
        from: 0,
        to: 0,
        path: '',
        per_page: 10,
    } as PaginatedData<Contract>,
    types: initialTypes = [],
    formTemplates: initialFormTemplates = [],
    metrics: initialMetrics = null,
    initialSelected: initialSelectedProp = null,
    filters = {},
}: {
    currentView?: View;
    contracts?: PaginatedData<Contract>;
    initialSelected?: Contract | null;
    types?: ContractType[];
    formTemplates?: FormTemplateInfo[];
    metrics?: any;
    filters?: any;
}) {
    const { auth, contractId: initialId } = usePage<{ auth: { user: any }; contractId?: string }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;
    const [contractsPaged, setContractsPaged] = useState<PaginatedData<Contract>>(initialContractsPaged);
    const [types, setTypes] = useState<ContractType[]>(initialTypes);
    const [bootLoading, setBootLoading] = useState(initialContractsPaged.data.length === 0 && !initialMetrics);
    const [initialSelected, setInitialSelected] = useState<Contract | null>(initialSelectedProp);
    const [metrics, setMetrics] = useState<any>(initialMetrics);

    useEffect(() => {
        // Only update if initialContractsPaged actually has items
        // or if we are currently in a view that SHOULD be empty (like a fresh pending view)
        if (initialContractsPaged.data.length > 0 || currentView === 'pending' || currentView === 'mine') {
            setContractsPaged(initialContractsPaged);
        }
    }, [initialContractsPaged, currentView]);

    useEffect(() => {
        // If we already have data or types, don't boot load unless it's genuinely empty
        // We consider it "has data" if it has items OR if it's intentionally empty for a specific view
        const hasInitialData = initialContractsPaged.data.length > 0 || initialContractsPaged.total > 0;
        const isIntentionallyEmpty = currentView === 'pending' || currentView === 'mine';

        if ((hasInitialData || isIntentionallyEmpty) && initialTypes.length > 0) {
            if (initialSelectedProp) {
                setInitialSelected(initialSelectedProp);
            } else if (initialId) {
                setInitialSelected(initialContractsPaged.data.find((c: Contract) => c.id === initialId) ?? null);
            }
            setBootLoading(false);
            return;
        }

        setBootLoading(true);
        Promise.all([
            contractApi.list({ view: currentView }),
            contractApi.getTypes(),
            axios
                .post('/admin/api/reports/data', {})
                .then((res) => res.data)
                .catch(() => null),
        ])
            .then(([cData, tData, mData]) => {
                setContractsPaged(cData as any);
                setTypes(tData);
                setMetrics(mData);
                if (initialId) {
                    setInitialSelected(cData.data.find((c: Contract) => c.id === initialId) ?? null);
                }
                setBootLoading(false);
            })
            .catch(() => setBootLoading(false));
    }, [initialContractsPaged, initialTypes, initialId, currentView]);

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                {bootLoading ? (
                    <div
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted-foreground)' }}
                    >
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary)', marginRight: 12 }} />
                        <span>Memuat data kontrak...</span>
                    </div>
                ) : (
                    <ContractPage
                        contracts={contractsPaged}
                        meId={meId}
                        meUser={meUser}
                        initialSelected={initialSelected}
                        types={types}
                        formTemplates={initialFormTemplates}
                        currentView={currentView}
                        metrics={metrics}
                        filters={filters}
                    />
                )}
            </ToastProvider>
        </>
    );
}
