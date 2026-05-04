import { ManagementForm, FormDangerZone, FormSection } from './ManagementForm';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { router, useForm } from '@inertiajs/react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { Button } from '@/components/ui/base/Button';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/contracts/Toast';

interface DepartmentManagementProps {
    departments: any;
    filters: any;
}

const DEPT_COLORS = ['bg-indigo-100 text-indigo-600','bg-teal-100 text-teal-600','bg-violet-100 text-violet-600','bg-blue-100 text-blue-600','bg-cyan-100 text-cyan-600'];
function deptColor(name: string) { let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h); return DEPT_COLORS[Math.abs(h)%DEPT_COLORS.length]; }

const DeptCell = ({ name, code }: Readonly<{ name: string; code: string }>) => (
    <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', deptColor(name))}>
            <Building2 size={16} />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground leading-tight mb-0.5 truncate">{name}</span>
            <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-muted-foreground/70 leading-none">
                {code}
            </div>
        </div>
    </div>
);

const DescriptionCell = ({ description }: Readonly<{ description?: string }>) => (
    <span className="text-sm font-medium text-muted-foreground/70 line-clamp-1 max-w-[300px]">
        {description || '—'}
    </span>
);

const VisibilityCell = ({ isActive }: Readonly<{ isActive: boolean }>) => (
    <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full shrink-0', isActive ? 'bg-emerald-500' : 'bg-rose-400')} />
        <span className={cn('text-xs font-semibold', isActive ? 'text-emerald-600' : 'text-rose-500')}>
            {isActive ? 'Aktif' : 'Nonaktif'}
        </span>
    </div>
);

export function DepartmentManagement({ departments, filters }: Readonly<DepartmentManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_DEPTS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingDept, setEditingDept] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true as boolean,
    });

    const filterConfig = useMemo(() => [
        {
            label: 'Status Visibilitas',
            key: 'is_active',
            options: [
                { label: 'Visible (Aktif)', value: 'true' },
                { label: 'Hidden (Nonaktif)', value: 'false' },
            ]
        }
    ], []);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(globalThis.location.pathname, { 
            ...filters, 
            ...newFilters, 
            page: 1 
        }, { preserveState: true, replace: true });
    };

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Departemen / Unit',
            accessorKey: 'name',
            cell: (row) => <DeptCell name={row.name} code={row.code} />
        },
        {
            header: 'Deskripsi',
            accessorKey: 'description',
            cell: (row) => <DescriptionCell description={row.description} />
        },
        {
            header: 'Visibilitas',
            accessorKey: 'is_active',
            cell: (row) => <VisibilityCell isActive={row.is_active} />
        },
    ], []);

    const openCreate = () => {
        setEditingDept(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (dept: any) => {
        setEditingDept(dept);
        form.setData({
            code: dept.code || '',
            name: dept.name,
            description: dept.description || '',
            is_active: !!dept.is_active,
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingDept(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingDept ? 'Departemen diperbarui' : 'Departemen baru ditambahkan', 'success');
            }
        };
        if (editingDept) form.put(`/admin/departments/${editingDept.id}`, options);
        else form.post('/admin/departments', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingDept ? 'Update Master Departemen' : 'Registrasi Master Departemen'}
                subtitle={editingDept ? 'Pengaturan detail unit organisasi' : 'Registrasi divisi atau unit organisasi'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingDept}
                headerActions={
                    editingDept && canDelete && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsConfirmOpen(true)}
                            className="h-9 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl px-4 text-xs font-semibold transition-all border border-rose-500/10 active:scale-95"
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
                                showToast('Departemen telah dihapus', 'success');
                            }
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus departemen ${editingDept?.name}? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Hapus Departemen"
                />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Main Column: 8 Columns */}
                    <div className="md:col-span-8 space-y-8">
                        <FormSection 
                            title="Data Organisasi" 
                            subtitle="Identitas unik dan deskripsi unit kerja"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <CompactInput 
                                    label="Kode / Singkatan"
                                    value={form.data.code}
                                    onChange={e => form.setData('code', e.target.value)}
                                    placeholder="CONTOH: IT"
                                    error={form.errors.code}
                                />
                                <CompactInput 
                                    label="Nama Unit Struktural"
                                    value={form.data.name}
                                    onChange={e => form.setData('name', e.target.value)}
                                    placeholder="NAMA LENGKAP DIVISI"
                                    error={form.errors.name}
                                    containerClassName="md:col-span-2"
                                />
                                <CompactInput 
                                    label="Keterangan Fungsi"
                                    value={form.data.description}
                                    onChange={e => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN DESKRIPSI UNIT KERJA INI..."
                                    error={form.errors.description}
                                    containerClassName="md:col-span-3"
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side Column: 4 Columns */}
                    <div className="md:col-span-4 flex flex-col gap-8">
                        <FormSection title="Status Visibilitas">
                            <CompactSwitch 
                                label="Unit Terlihat"
                                description="Tampilkan unit ini di seluruh aplikasi"
                                checked={form.data.is_active}
                                onCheckedChange={c => form.setData('is_active', c)}
                            />
                        </FormSection>

                        <div className="border border-border p-6 bg-muted/30 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Building2 size={80} strokeWidth={1} />
                            </div>
                            
                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <span className="text-xs font-bold tracking-wide text-foreground">Arsitektur Unit</span>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                                Departemen digunakan untuk mengelompokkan pengguna dan menentukan keterlibatan dalam alur persetujuan (Workflow) secara otomatis.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <TableMasterData
                title="Database Unit / Departemen"
                columns={columns}
                borderless={true}
                data={departments.data || []}
                searchPlaceholder="Cari departemen..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) => router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
                filters={filterConfig as any}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                headerActions={
                    canUpdate && (
                        <Button 
                            variant="white"
                            onClick={openCreate} 
                            className="h-10 px-6 rounded-xl gap-2 text-xs font-bold transition-all duration-200 border border-border/40 bg-card text-foreground shadow-sm hover:bg-muted/60 hover:border-border/60 hover:shadow-md active:scale-95"
                        >
                            <Plus size={15} /> Tambah Unit
                        </Button>
                    )
                }
                onRowClick={openEdit}
                bulkActions={canUpdate ? [
                    {
                        label: 'Hapus Terpilih',
                        icon: Trash2,
                        variant: 'destructive',
                        onClick: (ids: string[] | number[]) => {
                            if (confirm(`Hapus ${ids.length} departemen terpilih?`)) {
                                router.post('/admin/departments/bulk-delete', { ids }, {
                                    onSuccess: () => showToast(`${ids.length} departemen telah dihapus`, 'success')
                                });
                            }
                        }
                    }
                ] : undefined}
                pagination={{
                    currentPage: departments.current_page || 1,
                    lastPage: departments.last_page || 1,
                    total: departments.total || 0,
                    from: departments.from || 1,
                    to: departments.to || 1,
                    perPage: departments.per_page || 10,
                    onPageChange: (page: number) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp: number) => router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
                }}
            />
        </div>
    );
}
