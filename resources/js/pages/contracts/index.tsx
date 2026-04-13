import React, { useCallback, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { 
    Plus, 
    FileText, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    Search, 
    Filter, 
    MoreHorizontal, 
    FileDown, 
    History, 
    MessageSquare, 
    ExternalLink,
    ChevronDown,
    LayoutGrid,
    List as ListIcon,
    RefreshCcw,
    User,
    FileSearch,
    ChevronLeft,
    Inbox
} from 'lucide-react';
import { FilterDialog } from '@/components/ui/FilterDialog';
import { FilterPills } from '@/components/ui/FilterPills';
import { Contract, ContractType, PaginatedData } from '@/types/contracts';
import { contractApi } from '@/lib/contract-api';
import { ToastProvider, useToast } from '@/components/contracts/Toast';
import { Avatar, StatusBadge } from '@/components/contracts/ui';
import CreateContractModal from '@/components/contracts/CreateContractModal';
import FloatingChat from '@/components/contracts/FloatingChat';
import PreviewModal from '@/components/contracts/PreviewModal';
import CompareModal from '@/components/contracts/CompareModal';
import UploadRevisionModal from '@/components/contracts/UploadRevisionModal';
import RejectModal from '@/components/contracts/RejectModal';
import SendApprovalModal from '@/components/contracts/SendApprovalModal';
import ApprovalSteps from '@/components/contracts/ApprovalSteps';
import ContractChat from '@/components/contracts/ContractChat';
import ContractAttachments from '@/components/contracts/ContractAttachments';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile' | 'mine' | 'expiry';

// ─── Table header cell ───────────────────────────────────────────────
function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <th style={{ 
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
            ...style 
        }}>
            {children}
        </th>
    );
}
function Td({ children, className, style }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return (
        <td style={{ 
            padding: '12px 14px', 
            fontSize: 13, 
            borderBottom: '1px solid var(--border)', 
            verticalAlign: 'middle', 
            ...style 
        }} className={className}>
            {children}
        </td>
    );
}

function ProgressCell({ c }: { c: Contract }) {
    const { done, total, pct } = c.progress;
    return (
        <div style={{ padding: '0 12px', minWidth: 80 }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>{done}/{total}</div>
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
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", color)}>
            <i className={cn("fa-solid", icon)} />
            {label}
        </div>
    );
}

function Pagination({ data, filters }: { data: PaginatedData<Contract>; filters: any }) {
    if (!data || data.last_page <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-6 border-t border-border mt-auto">
            <div className="flex items-center gap-4">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                    Showing <span className="text-foreground">{data.from}</span> to <span className="text-foreground">{data.to}</span> of <span className="text-foreground">{data.total}</span> Results
                </div>
                
                <div className="flex items-center gap-2 border-l border-border pl-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Show</span>
                    <select 
                        value={data.per_page} 
                        onChange={(e) => {
                            const val = e.target.value;
                            router.get(window.location.href, { ...filters, per_page: val, page: 1 }, { 
                                preserveState: true, 
                                preserveScroll: true 
                            } as any);
                        }}
                        className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[10px] font-bold outline-none focus:border-primary/50"
                    >
                        {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
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
                                "h-8 px-3 rounded text-[10px] font-black uppercase tracking-tighter transition-all border shrink-0",
                                link.active 
                                    ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:scale-95",
                                !link.url && "opacity-30 cursor-not-allowed grayscale"
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
    const yLabels = Array.from({ length: steps + 1 }, (_, i) => Math.round(yMax - (i * (yMax / steps))));

    const metricsData = m || {
        avgCycleTime: 0,
        totalContracts: 0,
        pendingApprovals: 0,
        approvedThisMonth: 0
    };

    return (
        <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Rata-rata SLA" value={`${metricsData.avgCycleTime} Hari`} icon="fa-clock" color="blue" />
                <MetricCard title="Total Kontrak" value={String(metricsData.totalContracts)} icon="fa-file-signature" color="green" />
                <MetricCard title="Approval Pending" value={String(metricsData.pendingApprovals)} icon="fa-triangle-exclamation" color="amber" />
                <MetricCard title="Approved (Bulan Ini)" value={String(metricsData.approvedThisMonth)} icon="fa-calendar-check" color="purple" />
            </div>

            {/* Growth Chart */}
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-border font-semibold flex items-center justify-between shadow-sm bg-muted/20">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-chart-line text-muted-foreground mr-1" />
                        <span style={{ fontSize: 13 }}>Tren Pertumbuhan Kontrak</span>
                    </div>
                </div>
                <div className="p-6 flex flex-col justify-end min-h-[380px]">
                    <div className="flex gap-2 h-[220px] relative items-end">
                        {/* Dynamic Y-Axis Labels */}
                        <div className="flex flex-col justify-between h-full pb-6 pr-2 text-[10px] font-bold text-muted-foreground/60 select-none border-r border-border/50 min-w-[24px]">
                            {yLabels.map((v) => (
                                <span key={v} className="flex items-center justify-end h-0">{v}</span>
                            ))}
                        </div>

                        {/* Chart Area with Rules */}
                        <div className="flex-1 relative h-full flex items-end justify-between px-4 pb-6">
                            {/* Horizontal Grid Lines (Rules) */}
                            <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                                {yLabels.map((_, i) => (
                                    <div key={i} className="w-full border-t border-muted-foreground/10 border-dashed first:border-solid last:border-solid last:border-muted-foreground/20" />
                                ))}
                            </div>

                            {/* Data Points (Bars) */}
                            {Array.isArray(monthlyTrend) && monthlyTrend.map((mo: any) => {
                                return (
                                    <div key={mo.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative z-10">
                                        <div className="relative w-full flex items-end justify-center gap-1 h-full">
                                            {mo.types.map((t: any, idx: number) => {
                                                const typePct = (t.count / yMax) * 100;
                                                return (
                                                    <div
                                                        key={t.name}
                                                        className={cn(
                                                            "w-full max-w-[8px] rounded-t-sm transition-all duration-500 ease-out hover:brightness-110 cursor-help",
                                                            idx === 0 ? "bg-primary" :
                                                                idx === 1 ? "bg-blue-500" :
                                                                    idx === 2 ? "bg-purple-500" : "bg-amber-500"
                                                        )}
                                                        style={{ height: `${typePct}%`, minHeight: t.count > 0 ? 2 : 0 }}
                                                        title={`${t.name}: ${t.count}`}
                                                    />
                                                );
                                            })}
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md border border-border z-10">
                                                {mo.total} Kontrak
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-6 flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground mt-1 whitespace-nowrap">{mo.month}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-8 flex flex-wrap gap-4 px-4 justify-center">
                        {Array.from(new Set(monthlyTrend?.flatMap((m: any) => m.types.map((t: any) => t.name)) || [])).map((name: any, idx) => (
                            <div key={name} className="flex items-center gap-2">
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    idx === 0 ? "bg-primary" :
                                        idx === 1 ? "bg-blue-500" :
                                            idx === 2 ? "bg-purple-500" : "bg-amber-500"
                                )} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{name}</span>
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
        purple: 'bg-purple-500/10 text-purple-600 border-purple-200/50'
    } as any;
    return (
        <div className="bg-card border border-border rounded-xl p-5 hover:bg-muted/5 transition-colors relative overflow-hidden group">
            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
                </div>
                <div className={cn("h-10 w-10 flex items-center justify-center rounded-lg border border-border/10", bgMap[color])}>
                    <i className={cn("fa-solid", icon)} style={{ fontSize: 16 }} />
                </div>
            </div>
        </div>
    );
}


// ─── Profile View ────────────────────────────────────────────────────
function ProfileView({ meUser, showToast }: { meUser: any; showToast: any }) {
    const { data: pData, setData: setPData, patch, processing: pProcessing } = useForm({
        name: meUser?.name || '',
        email: meUser?.email || '',
    });

    const { data: qData, setData: setQData, put, processing: qProcessing, reset: resetQ } = useForm({
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
                const msg = Object.values(err)[0] as string || 'Gagal memperbarui password.';
                showToast(msg, 'danger');
            },
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-1">Informasi Profil</h3>
                    <p className="text-muted-foreground text-xs mb-6 uppercase tracking-wider">Kelola data diri dan alamat email Anda</p>

                    <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Nama Lengkap</label>
                            <div className="relative">
                                <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                <input value={pData.name} onChange={e => setPData('name', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-blue-500 focus:bg-card outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Alamat Email</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                <input type="email" value={pData.email} onChange={e => setPData('email', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-blue-500 focus:bg-card outline-none transition-all" />
                            </div>
                        </div>
                        <button type="submit" disabled={pProcessing}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4">
                            {pProcessing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-check mr-2" />}
                            {pProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>

                {/* Password Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-1">Keamanan Akun</h3>
                    <p className="text-muted-foreground text-xs mb-6 uppercase tracking-wider">Perbarui kata sandi secara berkala</p>

                    <form onSubmit={updatePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Password Saat Ini</label>
                            <div className="relative">
                                <i className="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                <input type="password" value={qData.current_password} onChange={e => setQData('current_password', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-blue-500 focus:bg-card outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Password Baru</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                <input type="password" value={qData.password} onChange={e => setQData('password', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-blue-500 focus:bg-card outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Konfirmasi Password</label>
                            <div className="relative">
                                <i className="fa-solid fa-shield absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                                <input type="password" value={qData.password_confirmation} onChange={e => setQData('password_confirmation', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:border-blue-500 focus:bg-card outline-none transition-all" />
                            </div>
                        </div>
                        <button type="submit" disabled={qProcessing}
                            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-gray-100 hover:bg-black hover:shadow-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4">
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
function ContractPage({ contracts: contractsPaged, meId, meUser, initialSelected, types, currentView, metrics, filters }: {
    contracts: PaginatedData<Contract>;
    meId: string;
    meUser: any;
    initialSelected?: Contract | null;
    types: ContractType[];
    currentView: View;
    metrics: any;
    filters: { search?: string; status?: string; contract_type_id?: string; per_page?: number };
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
    const [detailTab, setDetailTab] = useState<'f1' | 'f2' | 'attachments' | 'audit' | 'chat'>('f1');
    const [search, setSearch] = useState(filters?.search || '');
    
    // Multi-select faceted filters
    const [statusFilter, setStatusFilter] = useState<string[]>(
        Array.isArray(filters?.status) ? filters.status : (filters?.status && filters.status !== 'all' ? [filters.status] : [])
    );
    const [typeFilter, setTypeFilter] = useState<string[]>(
        Array.isArray(filters?.contract_type_id) ? filters.contract_type_id : (filters?.contract_type_id && filters.contract_type_id !== 'all' ? [filters.contract_type_id] : [])
    );
    const [layout, setLayout] = useState<'list' | 'card'>('list');
    const [approvalNote, setApprovalNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    // Filter Logic
    const handleFilterChange = useCallback((newFilters: { search?: string; status?: string[]; contract_type_id?: string[] }) => {
        const merged = { 
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : statusFilter,
            contract_type_id: newFilters.contract_type_id !== undefined ? newFilters.contract_type_id : typeFilter,
        };

        // Clean up empty filters
        const query = Object.fromEntries(
            Object.entries(merged).filter(([_, v]) => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true))
        );
        
        router.get(window.location.pathname, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        } as any);
    }, [search, statusFilter, typeFilter]);

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
                className: 'font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500'
            },
            {
                header: 'Judul Kontrak',
                accessorKey: 'title',
                sortable: true,
                cell: (c) => (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 line-clamp-1">{c.title}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{c.contract_type}</span>
                    </div>
                )
            },
            {
                header: 'Dibuat Oleh',
                accessorKey: 'creator.name',
                cell: (c) => (
                    <div className="flex items-center gap-2">
                        <Avatar user={c.creator} size="sm" />
                        <span className="text-[12px] font-medium text-slate-700">{c.creator?.name}</span>
                    </div>
                )
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (c) => <StatusBadge status={c.status} />
            },
            {
                header: 'Versi',
                accessorKey: 'current_version',
                className: 'w-[80px]',
                cell: (c) => <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">v{c.current_version}</span>
            },
            {
                header: 'Progress',
                accessorKey: 'progress.pct',
                cell: (c) => <ProgressCell c={c} />
            }
        ];

        if (view === 'expiry') {
            baseColumns.push({
                header: 'Masa Berlaku',
                accessorKey: 'end_date',
                cell: (c) => <ExpiryBadge endDate={c.end_date} />
            });
        }

        baseColumns.push({
            header: 'Tgl Dibuat',
            accessorKey: 'created_at',
            className: 'text-slate-400 text-[11px] font-medium',
            cell: (c) => c.created_at
        });

        return baseColumns;
    }, [view]);

    const renderRowActions = useCallback((c: Contract) => {
        return (
            <button 
                onClick={(e) => { e.stopPropagation(); openDetail(c); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95"
                title="Lihat Detail"
            >
                <i className="fa-solid fa-eye text-[11px]" />
            </button>
        );
    }, []);

    useEffect(() => {
        if (initialSelected) { setSelected(initialSelected); }
    }, [initialSelected?.id]);

    const updateContract = useCallback((c: Contract) => {
        router.reload({ preserveScroll: true, preserveState: true } as any);
        if (selected?.id === c.id) setSelected(c);
    }, [selected?.id]);

    const openDetail = (c: Contract) => { setSelected(c); setDetailTab('f1'); setApprovalNote(''); };
    const closeDetail = () => { setSelected(null); setDetailTab('f1'); };

    // Computed
    const stats = {
        total: contracts.length,
        pending: contracts.filter(c => c.status === 'in_review').length,
        approved: contracts.filter(c => c.status === 'approved').length,
        revision: contracts.filter(c => c.status === 'revision').length,
        monthCount: contracts.filter(c => c.created_at.startsWith('2026-04')).length,
    };

    const myPending = contracts.flatMap(c =>
        c.approvals.filter(a => a.user_id === meId && a.status === 'pending').map(a => ({ contract: c, approval: a }))
    );

    const pendingApprovalForMe = selected?.approvals.find(a => a.status === 'pending' && a.user_id === meId);
    const firstPending = selected?.approvals.find(a => a.status === 'pending');
    const hasAnyPending = !!firstPending;
    const canApprove = (selected?.status === 'in_review' || selected?.status === 'revision') && !!pendingApprovalForMe;

    const filtered = contracts; // Server handled filtering
    const recentContracts = contracts.slice(0, layout === 'card' ? 6 : 4);
    const myFilteredPending = contracts.filter(c =>
        c.approvals.some(a => a.user_id === meId && a.status === 'pending')
    );

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
        }
        finally { setLoading(false); }
    };

    const handleApprove = async () => {
        if (!selected) return;
        try {
            const c = await contractApi.approve(selected.id, approvalNote);
            updateContract(c);
            setApprovalNote('');
            showToast('Kontrak berhasil disetujui!', 'success');
        } catch { showToast('Gagal approve.', 'danger'); }
    };

    const handleReject = async (reason: string) => {
        if (!selected) return;
        try {
            const c = await contractApi.reject(selected.id, reason);
            updateContract(c);
            showToast('Kontrak ditolak.', 'info');
        } catch { showToast('Gagal reject.', 'danger'); }
    };

    const handleDownload = async (contractId: string, fileName?: string) => {
        try {
            const res = await fetch(contractApi.downloadUrl(contractId), { credentials: 'same-origin' });
            if (!res.ok) { showToast('File tidak tersedia. Belum ada dokumen yang diupload.', 'danger'); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName ?? 'dokumen.docx';
            a.click();
            URL.revokeObjectURL(url);
        } catch { showToast('Gagal mengunduh file.', 'danger'); }
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
        } catch { showToast('Gagal approve.', 'danger'); }
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
        } catch { showToast('Gagal memperbarui kontrak.', 'danger'); }
        finally { setProcessing(false); }
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
        } catch { showToast('Gagal menghapus kontrak.', 'danger'); }
        finally { setProcessing(false); }
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
        } catch { showToast('Gagal mengubah versi.', 'danger'); }
    };

    const navTo = (v: View) => { setView(v); closeDetail(); };

    const SL: Record<string, string> = { 
        dashboard: 'Dashboard', 
        contracts: 'Semua Kontrak', 
        pending: 'Menunggu Approval', 
        audit: 'Audit Trail', 
        f1: 'Form F1', 
        f2: 'Form F2', 
        profile: 'Profil Saya',
        mine: 'Dokumen Saya',
        expiry: 'Monitoring Masa Berlaku'
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(window.location.pathname, { search, status: statusFilter, per_page: filters?.per_page }, { 
            preserveState: true, 
            preserveScroll: true 
        } as any);
    };

    const handleStatusChange = (val: string) => {
        const next = val === 'all' ? [] : [val];
        setStatusFilter(next);
        router.get(window.location.pathname, { search, status: next, per_page: filters?.per_page }, { 
            preserveState: true, 
            preserveScroll: true 
        } as any);
    }

    const viewConfig = {
        dashboard: { title: 'Dashboard Kontrak', icon: LayoutGrid, desc: 'Ringkasan aktivitas dan status kontrak terbaru.' },
        contracts: { title: 'Manajemen Kontrak', icon: FileText, desc: 'Kelola semua data kontrak dalam sistem.' },
        mine: { title: 'Kontrak Saya', icon: User, desc: 'Daftar kontrak yang Anda buat.' },
        pending: { title: 'Menunggu Approval', icon: Clock, desc: 'Daftar kontrak yang sedang menunggu persetujuan Anda.' },
        f1: { title: 'Kontrak F1', icon: FileText, desc: 'Kelola draft kontrak dan dokumen F1.' },
        f2: { title: 'Kontrak F2', icon: FileSearch, desc: 'Kelola revisi kontrak dan dokumen F2.' },
        expiry: { title: 'Kontrak Berakhir', icon: AlertCircle, desc: 'Daftar kontrak yang mendekati masa kadaluarsa.' },
        audit: { title: 'Audit Trail', icon: History, desc: 'Riwayat lengkap aktivitas perubahan kontrak.' },
        profile: { title: 'Profil Saya', icon: User, desc: 'Kelola informasi profil dan akun Anda.' }
    };

    const currentViewConfig = viewConfig[view] || viewConfig.contracts;
    const Icon = currentViewConfig.icon;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Manajemen Kontrak', href: route('contracts'), description: currentViewConfig.desc },
    ];

    return (
        <>
            <Head title={SL[view]} />

        <div className="flex flex-1 flex-col gap-6 p-6 min-h-0 bg-slate-50/50">
            {/* ── View Content ── */}
                {view === 'profile' && !selected && (
                    <ProfileView meUser={meUser} showToast={showToast} />
                )}

                {/* ── Dashboard ── */}
                {view === 'dashboard' && !selected && (
                    <div>
                        {/* Stats & Trends */}
                        <DashboardMetrics metrics={metrics} />

                        {/* Recent Contracts Header & Filter */}
                        <div className="flex flex-col gap-4 mb-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13 }}>
                                    <i className="fa-solid fa-list-ul text-muted-foreground" style={{ fontSize: 12 }} /> Kontrak Terbaru
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="relative max-w-[200px]">
                                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 11 }} />
                                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..."
                                            className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary/50 transition-all" />
                                    </div>
                                    <div className="flex border border-border rounded-lg overflow-hidden bg-card">
                                        <button onClick={() => setLayout('list')} className={`p-1.5 transition-colors ${layout === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`} title="List View">
                                            <i className="fa-solid fa-list" style={{ fontSize: 11 }} />
                                        </button>
                                        <button onClick={() => setLayout('card')} className={`p-1.5 transition-colors ${layout === 'card' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`} title="Grid View">
                                            <i className="fa-solid fa-table-cells-large" style={{ fontSize: 11 }} />
                                        </button>
                                    </div>
                                    <button onClick={() => navTo('contracts')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {recentContracts.map(c => (
                                        <div key={c.id} onClick={() => openDetail(c)} className="bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono text-[9px] bg-muted text-muted-foreground px-1 py-0.5 rounded uppercase tracking-wider">{c.contract_no}</span>
                                                <StatusBadge status={c.status} />
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1" style={{ fontSize: 13 }}>{c.title}</h3>
                                            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/50">
                                                <Avatar user={c.creator} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-gray-900 font-medium truncate" style={{ fontSize: 10 }}>{c.creator?.name}</div>
                                                    <div className="text-muted-foreground" style={{ fontSize: 9 }}>v{c.current_version} · {c.created_at}</div>
                                                </div>
                                                <div className="w-20">
                                                    <ProgressCell c={c} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {recentContracts.length === 0 && (
                                        <div className="col-span-full p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
                                            <p style={{ fontSize: 12 }}>Tidak ada kontrak ditemukan.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Bottleneck */}
                            <div className="bg-card border border-border rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 border-b border-border/50 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                    <i className="fa-solid fa-triangle-exclamation text-muted-foreground" style={{ fontSize: 12 }} /> Bottleneck Approval
                                </div>
                                <div style={{ padding: 16 }}>
                                    {(['Legal', 'Tax', 'Management', 'Direksi']).map(role => {
                                        const p = contracts.filter(c => c.approvals.some(a => a.role === role && a.status === 'pending')).length;
                                        return (
                                            <div key={role} style={{ marginBottom: 12 }}>
                                                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                                                    <span className="font-medium" style={{ fontSize: 12 }}>{role}</span>
                                                    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{p} pending</span>
                                                </div>
                                                <div style={{ height: 4, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: 99, width: `${p * 25}%`, background: p > 0 ? '#f59e0b' : '#16a34a', opacity: 0.8 }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Status Overview */}
                            <div className="bg-card border border-border rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 border-b border-border/50 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                    <i className="fa-solid fa-chart-pie text-muted-foreground" style={{ fontSize: 12 }} /> Status Overview
                                </div>
                                <div style={{ padding: 16 }}>
                                    {(['draft', 'in_review', 'revision', 'approved'] as const).map(s => (
                                        <div key={s} className="flex justify-between items-center border-b border-border/50 last:border-0" style={{ paddingTop: 8, paddingBottom: 8 }}>
                                            <StatusBadge status={s} />
                                            <span className="font-bold" style={{ fontSize: 18 }}>{contracts.filter(c => c.status === s).length}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Contracts & Pending View with unified layout ── */}
                {(view === 'contracts' || view === 'f1' || view === 'f2' || view === 'mine' || view === 'expiry' || view === 'pending') && !selected && (
                    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 overflow-hidden -mx-6 -mb-6 border-t border-slate-200">
                        {/* Top Action Bar */}
                        <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 max-w-md">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        placeholder="Cari kontrak, no, atau pembuat..."
                                        className="pl-9 h-10 border-slate-200 focus:ring-primary/20 rounded-lg bg-white shadow-sm" 
                                    />
                                </div>
                                <Button variant="outline" size="icon" onClick={() => router.reload({ preserveScroll: true, preserveState: true } as any)} className="shrink-0 h-10 w-10 border-slate-200 bg-white shadow-sm hover:bg-slate-50">
                                    <RefreshCcw className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setFilterOpen(true)}
                                    className={cn(
                                        "h-10 px-4 flex items-center gap-2 font-bold text-xs uppercase tracking-wider border-slate-200 bg-white shadow-sm",
                                        (statusFilter.length > 0 || typeFilter.length > 0) && "border-primary/50 bg-primary/5 text-primary"
                                    )}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    Filter
                                    {(statusFilter.length > 0 || typeFilter.length > 0) && (
                                        <Badge className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-0 font-bold">
                                            {statusFilter.length + typeFilter.length}
                                        </Badge>
                                    )}
                                </Button>

                                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white h-10 shadow-sm">
                                    <button onClick={() => setLayout('list')} className={`px-2.5 transition-colors ${layout === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 text-slate-500'}`} title="List View">
                                        <ListIcon size={16} />
                                    </button>
                                    <button onClick={() => setLayout('card')} className={`px-2.5 transition-colors ${layout === 'card' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 text-slate-500'}`} title="Grid View">
                                        <LayoutGrid size={16} />
                                    </button>
                                </div>

                                {canCreate && (
                                    <Button className="h-10 px-4 gap-2 font-bold text-[11px] uppercase tracking-wider rounded-lg shadow-lg shadow-primary/20" onClick={() => setCreateOpen(true)}>
                                        <Plus className="h-3.5 w-3.5" />
                                        Buat Kontrak
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Active Pills */}
                        <div className="px-6 py-2">
                            <FilterPills 
                                activeFilters={{ status: statusFilter, contract_type_id: typeFilter }}
                                types={types}
                                onRemove={(key, val) => {
                                    if (key === 'status') {
                                        const next = statusFilter.filter(v => v !== val);
                                        setStatusFilter(next);
                                        handleFilterChange({ status: next });
                                    } else {
                                        const next = typeFilter.filter(v => v !== val);
                                        setTypeFilter(next);
                                        handleFilterChange({ contract_type_id: next });
                                    }
                                }}
                                onClearAll={() => {
                                    setStatusFilter([]);
                                    setTypeFilter([]);
                                    handleFilterChange({ status: [], contract_type_id: [] });
                                }}
                            />
                        </div>

                            {/* List/Grid Area */}
                            <div className="flex-1 overflow-auto px-6 pb-6 pt-2">
                                {layout === 'list' ? (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <DataTable
                                            columns={view === 'pending' ? [
                                                ...columns.filter(col => col.accessorKey !== 'progress.pct'),
                                                {
                                                    header: 'Role / Seq',
                                                    accessorKey: 'role',
                                                    cell: (c) => {
                                                        const a = c.approvals.find(ap => ap.user_id === meId && ap.status === 'pending');
                                                        return (
                                                            <div className="flex flex-col">
                                                                <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase w-fit">{a?.role}</span>
                                                                <span className="text-[10px] text-muted-foreground mt-1">Sequence {a?.sequence}</span>
                                                            </div>
                                                        );
                                                    }
                                                }
                                            ] : columns}
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
                                                onPageChange: (page) => router.get(window.location.href, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                                                onPerPageChange: (perPage) => router.get(window.location.href, { ...filters, per_page: perPage, page: 1 }, { preserveState: true, preserveScroll: true })
                                            }}
                                            getRowId={(c) => c.id}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {contractsPaged.data.map(c => (
                                                <div key={c.id} onClick={() => openDetail(c)}
                                                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group hover:bg-primary/5 shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-wider font-bold border border-slate-200/50">{c.contract_no}</span>
                                                        <StatusBadge status={c.status} />
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-1 text-[15px]">{c.title}</h3>
                                                    <p className="text-slate-500 mb-5 line-clamp-2 text-[12px] leading-relaxed">{c.description || '—'}</p>
                                                    
                                                    <div className="flex items-center gap-3 mb-5">
                                                        <Avatar user={c.creator} size="sm" className="ring-2 ring-white shadow-sm" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-slate-900 font-semibold truncate text-[12px]">{c.creator?.name}</div>
                                                            <div className="text-slate-400 text-[10px] items-center flex gap-1"><Clock size={10} /> {c.created_at}</div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-2">
                                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold uppercase ring-1 ring-slate-200/50">v{c.current_version}</span>
                                                                <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full text-primary font-bold uppercase truncate max-w-[100px] ring-1 ring-primary/20">{c.contract_type}</span>
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
                                            <div className="p-20 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <Inbox size={32} className="text-slate-300" />
                                                </div>
                                                <h3 className="text-slate-900 font-bold text-lg mb-1">Tidak ada kontrak</h3>
                                                <p className="text-sm">Tidak ada kontrak yang sesuai dengan kriteria filter Anda.</p>
                                                <Button variant="outline" className="mt-6 font-bold text-xs uppercase" onClick={() => { setStatusFilter([]); setTypeFilter([]); handleFilterChange({ status: [], contract_type_id: [] }); }}>
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
                    <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                        <i className="fa-solid fa-lock mb-4 block" style={{ fontSize: 32 }} />
                        <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: 16 }}>Akses Terbatas</h3>
                        <p style={{ fontSize: 13 }}>Halaman Audit Trail hanya dapat diakses oleh Administrator.</p>
                    </div>
                )}

                {/* ── Common Pagination ── */}
                {(!selected && view !== 'dashboard' && view !== 'profile' && layout !== 'list') && (
                    <Pagination data={contractsPaged} filters={{ search, status: statusFilter }} />
                )}

                {/* ── Detail ── */}
                {selected && (
                    <div>
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12, marginBottom: 16 }}>
                            <a style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={closeDetail}>Kontrak</a>
                            <i className="fa-solid fa-chevron-right text-gray-300" style={{ fontSize: 12 }} />
                            <span className="text-muted-foreground">{selected.contract_no}</span>
                        </nav>


                        {/* Header */}
                        <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                            <div>
                                <h2 className="font-bold text-gray-900" style={{ fontSize: 16 }}>{selected.title}</h2>
                                <p className="text-gray-400" style={{ fontSize: 11, marginTop: 2 }}>{selected.contract_no} · {selected.status.replace('_', ' ').toUpperCase()}</p>
                            </div>
                            <div className="flex gap-2">
                                {selected.status === 'draft' && (
                                    <>
                                        {canUpdate && (
                                            <>
                                                <button onClick={() => setEditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                                    <i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }} /> Edit
                                                </button>
                                                <button onClick={handleSendForApproval} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                                                    onMouseOver={e => ((e.currentTarget as any).style.background = '#1d4ed8')} onMouseOut={e => ((e.currentTarget as any).style.background = '#2563eb')}>
                                                    <i className="fa-solid fa-paper-plane" style={{ fontSize: 11 }} /> Kirim
                                                </button>
                                            </>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => setDeleteOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                <i className="fa-solid fa-trash-can" style={{ fontSize: 11 }} /> Hapus
                                            </button>
                                        )}
                                    </>
                                )}
                                <button onClick={() => handleDownload(selected.id, selected.versions.find(v => v.version_no === selected.current_version)?.file_name)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                    <i className="fa-solid fa-download" style={{ fontSize: 11 }} /> Download
                                </button>
                                {canUpdate && (
                                    <button onClick={() => setRevOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                        <i className="fa-solid fa-upload" style={{ fontSize: 11 }} /> Upload Revisi
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

                            {/* Left */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Info Card */}
                                <div className="bg-card border border-border rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 border-b border-border/50 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                        <i className="fa-solid fa-circle-info text-muted-foreground" style={{ fontSize: 12 }} /> Informasi Kontrak
                                    </div>
                                    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        {[
                                            { k: 'No. Kontrak', v: <span className="font-mono bg-muted text-foreground/80 px-2 py-0.5 rounded" style={{ fontSize: 12 }}>{selected.contract_no}</span> },
                                            { k: 'Status', v: <StatusBadge status={selected.status} /> },
                                            { k: 'Tipe Kontrak', v: <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-xs border border-blue-100 dark:border-blue-900/30">{selected.contract_type}</span> },
                                            { k: 'Dibuat Oleh', v: <div className="flex items-center gap-1.5"><Avatar user={selected.creator} size="sm" /><span style={{ fontSize: 12 }}>{selected.creator?.name}</span></div> },
                                            { k: 'Tgl Dibuat', v: <span style={{ fontSize: 12 }}>{selected.created_at}</span> },
                                            {
                                                k: 'Dokumen F1', v: (() => {
                                                    const v = selected.versions.find(x => x.document_type === 'f1' && x.version_no === selected.current_version);
                                                    return v ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col"><span className="font-mono font-bold text-blue-600" style={{ fontSize: 12 }}>v{v.version_no}</span><span className="text-muted-foreground truncate max-w-[140px]" style={{ fontSize: 12 }} title={v.file_name}>{v.file_name}</span></div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => { setPreviewTitle('F1 - v' + v.version_no); setPreviewUrl(contractApi.pdfPreviewUrl(selected.id, v.version_no, 'f1')); setPreviewHasFile(v.has_file); setPreviewOpen(true); }} className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 border border-border/50 text-muted-foreground hover:text-blue-600 hover:bg-card transition-all shadow-sm">
                                                                    <i className="fa-solid fa-eye" style={{ fontSize: 12 }} />
                                                                </button>
                                                                <a href={contractApi.downloadUrl(selected.id, 'f1', v.version_no)} download className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 border border-border/50 text-muted-foreground hover:text-blue-600 hover:bg-card transition-all shadow-sm">
                                                                    <i className="fa-solid fa-download" style={{ fontSize: 12 }} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-muted-foreground italic" style={{ fontSize: 12 }}>-</span>;
                                                })()
                                            },
                                            {
                                                k: 'Dokumen F2', v: (() => {
                                                    const v = selected.versions.filter(x => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];
                                                    return v ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col"><span className="font-mono font-bold text-cyan-600" style={{ fontSize: 12 }}>v{v.version_no}</span><span className="text-muted-foreground truncate max-w-[140px]" style={{ fontSize: 12 }} title={v.file_name}>{v.file_name}</span></div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => { setPreviewTitle('F2 - v' + v.version_no); setPreviewUrl(contractApi.pdfPreviewUrl(selected.id, v.version_no, 'f2')); setPreviewHasFile(v.has_file); setPreviewOpen(true); }} className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 border border-border/50 text-muted-foreground hover:text-cyan-600 hover:bg-card transition-all shadow-sm">
                                                                    <i className="fa-solid fa-eye" style={{ fontSize: 12 }} />
                                                                </button>
                                                                <a href={contractApi.downloadUrl(selected.id, 'f2', v.version_no)} download className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 border border-border/50 text-muted-foreground hover:text-cyan-600 hover:bg-card transition-all shadow-sm">
                                                                    <i className="fa-solid fa-download" style={{ fontSize: 12 }} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-muted-foreground italic" style={{ fontSize: 12 }}>-</span>;
                                                })()
                                            },
                                            { k: 'Total Versi', v: <span style={{ fontSize: 12 }}>{selected.versions.length} versi</span> },
                                        ].map(({ k, v }) => (
                                            <div key={k}>
                                                <div className="font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: 12, marginBottom: 4 }}>{k}</div>
                                                {v}
                                            </div>
                                        ))}
                                        <div style={{ gridColumn: '1/-1' }}>
                                            <div className="font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: 12, marginBottom: 4 }}>Deskripsi</div>
                                            <div style={{ fontSize: 12 }}>{selected.description}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs Card */}
                                <div className="bg-card border border-border rounded-xl overflow-hidden">
                                    <div className="flex border-b border-border px-4 pt-2 gap-1">
                                        {([
                                            { id: 'f1', icon: 'fa-file-lines', label: 'F1', badge: 0 },
                                            { id: 'f2', icon: 'fa-file-shield', label: 'F2', badge: 0 },
                                            { id: 'attachments', icon: 'fa-paperclip', label: 'Lampiran', badge: selected.attachments?.length ?? 0 },
                                            { id: 'audit', icon: 'fa-list-check', label: 'Audit Trail', badge: 0 },
                                            {
                                                id: 'chat', icon: 'fa-comments', label: 'Diskusi',
                                                badge: (selected.messages ?? []).filter(m => !m.read_by.includes(meId)).length
                                            },
                                        ] as const).map(tab => (
                                            <button key={tab.id} onClick={() => setDetailTab(tab.id as any)} style={{
                                                fontSize: 12, fontWeight: 500, padding: '8px 12px',
                                                color: detailTab === tab.id ? 'var(--primary)' : 'var(--muted-foreground)',
                                                background: 'none', border: 'none',
                                                borderBottom: detailTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1,
                                                transition: 'color .15s',
                                            }}>
                                                <i className={`fa-solid ${tab.icon}`} /> {tab.label}
                                                {tab.badge > 0 && <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--primary)', color: 'var(--primary-foreground)', padding: '1px 6px', borderRadius: 99, lineHeight: 1.4 }}>{tab.badge}</span>}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ padding: 16 }}>

                                        {/* F1 Tab */}
                                        {detailTab === 'f1' && (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-foreground" style={{ fontSize: 13 }}>Riwayat Dokumen F1</h4>
                                                    <button onClick={() => { setRevType('f1'); setRevOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                        <i className="fa-solid fa-plus" /> Upload Revisi F1
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {selected.versions.filter(v => v.document_type === 'f1').sort((a, b) => b.version_no - a.version_no).map(v => (
                                                        <div key={v.id} style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            border: v.version_no === selected.current_version ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                            background: v.version_no === selected.current_version ? 'var(--accent)' : 'var(--card)',
                                                            borderRadius: 8, padding: '10px 12px'
                                                        }}>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-mono font-bold text-xs">v{v.version_no}</span>
                                                                    {v.is_final && <StatusBadge status="approved" label="Final" />}
                                                                    {v.version_no === selected.current_version && (
                                                                        <span className="rounded-full font-bold uppercase tracking-wider" style={{ fontSize: 12 }}>Aktif</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs font-medium text-foreground/80 truncate" title={v.file_name}>
                                                                    <i className="fa-regular fa-file-word mr-1.5 text-blue-400" />
                                                                    {v.file_name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-0.5">{v.change_log} · {v.created_at} · {v.uploader?.name}</div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                                                                <button onClick={() => {
                                                                    setPreviewTitle(`F1 - v${v.version_no}`);
                                                                    setPreviewUrl(contractApi.pdfPreviewUrl(selected.id, v.version_no, 'f1'));
                                                                    setPreviewHasFile(v.has_file);
                                                                    setPreviewOpen(true);
                                                                }} className="px-2.5 py-1.5 text-xs font-semibold border border-border rounded-md hover:bg-muted/50 transition-all flex items-center gap-1.5">
                                                                    <i className="fa-solid fa-eye" /> Preview
                                                                </button>
                                                                <button onClick={() => {
                                                                    setCompareVer(v.version_no);
                                                                    setCompareType('f1');
                                                                    setCompareOpen(true);
                                                                }} className="px-2.5 py-1.5 text-xs font-semibold border border-border rounded-md hover:bg-muted/50 transition-all flex items-center gap-1.5">
                                                                    <i className="fa-solid fa-shuffle" /> Diff
                                                                </button>
                                                                <a href={contractApi.downloadUrl(selected.id, 'f1', v.version_no)} download className="w-8 h-8 flex items-center justify-center border border-border rounded-md hover:bg-muted/50 transition-all text-muted-foreground">
                                                                    <i className="fa-solid fa-download text-xs" />
                                                                </a>
                                                                {v.version_no !== selected.current_version && (
                                                                    <button onClick={() => handleChangeVersion(v.version_no)} className="w-8 h-8 flex items-center justify-center border border-border rounded-md hover:bg-green-50 hover:text-green-600 transition-all text-muted-foreground" title="Jadikan versi aktif">
                                                                        <i className="fa-solid fa-circle-check text-xs" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {selected.versions.filter(v => v.document_type === 'f1').length === 0 && (
                                                        <div className="text-center py-8 text-muted-foreground" style={{ fontSize: 12 }}>Belum ada dokumen F1.</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* F2 Tab */}
                                        {detailTab === 'f2' && (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-foreground" style={{ fontSize: 13 }}>Riwayat Dokumen F2</h4>
                                                    <button onClick={() => { setRevType('f2'); setRevOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                        <i className="fa-solid fa-plus" /> Upload Revisi F2
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {selected.versions.filter(v => v.document_type === 'f2').sort((a, b) => b.version_no - a.version_no).map(v => (
                                                        <div key={v.id} style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            border: '1px solid var(--border)',
                                                            background: 'var(--card)',
                                                            borderRadius: 8, padding: '10px 12px'
                                                        }}>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-mono font-bold text-cyan-600 text-xs">v{v.version_no}</span>
                                                                </div>
                                                                <div className="text-xs font-medium text-foreground/80 truncate" title={v.file_name}>
                                                                    <i className="fa-regular fa-file-word mr-1.5 text-cyan-400" />
                                                                    {v.file_name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-0.5">{v.change_log} · {v.created_at} · {v.uploader?.name}</div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                                                                <button onClick={() => {
                                                                    setPreviewTitle(`F2 - v${v.version_no}`);
                                                                    setPreviewUrl(contractApi.pdfPreviewUrl(selected.id, v.version_no, 'f2'));
                                                                    setPreviewHasFile(v.has_file);
                                                                    setPreviewOpen(true);
                                                                }} className="px-2.5 py-1.5 text-xs font-semibold border border-border rounded-md hover:bg-muted/50 transition-all flex items-center gap-1.5">
                                                                    <i className="fa-solid fa-eye" /> Preview
                                                                </button>
                                                                <button onClick={() => {
                                                                    setCompareVer(v.version_no);
                                                                    setCompareType('f2');
                                                                    setCompareOpen(true);
                                                                }} className="px-2.5 py-1.5 text-xs font-semibold border border-border rounded-md hover:bg-muted/50 transition-all flex items-center gap-1.5">
                                                                    <i className="fa-solid fa-shuffle" /> Diff
                                                                </button>
                                                                <a href={contractApi.downloadUrl(selected.id, 'f2', v.version_no)} download className="w-8 h-8 flex items-center justify-center border border-border rounded-md hover:bg-muted/50 transition-all text-muted-foreground">
                                                                    <i className="fa-solid fa-download text-xs" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {selected.versions.filter(v => v.document_type === 'f2').length === 0 && (
                                                        <div className="text-center py-8 text-muted-foreground" style={{ fontSize: 12 }}>Belum ada dokumen F2.</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

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
                                                    const colors: Record<string, string> = { CONTRACT_CREATED: 'var(--chart-1)', FILE_UPLOADED: 'var(--chart-2)', APPROVAL_APPROVED: 'var(--chart-3)', APPROVAL_REJECTED: 'var(--destructive)', CONTRACT_APPROVED: 'var(--chart-4)' };
                                                    return (
                                                        <div key={i} className="flex gap-2.5 border-b border-border/50 last:border-0" style={{ paddingTop: 8, paddingBottom: 8 }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: colors[h.action] ?? 'var(--muted-foreground)' }} />
                                                            <div>
                                                                <div className="font-medium" style={{ fontSize: 12 }}>{h.description}</div>
                                                                <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>
                                                                    <Avatar user={h.actor} size="sm" /> {h.actor?.name} · {h.actor?.role}
                                                                </div>
                                                                <div className="text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>{h.created_at}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Chat tab */}
                                        {detailTab === 'chat' && (
                                            <ContractChat contract={selected} meId={meId} onNewMessage={updateContract} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Approval Flow */}
                                <div className="bg-card border border-border rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 border-b border-border/50 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                        <i className="fa-solid fa-arrow-right-arrow-left text-muted-foreground" style={{ fontSize: 12 }} /> Alur Approval
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        <ApprovalSteps approvals={selected.approvals} />
                                    </div>
                                </div>

                                {/* Action Card — only shown if there's a pending approval */}
                                {hasAnyPending && (
                                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                                        <div className="flex items-center gap-2 border-b border-border/50 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                            <i className="fa-solid fa-bolt text-muted-foreground" style={{ fontSize: 12 }} /> Aksi Approval
                                        </div>
                                        <div style={{ padding: 16 }}>
                                            {canApprove ? (
                                                <>
                                                    <p className="text-muted-foreground" style={{ fontSize: 12, marginBottom: 12 }}>Kamu adalah approver berikutnya untuk kontrak ini.</p>
                                                    <div style={{ marginBottom: 12 }}>
                                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 4 }}>Catatan</label>
                                                        <textarea value={approvalNote} onChange={e => setApprovalNote(e.target.value)} rows={3} placeholder="Tambahkan catatan..."
                                                            style={{ width: '100%', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleApprove} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                            <i className="fa-solid fa-check" style={{ fontSize: 12 }} /> Setujui
                                                        </button>
                                                        <button onClick={() => setRejectOpen(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                            <i className="fa-solid fa-xmark" style={{ fontSize: 12 }} /> Tolak
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-muted-foreground text-center" style={{ fontSize: 12, padding: '8px 0' }}>
                                                    Menunggu approval dari <strong>{firstPending?.approver?.name || firstPending?.approver_name}</strong>
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
            <SendApprovalModal open={sendOpen} onClose={() => setSendOpen(false)} onSubmit={handleSendSubmit} contractType={selected?.contract_type || undefined} />
            <EditContractModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate} contract={selected} types={types} processing={processing} />
            <FilterDialog
                open={filterOpen}
                onOpenChange={setOpen => setFilterOpen(setOpen)}
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
            <PreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                title={previewTitle}
                url={previewUrl}
                hasFile={previewHasFile}
            />

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

function EditContractModal({ open, onClose, onSubmit, contract, types, processing }: {
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
            const t = types.find(x => x.name === contract.contract_type);
            setTypeId(t ? String(t.id) : '');
        }
    }, [open, contract, types]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-in-center">
                <div className="flex items-center justify-between border-b border-border/50" style={{ padding: '16px 20px' }}>
                    <h3 className="font-bold text-gray-900" style={{ fontSize: 16 }}>Edit Informasi Kontrak</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"><i className="fa-solid fa-xmark" /></button>
                </div>
                <div style={{ padding: 20 }}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Judul Kontrak</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Perjanjian Kerjasama Jasa IT"
                                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">No. Kontrak</label>
                                <input value={contractNo} onChange={e => setContractNo(e.target.value)} placeholder="CTR/2026/..."
                                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-all font-mono" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Tanggal</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Tipe Kontrak</label>
                            <select value={typeId} onChange={e => setTypeId(e.target.value)}
                                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-all">
                                <option value="">Pilih Tipe</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Deskripsi</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Penjelasan singkat kontrak..."
                                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-all resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button onClick={onClose} className="flex-1 py-2.5 border border-border text-sm font-bold rounded-xl hover:bg-muted transition-all">Batal</button>
                        <button onClick={() => onSubmit({ title, contract_no: contractNo, description, contract_date: date, contract_type_id: typeId })}
                            disabled={processing || !title}
                            className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50">
                            {processing ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <i className="fa-solid fa-save mr-2" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmModal({ open, onClose, onConfirm, processing }: { open: boolean, onClose: () => void, onConfirm: () => void, processing: boolean }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden scale-in-center">
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                    <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-trash-can" style={{ fontSize: 24 }} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: 18 }}>Hapus Kontrak?</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">Seluruh data dokumen, riwayat, dan chat terkait kontrak ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
                </div>
                <div className="flex border-t border-border">
                    <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors border-r border-border">Batal</button>
                    <button onClick={onConfirm} disabled={processing} className="flex-1 py-4 text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors">
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
        per_page: 10
    } as PaginatedData<Contract>,
    types: initialTypes = [],
    metrics: initialMetrics = null,
    filters = {}
}: { 
    currentView?: View;
    contracts?: PaginatedData<Contract>;
    types?: ContractType[];
    metrics?: any;
    filters?: any;
}) {
    const { auth, contractId: initialId } = usePage<{ auth: { user: any }; contractId?: string }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;
    const [contractsPaged, setContractsPaged] = useState<PaginatedData<Contract>>(initialContractsPaged);
    const [types, setTypes] = useState<ContractType[]>(initialTypes);
    const [bootLoading, setBootLoading] = useState(initialContractsPaged.data.length === 0 && !initialMetrics);
    const [initialSelected, setInitialSelected] = useState<Contract | null>(null);
    const [metrics, setMetrics] = useState<any>(initialMetrics);

    useEffect(() => {
        if (initialContractsPaged.data.length > 0) {
            setContractsPaged(initialContractsPaged);
        }
    }, [initialContractsPaged]);

    useEffect(() => {
        if (initialContractsPaged.data.length > 0 && initialTypes.length > 0) {
            if (initialId) {
                setInitialSelected(initialContractsPaged.data.find((c: Contract) => c.id === initialId) ?? null);
            }
            return;
        }

        setBootLoading(true);
        Promise.all([
            contractApi.list(),
            contractApi.getTypes(),
            axios.post('/admin/api/reports/data', {}).then(res => res.data).catch(() => null)
        ]).then(([cData, tData, mData]) => {
            setContractsPaged(cData as any);
            setTypes(tData);
            setMetrics(mData);
            if (initialId) {
                setInitialSelected(cData.data.find((c: Contract) => c.id === initialId) ?? null);
            }
            setBootLoading(false);
        }).catch(() => setBootLoading(false));
    }, [initialContractsPaged, initialTypes, initialId]);

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                {bootLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted-foreground)' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary)', marginRight: 12 }} />
                        <span >Memuat data kontrak...</span>
                    </div>
                ) : (
                    <ContractPage 
                        contracts={contractsPaged} 
                        meId={meId} 
                        meUser={meUser} 
                        initialSelected={initialSelected} 
                        types={types} 
                        currentView={currentView} 
                        metrics={metrics}
                        filters={filters}
                    />
                )}
            </ToastProvider>
        </>
    );
}
