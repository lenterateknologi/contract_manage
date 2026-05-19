import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface CompanyManagementProps {
    companies: any;
    regions: any;
    groups: any;
    filters: any;
}

const COMPANY_COLORS = [
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
];

function companyColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return COMPANY_COLORS[Math.abs(h) % COMPANY_COLORS.length];
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
            <span className="mb-0.5 truncate text-sm leading-tight font-bold tracking-wide text-slate-900 dark:text-slate-100">{name}</span>
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
        company_group_id: '',
        region_id: '',
        address: '',
    });

    // --- Deep Linking Support ---
    React.useEffect(() => {
        if (filters.action === 'create') {
            openCreate();
            if (filters.region_id) {
                form.setData('region_id', filters.region_id.toString());
            }
            if (filters.company_group_id) {
                form.setData('company_group_id', filters.company_group_id.toString());
            }
        } else if (filters.action === 'edit' && filters.id) {
            const company = (Array.isArray(companies) ? companies : companies?.data || []).find((c: any) => c.id === filters.id);
            if (company) openEdit(company);
        }
    }, [filters.action, filters.id, filters.region_id, filters.company_group_id]);

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Nama Company',
                accessorKey: 'name',
                cell: (row) => <CompanyCell name={row.name} />,
            },
            {
                header: 'Kode',
                accessorKey: 'code',
                cell: (row) => <span className="text-muted-foreground text-sm font-medium tracking-wide dark:text-slate-300/80">{row.code}</span>,
            },
            {
                header: 'Region / Group',
                accessorKey: 'region.name',
                cell: (row) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">{row.region?.name || '—'}</span>
                        <span className="text-muted-foreground/60 text-[10px] font-bold uppercase dark:text-slate-500">{row.group?.name || '—'}</span>
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

    const openEdit = (company: any) => {
        setEditingCompany(company);
        form.setData({
            name: company.name,
            code: company.code,
            alias: company.alias || '',
            company_group_id: company.company_group_id?.toString() || '',
            region_id: company.region_id?.toString() || '',
            address: company.address || '',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingCompany(null);
        form.reset();
        // Clear filters if we were in a deep-linked state
        if (filters.action || filters.id || filters.region_id || filters.company_group_id) {
            router.get(
                globalThis.location.pathname,
                { ...filters, action: undefined, id: undefined, region_id: undefined, company_group_id: undefined },
                { preserveState: true, replace: true },
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingCompany ? 'Company diperbarui' : 'Company baru ditambahkan', 'success');
            },
        };
        if (editingCompany) form.put(`/admin/companies/${editingCompany.id}`, options);
        else form.post('/admin/companies', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingCompany ? 'Update Data Company' : 'Registrasi Data Company'}
                subtitle={editingCompany ? 'Pengaturan detail entitas perusahaan' : 'Registrasi entitas bisnis atau perusahaan baru'}
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
                            className="h-10 rounded-xl border border-rose-500/20 px-4 text-xs font-bold text-rose-500 transition-all duration-200 select-none hover:bg-rose-500 hover:text-white active:scale-95 dark:hover:bg-rose-500/20"
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
                                showToast('Company telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus company ${editingCompany?.name}? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Hapus Company"
                />
                <div className="animate-in fade-in grid grid-cols-1 gap-8 duration-200 select-none md:grid-cols-12">
                    <div className="space-y-8 md:col-span-8">
                        <FormSection title="Informasi Company" subtitle="Nama dan pemetaan wilayah operasional perusahaan">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                                        Grup Perusahaan / Group
                                    </label>
                                    <Select value={form.data.company_group_id} onValueChange={(v: string) => form.setData('company_group_id', v)}>
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue placeholder="PILIH GRUP..." />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            {(groups || []).map((g: any) => (
                                                <SelectItem key={g.id} value={g.id.toString()} className="py-2.5 text-xs font-bold uppercase">
                                                    {g.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.company_group_id && (
                                        <p className="mt-1 text-[10px] font-bold tracking-tight text-rose-500 uppercase">
                                            {form.errors.company_group_id}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                                        Wilayah / Region
                                    </label>
                                    <Select value={form.data.region_id} onValueChange={(v: string) => form.setData('region_id', v)}>
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue placeholder="PILIH REGION..." />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            {(regions || []).map((r: any) => (
                                                <SelectItem key={r.id} value={r.id.toString()} className="py-2.5 text-xs font-bold uppercase">
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                            {(regions || []).length === 0 && (
                                                <div className="text-muted-foreground p-4 text-center text-[10px] font-bold uppercase">
                                                    TIDAK ADA DATA REGION
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.region_id && (
                                        <p className="mt-1 text-[10px] font-bold tracking-tight text-rose-500 uppercase">{form.errors.region_id}</p>
                                    )}
                                </div>
                                <CompactInput
                                    label="Nama Perusahaan"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: PT. SEJAHTERA BERSAMA"
                                    error={form.errors.name}
                                />
                                <CompactInput
                                    label="Kode Perusahaan"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    placeholder="CONTOH: COMP-SB"
                                    error={form.errors.code}
                                />
                                <CompactInput
                                    label="Alias"
                                    value={form.data.alias}
                                    onChange={(e) => form.setData('alias', e.target.value)}
                                    placeholder="CONTOH: PSB"
                                    error={form.errors.alias}
                                />
                                <CompactInput
                                    label="Alamat"
                                    value={form.data.address}
                                    onChange={(e) => form.setData('address', e.target.value)}
                                    placeholder="ALAMAT LENGKAP PERUSAHAAN..."
                                    error={form.errors.address}
                                />
                            </div>
                        </FormSection>
                    </div>

                    <div className="flex flex-col gap-8 md:col-span-4">
                        <div className="border-border/80 bg-muted/20 group relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-200 select-none dark:border-slate-800/80 dark:bg-slate-900/40">
                            <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity duration-200 group-hover:opacity-10">
                                <Building2 size={80} strokeWidth={1} />
                            </div>
                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">
                                    Master Hierarchy
                                </span>
                            </div>
                            <p className="text-muted-foreground relative z-10 text-xs leading-relaxed font-medium dark:text-slate-400">
                                Company adalah level unit bisnis operasional. Ini adalah level paling granular dalam hirarki Master Data yang akan
                                digunakan untuk penentuan otoritas penyetuju.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="bg-card/40 border-border/60 animate-in fade-in m-5 rounded-2xl border p-6 shadow-sm backdrop-blur-sm duration-200 select-none dark:border-slate-800/60 dark:bg-slate-900/20">
            <TableMasterData
                title="Database Entitas Perusahaan"
                columns={columns}
                borderless={true}
                data={Array.isArray(companies) ? companies : companies?.data || []}
                searchPlaceholder="Cari company..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                headerActions={
                    canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                            className="border-border bg-card text-foreground hover:bg-muted/60 hover:border-border h-10 gap-2 rounded-xl border px-5 text-xs font-bold tracking-wide shadow-sm transition-all duration-200 select-none hover:shadow-md dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
                        >
                            <Plus size={15} className="text-primary" /> Tambah Company
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
                                      if (confirm(`Hapus ${ids.length} company terpilih?`)) {
                                          router.post(
                                              '/admin/companies/bulk-delete',
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} company telah dihapus`, 'success'),
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
