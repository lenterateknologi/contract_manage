import { useToast } from '@/components/contracts/Toast';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { Button } from '@/components/ui/base/Button';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { usePermissions } from '@/hooks/use-permissions';
import { router, useForm } from '@inertiajs/react';
import { Plus, Trash2, FileText, Info, LayoutGrid, Settings2, ShieldCheck, ChevronRight } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface ContractTypeManagementProps {
    readonly contractTypes: any;
    readonly formTemplates?: any[] | null;
    readonly contractTemplates?: any[] | null;
    readonly filters: any;
}

const MechanismCell = ({ mechanism }: Readonly<{ mechanism: string }>) => (
    <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/20 dark:bg-white/20" />
        <span className="text-[10px] font-black tracking-widest text-primary/60 uppercase dark:text-white/60">
            {mechanism === 'digital' ? 'Formulir Digital' : mechanism === 'folder' ? 'Folder Kontrak' : 'Unggah Manual'}
        </span>
    </div>
);

const TypeDescriptionCell = ({ description }: Readonly<{ description?: string }>) => (
    <span className="text-[10px] font-bold text-primary/40 dark:text-white/40 uppercase tracking-tight truncate max-w-[200px]">
        {description || '—'}
    </span>
);

const MechanismOptions = ({
    mechanism,
    formTemplateId,
    setFormTemplateId,
    contractTemplateId,
    setContractTemplateId,
    templates,
    physTemplates,
    type,
}: {
    mechanism: string;
    formTemplateId: string;
    setFormTemplateId: (id: string | number) => void;
    contractTemplateId: string;
    setContractTemplateId: (id: string | number) => void;
    templates: any[];
    physTemplates: any[];
    type: 'F1' | 'F2';
}) => {
    if (mechanism === 'digital') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
                <CompactSelect 
                    label={`Tautan Templat Digital ${type}`}
                    value={formTemplateId}
                    onChange={setFormTemplateId}
                    options={[
                        { label: '-- TANPA TEMPLAT TERPAUT --', value: 'none' },
                        ...templates.map((t: any) => ({
                            label: `${t.name} (${t.document_type || 'ADHOC'})`,
                            value: t.id
                        }))
                    ]}
                    icon={LayoutGrid}
                />
            </div>
        );
    }
    if (mechanism === 'folder') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
                <CompactSelect 
                    label={`Tautan Templat Folder (${type})`}
                    value={contractTemplateId}
                    onChange={setContractTemplateId}
                    options={[
                        { label: '-- TIDAK ADA TEMPLAT TERPILIH --', value: 'none' },
                        ...physTemplates.map((t: any) => ({
                            label: `${t.name} (${t.file_type || 'PDF'})`,
                            value: t.id
                        }))
                    ]}
                    icon={FileText}
                />
            </div>
        );
    }
    return (
        <div className="animate-in fade-in rounded-2xl border border-dashed border-primary/10 bg-primary/[0.01] p-6 text-center dark:border-white/10 dark:bg-white/[0.01]">
            <p className="text-[10px] font-black tracking-[0.2em] text-primary/30 uppercase dark:text-white/30 italic">
                {type === 'F1' ? 'PENGGUNA INTERNAL' : 'VENDOR'} AKAN MENGUNGGAH PDF MANUAL UNTUK {type}
            </p>
        </div>
    );
};

export function ContractTypeManagement({ contractTypes, filters }: Readonly<ContractTypeManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_TYPES');

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Klasifikasi Kontrak',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => (
                    <div className="flex flex-col group">
                        <span className="text-[13px] font-black tracking-tight text-primary dark:text-white uppercase group-hover:translate-x-1 transition-transform">{row.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <ShieldCheck size={10} className="text-primary/20 dark:text-white/20" />
                            <span className="text-[9px] font-bold text-primary/30 dark:text-white/30 uppercase tracking-widest italic">Aset Administratif Terpantau</span>
                        </div>
                    </div>
                )
            },
            {
                header: 'Mekanisme F1 (Internal)',
                accessorKey: 'f1_input_mechanism',
                cell: (row) => <MechanismCell mechanism={row.f1_input_mechanism} />
            },
            {
                header: 'Mekanisme F2 (Eksternal)',
                accessorKey: 'f2_input_mechanism',
                cell: (row) => <MechanismCell mechanism={row.f2_input_mechanism} />
            },
            {
                header: 'Keterangan Konten',
                accessorKey: 'description',
                cell: (row) => <TypeDescriptionCell description={row.description} />,
            },
        ],
        [],
    );

    const openCreate = () => {
        router.visit(route('admin.contract-types.create'));
    };

    const openEdit = (type: any) => {
        if (!type) return;
        router.visit(route('admin.contract-types.edit', type.id));
    };

    return (
        <div className="animate-in fade-in flex h-full flex-col bg-white dark:bg-black antialiased">
            <DataTable
                title="Registri Klasifikasi Kontrak"
                columns={columns}
                data={contractTypes?.data || []}
                searchPlaceholder="Filter jenis klasifikasi..."
                searchValue={filters.search || ''}
                onSearchChange={(v) => router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
                filters={[
                    {
                        label: 'Mekanisme F1',
                        key: 'f1_input_mechanism',
                        options: [
                            { label: 'Formulir Digital', value: 'digital' },
                            { label: 'Folder Kontrak', value: 'folder' },
                            { label: 'Manual', value: 'manual' },
                        ],
                    },
                    {
                        label: 'Mekanisme F2',
                        key: 'f2_input_mechanism',
                        options: [
                            { label: 'Formulir Digital', value: 'digital' },
                            { label: 'Folder Kontrak', value: 'folder' },
                            { label: 'Manual', value: 'manual' },
                        ],
                    },
                ]}
                activeFilters={{
                    f1_input_mechanism: filters.f1_input_mechanism ? [filters.f1_input_mechanism] : [],
                    f2_input_mechanism: filters.f2_input_mechanism ? [filters.f2_input_mechanism] : [],
                }}
                onFilterChange={(updatedFilters) => {
                    const newFilters: Record<string, any> = { ...filters, page: 1 };
                    Object.keys(updatedFilters).forEach(key => {
                        newFilters[key] = updatedFilters[key].length > 0 ? updatedFilters[key][0] : null;
                    });
                    router.get(globalThis.location.pathname, newFilters, { preserveState: true, replace: true });
                }}
                headerActions={
                    canCreate && (
                        <Button variant="primary" onClick={openCreate} className="h-10 px-8 shadow-xl active:scale-95">
                            <Plus size={14} className="mr-2" /> Registrasi Klasifikasi
                        </Button>
                    )
                }
                onRowClick={openEdit}
                bulkActions={
                    canDelete
                        ? [
                                {
                                    label: 'Hapus Terpilih',
                                    icon: Trash2,
                                    variant: 'destructive',
                                    onClick: (ids: string[]) => {
                                        if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} tipe kontrak terpilih secara permanen?`)) {
                                            router.post(
                                                route('admin.contract-types.bulk-destroy'),
                                                { ids },
                                                {
                                                    onSuccess: () => showToast(`${ids.length} tipe kontrak telah dihapus dari registri`, 'success'),
                                                },
                                            );
                                        }
                                    },
                                },
                            ]
                        : undefined
                }
                pagination={contractTypes?.meta ? {
                    currentPage: contractTypes.meta.current_page || 1,
                    lastPage: contractTypes.meta.last_page || 1,
                    total: contractTypes.meta.total || 0,
                    onPageChange: (page) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                } : undefined}
            />
        </div>
    );
}
