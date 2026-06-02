import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { ExcelActions } from '@/components/ui/data/ExcelActions';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn, groupColor } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Plus, Tags, Trash2, Users } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface CompanyGroupManagementProps {
    groups: any;
    regions: any;
    filters: any;
}

const GroupCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 select-none',
                groupColor(name),
            )}
        >
            <Users size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="mb-0.5 truncate text-sm leading-tight font-semibold tracking-wide text-text-main">{name}</span>
        </div>
    </div>
);

export function CompanyGroupManagement({ groups, regions, filters }: Readonly<CompanyGroupManagementProps>) {
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

    const filterConfig = useMemo(
        () => [
            {
                label: 'Wilayah / Region',
                key: 'region_id',
                type: 'searchable',
                options: (regions || []).map((r: any) => ({ label: r.name, value: r.id })),
            },
        ],
        [regions],
    );

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(
            globalThis.location.pathname,
            {
                ...filters,
                ...newFilters,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

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
                cell: (row) => <span className="text-text-desc text-sm font-medium tracking-wide">{row.code}</span>,
            },
            {
                header: 'Deskripsi',
                accessorKey: 'description',
                cell: (row) => (
                    <span className="text-text-desc line-clamp-1 max-w-[300px] text-sm font-medium tracking-wide">
                        {row.description || '—'}
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
                            className="border-danger/20 px-4 text-xs text-danger transition-all duration-200 hover:bg-danger hover:text-white"
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
                <div className="animate-in fade-in grid grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2 w-full">
                    {/* Side 1: Primary Configuration */}
                    <div className="space-y-12">
                        <FormSection title="Informasi Group" subtitle="Nama dan identitas unik entitas grup perusahaan">
                            <div className="grid grid-cols-1 gap-y-10">
                                <CompactInput
                                    label="Nama Group Perusahaan"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: HOLDING ABC"
                                    error={form.errors.name}
                                    icon={Users}
                                />
                                <CompactInput
                                    label="Kode Group"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    placeholder="CONTOH: HOLD-ABC"
                                    error={form.errors.code}
                                    icon={Tags}
                                />
                                <CompactInput
                                    label="Deskripsi"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN DESKRIPSI GRUP INI SECARA MENDALAM..."
                                    error={form.errors.description}
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side 2: Associated Companies & Metadata */}
                    <div className="space-y-12">
                        {editingGroup && (
                            <FormSection
                                title="Unit Bisnis Terdaftar"
                                subtitle="Daftar perusahaan yang berada di bawah naungan grup ini"
                                headerAction={
                                    <Button
                                        type="button"
                                        variant="white"
                                        size="sm"
                                        onClick={() => router.get('/admin/companies', { action: 'create', company_group_id: editingGroup.id })}
                                        className="h-8 rounded-lg border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all"
                                    >
                                        <Plus size={12} className="mr-1.5" /> Tambah Company
                                    </Button>
                                }
                            >
                                <div className="border-black/[0.03] dark:border-white/[0.03] rounded-2xl border-2 border-dashed p-6 transition-all duration-200 overflow-hidden">
                                    {editingGroup.companies?.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {editingGroup.companies.map((company: any) => (
                                                <div
                                                    key={company.id}
                                                    className="group flex items-center justify-between rounded-xl border border-black/[0.03] dark:border-white/[0.03] bg-black/[0.01] dark:bg-white/[0.01] p-4 transition-all hover:border-primary/30 hover:bg-white dark:hover:bg-black"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-bold text-slate-700 tracking-tight dark:text-slate-300">
                                                            {company.name}
                                                        </span>
                                                        <span className="text-text-soft text-[10px] font-medium uppercase mt-0.5">
                                                            {company.code} • {company.region?.name || 'GLOBAL'}
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
                                        <div className="flex flex-col items-center justify-center py-12 bg-black/[0.01] dark:bg-white/[0.01] rounded-xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Belum ada unit bisnis terdaftar</p>
                                        </div>
                                    )}
                                </div>
                            </FormSection>
                        )}

                        <div className="animate-in fade-in flex gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm duration-300 dark:bg-primary/10">
                            <Users size={24} className="mt-0.5 shrink-0 text-primary" />
                            <p className="text-[11px] leading-relaxed font-semibold text-primary/80 uppercase tracking-tight">
                                Company Group adalah level tertinggi dalam hirarki organisasi. Satu Group dapat membawahi beberapa Perusahaan (PT) di berbagai wilayah untuk konsolidasi data dan pelaporan.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Database Group Perusahaan"
            columns={columns}
            borderless={true}
            data={Array.isArray(groups) ? groups : groups?.data || []}
            searchPlaceholder="Cari group..."
            searchValue={filters.search || ''}
            onSearchChange={(v: string) =>
                router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
            }
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            headerActions={
                <div className="flex items-center gap-2">
                    <ExcelActions
                        exportRoute="admin.company-groups.export"
                        importRoute="admin.company-groups.import"
                        label="Group"
                    />
                    {canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                        >
                            <Plus size={15} className="text-primary" /> Tambah Group
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
            pagination={{
                currentPage: groups.current_page || 1,
                lastPage: groups.last_page || 1,
                total: groups.total || 0,
                from: groups.from || 1,
                to: groups.to || 1,
                perPage: groups.per_page || 10,
                onPageChange: (page: number) =>
                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
