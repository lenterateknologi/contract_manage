import { Button } from '@/components/ui/buttons/Button';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import React from 'react';

interface UserResolvedPolicyViewProps {
    record: any;
    returnUrl?: string | null;
    resourceSlug: string;
    onEditProfile: () => void;
}

export function UserResolvedPolicyView({
    record,
    returnUrl,
    resourceSlug,
    onEditProfile,
}: UserResolvedPolicyViewProps) {
    const policy = record?.resolved_policy;
    if (!policy) return null;

    const activeTabs = [
        policy.show_overview && 'Overview Kontrak & Metrik',
        policy.show_overview_contract && 'Overview Kontrak',
        policy.show_overview_non_contract && 'Overview Non-Kontrak',
        policy.show_overview_nda && 'Overview NDA',
        policy.show_workload && 'Workload Tim & Approval',
        policy.show_master_data && 'Master Data Terkait',
    ].filter(Boolean);

    const categories = (policy.categories || []).map((cat: string) => {
        if (cat === 'contract') return 'Kontrak (Contract)';
        if (cat === 'non-contract') return 'Non-Kontrak';
        if (cat === 'nda') return 'Kerahasiaan (NDA)';
        return cat;
    });

    return (
        <div className="animate-in fade-in flex min-h-0 flex-1 flex-col overflow-hidden duration-200">
            <div className="flex-1 [scrollbar-width:none] space-y-4 overflow-y-auto p-6 pb-8 [&::-webkit-scrollbar]:hidden">
                {/* User Context Header Banner */}
                <div className="border-primary/20 from-primary/5 via-surface-base to-surface-muted/30 flex flex-col justify-between gap-3 rounded-xl border bg-gradient-to-r p-4 shadow-2xs md:flex-row md:items-center">
                    <div className="flex items-center gap-3.5">
                        <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs">
                            {(record.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-text-main text-sm font-bold">{record.name}</h3>
                                <span className="bg-primary/10 text-primary border-primary/20 rounded-md border px-2 py-0.5 text-[10px] font-bold">
                                    {record.roleRelation?.name || record.role || 'User'}
                                </span>
                                {record.division?.name && (
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        Divisi: {record.division.name}
                                    </span>
                                )}
                                {record.department?.name && (
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        Dept: {record.department.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-text-muted mt-0.5 text-[11px]">
                                NIK: {record.nik || '-'} &bull; Email: {record.email || '-'} &bull; Perusahaan:{' '}
                                {record.company_name || '-'}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 md:self-center">
                        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {policy.dashboard_type_name}
                        </span>
                    </div>
                </div>

                {/* Compact Policy Grid */}
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                    {/* Card 1: Profil & Visibilitas Dashboard */}
                    <div className="border-surface-border bg-surface-base flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-2xs">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                    <LucideIcons.LayoutDashboard size={13} className="text-primary" /> Profil Dashboard
                                </span>
                                <span className="py-0.2 rounded bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    Aktif
                                </span>
                            </div>
                            <div>
                                <h4 className="text-text-main text-xs leading-snug font-bold">
                                    {policy.dashboard_type_name}
                                </h4>
                                <p className="text-text-muted mt-1 text-[11px] leading-relaxed">
                                    {policy.dashboard_type_description}
                                </p>
                            </div>
                        </div>

                        {activeTabs.length > 0 && (
                            <div className="border-surface-border/60 border-t pt-2.5">
                                <span className="text-text-muted mb-1.5 block text-[10px] font-semibold">
                                    Visibilitas Tab Aktif:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {activeTabs.map((tab: string) => (
                                        <span
                                            key={tab}
                                            className="rounded border border-blue-200/80 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                        >
                                            {tab}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Cakupan Organisasi (Dynamic Scope) */}
                    <div className="border-surface-border bg-surface-base flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-2xs">
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                    <LucideIcons.ShieldCheck size={13} className="text-primary" /> Cakupan Organisasi
                                </span>
                                <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    Dynamic Scope
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="border-surface-border/50 flex items-center justify-between border-b py-1">
                                    <span className="text-text-muted text-[11px]">Cakupan Divisi:</span>
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold',
                                            policy.scope_to_user_division
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-emerald-600 dark:text-emerald-400',
                                        )}
                                    >
                                        {policy.scope_to_user_division
                                            ? `Terkunci (${record.division?.name || 'Divisi User'})`
                                            : 'Lintas Divisi (Bebas)'}
                                    </span>
                                </div>
                                <div className="border-surface-border/50 flex items-center justify-between border-b py-1">
                                    <span className="text-text-muted text-[11px]">Cakupan Dept:</span>
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold',
                                            policy.scope_to_user_department
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-emerald-600 dark:text-emerald-400',
                                        )}
                                    >
                                        {policy.scope_to_user_department
                                            ? `Terkunci (${record.department?.name || 'Dept User'})`
                                            : 'Semua Dept di Divisi'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-text-muted text-[11px]">Cakupan PT/Group:</span>
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold',
                                            policy.scope_to_user_company
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-emerald-600 dark:text-emerald-400',
                                        )}
                                    >
                                        {policy.scope_to_user_company ? 'Terkunci PT Sendiri' : 'Lintas Perusahaan'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Filter Dokumen & Pengajuan */}
                    <div className="border-surface-border bg-surface-base flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-2xs">
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                    <LucideIcons.FileText size={13} className="text-primary" /> Filter Pengajuan Dokumen
                                </span>
                                <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    Filter
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-text-muted mb-1 block text-[10.5px]">
                                        Kategori Dokumen Terbuka:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {categories.map((cat: string) => (
                                            <span
                                                key={cat}
                                                className="bg-primary/10 text-primary border-primary/20 rounded border px-2 py-0.5 text-[10px] font-semibold"
                                            >
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-surface-border/50 flex items-center justify-between border-t pt-2 text-xs">
                                    <span className="text-text-muted text-[11px]">Tipe Dokumen:</span>
                                    <span className="text-text-main text-[11px] font-semibold">
                                        {policy.contract_type_ids?.length > 0
                                            ? `${policy.contract_type_ids.length} Tipe Dokumen Terpilih`
                                            : 'Semua Tipe Dokumen'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informational Callout */}
                <div className="border-surface-border/80 bg-surface-muted/30 flex items-center gap-3 rounded-xl border p-3.5">
                    <LucideIcons.Info size={16} className="text-primary shrink-0" />
                    <p className="text-text-muted text-[11px] leading-relaxed">
                        Pengaturan kebijakan dashboard ini dihitung secara dinamis oleh sistem berdasarkan matriks Role dan
                        Divisi pengguna. Untuk menyesuaikan otoritas, Anda dapat mengubah <strong>Role</strong> atau{' '}
                        <strong>Divisi</strong> pada Tab Profil, atau mengubah matriks di menu{' '}
                        <Link href="/admin/core/dashboard-types" className="text-primary font-semibold hover:underline">
                            Tipe Dashboard
                        </Link>
                        .
                    </p>
                </div>
            </div>

            {/* Tab 2 Footer */}
            <div className="border-surface-border bg-surface-muted/30 flex shrink-0 items-center justify-between gap-3 border-t px-6 py-3.5">
                <Link href={returnUrl || `/admin/core/${resourceSlug}`}>
                    <Button type="button" variant="white" className="border-surface-border h-9 rounded-xl text-xs">
                        Kembali ke Registri Pengguna
                    </Button>
                </Link>
                <Button
                    type="button"
                    variant="primary"
                    onClick={onEditProfile}
                    className="h-9 gap-1.5 rounded-xl text-xs"
                >
                    <LucideIcons.Pencil size={13} />
                    Ubah Profil Pengguna
                </Button>
            </div>
        </div>
    );
}
export default UserResolvedPolicyView;
