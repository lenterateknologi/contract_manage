import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import AuthorityTableManager from '@/pages/workflows/components/AuthorityTableManager';
import { Head, router } from '@inertiajs/react';
import { AppIcon, Icons } from '@/components/ui';
import React, { useState } from 'react';

const { Save, RefreshCw, UserCheck, ShieldCheck, Info } = Icons;

interface Props {
    initialAuthorities: any[];
    roles: any[];
    departments: any[];
    divisions: any[];
    locations: any[];
    users: any[];
    companyGroups: any[];
    organizationGroups: any[];
    regions: any[];
    companies: any[];
    breadcrumbs?: any[];
}

export default function OnBehalfAuthorityIndex({
    initialAuthorities = [],
    roles = [],
    departments = [],
    divisions = [],
    locations = [],
    users = [],
    companyGroups = [],
    organizationGroups = [],
    regions = [],
    companies = [],
    breadcrumbs = [],
}: Props) {
    const [authorities, setAuthorities] = useState<any[]>(initialAuthorities);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const handleSave = () => {
        setIsSaving(true);
        router.post(
            route('admin.on-behalf-authorities.save'),
            {
                authorities: authorities.map((a, idx) => ({
                    authority_type: a.authority_type || 'group',
                    role_id: a.role_id || null,
                    department_id: a.department_id || null,
                    division_id: a.division_id || null,
                    organization_group_id: a.organization_group_id || null,
                    location_id: a.location_id || null,
                    user_id: a.user_id || null,
                    company_group_id: a.company_group_id || null,
                    company_id: a.company_id || null,
                    region_id: a.region_id || null,
                    role_use_initiator: Boolean(a.role_use_initiator),
                    department_use_initiator: Boolean(a.department_use_initiator),
                    division_use_initiator: Boolean(a.division_use_initiator),
                    organization_group_use_initiator: Boolean(a.organization_group_use_initiator),
                    location_use_initiator: Boolean(a.location_use_initiator),
                    company_group_use_initiator: Boolean(a.company_group_use_initiator),
                    company_use_initiator: Boolean(a.company_use_initiator),
                    region_use_initiator: Boolean(a.region_use_initiator),
                    sequence: idx + 1,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    showToast('Otoritas buat pengajuan atas nama berhasil disimpan!', 'success');
                },
                onError: (errors) => {
                    setIsSaving(false);
                    const msg = Object.values(errors)[0] || 'Gagal menyimpan konfigurasi otoritas.';
                    showToast(String(msg), 'error');
                },
            }
        );
    };

    return (
        <MasterPageLayout
            title="Otoritas Buat Pengajuan (On-Behalf)"
            description="Tentukan personil, role, atau unit kerja yang berhak membuatkan pengajuan kontrak atas nama orang lain (inisiator)."
            icon={UserCheck}
            breadcrumbs={breadcrumbs}
            headerAction={
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="primary"
                    className="cursor-pointer h-9 px-4 text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Menyimpan...</span>
                        </>
                    ) : (
                        <>
                            <Save size={14} />
                            <span>Simpan Perubahan</span>
                        </>
                    )}
                </Button>
            }
        >
            <Head title="Otoritas Buat Pengajuan (On-Behalf)" />

            <div className="space-y-6 pb-12">
                {/* Info Card */}
                <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 rounded-xl p-4 flex items-start gap-3">
                    <div className="bg-sky-500/10 dark:bg-sky-400/20 text-sky-600 dark:text-sky-300 p-2 rounded-lg shrink-0 mt-0.5">
                        <Info size={18} />
                    </div>
                    <div className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed space-y-1">
                        <p className="font-bold text-sky-950 dark:text-sky-100">
                            Bagaimana Cara Kerja Otoritas Ini?
                        </p>
                        <p>
                            Secara default, pengguna hanya dapat membuat pengajuan kontrak atas nama dirinya sendiri.
                            Jika suatu pengguna/role/unit kerja ditambahkan ke dalam daftar di bawah ini, mereka akan diberikan akses untuk memilih <strong>Dibuat Untuk (Initiator)</strong> saat membuat pengajuan kontrak baru.
                        </p>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
                    <AuthorityTableManager
                        title="Daftar Otoritas Pembuat Pengajuan Atas Nama"
                        authorities={authorities}
                        onChange={setAuthorities}
                        users={users}
                        roles={roles}
                        departments={departments}
                        divisions={divisions}
                        locations={locations}
                        companyGroups={companyGroups}
                        organizationGroups={organizationGroups}
                        companies={companies}
                        regions={regions}
                        showCustom={false}
                        showCombinations={true}
                        showInitiatorOption={false}
                    />
                </div>
            </div>
        </MasterPageLayout>
    );
}
