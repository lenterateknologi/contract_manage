import React, { useCallback, useEffect, useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Contract, ContractType } from '@/types/contracts';
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
import ContractAttachments from '@/components/contracts/ContractAttachments';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

type View = 'dashboard' | 'contracts' | 'pending' | 'audit' | 'f1' | 'f2' | 'profile';

// ─── Table header cell ───────────────────────────────────────────────
function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', ...style }}>
            {children}
        </th>
    );
}
function Td({ children, className, style }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return (
        <td style={{ padding: '11px 14px', fontSize: 14, borderBottom: '1px solid var(--border)', verticalAlign: 'middle', ...style }} className={className}>
            {children}
        </td>
    );
}

// ─── Progress ────────────────────────────────────────────────────────
function ProgressCell({ c }: { c: Contract }) {
    const { done, total, pct } = c.progress;
    return (
        <div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>{done}/{total}</div>
            <div style={{ height: 4, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden', width: 80 }}>
                <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 99, width: `${pct}%` }} />
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
function ContractPage({ contracts, setContracts, meId, meUser, initialSelected, types, currentView }: {
    contracts: Contract[];
    setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
    meId: string;
    meUser: any;
    initialSelected?: Contract | null;
    types: ContractType[];
    currentView: View;
}) {
    const { showToast } = useToast();
    const [view, setView] = useState<View>(currentView);

    useEffect(() => {
        if (currentView) {
            setView(currentView);
            setSelected(null);
        }
    }, [currentView]);

    const [selected, setSelected] = useState<Contract | null>(initialSelected ?? null);
    const [detailTab, setDetailTab] = useState<'f1' | 'f2' | 'attachments' | 'audit' | 'chat'>('f1');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [approvalNote, setApprovalNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [revOpen, setRevOpen] = useState(false);
    const [revType, setRevType] = useState<'contract' | 'f1' | 'f2'>('f1');
    const [rejectOpen, setRejectOpen] = useState(false);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewHasFile, setPreviewHasFile] = useState(false);

    const [compareOpen, setCompareOpen] = useState(false);
    const [compareVer, setCompareVer] = useState<number | null>(null);
    const [compareType, setCompareType] = useState<'contract' | 'f1' | 'f2'>('contract');

    useEffect(() => {
        if (initialSelected) { setSelected(initialSelected); }
    }, [initialSelected?.id]);

    const updateContract = useCallback((c: Contract) => {
        setContracts(prev => prev.map(x => x.id === c.id ? c : x));
        if (selected?.id === c.id) setSelected(c);
    }, [selected?.id, setContracts]);

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
        c.approvals.filter(a => a.approver_id === meId && a.status === 'pending').map(a => ({ contract: c, approval: a }))
    );

    const pendingApproval = selected?.approvals.find(a => a.status === 'pending');
    const canApprove = selected?.status === 'in_review' && pendingApproval?.approver_id === meId;

    const filtered = contracts.filter(c => {
        const q = search.toLowerCase();
        const matchQ = !q || c.title.toLowerCase().includes(q) || c.contract_no.toLowerCase().includes(q);
        const matchS = statusFilter === 'all' || c.status === statusFilter;
        let matchV = true;
        if (view === 'f1') matchV = c.versions.some(v => v.document_type === 'f1');
        if (view === 'f2') matchV = c.versions.some(v => v.document_type === 'f2');
        if (view === 'pending') matchV = c.approvals.some(a => a.approver_id === meId && a.status === 'pending');
        return matchQ && matchS && matchV;
    });

    // Handlers
    const handleCreate = async (fd: FormData) => {
        setLoading(true);
        try {
            const c = await contractApi.create(fd);
            setContracts(prev => [c, ...prev]);
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
        try {
            const c = await contractApi.send(selected.id);
            updateContract(c);
            showToast('Kontrak berhasil dikirim untuk approval!', 'success');
        } catch { showToast('Gagal mengirim kontrak.', 'danger'); }
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

    const SL: Record<string, string> = { dashboard: 'Dashboard', contracts: 'Semua Kontrak', pending: 'Menunggu Approval', audit: 'Audit Trail', f1: 'Form F1', f2: 'Form F2', profile: 'Profil Saya' };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: SL[view] || 'Dashboard', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={SL[view]} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* ── View Content ── */}
                {/* ── Profile ── */}
                {view === 'profile' && !selected && (
                    <ProfileView meUser={meUser} showToast={showToast} />
                )}

                {/* ── Dashboard ── */}
                {view === 'dashboard' && !selected && (
                    <div>
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-3 mb-5">
                            {[
                                { icon: 'fa-file-lines', label: 'Total Kontrak', value: stats.total, sub: `+ ${stats.monthCount} bulan ini` },
                                { icon: 'fa-regular fa-clock', label: 'Menunggu Approval', value: stats.pending, sub: `${myPending.length} perlu aksimu` },
                                { icon: 'fa-circle-check', label: 'Disetujui', value: stats.approved, sub: `${stats.total ? Math.round(stats.approved / stats.total * 100) : 0}% approval rate` },
                                { icon: 'fa-rotate', label: 'Revisi', value: stats.revision, sub: `${stats.revision} kontrak perlu revisi` },
                            ].map(s => (
                                <div key={s.label} className="bg-card border border-border rounded-xl flex items-center gap-3" style={{ padding: 16 }}>
                                    <div className="flex items-center justify-center rounded-lg border border-border text-muted-foreground flex-shrink-0" style={{ width: 36, height: 36 }}>
                                        <i className={`${s.icon.startsWith('fa-regular') ? s.icon : 'fa-solid ' + s.icon}`} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground" style={{ fontSize: 12 }}>{s.label}</div>
                                        <div className="font-bold leading-tight" style={{ fontSize: 22 }}>{s.value}</div>
                                        <div className="text-muted-foreground" style={{ fontSize: 12 }}>{s.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent table */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
                            <div className="flex items-center justify-between border-b border-border/50" style={{ padding: '12px 16px' }}>
                                <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13 }}>
                                    <i className="fa-solid fa-list-ul text-muted-foreground" style={{ fontSize: 12 }} /> Kontrak Terbaru
                                </span>
                                <button onClick={() => navTo('contracts')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    Lihat Semua <i className="fa-solid fa-arrow-right" style={{ fontSize: 12 }} />
                                </button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%' }}>
                                    <thead><tr style={{ background: 'var(--muted)' }}>
                                        <Th>No. Kontrak</Th><Th>Judul</Th><Th>Dibuat Oleh</Th>
                                        <Th>Status</Th><Th>Versi</Th><Th>Tgl Dibuat</Th><Th></Th>
                                    </tr></thead>
                                    <tbody>
                                        {contracts.slice(0, 4).map(c => (
                                            <tr key={c.id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}
                                                onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--muted)'}
                                                onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                                <Td><span style={{ fontSize: 12 }}>{c.contract_no}</span></Td>
                                                <Td>
                                                    <div className="font-medium" style={{ fontSize: 12 }}>{c.title}</div>
                                                    <div className="text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>{c.description.substring(0, 55)}…</div>
                                                </Td>
                                                <Td><div className="flex items-center gap-1.5"><Avatar user={c.creator} size="sm" /><span style={{ fontSize: 12 }}>{c.creator?.name}</span></div></Td>
                                                <Td><StatusBadge status={c.status} /></Td>
                                                <Td><span className="font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded" style={{ fontSize: 12 }}>v{c.current_version}</span></Td>
                                                <Td><span className="text-muted-foreground" style={{ fontSize: 12 }}>{c.created_at}</span></Td>
                                                <Td>
                                                    <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
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

                {/* ── Contracts ── */}
                {(view === 'contracts' || view === 'f1' || view === 'f2') && !selected && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border/50" style={{ padding: '12px 16px' }}>
                            <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13 }}>
                                <i className={`fa-solid ${view === 'f1' ? 'fa-file-lines' : (view === 'f2' ? 'fa-file-shield' : 'fa-folder-open')} text-muted-foreground`} style={{ fontSize: 12 }} /> {(SL as any)[view]}
                            </span>
                            <div className="flex gap-2">
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', outline: 'none', background: 'var(--card)' }}>
                                    <option value="all">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="in_review">In Review</option>
                                    <option value="revision">Revision</option>
                                    <option value="approved">Approved</option>
                                </select>
                                <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                                    onMouseOver={e => (e.currentTarget.style.background = 'var(--primary)')} onMouseOut={e => (e.currentTarget.style.background = 'var(--primary)')}>
                                    <i className="fa-solid fa-plus" style={{ fontSize: 12 }} /> Buat Kontrak
                                </button>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%' }}>
                                <thead><tr style={{ background: 'var(--muted)' }}>
                                    <Th>No. Kontrak</Th><Th>Judul</Th><Th>Tgl Kontrak</Th><Th>Tipe</Th><Th>Status</Th><Th>Versi</Th><Th>Progress</Th><Th></Th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c.id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}
                                            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--muted)'}
                                            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                            <Td><span style={{ fontSize: 12 }}>{c.contract_no}</span></Td>
                                            <Td>
                                                <div className="font-medium" style={{ fontSize: 12 }}>{c.title}</div>
                                                <div className="text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>{c.creator?.name} · {c.created_at}</div>
                                            </Td>
                                            <Td><span className="text-muted-foreground font-medium" style={{ fontSize: 12 }}>{c.contract_date || '—'}</span></Td>
                                            <Td><span className="px-2 py-0.5 bg-muted rounded text-muted-foreground" style={{ fontSize: 12 }}>{c.contract_type || '—'}</span></Td>
                                            <Td><StatusBadge status={c.status} /></Td>
                                            <Td><span className="font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded" style={{ fontSize: 12 }}>v{c.current_version}</span></Td>
                                            <Td><ProgressCell c={c} /></Td>
                                            <Td>
                                                <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                                    <i className="fa-solid fa-eye" />
                                                </button>
                                            </Td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--muted-foreground)', fontSize: 12 }}>Tidak ada kontrak ditemukan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Pending ── */}
                {view === 'pending' && !selected && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="border-b border-border/50 font-semibold flex items-center gap-2" style={{ padding: '12px 16px', fontSize: 13 }}>
                            <i className="fa-regular fa-clock text-muted-foreground" style={{ fontSize: 12 }} /> Menunggu Approval Saya
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%' }}>
                                <thead><tr style={{ background: 'var(--muted)' }}>
                                    <Th>No. Kontrak</Th><Th>Judul</Th><Th>Role</Th>
                                    <Th>Versi</Th><Th>Sequence</Th><Th>Tgl Dibuat</Th><Th>Aksi</Th>
                                </tr></thead>
                                <tbody>
                                    {myPending.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--muted-foreground)' }}>
                                            <i className="fa-solid fa-circle-check" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: 'var(--muted-foreground)' }} />
                                            <strong style={{ color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>Tidak ada approval pending</strong>
                                            <span style={{ fontSize: 12 }}>Semua sudah ditangani.</span>
                                        </td></tr>
                                    ) : myPending.map(({ contract: c, approval: a }) => (
                                        <tr key={`${c.id}-${a.id}`} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }}
                                            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--muted)'}
                                            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                            <Td><span style={{ fontSize: 12 }}>{c.contract_no}</span></Td>
                                            <Td className="font-medium">{c.title}</Td>
                                            <Td><span className="font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded" style={{ fontSize: 12 }}>{a.role}</span></Td>
                                            <Td><span className="font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded" style={{ fontSize: 12 }}>v{c.current_version}</span></Td>
                                            <Td className="text-muted-foreground" style={{ fontSize: 12 }}>Seq {a.sequence}</Td>
                                            <Td><span className="text-muted-foreground" style={{ fontSize: 12 }}>{c.created_at}</span></Td>
                                            <Td>
                                                <div className="flex gap-1.5">
                                                    <button onClick={e => { e.stopPropagation(); handleQuickApprove(c.id); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                                                        <i className="fa-solid fa-check" style={{ fontSize: 12 }} /> Setuju
                                                    </button>
                                                    <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
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
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border/50" style={{ padding: '12px 16px' }}>
                            <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13 }}>
                                <i className="fa-solid fa-chart-bar text-muted-foreground" style={{ fontSize: 12 }} /> Audit Trail
                            </span>
                            <div className="flex gap-2">
                                <input type="date" style={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', outline: 'none', width: 144 }} />
                                <input type="date" style={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', outline: 'none', width: 144 }} />
                                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                    <i className="fa-solid fa-filter" style={{ fontSize: 12 }} /> Filter
                                </button>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%' }}>
                                <thead><tr style={{ background: 'var(--muted)' }}>
                                    <Th>Waktu</Th><Th>Kontrak</Th><Th>Aksi</Th><Th>Deskripsi</Th><Th>Aktor</Th>
                                </tr></thead>
                                <tbody>
                                    {contracts.flatMap(c => c.histories.map(h => ({ ...h, contract: c }))).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((h, i) => (
                                        <tr key={i} onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'var(--muted)'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}>
                                            <Td><span className="text-muted-foreground whitespace-nowrap" style={{ fontSize: 12 }}>{h.created_at}</span></Td>
                                            <Td>
                                                <button onClick={() => openDetail(h.contract)} style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>{h.contract.contract_no}</button>
                                            </Td>
                                            <Td><span className="font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded" style={{ fontSize: 12 }}>{h.action}</span></Td>
                                            <Td style={{ fontSize: 12 }}>{h.description}</Td>
                                            <Td><div className="flex items-center gap-1.5"><Avatar user={h.actor} size="sm" /><span style={{ fontSize: 12 }}>{h.actor?.name}</span></div></Td>
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
                        <nav className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12, marginBottom: 16 }}>
                            <a style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={closeDetail}>Kontrak</a>
                            <i className="fa-solid fa-chevron-right text-gray-300" style={{ fontSize: 12 }} />
                            <span className="text-muted-foreground">{selected.contract_no}</span>
                        </nav>

                        {/* Header */}
                        <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                            <div>
                                <h2 className="font-bold text-foreground" style={{ fontSize: 16 }}>{selected.title}</h2>
                                <p className="text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>{selected.contract_no} · {selected.status.replace('_', ' ').toUpperCase()}</p>
                            </div>

                        </div>
                        {/* Header */}
                        <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                            <div>
                                <h2 className="font-bold text-gray-900" style={{ fontSize: 16 }}>{selected.title}</h2>
                                <p className="text-gray-400" style={{ fontSize: 11, marginTop: 2 }}>{selected.contract_no} · {selected.status.replace('_', ' ').toUpperCase()}</p>
                            </div>
                            <div className="flex gap-2">
                                {selected.status === 'draft' && (
                                    <button onClick={handleSendForApproval} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                                        onMouseOver={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}>
                                        <i className="fa-solid fa-paper-plane" style={{ fontSize: 11 }} /> Kirim
                                    </button>
                                )}
                                <button onClick={() => handleDownload(selected.id, selected.versions.find(v => v.version_no === selected.current_version)?.file_name)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                    <i className="fa-solid fa-download" style={{ fontSize: 11 }} /> Download
                                </button>
                                <button onClick={() => setRevOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, borderRadius: 6, background: 'none', cursor: 'pointer', color: '#374151' }}>
                                    <i className="fa-solid fa-upload" style={{ fontSize: 11 }} /> Upload Revisi
                                </button>
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
                                {pendingApproval && (
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

            {/* ── Modals ── */}
            <CreateContractModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} types={types} />
            <UploadRevisionModal open={revOpen} onClose={() => setRevOpen(false)} onSubmit={handleRevision} initialType={revType} />
            <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={handleReject} />
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

        </AppLayout>
    );
}

// ─── Page Entry ──────────────────────────────────────────────────────
export default function ContractsIndex({ currentView = 'dashboard' }: { currentView?: View }) {
    const { auth, contractId: initialId } = usePage<{ auth: { user: any }; contractId?: string }>().props;
    const meId = auth?.user?.id ?? '';
    const meUser = auth?.user ?? null;
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [types, setTypes] = useState<ContractType[]>([]);
    const [bootLoading, setBootLoading] = useState(true);
    const [initialSelected, setInitialSelected] = useState<Contract | null>(null);

    useEffect(() => {
        Promise.all([contractApi.list(), contractApi.getTypes()]).then(([cData, tData]) => {
            setContracts(cData);
            setTypes(tData);
            if (initialId) {
                setInitialSelected(cData.find((c: Contract) => c.id === initialId) ?? null);
            }
            setBootLoading(false);
        }).catch(() => setBootLoading(false));
    }, []);

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
                    <ContractPage contracts={contracts} setContracts={setContracts} meId={meId} meUser={meUser} initialSelected={initialSelected} types={types} currentView={currentView} />
                )}
            </ToastProvider>
        </>
    );
}
