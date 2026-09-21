import { Button } from '@/components/ui/buttons/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { PageHeader } from '@/components/ui/navigation/PageHeader';
import AuthorityTableManager from '@/pages/workflows/components/AuthorityTableManager';
import { Head, router } from '@inertiajs/react';
import { Icons } from '@/components/ui';
import React, { useState } from 'react';

const { Save, RefreshCw, UserCheck } = Icons;

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
        <>
            <Head title="Otoritas Buat Pengajuan (On-Behalf)" />
            <MasterPageLayout padded={false}>
                <FloatingPanel className="flex-1 min-w-0 flex flex-col h-full rounded-none border-0 overflow-hidden bg-background">
                    <PageHeader
                        title="Otoritas Buat Pengajuan (On-Behalf)"
                        subtitle="Tentukan personil, role, atau unit kerja yang berhak membuatkan pengajuan kontrak atas nama orang lain (inisiator)"
                        icon={UserCheck}
                        actions={
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
                    />

                    <div className="flex-1 min-h-0 w-full overflow-y-auto p-4 custom-scrollbar">
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
                </FloatingPanel>
            </MasterPageLayout>
        </>
    );
}
