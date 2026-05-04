import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { Plus, Shield, Trash2, UserCheck, Users as UsersIcon } from 'lucide-react';
import { useMemo } from 'react';

// --- Cell Components (Compact) ---
const WorkflowNameCell = ({ row }: { readonly row: any }) => (
    <div className="group flex flex-col py-1">
        <div className="flex items-center gap-2">
            <span className="text-primary text-[12px] font-semibold tracking-tight uppercase transition-transform group-hover:translate-x-1 dark:text-white">
                {row.name}
            </span>
            {row.is_default && (
                <div className="bg-primary/[0.05] border-primary/10 text-primary/40 rounded border px-1.5 py-0.5 text-[7px] font-semibold tracking-widest uppercase dark:border-white/10 dark:bg-white/[0.05] dark:text-white/40">
                    DEFAULT
                </div>
            )}
        </div>
        <span className="text-primary/30 mt-0.5 text-[8px] font-bold tracking-widest uppercase italic dark:text-white/30">
            {row.contract_type || 'GLOBAL'}
        </span>
    </div>
);

const InitiatorCell = ({ row }: { readonly row: any }) => {
    let text =
        row.initiator_type === 'all'
            ? 'Publik'
            : row.initiator_type === 'role'
              ? `${row.initiator_roles?.length || 0} Role`
              : `${row.initiator_users?.length || 0} User`;
    let Icon = row.initiator_type === 'all' ? UsersIcon : row.initiator_type === 'role' ? Shield : UserCheck;
    return (
        <div className="flex items-center gap-2">
            <div className="bg-primary/[0.03] text-primary/40 rounded-md p-1 dark:bg-white/[0.03] dark:text-white/40">
                <Icon size={10} />
            </div>
            <span className="text-primary/60 text-[9px] font-semibold tracking-widest uppercase dark:text-white/60">{text}</span>
        </div>
    );
};

const StepsCell = ({ row }: { readonly row: any }) => (
    <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
            {row.steps?.slice(0, 3).map((s: any, i: number) => (
                <div
                    key={s.id || i}
                    className="bg-primary flex h-7 w-7 items-center justify-center rounded-lg border border-white text-[9px] font-semibold text-white shadow-md"
                >
                    {i + 1}
                </div>
            ))}
            {row.steps?.length > 3 && (
                <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg border border-white text-[8px] font-semibold dark:bg-white/10 dark:text-white">
                    +{row.steps.length - 3}
                </div>
            )}
        </div>
        <span className="text-primary/30 text-[9px] font-semibold tracking-widest uppercase dark:text-white/30">{row.steps?.length || 0} TAHAP</span>
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

    const columns = useMemo<Column<any>[]>(
        () => [
            { header: 'Identitas Alur', accessorKey: 'name', sortable: true, cell: (row) => <WorkflowNameCell row={row} /> },
            { header: 'Otoritas Inisiasi', accessorKey: 'initiator_type', cell: (row) => <InitiatorCell row={row} /> },
            { header: 'Struktur Tahapan', accessorKey: 'steps_count', cell: (row) => <StepsCell row={row} /> },
        ],
        [],
    );

    const openCreate = () => {
        router.visit(route('admin.workflows.create'));
    };

    const openEdit = (w: any) => {
        router.visit(route('admin.workflows.edit', w.id));
    };

    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <TableMasterData
                title="Manajemen Alur Kerja"
                borderless={true}
                columns={columns}
                data={workflows.data || []}
                searchPlaceholder="Filter alur..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                onRowClick={openEdit}
                headerActions={
                    canCreate && (
                        <Button 
                            variant="white" 
                            onClick={openCreate} 
                            className="h-10 px-6 rounded-xl gap-2 text-xs font-bold transition-all duration-200 border border-border/40 bg-card text-foreground shadow-sm hover:bg-muted/60 hover:border-border/60 hover:shadow-md active:scale-95"
                        >
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
                pagination={
                    workflows.meta
                        ? {
                              currentPage: workflows.meta.current_page || 1,
                              lastPage: workflows.meta.last_page || 1,
                              total: workflows.meta.total || 0,
                              onPageChange: (page: number) =>
                                  router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                          }
                        : undefined
                }
            />
        </div>
    );
}
