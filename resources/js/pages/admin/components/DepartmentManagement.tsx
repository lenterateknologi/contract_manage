import { Button } from '@/components/ui/buttons/Button';
import { Column, DataTable } from '@/components/ui/tables/DataTable';
import { ExcelActions } from '@/components/ui/tables/ExcelActions';
import { useToast } from '@/components/ui/feedback/Toast';
import { CompactInput } from '@/components/ui/inputs/CompactInput';
import { CompactSwitch } from '@/components/ui/selection/CompactSwitch';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn, deptColor } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Building2, Info, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface DepartmentManagementProps {
    departments: any;
    filters: any;
}

const DeptCell = ({ name, code }: Readonly<{ name: string; code: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 select-none',
                deptColor(name),
            )}
        >
            <Building2 size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="text-text-main mb-0.5 truncate text-sm leading-tight font-semibold tracking-wide">{name}</span>
            <span className="text-text-desc font-mono text-[10px] font-medium tracking-widest uppercase">{code}</span>
        </div>
    </div>
);

export function DepartmentManagement({ departments, filters }: Readonly<DepartmentManagementProps>) {
    const { showToast } = useToast();
    const { canUpdate, canDelete } = usePermissions('ADMIN_DEPTS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingDept, setEditingDept] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    // Deep Linking Support
    React.useEffect(() => {
        if (filters.action === 'create') {
            openCreate();
        } else if (filters.action === 'edit' && filters.id) {
            const dept = (Array.isArray(departments) ? departments : departments?.data || []).find((d: any) => d.id === filters.id);
            if (dept) openEdit(dept);
        }
    }, [filters.action, filters.id]);

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: (
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-text-desc" />
                        <span>Unit Struktural</span>
                    </div>
                ),
                accessorKey: 'name',
                sortable: true,
                cell: (row) => <DeptCell name={row.name} code={row.code} />,
            },
            {
                header: (
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-text-desc" />
                        <span>Keterangan Fungsi</span>
                    </div>
                ),
                accessorKey: 'description',
                cell: (row) => (
                    <span className="text-text-desc line-clamp-1 max-w-[400px] text-xs font-medium tracking-wide">{row.description || '—'}</span>
                ),
            },
            {
                header: (
                    <div className="flex items-center justify-end gap-2">
                        <ShieldCheck size={14} className="text-text-desc" />
                        <span>Status</span>
                    </div>
                ),
                accessorKey: 'is_active',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2 select-none">
                        <div className={cn('h-2 w-2 rounded-full', row.is_active ? 'bg-success animate-pulse' : 'bg-surface-muted')} />
                        <span
                            className={cn(
                                'text-xs font-semibold tracking-wide transition-colors duration-200 select-none',
                                row.is_active ? 'text-text-main' : 'text-text-desc',
                            )}
                        >
                            {row.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                    </div>
                ),
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingDept(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (d: any) => {
        setEditingDept(d);
        form.setData({
            name: d.name,
            code: d.code,
            description: d.description || '',
            is_active: !!d.is_active,
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingDept(null);
        form.reset();
        if (filters.action || filters.id) {
            router.get(globalThis.location.pathname, { ...filters, action: undefined, id: undefined }, { preserveState: true, replace: true });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingDept ? 'Unit diperbarui' : 'Unit baru ditambahkan', 'success');
            },
        };
        if (editingDept) form.put(`/admin/departments/${editingDept.id}`, options);
        else form.post('/admin/departments', options);
    };

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(globalThis.location.pathname, { ...filters, ...newFilters, page: 1 }, { preserveState: true, replace: true });
    };

    const filterConfig = useMemo(() => [], []);

    if (isFormView) {
        return (
            <ManagementForm
                title={editingDept ? 'Update Unit Struktural' : 'Registrasi Unit Baru'}
                subtitle={editingDept ? 'Mengatur parameter organisasi unit' : 'Menambahkan departemen baru ke dalam hirarki'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingDept}
                headerActions={
                    editingDept &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsConfirmOpen(true)}
                            className="border-danger/20 text-danger hover:bg-danger px-4 text-xs transition-all duration-200 hover:text-white"
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
                        router.delete(`/admin/departments/${editingDept.id}`, {
                            onSuccess: () => {
                                closeForm();
                                showToast('Unit telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus unit ${editingDept?.name}? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Hapus Unit"
                />
                <div className="animate-in fade-in grid w-full grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2">
                    {/* Side 1: Primary Configuration */}
                    <div className="space-y-12">
                        <FormSection title="Data Organisasi" subtitle="Identitas unik dan deskripsi unit kerja">
                            <div className="grid grid-cols-1 gap-y-10">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                    <CompactInput
                                        label="Kode / Singkatan"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        placeholder="CONTOH: IT"
                                        error={form.errors.code}
                                        icon={Building2}
                                    />
                                    <CompactInput
                                        label="Nama Unit Struktural"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="NAMA LENGKAP DIVISI"
                                        error={form.errors.name}
                                        containerClassName="md:col-span-2"
                                        icon={Building2}
                                    />
                                </div>
                                <CompactInput
                                    label="Keterangan Fungsi"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN DESKRIPSI UNIT KERJA INI SECARA MENDALAM..."
                                    error={form.errors.description}
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side 2: Visibility & Metadata */}
                    <div className="space-y-12">
                        <FormSection title="Status Visibilitas" subtitle="Mengatur kemunculan unit dalam sistem">
                            <CompactSwitch
                                label="Unit Terlihat"
                                description="Tampilkan unit ini di seluruh aplikasi dan mesin alur kerja"
                                checked={form.data.is_active}
                                onCheckedChange={(c) => form.setData('is_active', c)}
                            />
                        </FormSection>

                        <div className="animate-in fade-in flex gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 backdrop-blur-sm duration-300 dark:bg-indigo-500/10">
                            <Building2 size={24} className="mt-0.5 shrink-0 text-indigo-500" />
                            <p className="text-[11px] leading-relaxed font-semibold tracking-tight text-indigo-700/80 uppercase">
                                Departemen digunakan untuk mengelompokkan pengguna dan menentukan keterlibatan dalam alur persetujuan (Workflow)
                                secara otomatis berdasarkan struktur organisasi.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Database Unit / Departemen"
            columns={columns}
            borderless={true}
            data={departments.data || []}
            searchPlaceholder="Cari departemen..."
            searchValue={filters.search || ''}
            onSearchChange={(v: string) =>
                router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
            }
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            headerActions={
                <div className="flex items-center gap-2">
                    <ExcelActions exportRoute="admin.departments.export" importRoute="admin.departments.import" label="Departemen" />
                    {canUpdate && (
                        <Button variant="white" onClick={openCreate}>
                            <Plus size={15} className="text-primary" /> Tambah Unit
                        </Button>
                    )}
                </div>
            }
            onRowClick={openEdit}
            bulkActions={
                canUpdate
                    ? [
                          {
                              label: 'Hapus Terpilih',
                              icon: Trash2,
                              variant: 'destructive',
                              onClick: (ids: string[] | number[]) => {
                                  if (confirm(`Hapus ${ids.length} departemen terpilih?`)) {
                                      router.post(
                                          '/admin/departments/bulk-delete',
                                          { ids },
                                          {
                                              onSuccess: () => showToast(`${ids.length} departemen telah dihapus`, 'success'),
                                          },
                                      );
                                  }
                              },
                          },
                      ]
                    : undefined
            }
            pagination={{
                currentPage: departments.current_page || 1,
                lastPage: departments.last_page || 1,
                total: departments.total || 0,
                from: departments.from || 1,
                to: departments.to || 1,
                perPage: departments.per_page || 10,
                onPageChange: (page: number) =>
                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
