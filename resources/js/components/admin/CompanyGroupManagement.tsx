import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Users, Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';

interface CompanyGroupManagementProps {
    groups: any;
    filters: any;
}

const GROUP_COLORS = [
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
];

function groupColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return GROUP_COLORS[Math.abs(h) % GROUP_COLORS.length];
}

const GroupCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 shadow-sm backdrop-blur-sm select-none', groupColor(name))}>
            <Users size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="text-slate-900 dark:text-slate-100 mb-0.5 truncate text-sm leading-tight font-bold tracking-wide">{name}</span>
        </div>
    </div>
);

export function CompanyGroupManagement({ groups, filters }: Readonly<CompanyGroupManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_GROUPS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingGroup, setEditingGroup] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        code: '',
        description: '',
    });

    // --- Deep Linking Support ---
    React.useEffect(() => {
        if (filters.action === 'create') {
            openCreate();
        } else if (filters.action === 'edit' && filters.id) {
            const group = (Array.isArray(groups) ? groups : groups?.data || []).find((g: any) => g.id === filters.id);
            if (group) openEdit(group);
        }
    }, [filters.action, filters.id]);

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Nama Group',
                accessorKey: 'name',
                cell: (row) => <GroupCell name={row.name} />,
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
                header: 'Deskripsi',
                accessorKey: 'description',
                cell: (row) => (
                    <span className="text-muted-foreground dark:text-slate-300/80 line-clamp-1 max-w-[300px] text-sm font-medium tracking-wide">
                        {row.description || '—'}
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
        setEditingGroup(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (group: any) => {
        setEditingGroup(group);
        form.setData({
            name: group.name,
            code: group.code,
            description: group.description || '',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingGroup(null);
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
                showToast(editingGroup ? 'Group diperbarui' : 'Group baru ditambahkan', 'success');
            },
        };
        if (editingGroup) form.put(`/admin/company-groups/${editingGroup.id}`, options);
        else form.post('/admin/company-groups', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingGroup ? 'Update Data Group' : 'Registrasi Data Group'}
                subtitle={editingGroup ? 'Pengaturan detail grup perusahaan' : 'Registrasi entitas grup perusahaan baru'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingGroup}
                headerActions={
                    editingGroup &&
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
                        router.delete(`/admin/company-groups/${editingGroup.id}`, {
                            onSuccess: () => {
                                closeForm();
                                showToast('Group telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus group ${editingGroup?.name}? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Hapus Group"
                />
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12 select-none animate-in fade-in duration-200">
                    <div className="space-y-8 md:col-span-8">
                        <FormSection title="Informasi Group" subtitle="Nama dan deskripsi entitas grup">
                            <div className="grid grid-cols-1 gap-6">
                                <CompactInput
                                    label="Nama Group Perusahaan"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: HOLDING ABC"
                                    error={form.errors.name}
                                />
                                <CompactInput
                                    label="Kode Group"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    placeholder="CONTOH: HOLD-ABC"
                                    error={form.errors.code}
                                />
                                <CompactInput
                                    label="Deskripsi"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN DESKRIPSI GRUP INI..."
                                    error={form.errors.description}
                                />
                            </div>
                        </FormSection>

                        {editingGroup && (
                            <>
                                <FormSection 
                                    title="Daftar Perusahaan" 
                                    subtitle="Daftar unit bisnis yang terdaftar dalam grup ini"
                                    headerAction={
                                        <Button
                                            type="button"
                                            variant="white"
                                            size="sm"
                                            onClick={() => router.get('/admin/companies', { action: 'create', company_group_id: editingGroup.id })}
                                            className="h-8 gap-2 rounded-lg border border-primary/10 bg-primary/5 text-[10px] font-bold text-primary transition-all hover:bg-primary hover:text-white"
                                        >
                                            <Plus size={12} /> Tambah Company
                                        </Button>
                                    }
                                >
                                <div className="divide-y divide-primary/5 rounded-xl border border-primary/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                                    {editingGroup.companies?.length > 0 ? (
                                        editingGroup.companies.map((company: any) => (
                                            <div key={company.id} className="flex items-center justify-between p-4 transition-colors hover:bg-primary/[0.04]">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase tracking-wide text-primary dark:text-white">{company.name}</span>
                                                    <span className="text-[10px] font-medium text-primary/40 dark:text-white/40 uppercase tracking-widest">{company.code} • {company.region?.name || 'GLOBAL'}</span>
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
                                <Users size={80} strokeWidth={1} />
                            </div>
                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-slate-900 dark:text-slate-100 text-xs font-bold tracking-wider uppercase">Master Hierarchy</span>
                            </div>
                            <p className="text-muted-foreground dark:text-slate-400 relative z-10 text-xs leading-relaxed font-medium">
                                Company Group adalah level tertinggi dalam hirarki organisasi. Satu Group dapat membawahi beberapa Perusahaan (PT) di berbagai wilayah.
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
                title="Database Group Perusahaan"
                columns={columns}
                borderless={true}
                data={Array.isArray(groups) ? groups : groups?.data || []}
                searchPlaceholder="Cari group..."
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
                            <Plus size={15} className="text-primary" /> Tambah Group
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
                                      if (confirm(`Hapus ${ids.length} group terpilih?`)) {
                                          router.post(
                                              '/admin/company-groups/bulk-delete',
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} group telah dihapus`, 'success'),
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
