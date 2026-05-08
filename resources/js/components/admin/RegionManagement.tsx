import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/Select";
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface RegionManagementProps {
    regions: any;
    filters: any;
}

const REGION_COLORS = [
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
];

function regionColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return REGION_COLORS[Math.abs(h) % REGION_COLORS.length];
}

const RegionCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 shadow-sm backdrop-blur-sm select-none', regionColor(name))}>
            <GitBranch size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="text-slate-900 dark:text-slate-100 mb-0.5 truncate text-sm leading-tight font-bold tracking-wide">{name}</span>
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
                cell: (row) => <RegionCell name={row.name} />,
            },
            {
                header: 'Kode',
                accessorKey: 'code',
                cell: (row) => (
                    <span className="text-muted-foreground dark:text-slate-300/80 text-sm font-medium tracking-wide">
                        {row.code}
                    </span>
                ),
            },
            {
                header: 'ID Portal',
                accessorKey: 'id_portal_master',
                cell: (row) => (
                    <span className="text-muted-foreground dark:text-slate-300/80 text-sm font-medium tracking-wide">
                        {row.id_portal_master || '—'}
                    </span>
                ),
            },
            {
                header: 'Jumlah Company',
                accessorKey: 'companies_count',
                cell: (row) => (
                    <span className="text-muted-foreground dark:text-slate-300/80 text-sm font-medium tracking-wide">
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
                            className="h-10 rounded-xl border border-rose-500/20 px-4 text-xs font-bold text-rose-500 transition-all hover:bg-rose-500 dark:hover:bg-rose-500/20 hover:text-white active:scale-95 select-none duration-200"
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
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12 select-none animate-in fade-in duration-200">
                    <div className="space-y-8 md:col-span-8">
                        <FormSection title="Informasi Region" subtitle="Nama dan identitas wilayah operasional">
                            <div className="grid grid-cols-1 gap-6">
                                <CompactInput
                                    label="Nama Region"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: JAWA BARAT"
                                    error={form.errors.name}
                                />
                                <CompactInput
                                    label="Kode Region"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    placeholder="CONTOH: REG-JABAR"
                                    error={form.errors.code}
                                />
                                <CompactInput
                                    label="Alias"
                                    value={form.data.alias}
                                    onChange={(e) => form.setData('alias', e.target.value)}
                                    placeholder="CONTOH: JABAR"
                                    error={form.errors.alias}
                                />
                                <CompactInput
                                    label="ID Portal Master"
                                    value={form.data.id_portal_master}
                                    onChange={(e) => form.setData('id_portal_master', e.target.value)}
                                    placeholder="CONTOH: 14"
                                    error={form.errors.id_portal_master}
                                />
                                <CompactInput
                                    label="Deskripsi"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN DESKRIPSI REGION..."
                                    error={form.errors.description}
                                />
                            </div>
                        </FormSection>

                        {editingRegion && (
                            <>
                                <FormSection 
                                    title="Daftar Company" 
                                    subtitle="Entitas perusahaan yang terdaftar dalam wilayah ini"
                                    headerAction={
                                        <Button
                                            type="button"
                                            variant="white"
                                            size="sm"
                                            onClick={() => router.get('/admin/companies', { action: 'create', region_id: editingRegion.id })}
                                            className="h-8 gap-2 rounded-lg border border-primary/10 bg-primary/5 text-[10px] font-bold text-primary transition-all hover:bg-primary hover:text-white"
                                        >
                                            <Plus size={12} /> Tambah Company
                                        </Button>
                                    }
                                >
                                <div className="divide-y divide-primary/5 rounded-xl border border-primary/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                                    {editingRegion.companies?.length > 0 ? (
                                        editingRegion.companies.map((company: any) => (
                                            <div key={company.id} className="flex items-center justify-between p-4 transition-colors hover:bg-primary/[0.04]">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase tracking-wide text-primary dark:text-white">{company.name}</span>
                                                    <span className="text-[10px] font-medium text-primary/40 dark:text-white/40 uppercase tracking-widest">{company.code} • {company.alias || company.code}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.get('/admin/companies', { action: 'edit', id: company.id })}
                                                    className="h-8 rounded-lg text-[10px] font-bold uppercase text-primary/60 hover:text-primary"
                                                >
                                                    Kelola
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada company terdaftar</p>
                                        </div>
                                    )}
                                </div>
                                </FormSection>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-8 md:col-span-4">
                        <div className="border-border/80 dark:border-slate-800/80 bg-muted/20 dark:bg-slate-900/40 backdrop-blur-sm group relative overflow-hidden rounded-2xl border p-6 select-none shadow-sm transition-all duration-200">
                            <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10 duration-200">
                                <GitBranch size={80} strokeWidth={1} />
                            </div>
                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-slate-900 dark:text-slate-100 text-xs font-bold tracking-wider uppercase">Master Hierarchy</span>
                            </div>
                            <p className="text-muted-foreground dark:text-slate-400 relative z-10 text-xs leading-relaxed font-medium">
                                Region adalah level menengah dalam hirarki organisasi. Region bersifat global dan dapat digunakan oleh berbagai Group Perusahaan.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="bg-card/40 dark:bg-slate-900/20 backdrop-blur-sm border border-border/60 dark:border-slate-800/60 m-5 rounded-2xl p-6 shadow-sm animate-in fade-in duration-200 select-none">
            <TableMasterData
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
                    canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                            className="h-10 px-5 gap-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 border border-border bg-card dark:bg-slate-900/60 text-foreground shadow-sm hover:bg-muted/60 dark:hover:bg-slate-800/60 hover:border-border hover:shadow-md select-none"
                        >
                            <Plus size={15} className="text-primary" /> Tambah Region
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
        </div>
    );
}
