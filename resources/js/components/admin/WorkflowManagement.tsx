import { useToast } from '@/components/contracts/Toast';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { Button } from '@/components/ui/base/Button';
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { 
    Plus, 
    Shield, 
    Trash2, 
    UserCheck, 
    Users as UsersIcon,
    ShieldCheck,
    Briefcase
} from 'lucide-react';
import React, { useMemo } from 'react';

// --- Cell Components (Compact) ---
const WorkflowNameCell = ({ row }: { readonly row: any }) => (
    <div className="flex flex-col group py-1">
        <div className="flex items-center gap-2">
            <span className="text-[12px] font-black tracking-tight text-primary uppercase group-hover:translate-x-1 transition-transform">{row.name}</span>
            {row.is_default && <div className="px-1.5 py-0.5 rounded bg-primary/[0.05] border border-primary/10 text-[7px] font-black tracking-widest text-primary/40 uppercase">DEFAULT</div>}
        </div>
        <span className="text-[8px] font-bold tracking-widest text-primary/30 uppercase mt-0.5 italic">{row.contract_type || 'GLOBAL'}</span>
    </div>
);

const InitiatorCell = ({ row }: { readonly row: any }) => {
    let text = row.initiator_type === 'all' ? 'Publik' : row.initiator_type === 'role' ? `${row.initiator_roles?.length || 0} Role` : `${row.initiator_users?.length || 0} User`;
    let Icon = row.initiator_type === 'all' ? UsersIcon : row.initiator_type === 'role' ? Shield : UserCheck;
    return (
        <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/[0.03] text-primary/40"><Icon size={10} /></div>
            <span className="text-[9px] font-black tracking-widest text-primary/60 uppercase">{text}</span>
        </div>
    );
};

const StepsCell = ({ row }: { readonly row: any }) => (
    <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
            {row.steps?.slice(0, 3).map((s:any, i:number) => (
                <div key={s.id||i} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white bg-primary text-[9px] font-black text-white shadow-md">{i+1}</div>
            ))}
            {row.steps?.length > 3 && <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white bg-primary/10 text-[8px] font-black text-primary">+{row.steps.length-3}</div>}
        </div>
        <span className="text-[9px] font-black text-primary/30 uppercase tracking-widest">{row.steps?.length || 0} TAHAP</span>
    </div>
);

interface WorkflowManagementProps {
    readonly workflows: any;
    readonly contractTypes: any[];
    readonly filters: any;
}

export function WorkflowManagement({ workflows, contractTypes, filters }: Readonly<WorkflowManagementProps>) {
    const { showToast } = useToast();
    const { canUpdate, canCreate, canDelete } = usePermissions('ADMIN_WORKFLOWS');

    const columns = useMemo<Column<any>[]>(() => [
        { header: 'Identitas Alur', accessorKey: 'name', sortable: true, cell: (row) => <WorkflowNameCell row={row} /> },
        { header: 'Otoritas Inisiasi', accessorKey: 'initiator_type', cell: (row) => <InitiatorCell row={row} /> },
        { header: 'Struktur Tahapan', accessorKey: 'steps_count', cell: (row) => <StepsCell row={row} /> },
    ], []);

    const openCreate = () => {
        router.visit(route('admin.workflows.create'));
    };

    const openEdit = (w: any) => {
        router.visit(route('admin.workflows.edit', w.id));
    };

    return (
        <div className="animate-in fade-in flex h-full flex-col bg-white dark:bg-black antialiased">
            <DataTable
                title="Workflow Management"
                columns={columns}
                data={workflows.data || []}
                searchPlaceholder="Filter alur..."
                searchValue={filters.search || ''}
                onSearchChange={(v) => router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
                onRowClick={openEdit}
                headerActions={
                    canCreate && (
                        <Button variant="primary" onClick={openCreate} className="h-9 px-6 rounded-xl text-[10px] shadow-lg">
                            <Plus size={12} className="mr-2" /> Registrasi Baru
                        </Button>
                    )
                }
                bulkActions={
                    canDelete
                        ? [
                                {
                                    label: 'Hapus Terpilih',
                                    icon: Trash2,
                                    variant: 'destructive',
                                    onClick: (ids: string[]) => {
                                        if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} alur kerja terpilih?`)) {
                                            router.post(
                                                route('admin.workflows.bulk-destroy'),
                                                { ids },
                                                {
                                                    onSuccess: () => showToast(`${ids.length} alur kerja telah dihapus`, 'success'),
                                                },
                                            );
                                        }
                                    },
                                },
                            ]
                        : undefined
                }
                pagination={workflows.meta ? { 
                    currentPage: workflows.meta.current_page || 1, 
                    lastPage: workflows.meta.last_page || 1, 
                    total: workflows.meta.total || 0, 
                    onPageChange: (page) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }) 
                } : undefined}
            />
        </div>
    );
}
