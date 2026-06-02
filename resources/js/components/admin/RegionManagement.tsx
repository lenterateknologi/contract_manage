import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { ExcelActions } from '@/components/ui/data/ExcelActions';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn, regionColor } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { GitBranch, Plus, Tags, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface RegionManagementProps {
    regions: any;
    filters: any;
}

const RegionCell = ({ name, description }: Readonly<{ name: string; description?: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 select-none',
                regionColor(name),
            )}
        >
            <GitBranch size={18} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold tracking-wide text-text-main leading-tight">{name}</span>
            {description && (
                <span className="text-text-desc text-[11px] font-medium leading-normal">
                    {description}
                </span>
            )}
        </div>
    </div>
);

export function RegionManagement({ regions, filters }: Readonly<RegionManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_REGIONS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingRegion, setEditingRegion] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        code: '',
        alias: '',
        id_portal_master: '',
        description: '',
    });

    // --- Deep Linking Support ---
    React.useEffect(() => {
        if (filters.action === 'create') {
            openCreate();
        } else if (filters.action === 'edit' && filters.id) {
            const region = (Array.isArray(regions) ? regions : regions?.data || []).find((r: any) => r.id === filters.id);
            if (region) openEdit(region);
        }
    }, [filters.action, filters.id]);

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Nama Region',
                accessorKey: 'name',
                cell: (row) => <RegionCell name={row.name} description={row.description} />,
            },
            {
                header: 'Kode',
                accessorKey: 'code',
                cell: (row) => <span className="text-text-desc text-sm font-medium tracking-wide">{row.code}</span>,
            },
            {
                header: 'ID Portal',
                accessorKey: 'id_portal_master',
                cell: (row) => (
                    <span className="text-text-desc text-sm font-medium tracking-wide">
                        {row.id_portal_master || '—'}
                    </span>
                ),
            },
            {
                header: 'Jumlah Company',
                accessorKey: 'companies_count',
                cell: (row) => (
                    <span className="text-text-desc text-sm font-medium tracking-wide">
                        {row.companies?.length || 0} Company
                    </span>
                ),
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingRegion(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (region: any) => {
        setEditingRegion(region);
        form.setData({
            name: region.name,
            code: region.code,
            alias: region.alias || '',
            id_portal_master: region.id_portal_master || '',
            description: region.description || '',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingRegion(null);
        form.reset();
        // Clear filters if we were in a deep-linked state
        if (filters.action || filters.id) {
            router.get(globalThis.location.pathname, { ...filters, action: undefined, id: undefined }, { preserveState: true, replace: true });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingRegion ? 'Region diperbarui' : 'Region baru ditambahkan', 'success');
            },
        };
        if (editingRegion) form.put(`/admin/regions/${editingRegion.id}`, options);
        else form.post('/admin/regions', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingRegion ? 'Update Data Region' : 'Registrasi Data Region'}
                subtitle={editingRegion ? 'Pengaturan detail wilayah operasional' : 'Registrasi wilayah operasional baru'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingRegion}
                headerActions={
                    editingRegion &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsConfirmOpen(true)}
                            className="h-10 rounded-xl border border-danger/20 px-4 text-xs font-bold text-danger transition-all duration-200 select-none hover:bg-danger hover:text-white active:scale-95"
                        >
                            <Trash2 size={15} className="mr-2" /> Hapus
                        </Button>
                    )
                }
            >
                <ConfirmationModal
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        setIsConfirmOpen(false);
                        router.delete(`/admin/regions/${editingRegion.id}`, {
                            onSuccess: () => {
                                closeForm();
                                showToast('Region telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus region ${editingRegion?.name}? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Hapus Region"
                />
                <div className="animate-in fade-in grid grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2 w-full">
                    {/* Side 1: Primary Configuration */}
                    <div className="space-y-12">
                        <FormSection title="Parameter Wilayah" subtitle="Nama dan identitas unik wilayah operasional">
                            <div className="grid grid-cols-1 gap-y-10">
                                <CompactInput
                                    label="Nama Wilayah (Region)"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: JAWA BARAT"
                                    error={form.errors.name}
                                    icon={GitBranch}
                                />
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <CompactInput
                                        label="Kode Region"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        placeholder="CONTOH: REG-JABAR"
                                        error={form.errors.code}
                                        icon={Tags}
                                    />
                                    <CompactInput
                                        label="Alias Visual"
                                        value={form.data.alias}
                                        onChange={(e) => form.setData('alias', e.target.value)}
                                        placeholder="CONTOH: JABAR"
                                        error={form.errors.alias}
                                    />
                                </div>
                                <CompactInput
                                    label="ID Portal Master (Sync)"
                                    value={form.data.id_portal_master}
                                    onChange={(e) => form.setData('id_portal_master', e.target.value)}
                                    placeholder="NOMOR ID DARI MASTER DATA"
                                    error={form.errors.id_portal_master}
                                />
                                <CompactInput
                                    label="Deskripsi Wilayah"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN CAKUPAN ATAU KETERANGAN WILAYAH..."
                                    error={form.errors.description}
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side 2: Associated Entities & Metadata */}
                    <div className="space-y-12">
                        {editingRegion && (
                            <FormSection
                                title="Entitas Terkait"
                                subtitle="Daftar perusahaan yang beroperasi di wilayah ini"
                                headerAction={
                                    <Button
                                        type="button"
                                        variant="white"
                                        size="sm"
                                        onClick={() => router.get('/admin/companies', { action: 'create', region_id: editingRegion.id })}
                                        className="h-8 rounded-lg border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all"
                                    >
                                        <Plus size={12} className="mr-1.5" /> Tambah Company
                                    </Button>
                                }
                            >
                                {editingRegion.companies?.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {editingRegion.companies.map((company: any) => (
                                            <div
                                                key={company.id}
                                                className="group flex items-center justify-between rounded-xl border border-black/[0.03] dark:border-white/[0.03] bg-black/[0.01] dark:bg-white/[0.01] p-4 transition-all hover:border-primary/30 hover:bg-white dark:hover:bg-black"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-slate-700 tracking-tight dark:text-slate-300">
                                                        {company.name}
                                                    </span>
                                                    <span className="text-text-soft text-[10px] font-medium uppercase mt-0.5">
                                                        {company.code} • {company.alias || company.code}
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.get('/admin/companies', { action: 'edit', id: company.id })}
                                                    className="text-text-desc hover:text-primary h-8 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100"
                                                >
                                                    Kelola
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-black/[0.03] dark:border-white/[0.03] rounded-xl bg-black/[0.01] dark:bg-white/[0.01]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Belum ada company terdaftar</p>
                                    </div>
                                )}
                            </FormSection>
                        )}

                        <div className="animate-in fade-in flex gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm duration-300 dark:bg-primary/10">
                            <GitBranch size={24} className="mt-0.5 shrink-0 text-primary" />
                            <p className="text-[11px] leading-relaxed font-semibold text-primary/80 uppercase tracking-tight">
                                Region adalah level menengah dalam hirarki organisasi. Region bersifat global dan dapat digunakan oleh berbagai Group Perusahaan untuk pemetaan wilayah hukum dan pajak.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Database Region Operasional"
            columns={columns}
            borderless={true}
            data={Array.isArray(regions) ? regions : regions?.data || []}
            searchPlaceholder="Cari region..."
            searchValue={filters.search || ''}
            onSearchChange={(v: string) =>
                router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
            }
            headerActions={
                <div className="flex items-center gap-2">
                    <ExcelActions
                        exportRoute="admin.regions.export"
                        importRoute="admin.regions.import"
                        label="Region"
                    />
                    {canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                        >
                            <Plus size={15} className="text-primary" /> Tambah Region
                        </Button>
                    )}
                </div>
            }
            onRowClick={openEdit}
            bulkActions={
                canDelete
                    ? [
                          {
                              label: 'Hapus Terpilih',
                              icon: Trash2,
                              variant: 'destructive',
                              onClick: (ids: string[] | number[]) => {
                                  if (confirm(`Hapus ${ids.length} region terpilih?`)) {
                                      router.post(
                                          '/admin/regions/bulk-delete',
                                          { ids },
                                          {
                                              onSuccess: () => showToast(`${ids.length} region telah dihapus`, 'success'),
                                          },
                                      );
                                  }
                              },
                          },
                      ]
                    : undefined
            }
        />
    );
}
