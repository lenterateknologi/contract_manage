import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { FileText, Download, Table, Calendar, Users, Filter, Check, ChevronDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/contracts/ui';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/users' },
    { title: 'Laporan & Audit', href: '#' },
];

interface ReportData {
    contracts: any[];
    histories: any[];
    users: { id: string; name: string }[];
    types: { id: string; name: string }[];
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'contracts' | 'audit'>('contracts');
    
    // Filters state
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        contract_type_ids: [] as string[],
        creator_ids: [] as string[],
        involved_ids: [] as string[]
    });

    const fetchData = (currentFilters = filters) => {
        setLoading(true);
        axios.post('/admin/api/reports/data', currentFilters).then(res => {
            setData(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleMultiFilter = (key: string, id: string) => {
        const current = (filters as any)[key] as string[];
        const next = current.includes(id) 
            ? current.filter(x => x !== id)
            : [...current, id];
        handleFilterChange(key, next);
    };

    const applyFilters = () => fetchData();

    const resetFilters = () => {
        const clear = { 
            start_date: '', 
            end_date: '', 
            contract_type_ids: [], 
            creator_ids: [], 
            involved_ids: [] 
        };
        setFilters(clear);
        fetchData(clear);
    };

    const exportCsv = () => {
        const params = new URLSearchParams();
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        filters.contract_type_ids.forEach(id => params.append('contract_type_ids[]', id));
        filters.creator_ids.forEach(id => params.append('creator_ids[]', id));
        filters.involved_ids.forEach(id => params.append('involved_ids[]', id));
        
        const endpoint = activeTab === 'contracts' ? '/admin/api/reports/export' : '/admin/api/reports/audit/export';
        window.location.href = `${endpoint}?${params.toString()}`;
    };

    if (loading && !data) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground p-20">
                <div className="flex items-center gap-2">
                     <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: 24 }} />
                    <span>Menyiapkan laporan & audit trail...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title="Audit & Pelaporan" />
            
            <div className="flex h-full flex-col flex-1 divide-y divide-border overflow-hidden">
                {/* Unified Filter Bar */}
                <div className="px-6 py-4 bg-card border-b border-border shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Periode</label>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="date" 
                                    className="bg-muted/50 border border-border rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                />
                                <span className="text-muted-foreground">—</span>
                                <input 
                                    type="date" 
                                    className="bg-muted/50 border border-border rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                />
                            </div>
                        </div>

                        <MultiSelect 
                            label="Tipe" 
                            options={data?.types || []} 
                            selected={filters.contract_type_ids} 
                            onToggle={(id) => toggleMultiFilter('contract_type_ids', id)}
                            onSelectAll={() => handleFilterChange('contract_type_ids', data?.types.map(t => t.id) || [])}
                            onClearAll={() => handleFilterChange('contract_type_ids', [])}
                        />
                        
                        <MultiSelect 
                            label="Pembuat" 
                            options={data?.users || []} 
                            selected={filters.creator_ids} 
                            onToggle={(id) => toggleMultiFilter('creator_ids', id)}
                            onSelectAll={() => handleFilterChange('creator_ids', data?.users.map(u => u.id) || [])}
                            onClearAll={() => handleFilterChange('creator_ids', [])}
                        />

                        <MultiSelect 
                            label="Terlibat" 
                            options={data?.users || []} 
                            selected={filters.involved_ids} 
                            onToggle={(id) => toggleMultiFilter('involved_ids', id)}
                            onSelectAll={() => handleFilterChange('involved_ids', data?.users.map(u => u.id) || [])}
                            onClearAll={() => handleFilterChange('involved_ids', [])}
                        />

                        <div className="flex items-center gap-2 ml-auto">
                            <Button variant="ghost" className="h-9 text-[10px] font-bold uppercase px-3 hover:bg-muted" onClick={resetFilters}>
                                Reset
                            </Button>
                            <Button className="h-9 text-[10px] font-bold uppercase px-4" onClick={applyFilters}>
                                <Filter className="h-3 w-3 mr-2" />
                                Terapkan Filter
                            </Button>
                            <Button variant="secondary" className="gap-2 h-9 text-[10px] font-bold uppercase px-4" onClick={exportCsv}>
                                <Download className="h-3.5 w-3.5" />
                                Ekspor CSV
                            </Button>
                        </div>
                    </div>

                    {/* Tabs Switcher */}
                    <div className="flex items-center gap-6 border-b border-border/50">
                        <button 
                            className={cn(
                                "pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors relative",
                                activeTab === 'contracts' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setActiveTab('contracts')}
                        >
                            Daftar Kontrak
                            {activeTab === 'contracts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                        <button 
                            className={cn(
                                "pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors relative",
                                activeTab === 'audit' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setActiveTab('audit')}
                        >
                            Jejak Audit (History)
                            {activeTab === 'audit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-background relative flex flex-col">
                    {loading && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
                            <i className="fa-solid fa-spinner fa-spin text-primary text-2xl" />
                        </div>
                    )}

                    {activeTab === 'contracts' ? (
                        <ContractRegistryTable contracts={data?.contracts || []} />
                    ) : (
                        <AuditTrailTable histories={data?.histories || []} />
                    )}
                </div>
            </div>
        </>
    );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function MultiSelect({ label, options, selected, onToggle, onSelectAll, onClearAll }: { 
    label: string, 
    options: any[], 
    selected: string[], 
    onToggle: (id: string) => void,
    onSelectAll?: () => void,
    onClearAll?: () => void
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={ref}>
            <div 
                className={cn(
                    "flex items-center justify-between gap-3 px-3 py-1.5 border rounded-lg cursor-pointer transition-all min-w-[140px] hover:bg-muted/30",
                    selected.length > 0 ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border bg-muted/50"
                )}
                onClick={() => setOpen(!open)}
            >
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none mb-1">{label}</span>
                    <span className="text-xs font-semibold truncate max-w-[100px]">
                        {selected.length === 0 ? 'Semua' : selected.length === options.length ? 'Semua terpilih' : `${selected.length} Item`}
                    </span>
                </div>
                <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>

            {open && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    {/* Search & Bulk Actions */}
                    <div className="p-2 border-b border-border/50 bg-muted/20 space-y-2">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder={`Cari ${label}...`}
                                className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center justify-between px-1">
                            <button 
                                className="text-[10px] font-bold text-primary hover:underline uppercase"
                                onClick={(e) => { e.stopPropagation(); onSelectAll?.(); }}
                            >
                                Pilih Semua
                            </button>
                            <button 
                                className="text-[10px] font-bold text-muted-foreground hover:text-destructive uppercase"
                                onClick={(e) => { e.stopPropagation(); onClearAll?.(); }}
                            >
                                Hapus
                            </button>
                        </div>
                    </div>

                    <div className="p-1 max-h-[250px] overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="py-4 text-center text-[10px] text-muted-foreground italic">
                                Tidak ada hasil
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredOptions.map(opt => (
                                    <div 
                                        key={opt.id} 
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-colors hover:bg-muted/50",
                                            selected.includes(opt.id) && "text-primary bg-primary/5 font-bold"
                                        )}
                                        onClick={() => onToggle(opt.id)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                                            selected.includes(opt.id) ? "bg-primary border-primary text-white" : "border-border"
                                        )}>
                                            {selected.includes(opt.id) && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                                        </div>
                                        {opt.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ContractRegistryTable({ contracts }: { contracts: any[] }) {
    if (contracts.length === 0) return <EmptyState label="kontrak" />;
    return (
        <table className="w-full text-[13px] border-collapse bg-white">
            <thead className="sticky top-0 bg-white border-b-2 border-slate-200 z-10">
                <tr>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">No. Kontrak</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Judul</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Tipe</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Pembuat</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Tgl Dibuat</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500 text-center">Status</th>
                    <th className="text-right font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Usia</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Pending Di</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono text-[11px] text-slate-500 whitespace-nowrap">{c.contract_no}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{c.title}</td>
                        <td className="py-4 px-6 text-slate-600">{c.type || '—'}</td>
                        <td className="py-4 px-6 text-slate-600">{c.creator}</td>
                        <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                            {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-center">
                            <span className="inline-block px-2 py-0.5 border border-slate-300 rounded text-[10px] font-bold uppercase tracking-tight text-slate-700">
                                {c.status}
                            </span>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-slate-600 whitespace-nowrap">{formatRelativeTime(c.created_at)}</td>
                        <td className="py-4 px-6">
                            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                {c.current_step}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function AuditTrailTable({ histories }: { histories: any[] }) {
    if (histories.length === 0) return <EmptyState label="riwayat audit" />;
    return (
        <table className="w-full text-[13px] border-collapse bg-white">
            <thead className="sticky top-0 bg-white border-b-2 border-slate-200 z-10">
                <tr>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Waktu</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Kontrak</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Aksi</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500">Deskripsi</th>
                    <th className="text-left font-bold py-3 px-6 uppercase text-[10px] tracking-widest text-slate-500 border-l border-slate-100">Aktor</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {histories.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                            {new Date(h.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono text-slate-400">{h.contract_no}</span>
                                <span className="text-xs font-bold text-slate-900">{h.contract_title}</span>
                            </div>
                        </td>
                        <td className="py-4 px-6">
                            <span className="text-[11px] font-bold uppercase text-slate-700 tracking-tight">
                                {h.action}
                            </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-[12px] leading-relaxed max-w-sm">{h.description}</td>
                        <td className="py-4 px-6 border-l border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter border-b border-slate-300">
                                    {h.actor}
                                </span>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground py-20 gap-4">
            <FileText className="h-12 w-12 opacity-10" />
            <span className="text-sm font-medium tracking-tight">Tidak ada {label} ditemukan dengan filter ini.</span>
        </div>
    );
}

function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);

    if (diffInDays === 0) {
        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mnt lalu`;
        return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    }
    if (diffInDays === 1) return 'Kemarin';
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} minggu lalu`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} bulan lalu`;
    return `${Math.floor(diffInDays / 365)} tahun lalu`;
}
