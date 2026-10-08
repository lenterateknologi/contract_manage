import { Button } from '@/components/ui/buttons/Button';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { SlaSimulationModal } from '@/features/Contracts/components/parts/SlaSimulationModal';
import AuthorityTableManager from '@/pages/workflows/components/AuthorityTableManager';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calculator } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ResourceFieldRenderer from './components/ResourceFieldRenderer';
import UserResolvedPolicyView from './components/UserResolvedPolicyView';
import VendorDetailView from './components/VendorDetailView';
import { ResourceFieldSchema, ResourceFormProps } from './utils/types';

export default function ResourceForm({
    resourceSlug,
    title,
    formSchema,
    formColumns = 1,
    record,
    returnUrl,
    roles = [],
    departments = [],
    divisions = [],
    locations = [],
    users = [],
    companyGroups = [],
    organizationGroups = [],
    regions = [],
    companies = [],
}: ResourceFormProps) {
    const isEdit = !!record;
    const [activeTab, setActiveTab] = useState<'info' | 'detail'>('info');

    // Helper to get initial tab from URL query params
    const getInitialTab = <T extends string>(allowedTabs: T[], defaultTab: T): T => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as T;
            if (tabParam && allowedTabs.includes(tabParam)) {
                return tabParam;
            }
        }
        return defaultTab;
    };

    const [dashboardTab, setDashboardTab] = useState<'authority' | 'visibility' | 'template_authority' | 'on_behalf'>(() =>
        getInitialTab(['authority', 'visibility', 'template_authority', 'on_behalf'], 'authority'),
    );
    const [slaTab, setSlaTab] = useState<'config' | 'overdue_authority'>(() => getInitialTab(['config', 'overdue_authority'], 'config'));
    const [userTab, setUserTab] = useState<'profile' | 'policy'>(() => getInitialTab(['profile', 'policy'], 'profile'));

    const handleDashboardTabChange = (newTab: 'authority' | 'visibility' | 'template_authority' | 'on_behalf') => {
        setDashboardTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', newTab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleSlaTabChange = (newTab: 'config' | 'overdue_authority') => {
        setSlaTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', newTab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleUserTabChange = (newTab: 'profile' | 'policy') => {
        setUserTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', newTab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const currentTab = params.get('tab');
            if (
                resourceSlug === 'dashboard-types' &&
                currentTab &&
                ['authority', 'visibility', 'template_authority', 'on_behalf'].includes(currentTab)
            ) {
                setDashboardTab(currentTab as any);
            } else if (resourceSlug === 'contract-sla-configs' && currentTab && ['config', 'overdue_authority'].includes(currentTab)) {
                setSlaTab(currentTab as any);
            } else if (resourceSlug === 'users' && currentTab && ['profile', 'policy'].includes(currentTab)) {
                setUserTab(currentTab as any);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [resourceSlug]);

    const [isSlaSimOpen, setIsSlaSimOpen] = useState(false);

    // Helper to get flattened fields for initial state and validation
    const getFlattenedFields = (schema: ResourceFieldSchema[]): ResourceFieldSchema[] => {
        let fields: ResourceFieldSchema[] = [];
        schema.forEach((item) => {
            if (item.isGroup && Array.isArray(item.schema)) {
                fields = [...fields, ...getFlattenedFields(item.schema)];
            } else {
                fields.push(item);
            }
        });
        return fields;
    };

    const flattenedFields = getFlattenedFields(formSchema);

    // Initial form state based on schema and existing record values
    const initialFormState = flattenedFields.reduce((acc: any, field: any) => {
        const isBool = field.type === 'switch' || field.type === 'toggle' || field.name.startsWith('can_change_');
        acc[field.name] = isEdit ? (record[field.name] ?? (isBool ? false : '')) : (field.defaultValue ?? (isBool ? false : ''));
        return acc;
    }, {});

    if (resourceSlug === 'dashboard-types' || resourceSlug === 'contract-sla-configs') {
        initialFormState['authorities'] = record?.authorities || [];
    }

    if (resourceSlug === 'dashboard-types') {
        initialFormState['on_behalf_authorities'] = record?.on_behalf_authorities || [];
    }

    const { data, setData, post, put, errors, processing } = useForm(initialFormState);

    // Disable template selection if input mechanism is upload (digital) or none
    const isFieldDisabled = (fieldName: string) => {
        if (fieldName === 'f1_form_template_id') return data.f1_input_mechanism === 'digital' || data.f1_input_mechanism === 'none';
        if (fieldName === 'f2_form_template_id') return data.f2_input_mechanism === 'digital' || data.f2_input_mechanism === 'none';
        if (fieldName === 'contract_form_template_id') return data.contract_input_mechanism === 'digital' || data.contract_input_mechanism === 'none';

        return false;
    };

    useEffect(() => {
        if ((data.f1_input_mechanism === 'digital' || data.f1_input_mechanism === 'none') && data.f1_form_template_id !== '') {
            setData('f1_form_template_id', '');
        }
    }, [data.f1_input_mechanism]);

    useEffect(() => {
        if ((data.f2_input_mechanism === 'digital' || data.f2_input_mechanism === 'none') && data.f2_form_template_id !== '') {
            setData('f2_form_template_id', '');
        }
    }, [data.f2_input_mechanism]);

    useEffect(() => {
        if ((data.contract_input_mechanism === 'digital' || data.contract_input_mechanism === 'none') && data.contract_form_template_id !== '') {
            setData('contract_form_template_id', '');
        }
    }, [data.contract_input_mechanism]);

    // Live auto-sync for User form
    useEffect(() => {
        if (resourceSlug === 'users' && data.company_id) {
            const companyField = flattenedFields.find((f) => f.name === 'company_id');
            const companyMap = companyField?.meta?.company_map;
            if (companyMap && companyMap[data.company_id]) {
                const info = companyMap[data.company_id];
                setData((prev: any) => ({
                    ...prev,
                    company_name: info.name || '',
                    idcompany: info.idcompany ?? null,
                    company_group_name: info.company_group_name || '',
                    company_group_id: info.company_group_id || '',
                    region_name: info.region_name || '',
                    region_id: info.region_id || '',
                }));
            }
        } else if (resourceSlug === 'users' && data.company_name) {
            const companyField = flattenedFields.find((f) => f.name === 'company_name');
            const companyMap = companyField?.meta?.company_map;
            if (companyMap && companyMap[data.company_name]) {
                const info = companyMap[data.company_name];
                setData((prev: any) => ({
                    ...prev,
                    company_group_name: info.group_name || '',
                    region_name: info.region_name || '',
                }));
            }
        }
    }, [data.company_id, data.company_name, resourceSlug]);

    useEffect(() => {
        if (resourceSlug === 'users' && data.location_id) {
            const locField = flattenedFields.find((f) => f.name === 'location_id');
            const locMap = locField?.meta?.location_map;
            if (locMap && locMap[data.location_id]) {
                const info = locMap[data.location_id];
                setData((prev: any) => ({
                    ...prev,
                    location_name: info.location_name || '',
                    idlocation: info.idlocation ?? null,
                    business_unit_id: info.business_unit_id || '',
                    company_name: info.company_name || '',
                    company_id: info.company_id || '',
                    idcompany: info.idcompany ?? null,
                    company_group_name: info.company_group_name || '',
                    company_group_id: info.company_group_id || '',
                    region_name: info.region_name || '',
                    region_id: info.region_id || '',
                }));
            }
        }
    }, [data.location_id, resourceSlug]);

    useEffect(() => {
        if (resourceSlug === 'users' && data.job_position_id) {
            const jobField = flattenedFields.find((f) => f.name === 'job_position_id');
            const jobMap = jobField?.meta?.job_title_map;
            if (jobMap && jobMap[data.job_position_id]) {
                const info = jobMap[data.job_position_id];
                setData((prev: any) => ({
                    ...prev,
                    job_level_id: info.job_level_id || '',
                    joblevel_name: info.job_level_name || '',
                }));
            }
        }
    }, [data.job_position_id, resourceSlug]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const urlParams = new URLSearchParams();
        if (returnUrl) {
            urlParams.set('return_url', returnUrl);
        }
        if (resourceSlug === 'dashboard-types') {
            urlParams.set('tab', dashboardTab);
        } else if (resourceSlug === 'contract-sla-configs') {
            urlParams.set('tab', slaTab);
        } else if (resourceSlug === 'users' && isEdit) {
            urlParams.set('tab', userTab);
        }

        const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';
        const endpoint = `/admin/core/${resourceSlug}${isEdit ? `/${record.id}` : ''}${queryString}`;

        if (isEdit) {
            put(endpoint);
        } else {
            post(endpoint);
        }
    };

    const getGridClass = () => {
        if (formColumns === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full';
        if (formColumns === 3) return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4 w-full';
        if (formColumns >= 4) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 w-full';
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4 w-full';
    };

    return (
        <>
            <Head title={isEdit ? `Edit ${title}` : `Tambah ${title}`} />

            <div className="bg-background m-0 flex h-svh max-h-svh w-full flex-col overflow-hidden p-0">
                <div className="bg-background flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none border-0 shadow-none">
                    {/* Sticky Header with Tabs */}
                    <div className="border-surface-border bg-background flex shrink-0 flex-col border-b">
                        <div className="box-border flex h-16 max-h-[64px] min-h-[64px] items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={returnUrl || `/admin/core/${resourceSlug}`}
                                    className="border-surface-border hover:bg-surface-muted text-text-main rounded-xl border p-2 transition-all"
                                >
                                    <ArrowLeft size={16} />
                                </Link>
                                <div className="flex flex-col justify-center">
                                    <h1 className="text-text-main text-[13.5px] leading-tight font-bold tracking-tight">
                                        {isEdit ? `Edit ${title}` : `Tambah ${title}`}
                                    </h1>
                                    <p className="text-text-muted mt-0.5 text-[10.5px] leading-tight">
                                        {isEdit ? 'Ubah informasi data yang sudah ada.' : 'Tambahkan data master baru ke sistem.'}
                                    </p>
                                </div>
                            </div>

                            {resourceSlug === 'contract-sla-configs' && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="white"
                                        className="border-border hover:bg-surface-muted text-primary h-8 gap-1.5 text-xs font-semibold"
                                        onClick={() => setIsSlaSimOpen(true)}
                                    >
                                        <Calculator size={14} className="text-primary" /> Simulasi SLA
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Navigation Tabs for Dashboard Types */}
                        {resourceSlug === 'dashboard-types' && (
                            <div className="border-surface-border/60 bg-surface-base flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('authority')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'authority'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.ShieldCheck size={14} className={dashboardTab === 'authority' ? 'text-primary' : 'text-slate-400'} />
                                    1. Identitas & Target
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('visibility')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'visibility'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.LayoutDashboard
                                        size={14}
                                        className={dashboardTab === 'visibility' ? 'text-primary' : 'text-slate-400'}
                                    />
                                    2. Visibilitas Dashboard
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('template_authority')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'template_authority'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.FileSpreadsheet
                                        size={14}
                                        className={dashboardTab === 'template_authority' ? 'text-primary' : 'text-slate-400'}
                                    />
                                    3. Otoritas Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDashboardTabChange('on_behalf')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        dashboardTab === 'on_behalf'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.UserCheck size={14} className={dashboardTab === 'on_behalf' ? 'text-primary' : 'text-slate-400'} />
                                    4. Otoritas On-Behalf
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for SLA Configs */}
                        {resourceSlug === 'contract-sla-configs' && (
                            <div className="border-surface-border/60 bg-surface-base flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleSlaTabChange('config')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        slaTab === 'config'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.Clock size={14} className={slaTab === 'config' ? 'text-primary' : 'text-slate-400'} />
                                    1. Target SLA & Hari Kerja
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSlaTabChange('overdue_authority')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        slaTab === 'overdue_authority'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.BellRing size={14} className={slaTab === 'overdue_authority' ? 'text-primary' : 'text-slate-400'} />
                                    2. Otoritas Notifikasi Overdue
                                    <span className="py-0.2 bg-primary/10 text-primary ml-1 rounded-full px-1.5 text-[9px] font-bold">
                                        {(data.authorities || []).length}
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for Users */}
                        {resourceSlug === 'users' && isEdit && (
                            <div className="border-surface-border/60 bg-surface-base flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleUserTabChange('profile')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        userTab === 'profile'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.UserCheck size={14} className={userTab === 'profile' ? 'text-primary' : 'text-slate-400'} />
                                    1. Profil & Akses Pengguna
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUserTabChange('policy')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        userTab === 'policy'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <LucideIcons.SlidersHorizontal size={14} className={userTab === 'policy' ? 'text-primary' : 'text-slate-400'} />
                                    2. Kebijakan Dashboard & Filter Dokumen
                                    <span className="py-0.2 ml-1 rounded-full bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        View Only
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Navigation Tabs for Vendors */}
                        {resourceSlug === 'vendors' && isEdit && (
                            <div className="border-surface-border/60 flex items-center gap-2 border-t px-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('info')}
                                    className={cn(
                                        'cursor-pointer border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        activeTab === 'info'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    1. Form Edit Data
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('detail')}
                                    className={cn(
                                        'cursor-pointer border-b-2 px-4 py-2 text-xs font-semibold transition-all',
                                        activeTab === 'detail'
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    2. Detail Profil & Legalitas Vendor
                                </button>
                            </div>
                        )}
                    </div>

                    {activeTab === 'info' && (resourceSlug !== 'users' || userTab === 'profile') && (
                        <form onSubmit={handleSubmit} className="animate-in fade-in flex min-h-0 flex-1 flex-col overflow-hidden duration-200">
                            {/* Scrollable Form Body */}
                            <div className="flex-1 [scrollbar-width:none] space-y-6 overflow-y-auto p-6 pb-8 [&::-webkit-scrollbar]:hidden">
                                {resourceSlug === 'contract-sla-configs' && slaTab === 'overdue_authority' ? (
                                    <div className="col-span-full space-y-4">
                                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                                            <LucideIcons.BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                            <div>
                                                <h4 className="text-text-main text-xs font-bold">
                                                    Penerima Notifikasi SLA Terlewat (Overdue Escalation)
                                                </h4>
                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                    Tentukan personil, peran, atau atasan terkait yang akan otomatis menerima email alert ketika
                                                    pengajuan kontrak pada konfigurasi SLA ini melewati batas waktu.
                                                </p>
                                            </div>
                                        </div>

                                        <AuthorityTableManager
                                            authorities={data.authorities || []}
                                            onChange={(newAuths) => setData('authorities', newAuths)}
                                            roles={roles}
                                            departments={departments}
                                            divisions={divisions}
                                            locations={locations}
                                            users={users}
                                            companyGroups={companyGroups}
                                            organizationGroups={organizationGroups}
                                            regions={regions}
                                            companies={companies}
                                            title="Matriks Penerima Notifikasi Overdue"
                                            showCustom={true}
                                            showCombinations={true}
                                            showInitiatorOption={true}
                                        />
                                    </div>
                                ) : resourceSlug === 'dashboard-types' && dashboardTab === 'authority' ? (
                                    <div className="space-y-6">
                                        <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                            <LucideIcons.ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                            <div>
                                                <h4 className="text-text-main text-xs font-bold">Identitas Profil & Matriks Target Pengguna</h4>
                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                    Atur nama profil, tingkat prioritas evaluasi, dan tentukan satu atau beberapa kombinasi kriteria
                                                    pengguna (Role, Level Jabatan, Divisi, Departemen, Lokasi, atau Akun Spesifik) yang mendapatkan
                                                    profil dashboard ini.
                                                </p>
                                            </div>
                                        </div>

                                        <div className={getGridClass()}>
                                            {formSchema
                                                .filter((field: any) => {
                                                    const label = (field.label || '').toLowerCase();
                                                    return label.includes('identitas') || label.includes('informasi');
                                                })
                                                .map((field: any) => {
                                                    if (field.isGroup) {
                                                        const GroupIcon =
                                                            field.icon && (LucideIcons as any)[field.icon]
                                                                ? (LucideIcons as any)[field.icon]
                                                                : undefined;

                                                        return (
                                                            <div key={field.label} className="col-span-full flex flex-col gap-4 pt-2">
                                                                <div className="border-surface-border flex items-center justify-between gap-4 border-b pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {GroupIcon && (
                                                                            <GroupIcon className="text-primary h-4 w-4 shrink-0 opacity-80" />
                                                                        )}
                                                                        <div>
                                                                            <h3 className="text-text-main text-xs font-semibold tracking-wider uppercase">
                                                                                {field.label}
                                                                            </h3>
                                                                            {field.description && (
                                                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                                                    {field.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className={getGridClass()}>
                                                                    {field.schema
                                                                        ?.filter(
                                                                            (subField: any) =>
                                                                                ![
                                                                                    'can_change_company_group',
                                                                                    'can_change_region',
                                                                                    'can_change_company',
                                                                                    'can_change_division',
                                                                                    'can_change_department',
                                                                                    'use_role_filter',
                                                                                ].includes(subField.name),
                                                                        )
                                                                        .map((subField: any) => (
                                                                            <ResourceFieldRenderer
                                                                                key={subField.name}
                                                                                field={subField}
                                                                                data={data}
                                                                                setData={setData}
                                                                                errors={errors}
                                                                                resourceSlug={resourceSlug}
                                                                                formColumns={formColumns}
                                                                                record={record}
                                                                                isFieldDisabled={isFieldDisabled}
                                                                            />
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <ResourceFieldRenderer
                                                            key={field.name}
                                                            field={field}
                                                            data={data}
                                                            setData={setData}
                                                            errors={errors}
                                                            resourceSlug={resourceSlug}
                                                            formColumns={formColumns}
                                                            record={record}
                                                            isFieldDisabled={isFieldDisabled}
                                                        />
                                                    );
                                                })}
                                        </div>

                                        <div className="col-span-full pt-2">
                                            <AuthorityTableManager
                                                authorities={data.authorities || []}
                                                onChange={(newAuths) => setData('authorities', newAuths)}
                                                roles={roles}
                                                departments={departments}
                                                divisions={divisions}
                                                locations={locations}
                                                users={users}
                                                companyGroups={companyGroups}
                                                organizationGroups={organizationGroups}
                                                regions={regions}
                                                companies={companies}
                                                title="Matriks Target Pengguna Profil"
                                                showCustom={false}
                                                showCombinations={true}
                                                showInitiatorOption={false}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'visibility' && (
                                            <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                                <LucideIcons.LayoutDashboard className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                                <div>
                                                    <h4 className="text-text-main text-xs font-bold">Visibilitas Tab Ringkasan & Modul Dashboard</h4>
                                                    <p className="text-text-muted mt-0.5 text-[11px]">
                                                        Tentukan tab statistik ringkasan dan modul dashboard apa saja yang dapat dilihat dan diakses
                                                        oleh pengguna dengan profil ini.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'template_authority' && (
                                            <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                                <LucideIcons.FileSpreadsheet className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                                <div>
                                                    <h4 className="text-text-main text-xs font-bold">
                                                        Hak Akses & Otoritas Template Dokumen (/admin/templates)
                                                    </h4>
                                                    <p className="text-text-muted mt-0.5 text-[11px]">
                                                        Tentukan hak akses pengguna profil ini terhadap berkas template kontrak, pembuatan folder
                                                        direktori, download file, upload berkas, ubah nama, atur visibilitas, hingga penghapusan
                                                        berkas.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'on_behalf' && (
                                            <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-4">
                                                <LucideIcons.UserCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                                                <div>
                                                    <h4 className="text-text-main text-xs font-bold">
                                                        Otoritas Buat Pengajuan Atas Nama Orang Lain (On-Behalf)
                                                    </h4>
                                                    <p className="text-text-muted mt-0.5 text-[11px]">
                                                        Izinkan pengguna dengan profil dashboard ini untuk membuat dan mengajukan draft kontrak baru
                                                        atas nama personil atau pemohon (requester) lain.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className={getGridClass()}>
                                            {formSchema
                                                .filter((field: any) => {
                                                    if (resourceSlug !== 'dashboard-types') return true;
                                                    const label = (field.label || '').toLowerCase();
                                                    if (dashboardTab === 'visibility') {
                                                        return (
                                                            label.includes('visibilitas tab') ||
                                                             label.includes('visibility') ||
                                                            label.includes('visibilitas')
                                                        );
                                                    }
                                                    if (dashboardTab === 'template_authority') {
                                                        return label.includes('template dokumen') || label.includes('otoritas & akses template');
                                                    }
                                                    if (dashboardTab === 'on_behalf') {
                                                        return (
                                                            label.includes('on-behalf') || label.includes('on_behalf') || label.includes('atas nama')
                                                        );
                                                    }
                                                    return false;
                                                })
                                                .map((field: any) => {
                                                    if (field.isGroup) {
                                                        const GroupIcon =
                                                            field.icon && (LucideIcons as any)[field.icon]
                                                                ? (LucideIcons as any)[field.icon]
                                                                : undefined;

                                                        return (
                                                            <div key={field.label} className="col-span-full flex flex-col gap-4 pt-2">
                                                                <div className="border-surface-border flex items-center justify-between gap-4 border-b pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {GroupIcon && (
                                                                            <GroupIcon className="text-primary h-4 w-4 shrink-0 opacity-80" />
                                                                        )}
                                                                        <div>
                                                                            <h3 className="text-text-main text-xs font-semibold tracking-wider uppercase">
                                                                                {field.label}
                                                                            </h3>
                                                                            {field.description && (
                                                                                <p className="text-text-muted mt-0.5 text-[11px]">
                                                                                    {field.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className={getGridClass()}>
                                                                    {field.schema
                                                                        ?.filter(
                                                                            (subField: any) =>
                                                                                ![
                                                                                    'can_change_company_group',
                                                                                    'can_change_region',
                                                                                    'can_change_company',
                                                                                    'can_change_division',
                                                                                    'can_change_department',
                                                                                    'use_role_filter',
                                                                                ].includes(subField.name),
                                                                        )
                                                                        .map((subField: any) => (
                                                                            <ResourceFieldRenderer
                                                                                key={subField.name}
                                                                                field={subField}
                                                                                data={data}
                                                                                setData={setData}
                                                                                errors={errors}
                                                                                resourceSlug={resourceSlug}
                                                                                formColumns={formColumns}
                                                                                record={record}
                                                                                isFieldDisabled={isFieldDisabled}
                                                                            />
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <ResourceFieldRenderer
                                                            key={field.name}
                                                            field={field}
                                                            data={data}
                                                            setData={setData}
                                                            errors={errors}
                                                            resourceSlug={resourceSlug}
                                                            formColumns={formColumns}
                                                            record={record}
                                                            isFieldDisabled={isFieldDisabled}
                                                        />
                                                    );
                                                })}
                                        </div>

                                        {resourceSlug === 'dashboard-types' && dashboardTab === 'on_behalf' && data.can_create_on_behalf && (
                                            <div className="border-surface-border col-span-full border-t pt-4">
                                                <AuthorityTableManager
                                                    authorities={data.on_behalf_authorities || []}
                                                    onChange={(newAuths) => setData('on_behalf_authorities', newAuths)}
                                                    roles={roles}
                                                    departments={departments}
                                                    divisions={divisions}
                                                    locations={locations}
                                                    users={users}
                                                    companyGroups={companyGroups}
                                                    organizationGroups={organizationGroups}
                                                    regions={regions}
                                                    companies={companies}
                                                    title="Matriks Target Initiator yang Boleh Diwakili (On-Behalf)"
                                                    showCustom={false}
                                                    showCombinations={true}
                                                    showInitiatorOption={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="border-surface-border bg-surface-muted/30 flex shrink-0 items-center justify-end gap-3 border-t px-6 py-3.5">
                                <Link href={returnUrl || `/admin/core/${resourceSlug}`}>
                                    <Button type="button" variant="white" className="border-surface-border h-9 rounded-xl text-xs">
                                        Batal
                                    </Button>
                                </Link>
                                <Button type="submit" variant="primary" disabled={processing} className="h-9 rounded-xl text-xs">
                                    Simpan Data
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Tab 2: User Resolved Policy View (Read Only & Compact) */}
                    {resourceSlug === 'users' && isEdit && userTab === 'policy' && record?.resolved_policy && (
                        <UserResolvedPolicyView
                            record={record}
                            returnUrl={returnUrl}
                            resourceSlug={resourceSlug}
                            onEditProfile={() => setUserTab('profile')}
                        />
                    )}

                    {/* Tab 2: Vendor Detail View */}
                    {activeTab === 'detail' && <VendorDetailView record={record} />}
                </div>
            </div>

            {resourceSlug === 'contract-sla-configs' && (
                <SlaSimulationModal
                    open={isSlaSimOpen}
                    onOpenChange={setIsSlaSimOpen}
                    currentConfig={{
                        name: data.name,
                        contract_type_id: data.contract_type_id,
                        topic: data.topic,
                        sla_drafting_hours: data.sla_drafting_hours,
                        sla_review_hours: data.sla_review_hours,
                        sla_total_hours: data.sla_total_hours,
                        sla_start_hour: data.sla_start_hour,
                        sla_cutoff_hour: data.sla_cutoff_hour,
                        working_days: data.working_days,
                        warning_threshold_percent: data.warning_threshold_percent,
                    }}
                />
            )}
        </>
    );
}
