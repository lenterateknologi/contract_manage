import React, { useCallback, useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Contract } from '@/types/contracts';
import { contractApi } from '@/lib/contract-api';
import { ToastProvider, useToast } from '@/components/contracts/Toast';
import { Avatar, StatusBadge } from '@/components/contracts/ui';
import CreateContractModal from '@/components/contracts/CreateContractModal';
import FloatingChat from '@/components/contracts/FloatingChat';
import PreviewModal from '@/components/contracts/PreviewModal';
import CompareModal from '@/components/contracts/CompareModal';
import UploadRevisionModal from '@/components/contracts/UploadRevisionModal';
import RejectModal from '@/components/contracts/RejectModal';
import ApprovalSteps from '@/components/contracts/ApprovalSteps';
import ContractChat from '@/components/contracts/ContractChat';

type View = 'dashboard' | 'contracts' | 'pending' | 'audit';

// ─── Table header cell ───────────────────────────────────────────────
function Th({ children }: { children: React.ReactNode }) {
    return (
        <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: '#9ca3af', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
            {children}
        </th>
    );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <td style={{ padding: '11px 14px', fontSize: 12, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }} className={className}>
            {children}
        </td>
    );
}

// ─── Progress ────────────────────────────────────────────────────────
function ProgressCell({ c }: { c: Contract }) {
    const { done, total, pct } = c.progress;
    return (
        <div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>{done}/{total}</div>
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', width: 80 }}>
                <div style={{ height: '100%', background: '#3b82f6', borderRadius: 99, width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────
function ContractPage({ contracts, setContracts, meId, meUser, initialSelected }: {
    contracts: Contract[];
    setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
    meId: string;
    meUser: any;
    initialSelected?: Contract | null;
}) {
    const { showToast } = useToast();
    const [view, setView] = useState<View>('dashboard');
    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    const [detailTab, setDetailTab] = useState<'versions' | 'audit' | 'chat'>('versions');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [approvalNote, setApprovalNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [revOpen, setRevOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewVer, setPreviewVer] = useState<number | null>(null);
    const [compareOpen, setCompareOpen] = useState(false);
    const [compareVer, setCompareVer] = useState<number | null>(null);

    useEffect(() => {
        if (initialSelected) { setSelected(initialSelected); }
    }, [initialSelected?.id]);

    const updateContract = useCallback((c: Contract) => {
        setContracts(prev => prev.map(x => x.id === c.id ? c : x));
        if (selected?.id === c.id) setSelected(c);
    }, [selected?.id, setContracts]);

    const openDetail = (c: Contract) => { setSelected(c); setDetailTab('versions'); setApprovalNote(''); };
    const closeDetail = () => { setSelected(null); setDetailTab('versions'); };

    // Computed
    const stats = {
        total: contracts.length,
        pending: contracts.filter(c => c.approvals.some(a => a.status === 'pending')).length,
        approved: contracts.filter(c => c.status === 'approved').length,
        revision: contracts.filter(c => c.status === 'revision').length,
    };

    const myPending = contracts.flatMap(c =>
        c.approvals.filter(a => a.approver_id === meId && a.status === 'pending').map(a => ({ contract: c, approval: a }))
    );

    const pendingApproval = selected?.approvals.find(a => a.status === 'pending');
    const canApprove = selected?.status === 'in_review' && pendingApproval?.approver_id === meId;

    const filtered = contracts.filter(c => {
        const q = search.toLowerCase();
        const matchQ = !q || c.title.toLowerCase().includes(q) || c.contract_no.toLowerCase().includes(q);
        const matchS = statusFilter === 'all' || c.status === statusFilter;
        return matchQ && matchS;
    });

    // Handlers
    const handleCreate = async (fd: FormData) => {
        setLoading(true);
        try {
            const c = await contractApi.create(fd);
            setContracts(prev => [c, ...prev]);
            showToast('Kontrak berhasil dibuat!', 'success');
        } catch { showToast('Gagal membuat kontrak.', 'danger'); }
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
        const c = await contractApi.uploadRevision(selected.id, fd);
        updateContract(c);
        showToast('Versi baru berhasil diupload!', 'success');
    };

    const handleQuickApprove = async (contractId: string) => {
        try {
            const c = await contractApi.approve(contractId, 'Disetujui.');
            updateContract(c);
            showToast('Berhasil disetujui', 'success');
        } catch { showToast('Gagal approve.', 'danger'); }
    };

    const navTo = (v: View) => { setView(v); closeDetail(); };

    const SL: Record<string, string> = { dashboard: 'Dashboard', contracts: 'Semua Kontrak', pending: 'Menunggu Approval', audit: 'Audit Trail' };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900" style={{ fontSize: 14 }}>

            {/* ══ Sidebar ══ */}
            <aside className="flex-shrink-0 flex flex-col h-screen bg-white border-r border-gray-200" style={{ width: 220 }}>

                {/* Brand */}
                <div className="flex items-center gap-2.5 px-4 border-b border-gray-200" style={{ paddingTop: 14, paddingBottom: 14 }}>
                    <div className="flex items-center justify-center rounded-lg bg-blue-600 text-white flex-shrink-0" style={{ width: 28, height: 28, fontSize: 12 }}>
                        <i className="fa-solid fa-file-contract" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900" style={{ fontSize: 13 }}>CMS</div>
                        <div className="text-gray-400" style={{ fontSize: 10 }}>Contract Management</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ gap: 2 }}>
                    <div className="font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1 pt-1" style={{ fontSize: 10 }}>Menu</div>

                    {([
                        { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
                        { id: 'contracts', icon: 'fa-folder-open', label: 'Semua Kontrak' },
                        { id: 'pending', icon: 'fa-regular fa-clock', label: 'Menunggu Approval', badge: myPending.length },
                    ] as const).map(item => (
                        <a key={item.id}
                            onClick={() => navTo(item.id as View)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                                borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                marginBottom: 2, transition: 'all .15s',
                                background: view === item.id && !selected ? '#eff6ff' : 'transparent',
                                color: view === item.id && !selected ? '#2563eb' : '#6b7280',
                            }}>
                            <i className={`${item.icon.startsWith('fa-regular') ? item.icon : 'fa-solid ' + item.icon} w-4 text-center`} style={{ fontSize: 13 }} />
                            {item.label}
                            {item.badge > 0 && (
                                <span className="ml-auto flex items-center justify-center bg-red-500 text-white font-bold rounded-full" style={{ fontSize: 10, width: 18, height: 18 }}>{item.badge}</span>
                            )}
                        </a>
                    ))}

                    <div className="font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1 pt-3" style={{ fontSize: 10 }}>Laporan</div>
                    <a onClick={() => navTo('audit')} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                        borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 2,
                        background: view === 'audit' && !selected ? '#eff6ff' : 'transparent',
                        color: view === 'audit' && !selected ? '#2563eb' : '#6b7280',
                    }}>
                        <i className="fa-solid fa-chart-bar w-4 text-center" style={{ fontSize: 13 }} />
                        Audit Trail
                    </a>
                </nav>

                {/* User */}
                <div className="flex items-center gap-2 border-t border-gray-200" style={{ padding: '10px 12px' }}>
                    <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold" style={{
                        width: 32, height: 32, fontSize: 11,
                        background: meUser?.bg_color ?? '#dbeafe',
                        color: meUser?.text_color ?? '#1d4ed8',
                    }}>
                        {meUser?.initials ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate" style={{ fontSize: 12 }}>{meUser?.name ?? 'User'}</div>
                        <div className="text-gray-400" style={{ fontSize: 10 }}>{meUser?.role ?? ''}</div>
                    </div>
                    <button onClick={() => router.post('/logout')} title="Logout"
                        className="flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        style={{ width: 28, height: 28 }}>
                        <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 13 }} />
                    </button>
                </div>
            </aside>

            {/* ══ Main ══ */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Topbar */}
                <div className="flex-shrink-0 flex items-center justify-between bg-white border-b border-gray-200" style={{ paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 }}>
                    <span className="font-semibold text-gray-900" style={{ fontSize: 14 }}>
                        {selected ? selected.contract_no : SL[view] ?? 'Dashboard'}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11 }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kontrak..."
                                style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 6, paddingBottom: 9, fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', width: 208 }}
                                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#3b82f6'}
                                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'} />
                        </div>
                        <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                            onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}>
                            <i className="fa-solid fa-plus" style={{ fontSize: 11 }} /> Buat Kontrak
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">

                    {/* ── Dashboard ── */}
                    {view === 'dashboard' && !selected && (
                        <div>
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-3 mb-5">
                                {[
                                    { icon: 'fa-file-lines', label: 'Total Kontrak', value: stats.total, sub: '+3 bulan ini' },
                                    { icon: 'fa-regular fa-clock', label: 'Menunggu Approval', value: stats.pending, sub: `${myPending.length} perlu aksimu` },
                                    { icon: 'fa-circle-check', label: 'Disetujui', value: stats.approved, sub: `${stats.total ? Math.round(stats.approved / stats.total * 100) : 0}% approval rate` },
                                    { icon: 'fa-rotate', label: 'Revisi', value: stats.revision, sub: 'Perlu re-upload' },
                                ].map(s => (
                                    <div key={s.label} className="bg-white border border-gray-200 rounded-xl flex items-center gap-3" style={{ padding: 16 }}>
                                        <div className="flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 flex-shrink-0" style={{ width: 36, height: 36 }}>
                                            <i className={`${s.icon.startsWith('fa-regular') ? s.icon : 'fa-solid ' + s.icon}`} style={{ fontSize: 14 }} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-500" style={{ fontSize: 11 }}>{s.label}</div>
                                            <div className="font-bold leading-tight" style={{ fontSize: 22 }}>{s.value}</div>
                                            <div className="text-gray-400" style={{ fontSize: 10 }}>{s.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent table */}
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                                <div className="flex items-center justify-between border-b border-gray-100" style={{ padding: '12px 16px' }}>
                                    <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13 }}>
                                        <i className="fa-solid fa-list-ul text-gray-400" style={{ fontSize: 12 }} /> Kontrak Terbaru
                                    </span>
                                    <button onClick={() => navTo('contracts')} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        Lihat Semua <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
                                    </button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%' }}>
                                        <thead><tr style={{ background: '#f9fafb' }}>
                                            <Th>No. Kontrak</Th><Th>Judul</Th><Th>Dibuat Oleh</Th>
                                            <Th>Status</Th><Th>Versi</Th><Th>Tgl Dibuat</Th><Th></Th>
                                        </tr></thead>
                                        <tbody>
                                            {contracts.slice(0, 4).map(c => (
                                                <tr key={c.id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}
                                                    onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
                                                    onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                                    <Td><span className="font-mono text-blue-600" style={{ fontSize: 11 }}>{c.contract_no}</span></Td>
                                                    <Td>
                                                        <div className="font-medium" style={{ fontSize: 12 }}>{c.title}</div>
                                                        <div className="text-gray-400" style={{ fontSize: 10, marginTop: 2 }}>{c.description.substring(0, 55)}…</div>
                                                    </Td>
                                                    <Td><div className="flex items-center gap-1.5"><Avatar user={c.creator} size="sm" /><span style={{ fontSize: 11 }}>{c.creator?.name}</span></div></Td>
                                                    <Td><StatusBadge status={c.status} /></Td>
                                                    <Td><span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" style={{ fontSize: 10 }}>v{c.current_version}</span></Td>
                                                    <Td><span className="text-gray-400" style={{ fontSize: 11 }}>{c.created_at}</span></Td>
                                                    <Td>
                                                        <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                                            <i className="fa-solid fa-eye" />
                                                        </button>
                                                    </Td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Bottom row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Bottleneck */}
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 border-b border-gray-100 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                        <i className="fa-solid fa-triangle-exclamation text-gray-400" style={{ fontSize: 12 }} /> Bottleneck Approval
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        {(['Legal', 'Tax', 'Management', 'Direksi']).map(role => {
                                            const p = contracts.filter(c => c.approvals.some(a => a.role === role && a.status === 'pending')).length;
                                            return (
                                                <div key={role} style={{ marginBottom: 12 }}>
                                                    <div className="flex justify-between" style={{ marginBottom: 4 }}>
                                                        <span className="font-medium" style={{ fontSize: 12 }}>{role}</span>
                                                        <span className="text-gray-400" style={{ fontSize: 11 }}>{p} pending</span>
                                                    </div>
                                                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', borderRadius: 99, width: `${p * 25}%`, background: p > 0 ? '#f59e0b' : '#16a34a' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* Status Overview */}
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 border-b border-gray-100 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                        <i className="fa-solid fa-chart-pie text-gray-400" style={{ fontSize: 12 }} /> Status Overview
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        {(['draft', 'in_review', 'revision', 'approved'] as const).map(s => (
                                            <div key={s} className="flex justify-between items-center border-b border-gray-100 last:border-0" style={{ paddingTop: 8, paddingBottom: 8 }}>
                                                <StatusBadge status={s} />
                                                <span className="font-bold" style={{ fontSize: 18 }}>{contracts.filter(c => c.status === s).length}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Contracts ── */}
                    {view === 'contracts' && !selected && (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between border-b border-gray-100" style={{ padding: '12px 16px' }}>
                                <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13 }}>
                                    <i className="fa-solid fa-folder-open text-gray-400" style={{ fontSize: 12 }} /> Semua Kontrak
                                </span>
                                <div className="flex gap-2">
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', outline: 'none', background: '#fff' }}>
                                        <option value="all">Semua Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="in_review">In Review</option>
                                        <option value="revision">Revision</option>
                                        <option value="approved">Approved</option>
                                    </select>
                                    <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                                        onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}>
                                        <i className="fa-solid fa-plus" style={{ fontSize: 11 }} /> Buat Kontrak
                                    </button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%' }}>
                                    <thead><tr style={{ background: '#f9fafb' }}>
                                        <Th>No. Kontrak</Th><Th>Judul</Th><Th>Dibuat Oleh</Th>
                                        <Th>Status</Th><Th>Versi</Th><Th>Progress</Th><Th>Tgl Dibuat</Th><Th></Th>
                                    </tr></thead>
                                    <tbody>
                                        {filtered.map(c => (
                                            <tr key={c.id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}
                                                onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
                                                onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                                <Td><span className="font-mono text-blue-600" style={{ fontSize: 11 }}>{c.contract_no}</span></Td>
                                                <Td>
                                                    <div className="font-medium" style={{ fontSize: 12 }}>{c.title}</div>
                                                    <div className="text-gray-400" style={{ fontSize: 10, marginTop: 2 }}>{c.description.substring(0, 55)}…</div>
                                                </Td>
                                                <Td><div className="flex items-center gap-1.5"><Avatar user={c.creator} size="sm" /><span style={{ fontSize: 11 }}>{c.creator?.name}</span></div></Td>
                                                <Td><StatusBadge status={c.status} /></Td>
                                                <Td><span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" style={{ fontSize: 10 }}>v{c.current_version}</span></Td>
                                                <Td><ProgressCell c={c} /></Td>
                                                <Td><span className="text-gray-400" style={{ fontSize: 11 }}>{c.created_at}</span></Td>
                                                <Td>
                                                    <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                                        <i className="fa-solid fa-eye" />
                                                    </button>
                                                </Td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af', fontSize: 12 }}>Tidak ada kontrak ditemukan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Pending ── */}
                    {view === 'pending' && !selected && (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="border-b border-gray-100 font-semibold flex items-center gap-2" style={{ padding: '12px 16px', fontSize: 13 }}>
                                <i className="fa-regular fa-clock text-gray-400" style={{ fontSize: 12 }} /> Menunggu Approval Saya
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%' }}>
                                    <thead><tr style={{ background: '#f9fafb' }}>
                                        <Th>No. Kontrak</Th><Th>Judul</Th><Th>Role</Th>
                                        <Th>Versi</Th><Th>Sequence</Th><Th>Tgl Dibuat</Th><Th>Aksi</Th>
                                    </tr></thead>
                                    <tbody>
                                        {myPending.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
                                                <i className="fa-solid fa-circle-check" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: '#d1d5db' }} />
                                                <strong style={{ color: '#6b7280', display: 'block', marginBottom: 4 }}>Tidak ada approval pending</strong>
                                                <span style={{ fontSize: 12 }}>Semua sudah ditangani.</span>
                                            </td></tr>
                                        ) : myPending.map(({ contract: c, approval: a }) => (
                                            <tr key={`${c.id}-${a.id}`} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}
                                                onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
                                                onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                                <Td><span className="font-mono text-blue-600" style={{ fontSize: 11 }}>{c.contract_no}</span></Td>
                                                <Td className="font-medium">{c.title}</Td>
                                                <Td><span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" style={{ fontSize: 10 }}>{a.role}</span></Td>
                                                <Td><span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" style={{ fontSize: 10 }}>v{c.current_version}</span></Td>
                                                <Td className="text-gray-500" style={{ fontSize: 11 }}>Seq {a.sequence}</Td>
                                                <Td><span className="text-gray-400" style={{ fontSize: 11 }}>{c.created_at}</span></Td>
                                                <Td>
                                                    <div className="flex gap-1.5">
                                                        <button onClick={e => { e.stopPropagation(); handleQuickApprove(c.id); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                            <i className="fa-solid fa-check" style={{ fontSize: 10 }} /> Setuju
                                                        </button>
                                                        <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                                            <i className="fa-solid fa-eye" />
                                                        </button>
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Audit ── */}
                    {view === 'audit' && !selected && (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between border-b border-gray-100" style={{ padding: '12px 16px' }}>
                                <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13 }}>
                                    <i className="fa-solid fa-chart-bar text-gray-400" style={{ fontSize: 12 }} /> Audit Trail
                                </span>
                                <div className="flex gap-2">
                                    <input type="date" style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', outline: 'none', width: 144 }} />
                                    <input type="date" style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', outline: 'none', width: 144 }} />
                                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                        <i className="fa-solid fa-filter" style={{ fontSize: 11 }} /> Filter
                                    </button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%' }}>
                                    <thead><tr style={{ background: '#f9fafb' }}>
                                        <Th>Waktu</Th><Th>Kontrak</Th><Th>Aksi</Th><Th>Deskripsi</Th><Th>Aktor</Th>
                                    </tr></thead>
                                    <tbody>
                                        {contracts.flatMap(c => c.histories.map(h => ({ ...h, contract: c }))).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((h, i) => (
                                            <tr key={i} onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                                <Td><span className="text-gray-400 whitespace-nowrap" style={{ fontSize: 11 }}>{h.created_at}</span></Td>
                                                <Td>
                                                    <button onClick={() => openDetail(h.contract)} style={{ fontFamily: 'monospace', fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>{h.contract.contract_no}</button>
                                                </Td>
                                                <Td><span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" style={{ fontSize: 10 }}>{h.action}</span></Td>
                                                <Td style={{ fontSize: 12 }}>{h.description}</Td>
                                                <Td><div className="flex items-center gap-1.5"><Avatar user={h.actor} size="sm" /><span style={{ fontSize: 11 }}>{h.actor?.name}</span></div></Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Detail ── */}
                    {selected && (
                        <div>
                            {/* Breadcrumb */}
                            <nav className="flex items-center gap-1.5 text-gray-400" style={{ fontSize: 11, marginBottom: 16 }}>
                                <a style={{ color: '#2563eb', cursor: 'pointer' }} onClick={closeDetail}>Kontrak</a>
                                <i className="fa-solid fa-chevron-right text-gray-300" style={{ fontSize: 9 }} />
                                <span className="text-gray-600">{selected.contract_no}</span>
                            </nav>

                            {/* Header */}
                            <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                                <div>
                                    <h2 className="font-bold text-gray-900" style={{ fontSize: 16 }}>{selected.title}</h2>
                                    <p className="text-gray-400" style={{ fontSize: 11, marginTop: 2 }}>{selected.contract_no} · {selected.status.replace('_', ' ').toUpperCase()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDownload(selected.id, selected.versions.find(v => v.version_no === selected.current_version)?.file_name)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                        <i className="fa-solid fa-download" style={{ fontSize: 11 }} /> Download
                                    </button>
                                    {['draft', 'revision'].includes(selected.status) && (
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
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="flex items-center gap-2 border-b border-gray-100 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                            <i className="fa-solid fa-circle-info text-gray-400" style={{ fontSize: 12 }} /> Informasi Kontrak
                                        </div>
                                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            {[
                                                { k: 'No. Kontrak', v: <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded" style={{ fontSize: 11 }}>{selected.contract_no}</span> },
                                                { k: 'Status', v: <StatusBadge status={selected.status} /> },
                                                { k: 'Dibuat Oleh', v: <div className="flex items-center gap-1.5"><Avatar user={selected.creator} size="sm" /><span style={{ fontSize: 12 }}>{selected.creator?.name}</span></div> },
                                                { k: 'Versi Aktif', v: <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" style={{ fontSize: 10 }}>v{selected.current_version}</span> },
                                                { k: 'Tgl Dibuat', v: <span style={{ fontSize: 12 }}>{selected.created_at}</span> },
                                                { k: 'Total Versi', v: <span style={{ fontSize: 12 }}>{selected.versions.length} versi</span> },
                                            ].map(({ k, v }) => (
                                                <div key={k}>
                                                    <div className="font-semibold uppercase tracking-wider text-gray-400" style={{ fontSize: 10, marginBottom: 4 }}>{k}</div>
                                                    {v}
                                                </div>
                                            ))}
                                            <div style={{ gridColumn: '1/-1' }}>
                                                <div className="font-semibold uppercase tracking-wider text-gray-400" style={{ fontSize: 10, marginBottom: 4 }}>Deskripsi</div>
                                                <div style={{ fontSize: 12 }}>{selected.description}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs Card */}
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="flex border-b border-gray-200 px-4 pt-2 gap-1">
                                            {([
                                                { id: 'versions', icon: 'fa-clock-rotate-left', label: 'Riwayat Versi' },
                                                { id: 'audit', icon: 'fa-list-check', label: 'Audit Trail' },
                                                {
                                                    id: 'chat', icon: 'fa-comments', label: 'Diskusi',
                                                    badge: (selected.messages ?? []).filter(m => !m.read_by.includes(meId)).length
                                                },
                                            ] as const).map(tab => (
                                                <button key={tab.id} onClick={() => setDetailTab(tab.id as any)} style={{
                                                    fontSize: 12, fontWeight: 500, padding: '8px 12px',
                                                    borderBottom: detailTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                                                    color: detailTab === tab.id ? '#2563eb' : '#6b7280',
                                                    background: 'none', border: 'none', borderBottom: detailTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1,
                                                    transition: 'color .15s',
                                                }}>
                                                    <i className={`fa-solid ${tab.icon}`} /> {tab.label}
                                                    {tab.badge > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#2563eb', color: '#fff', padding: '1px 6px', borderRadius: 99, lineHeight: 1.4 }}>{tab.badge}</span>}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ padding: 16 }}>

                                            {/* Versions tab */}
                                            {detailTab === 'versions' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {[...selected.versions].reverse().map(v => (
                                                        <div key={v.version_no} style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            border: v.version_no === selected.current_version ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                                                            background: v.version_no === selected.current_version ? '#eff6ff' : '#fff',
                                                            borderRadius: 8, padding: '10px 12px', transition: 'border-color .15s',
                                                        }}>
                                                            <div>
                                                                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                                                    <span className="font-mono font-bold text-blue-600" style={{ fontSize: 12 }}>v{v.version_no}</span>
                                                                    {v.is_final && <StatusBadge status="approved" label="Final" />}
                                                                    {v.version_no === selected.current_version && <StatusBadge status="in_review" label="Aktif" />}
                                                                </div>
                                                                <div className="text-gray-400" style={{ fontSize: 10 }}><i className="fa-regular fa-file-word mr-1" />{v.file_name}</div>
                                                                <div className="text-gray-400" style={{ fontSize: 10 }}><i className="fa-solid fa-fingerprint mr-1" />{v.file_hash}</div>
                                                                <div className="text-gray-400" style={{ fontSize: 10 }}>{v.change_log} · {v.created_at}</div>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 12, flexShrink: 0 }}>
                                                                <button onClick={() => { setPreviewVer(v.version_no); setPreviewOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                                                    <i className="fa-solid fa-eye" /> Preview
                                                                </button>
                                                                {selected.versions.length > 1 && (
                                                                    <button onClick={() => { setCompareVer(v.version_no); setCompareOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, border: '1px solid #ddd6fe', borderRadius: 6, background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer' }}>
                                                                        <i className="fa-solid fa-code-compare" /> Compare
                                                                    </button>
                                                                )}
                                                                <a href={contractApi.downloadUrl(selected.id)} download style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, background: 'none', cursor: 'pointer', textDecoration: 'none', color: '#374151' }}>
                                                                    <i className="fa-solid fa-download" /> Unduh
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Audit tab */}
                                            {detailTab === 'audit' && (
                                                <div>
                                                    {[...selected.histories].reverse().map((h, i) => {
                                                        const colors: Record<string, string> = { CONTRACT_CREATED: '#8b5cf6', FILE_UPLOADED: '#2563eb', APPROVAL_APPROVED: '#16a34a', APPROVAL_REJECTED: '#dc2626', CONTRACT_APPROVED: '#16a34a' };
                                                        return (
                                                            <div key={i} className="flex gap-2.5 border-b border-gray-100 last:border-0" style={{ paddingTop: 8, paddingBottom: 8 }}>
                                                                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: colors[h.action] ?? '#9ca3af' }} />
                                                                <div>
                                                                    <div className="font-medium" style={{ fontSize: 12 }}>{h.description}</div>
                                                                    <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: 11, marginTop: 2 }}>
                                                                        <Avatar user={h.actor} size="sm" /> {h.actor?.name} · {h.actor?.role}
                                                                    </div>
                                                                    <div className="text-gray-400" style={{ fontSize: 10, marginTop: 2 }}>{h.created_at}</div>
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
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="flex items-center gap-2 border-b border-gray-100 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                            <i className="fa-solid fa-arrow-right-arrow-left text-gray-400" style={{ fontSize: 12 }} /> Alur Approval
                                        </div>
                                        <div style={{ padding: 16 }}>
                                            <ApprovalSteps approvals={selected.approvals} />
                                        </div>
                                    </div>

                                    {/* Action Card — only shown if there's a pending approval */}
                                    {pendingApproval && (
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="flex items-center gap-2 border-b border-gray-100 font-semibold" style={{ padding: '12px 16px', fontSize: 13 }}>
                                                <i className="fa-solid fa-bolt text-gray-400" style={{ fontSize: 12 }} /> Aksi Approval
                                            </div>
                                            <div style={{ padding: 16 }}>
                                                {canApprove ? (
                                                    <>
                                                        <p className="text-gray-500" style={{ fontSize: 12, marginBottom: 12 }}>Kamu adalah approver berikutnya untuk kontrak ini.</p>
                                                        <div style={{ marginBottom: 12 }}>
                                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Catatan</label>
                                                            <textarea value={approvalNote} onChange={e => setApprovalNote(e.target.value)} rows={3} placeholder="Tambahkan catatan..."
                                                                style={{ width: '100%', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={handleApprove} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                                <i className="fa-solid fa-check" style={{ fontSize: 11 }} /> Setujui
                                                            </button>
                                                            <button onClick={() => setRejectOpen(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                                <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} /> Tolak
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-400 text-center" style={{ fontSize: 12, padding: '8px 0' }}>
                                                        Menunggu approval dari <strong>{pendingApproval.approver?.name}</strong>
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
            </div>

            {/* ── Modals ── */}
            <CreateContractModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />
            <UploadRevisionModal open={revOpen} onClose={() => setRevOpen(false)} onSubmit={handleRevision} />
            <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={handleReject} />
            <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} contract={selected} versionNo={previewVer} />
            <CompareModal open={compareOpen} onClose={() => setCompareOpen(false)} contract={selected} initialVersion={compareVer} />

            {/* ── Floating Chat ── */}
            <FloatingChat contracts={contracts} meId={meId} onContractUpdated={updateContract} />
        </div>
    );
}

// ─── Page Entry ──────────────────────────────────────────────────────
export default function ContractsIndex() {
    const { auth, contractId: initialId } = usePage<{ auth: { user: any }; contractId?: string }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [bootLoading, setBootLoading] = useState(true);
    const [initialSelected, setInitialSelected] = useState<Contract | null>(null);

    useEffect(() => {
        contractApi.list().then(data => {
            setContracts(data);
            if (initialId) {
                setInitialSelected(data.find(c => c.id === initialId) ?? null);
            }
            setBootLoading(false);
        }).catch(() => setBootLoading(false));
    }, []);

    return (
        <>
            <Head title="Contract Manager" />
            <ToastProvider>
                {bootLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: '#60a5fa', marginRight: 12 }} />
                        <span style={{ fontSize: 14 }}>Memuat data kontrak...</span>
                    </div>
                ) : (
                    <ContractPage contracts={contracts} setContracts={setContracts} meId={meId} meUser={meUser} initialSelected={initialSelected} />
                )}
            </ToastProvider>
        </>
    );
}
