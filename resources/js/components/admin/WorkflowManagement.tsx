import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { Modal } from '@/components/ui/overlays/Modal';
import { usePermissions } from '@/hooks/use-permissions';
import { router } from '@inertiajs/react';
import { Download, FileJson, Loader2, Plus, Shield, Trash2, Upload, UserCheck, Users as UsersIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

// --- Cell Components (Compact) ---
const WorkflowNameCell = ({ row }: { readonly row: any }) => (
    <div className="group flex flex-col py-1">
        <div className="flex items-center gap-2">
            <span className="text-primary text-[12px] font-semibold tracking-tight uppercase transition-transform group-hover:translate-x-1 dark:text-white">
                {row.name}
            </span>
            {row.is_default && (
                <div className="bg-primary/[0.05] border-primary/10 text-primary/40 rounded border px-1.5 py-0.5 text-[7px] font-semibold uppercase dark:border-white/10 dark:bg-white/[0.05] dark:text-white/40">
                    DEFAULT
                </div>
            )}
        </div>
        <span className="text-primary/30 mt-0.5 text-[8px] font-bold uppercase italic dark:text-white/30">{row.contract_type || 'GLOBAL'}</span>
    </div>
);

const InitiatorCell = ({ row }: { readonly row: any }) => {
    const text =
        row.initiator_type === 'all'
            ? 'Publik'
            : row.initiator_type === 'role'
              ? `${row.initiator_roles?.length || 0} Role`
              : `${row.initiator_users?.length || 0} User`;
    const Icon = row.initiator_type === 'all' ? UsersIcon : row.initiator_type === 'role' ? Shield : UserCheck;
    return (
        <div className="flex items-center gap-2">
            <div className="bg-primary/[0.03] text-primary/40 rounded-md p-1 dark:bg-white/[0.03] dark:text-white/40">
                <Icon size={10} />
            </div>
            <span className="text-primary/60 text-[9px] font-semibold uppercase dark:text-white/60">{text}</span>
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
        <span className="text-primary/30 text-[9px] font-semibold uppercase dark:text-white/30">{row.steps?.length || 0} TAHAP</span>
    </div>
);

interface ImportWorkflowModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

function ImportWorkflowModal({ isOpen, onClose, showToast }: Readonly<ImportWorkflowModalProps>) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [parsedData, setParsedData] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const processFile = (selectedFile: File) => {
        if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
            setError('Hanya berkas berformat .json yang diperbolehkan.');
            setFile(null);
            setParsedData(null);
            return;
        }

        setError(null);
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                const dataArray = Array.isArray(json) ? json : [json];

                const isValid = dataArray.every((item) => typeof item === 'object' && item !== null && 'name' in item);
                if (!isValid) {
                    throw new Error("Struktur JSON alur kerja tidak valid. Harus memiliki properti 'name'.");
                }

                setParsedData(dataArray);
            } catch (err: any) {
                setError(err.message || 'Gagal membaca berkas JSON.');
                setFile(null);
                setParsedData(null);
            }
        };
        reader.readAsText(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!file) {
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        router.post(route('admin.workflows.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                showToast('Alur kerja berhasil diimpor', 'success');
                setFile(null);
                setParsedData(null);
                setLoading(false);
                onClose();
            },
            onError: (errors: any) => {
                setError(errors.error || 'Gagal mengimpor alur kerja.');
                setLoading(false);
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!loading) {
                    setFile(null);
                    setParsedData(null);
                    setError(null);
                    onClose();
                }
            }}
            title="Impor Alur Kerja"
            description="Unggah berkas konfigurasi alur kerja berformat JSON"
            maxWidth="md"
        >
            <div className="flex flex-col gap-6">
                <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                        dragActive
                            ? 'border-primary bg-primary/[0.02]'
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleChange}
                        className="hidden"
                        disabled={loading}
                    />

                    <div className="bg-primary/5 text-primary mb-4 rounded-2xl p-4">
                        <Upload size={24} />
                    </div>

                    <p className="text-foreground mb-1 text-sm font-semibold">
                        {file ? file.name : 'Seret & letakkan berkas JSON alur kerja di sini'}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        atau klik untuk memilih berkas dari perangkat Anda
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border-rose-500/20 text-rose-500 rounded-xl border p-4 text-xs font-medium leading-relaxed">
                        {error}
                    </div>
                )}

                {parsedData && (
                    <div className="border-border/50 bg-muted/20 rounded-2xl border p-5">
                        <h4 className="text-foreground mb-3 text-xs font-bold tracking-wide uppercase">
                            Informasi Berkas ({parsedData.length} Alur Kerja Terdeteksi)
                        </h4>
                        <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                            {parsedData.map((item, index) => (
                                <div key={item.name || index} className="border-border/40 bg-card flex items-start gap-3 rounded-xl border p-3.5 shadow-xs">
                                    <div className="bg-primary/5 text-primary mt-0.5 rounded-lg p-2.5">
                                        <FileJson size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-[12px] font-bold">{item.name}</p>
                                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[10px]">{item.description || 'Tidak ada deskripsi'}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="border-border/30 bg-muted text-muted-foreground rounded-xs border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                                                {item.contract_type || 'GLOBAL'}
                                            </span>
                                            <span className="bg-primary/10 text-primary rounded-xs px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                                                {item.steps?.length || 0} Tahap
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-border/30 flex items-center justify-end gap-3 border-t pt-5">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="h-10 rounded-xl px-5 text-xs font-semibold shadow-xs"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || loading}
                        className="h-10 gap-2 rounded-xl px-6 text-xs font-semibold shadow-md"
                    >
                        {loading && <Loader2 size={12} className="animate-spin" />}
                        {loading ? 'Mengimpor...' : 'Mulai Impor'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

interface WorkflowManagementProps {
    readonly workflows: any;
    readonly contractTypes: any[];
    readonly filters: any;
}

export function WorkflowManagement({ workflows, contractTypes, filters }: Readonly<WorkflowManagementProps>) {
    const { showToast } = useToast();
    const { canUpdate, canCreate, canDelete } = usePermissions('ADMIN_WORKFLOWS');
    const [isImportOpen, setIsImportOpen] = useState(false);

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
        <div className="border-border bg-card m-5 rounded-2xl border p-5 shadow-sm">
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
                    <div className="flex items-center gap-2">
                        {canCreate && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsImportOpen(true)}
                                    className="border-border/40 bg-card text-foreground hover:bg-muted/60 hover:border-border/60 h-10 gap-2 rounded-xl border px-5 text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                                >
                                    <Upload size={12} className="mr-2" /> Impor Alur
                                </Button>
                                <Button
                                    variant="white"
                                    onClick={openCreate}
                                    className="border-border/40 bg-card text-foreground hover:bg-muted/60 hover:border-border/60 h-10 gap-2 rounded-xl border px-6 text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                                >
                                    <Plus size={12} className="mr-2" /> Registrasi Baru
                                </Button>
                            </>
                        )}
                    </div>
                }
                bulkActions={
                    useMemo(() => {
                        const actions = [];
                        
                        actions.push({
                            label: 'Ekspor Terpilih',
                            icon: Download,
                            variant: 'outline' as const,
                            onClick: (ids: string[]) => {
                                const params = new URLSearchParams();
                                ids.forEach(id => params.append('ids[]', id));
                                window.location.href = route('admin.workflows.export') + '?' + params.toString();
                            },
                        });

                        if (canDelete) {
                            actions.push({
                                label: 'Hapus Terpilih',
                                icon: Trash2,
                                variant: 'destructive' as const,
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
                            });
                        }

                        return actions;
                    }, [canDelete, showToast])
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

            <ImportWorkflowModal 
                isOpen={isImportOpen} 
                onClose={() => setIsImportOpen(false)} 
                showToast={showToast} 
            />
        </div>
    );
}
