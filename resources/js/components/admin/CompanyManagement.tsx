import { useToast } from '@/components/ui/feedback/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { ExcelActions } from '@/components/ui/data/ExcelActions';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn, companyColor } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Building2, MapPin, Plus, Tags, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface CompanyManagementProps {
    companies: any;
    regions: any;
    groups: any;
    filters: any;
}

const CompanyCell = ({ name }: Readonly<{ name: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 select-none',
                companyColor(name),
            )}
        >
            <Building2 size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="mb-0.5 truncate text-sm leading-tight font-semibold tracking-wide text-text-main">{name}</span>
        </div>
    </div>
);

export function CompanyManagement({ companies, regions, groups, filters }: Readonly<CompanyManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_COMPANIES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingCompany, setEditingCompany] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        code: '',
        alias: '',
        address: '',
        company_group_id: '',
        region_id: '',
    });

    // Deep Linking
    React.useEffect(() => {
        if (filters.action === 'create') {
            openCreate();
        } else if (filters.action === 'edit' && filters.id) {
            const comp = (Array.isArray(companies) ? companies : companies?.data || []).find((c: any) => c.id === filters.id);
            if (comp) openEdit(comp);
        }
    }, [filters.action, filters.id, companies]);

    const filterConfig = useMemo(
        () => [
            {
                label: 'Grup Perusahaan',
                key: 'company_group_id',
                type: 'searchable',
                options: (groups || []).map((g: any) => ({ label: g.name, value: g.id })),
            },
            {
                label: 'Wilayah / Region',
                key: 'region_id',
                type: 'searchable',
                options: (regions || []).map((r: any) => ({ label: r.name, value: r.id })),
            },
        ],
        [groups, regions],
    );

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(
            globalThis.location.pathname,
            { ...filters, ...newFilters, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Nama Perusahaan',
                accessorKey: 'name',
                cell: (row) => <CompanyCell name={row.name} />,
            },
            {
                header: 'Kode & Alias',
                accessorKey: 'code',
                cell: (row) => (
                    <div className="flex flex-col">
                        <span className="text-text-main text-sm font-semibold">{row.code}</span>
                        <span className="text-text-soft text-[10px] font-medium uppercase tracking-tight">{row.alias || '—'}</span>
                    </div>
                ),
            },
            {
                header: 'Group & Region',
                accessorKey: 'company_group_id',
                cell: (row) => (
                    <div className="flex flex-col">
                        <span className="text-text-main text-xs font-semibold uppercase">{row.group?.name || '—'}</span>
                        <span className="text-text-desc text-[10px] font-medium uppercase">{row.region?.name || 'GLOBAL'}</span>
                    </div>
                ),
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingCompany(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (comp: any) => {
        setEditingCompany(comp);
        form.setData({
            name: comp.name,
            code: comp.code,
            alias: comp.alias || '',
            address: comp.address || '',
            company_group_id: String(comp.company_group_id || ''),
            region_id: String(comp.region_id || ''),
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingCompany(null);
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
                showToast(editingCompany ? 'Data perusahaan diperbarui' : 'Perusahaan baru didaftarkan', 'success');
            },
        };
        if (editingCompany) form.put(`/admin/companies/${editingCompany.id}`, options);
        else form.post('/admin/companies', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingCompany ? 'Profil Perusahaan' : 'Registrasi Perusahaan'}
                subtitle={editingCompany ? 'Manajemen detail identitas unit bisnis' : 'Pendaftaran unit bisnis baru dalam sistem'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingCompany}
                headerActions={
                    editingCompany &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsConfirmOpen(true)}
                            className="border-danger/20 text-danger hover:bg-danger hover:text-white px-4 text-xs transition-all"
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
                        router.delete(`/admin/companies/${editingCompany.id}`, {
                            onSuccess: () => {
                                closeForm();
                                showToast('Perusahaan telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus ${editingCompany?.name}? Data operasional terkait akan terdampak.`}
                    confirmText="Hapus Perusahaan"
                />
                <div className="animate-in fade-in grid grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2 w-full">
                    {/* Side 1: Core Configuration */}
                    <div className="space-y-12">
                        <FormSection title="Identitas Korporasi" subtitle="Parameter dasar yang mendefinisikan entitas perusahaan">
                            <div className="grid grid-cols-1 gap-y-10">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-2.5">
                                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest dark:text-white/60">
                                            Grup Perusahaan / Group
                                        </label>
                                        <Select value={form.data.company_group_id} onValueChange={(v: string) => form.setData('company_group_id', v)}>
                                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-11 rounded-xl text-xs font-bold transition-all shadow-sm ring-1 ring-black/[0.03]">
                                                <SelectValue placeholder="PILIH GRUP..." />
                                            </SelectTrigger>
                                            <SelectContent className="border-surface-border rounded-xl bg-surface-base shadow-2xl">
                                                {(groups || []).map((g: any) => (
                                                    <SelectItem key={g.id} value={g.id.toString()} className="py-2.5 text-xs font-bold uppercase text-black dark:text-white">
                                                        {g.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.company_group_id && (
                                            <p className="mt-1.5 text-[10px] font-bold tracking-tight text-danger uppercase">
                                                {form.errors.company_group_id}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest dark:text-white/60">
                                            Wilayah / Region
                                        </label>
                                        <Select value={form.data.region_id} onValueChange={(v: string) => form.setData('region_id', v)}>
                                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-11 rounded-xl text-xs font-bold transition-all shadow-sm ring-1 ring-black/[0.03]">
                                                <SelectValue placeholder="PILIH REGION..." />
                                            </SelectTrigger>
                                            <SelectContent className="border-surface-border rounded-xl bg-surface-base shadow-2xl">
                                                {(regions || []).map((r: any) => (
                                                    <SelectItem key={r.id} value={r.id.toString()} className="py-2.5 text-xs font-bold uppercase text-black dark:text-white">
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.region_id && (
                                            <p className="mt-1.5 text-[10px] font-bold tracking-tight text-danger uppercase">{form.errors.region_id}</p>
                                        )}
                                    </div>
                                </div>

                                <CompactInput
                                    label="Nama Resmi Perusahaan"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: PT. SEJAHTERA BERSAMA"
                                    error={form.errors.name}
                                    icon={Building2}
                                />
                                
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <CompactInput
                                        label="Kode Entitas"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        placeholder="CONTOH: COMP-SB"
                                        error={form.errors.code}
                                        icon={Tags}
                                    />
                                    <CompactInput
                                        label="Alias Visual"
                                        value={form.data.alias}
                                        onChange={(e) => form.setData('alias', e.target.value)}
                                        placeholder="CONTOH: PSB"
                                        error={form.errors.alias}
                                    />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    {/* Side 2: Logistics & Metadata */}
                    <div className="space-y-12">
                        <FormSection title="Domisili & Lokasi" subtitle="Alamat resmi untuk keperluan korespondensi kontrak">
                            <CompactInput
                                label="Alamat Lengkap Kantor"
                                value={form.data.address}
                                onChange={(e) => form.setData('address', e.target.value)}
                                placeholder="ALAMAT LENGKAP PERUSAHAAN..."
                                error={form.errors.address}
                                icon={MapPin}
                            />
                        </FormSection>

                        <div className="animate-in fade-in flex gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm duration-300 dark:bg-primary/10">
                            <Building2 size={24} className="mt-0.5 shrink-0 text-primary" />
                            <p className="text-[11px] leading-relaxed font-semibold text-primary/80 uppercase tracking-tight">
                                Company adalah level unit bisnis operasional paling granular dalam hirarki Master Data yang akan digunakan untuk penentuan otoritas penyetuju dan penomoran kontrak otomatis.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Direktori Unit Bisnis (Company)"
            columns={columns}
            borderless={true}
            data={Array.isArray(companies) ? companies : companies?.data || []}
            searchPlaceholder="Cari perusahaan..."
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
                        exportRoute="admin.companies.export"
                        importRoute="admin.companies.import"
                        label="Perusahaan"
                    />
                    {canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                        >
                            <Plus size={15} className="text-primary" /> Registrasi Company
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
                                  if (confirm(`Hapus ${ids.length} perusahaan terpilih?`)) {
                                      router.post(
                                          '/admin/companies/bulk-delete',
                                          { ids },
                                          {
                                              onSuccess: () => showToast(`${ids.length} perusahaan telah dihapus`, 'success'),
                                          },
                                      );
                                  }
                              },
                          },
                      ]
                    : undefined
            }
            pagination={{
                currentPage: companies.current_page || 1,
                lastPage: companies.last_page || 1,
                total: companies.total || 0,
                from: companies.from || 1,
                to: companies.to || 1,
                perPage: companies.per_page || 10,
                onPageChange: (page: number) =>
                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
