import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/Select";
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { FileText, LayoutGrid, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

interface ContractTypeManagementProps {
    readonly contractTypes: any;
    readonly formTemplates?: any[] | null;
    readonly contractTemplates?: any[] | null;
    readonly filters: any;
}

const MechanismCell = ({ mechanism }: Readonly<{ mechanism: string }>) => (
    <div className="flex items-center gap-2">
        <div className="bg-primary/20 h-1.5 w-1.5 rounded-full dark:bg-white/20" />
        <span className="text-primary/60 text-[10px] font-semibold tracking-widest uppercase dark:text-white/60">
            {mechanism === 'digital' ? 'Formulir Digital' : mechanism === 'folder' ? 'Folder Kontrak' : 'Unggah Manual'}
        </span>
    </div>
);

const TypeDescriptionCell = ({ description }: Readonly<{ description?: string }>) => (
    <span className="text-primary/40 max-w-[200px] truncate text-[10px] font-bold tracking-tight uppercase dark:text-white/40">
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
            <div className="animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 dark:text-white/60 flex items-center gap-2">
                        Tautan Templat Digital {type}
                    </label>
                    <Select
                        value={String(formTemplateId)}
                        onValueChange={(v: string) => setFormTemplateId(String(v))}
                    >
                        <SelectTrigger className="h-10 rounded-xl border-primary/10 bg-primary/5 text-xs font-bold transition-all focus:border-primary">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/10 bg-white shadow-2xl dark:bg-black">
                            <SelectItem value="none" className="py-2.5 text-xs font-bold uppercase">-- TANPA TEMPLAT TERPAUT --</SelectItem>
                            {templates.map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)} className="py-2.5 text-xs font-bold uppercase">
                                    {t.name} ({t.document_type || 'ADHOC'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            </div>
        );
    }
    if (mechanism === 'folder') {
        return (
            <div className="animate-in fade-in slide-in-from-top-2">
            <div className="animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 dark:text-white/60 flex items-center gap-2">
                        Tautan Templat Folder ({type})
                    </label>
                    <Select
                        value={String(contractTemplateId)}
                        onValueChange={(v: string) => setContractTemplateId(String(v))}
                    >
                        <SelectTrigger className="h-10 rounded-xl border-primary/10 bg-primary/5 text-xs font-bold transition-all focus:border-primary">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/10 bg-white shadow-2xl dark:bg-black">
                            <SelectItem value="none" className="py-2.5 text-xs font-bold uppercase">-- TIDAK ADA TEMPLAT TERPILIH --</SelectItem>
                            {physTemplates.map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)} className="py-2.5 text-xs font-bold uppercase">
                                    {t.name} ({t.file_type || 'PDF'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            </div>
        );
    }
    return (
        <div className="animate-in fade-in border-primary/10 bg-primary/[0.01] rounded-2xl border border-dashed p-6 text-center dark:border-white/10 dark:bg-white/[0.01]">
            <p className="text-primary/30 text-[10px] font-bold tracking-[0.2em] uppercase italic dark:text-white/30">
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
                    <div className="group flex flex-col">
                        <span className="text-primary text-[13px] font-bold tracking-tight uppercase transition-transform group-hover:translate-x-1 dark:text-white">
                            {row.name}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                            <ShieldCheck size={10} className="text-primary/20 dark:text-white/20" />
                            <span className="text-primary/30 text-[9px] font-bold tracking-widest uppercase italic dark:text-white/30">
                                Aset Administratif Terpantau
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Mekanisme F1 (Internal)',
                accessorKey: 'f1_input_mechanism',
                cell: (row) => <MechanismCell mechanism={row.f1_input_mechanism} />,
            },
            {
                header: 'Mekanisme F2 (Eksternal)',
                accessorKey: 'f2_input_mechanism',
                cell: (row) => <MechanismCell mechanism={row.f2_input_mechanism} />,
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
        <div className="border-border bg-card m-5 rounded-2xl border p-5 shadow-sm">
            <TableMasterData
                title="Registri Klasifikasi Kontrak"
                borderless={true}
                columns={columns}
                data={contractTypes?.data || []}
                searchPlaceholder="Filter jenis klasifikasi..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
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
                onFilterChange={(updatedFilters: any) => {
                    const newFilters: Record<string, any> = { ...filters, page: 1 };
                    Object.keys(updatedFilters).forEach((key) => {
                        newFilters[key] = updatedFilters[key].length > 0 ? updatedFilters[key][0] : null;
                    });
                    router.get(globalThis.location.pathname, newFilters, { preserveState: true, replace: true });
                }}
                headerActions={
                    canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                            className="border-border/40 bg-card text-foreground hover:bg-muted/60 hover:border-border/60 h-10 gap-2 rounded-xl border px-6 text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                        >
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
                pagination={
                    contractTypes?.meta
                        ? {
                              currentPage: contractTypes.meta.current_page || 1,
                              lastPage: contractTypes.meta.last_page || 1,
                              total: contractTypes.meta.total || 0,
                              onPageChange: (page: number) =>
                                  router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                          }
                        : undefined
                }
            />
        </div>
    );
}
