import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { useToast } from '@/components/ui/feedback/Toast';
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { CheckCircle2, Copy, GitBranch, Plus, Trash2, UserCircle } from 'lucide-react';
import { useMemo } from 'react';

const WorkflowNameCell = ({ row }: { row: any }) => (
    <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
            <span className="text-text-main text-xs font-semibold tracking-tight uppercase">{row.name}</span>
            {row.is_default && (
                <div className="bg-success/10 border-success/20 text-success rounded-lg border px-1.5 py-0.5 text-[7px] font-semibold tracking-wider uppercase">
                    DEFAULT
                </div>
            )}
        </div>
        <span className="text-primary/30 mt-0.5 text-[8px] font-semibold uppercase dark:text-white/30">{row.contract_type_name || 'GLOBAL'}</span>
    </div>
);

const InitiatorCell = ({ row }: { row: any }) => {
    const label =
        row.initiator_type === 'all'
            ? 'Seluruh Staff'
            : row.initiator_type === 'department'
              ? 'Per Departemen'
              : row.initiator_type === 'role'
                ? 'Per Jabatan'
                : 'Spesifik User';
    return (
        <div className="flex items-center gap-2">
            <div className="bg-surface-muted rounded-lg p-1.5">
                <UserCircle size={12} className="text-text-soft" />
            </div>
            <span className="text-text-desc text-[10px] font-medium tracking-wider uppercase">{label}</span>
        </div>
    );
};

const StepsCell = ({ row }: { row: any }) => (
    <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
            {[...Array(Math.min(row.steps_count || 0, 3))].map((_, i) => (
                <div key={i} className="border-surface-base bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full border-2">
                    <CheckCircle2 size={10} className="text-primary" />
                </div>
            ))}
            {(row.steps_count || 0) > 3 && (
                <div className="border-surface-base bg-surface-muted text-text-soft flex h-6 w-6 items-center justify-center rounded-full border-2 text-[8px] font-bold">
                    +{(row.steps_count || 0) - 3}
                </div>
            )}
        </div>
        <span className="text-text-main text-[11px] font-semibold">{row.steps_count || 0} Tahapan</span>
    </div>
);

interface WorkflowManagementProps {
    readonly workflows: any;
    readonly contractTypes: any[];
    readonly filters: any;
}

export function WorkflowManagement({ workflows, contractTypes, filters }: Readonly<WorkflowManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canDelete } = usePermissions('ADMIN_WORKFLOWS');

    const columns = useMemo<Column<any>[]>(
        () => [
            { header: 'Identitas Alur', accessorKey: 'name', sortable: true, cell: (row: any) => <WorkflowNameCell row={row} /> },
            { header: 'Otoritas Inisiasi', accessorKey: 'initiator_type', cell: (row: any) => <InitiatorCell row={row} /> },
            { header: 'Struktur Tahapan', accessorKey: 'steps_count', cell: (row: any) => <StepsCell row={row} /> },
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
        <DataTable
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
                <div className="flex items-center gap-3">
                    {canCreate && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={openCreate}
                            className="shadow-primary/20 h-9 gap-2 rounded-xl px-5 text-[10px] font-semibold tracking-widest uppercase shadow-lg"
                        >
                            <Plus size={14} />
                            Alur Baru
                        </Button>
                    )}
                </div>
            }
            rowActions={(row: any) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(row)}
                        className="text-text-main/20 hover:text-text-main hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all"
                        title="Konfigurasi Tahapan"
                    >
                        <GitBranch size={14} />
                    </Button>
                    {canCreate && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menduplikasi alur kerja ini?')) {
                                    router.post(
                                        route('admin.workflows.duplicate', row.id),
                                        {},
                                        {
                                            onSuccess: () => showToast('Alur kerja berhasil diduplikasi', 'success'),
                                        },
                                    );
                                }
                            }}
                            className="text-text-main/20 hover:text-text-main hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all"
                            title="Duplikat Alur"
                        >
                            <Copy size={14} />
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus alur kerja ini?')) {
                                    router.delete(route('admin.workflows.destroy', row.id), {
                                        onSuccess: () => showToast('Alur kerja berhasil dihapus', 'success'),
                                    });
                                }
                            }}
                            className="text-text-main/20 hover:bg-danger/5 hover:text-danger h-9 w-9 rounded-xl transition-all"
                            title="Hapus Alur"
                        >
                            <Trash2 size={14} />
                        </Button>
                    )}
                </div>
            )}
            pagination={{
                currentPage: workflows.current_page || 1,
                lastPage: workflows.last_page || 1,
                total: workflows.total || 0,
                from: workflows.from || 1,
                to: workflows.to || 1,
                perPage: workflows.per_page || 10,
                onPageChange: (page: number) =>
                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}

declare let route: any;
