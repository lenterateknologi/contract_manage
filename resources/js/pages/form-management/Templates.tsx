import { Badge } from '@/components/ui/feedback/Badge';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { Textarea } from '@/components/ui/inputs/Textarea';
import { Column, DataTable as TableMasterData } from '@/components/ui/tables/DataTable';
import { FilterCategory } from '@/components/ui/selection/FilterPopover';
import { useToast } from '@/components/ui/feedback/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Modal } from '@/components/ui/dialogs/Modal';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    Edit2,
    FileCheck,
    FileJson,
    FileText,
    Filter,
    Layout,
    Loader2,
    MoreHorizontal,
    Plus,
    Settings,
    Trash2,
    Upload,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface FormTemplate {
    id: string;
    name: string;
    description: string | null;
    document_type: string | null;
    contract_type_id: string | null;
    is_active: boolean;
    fields_count: number;
    created_at: string;
    updated_at: string;
}

interface ContractType {
    id: string;
    name: string;
}

interface Props {
    templates: FormTemplate[];
    contract_types: ContractType[];
}

interface ImportFormTemplateModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

function ImportFormTemplateModal({ isOpen, onClose, showToast }: Readonly<ImportFormTemplateModalProps>) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [parsedData, setParsedData] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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

                const isValid = dataArray.every((item) => typeof item === 'object' && item !== null && 'name' in item && 'fields' in item);
                if (!isValid) {
                    throw new Error("Struktur JSON template form tidak valid. Harus memiliki properti 'name' dan 'fields'.");
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

        router.post(route('admin.form-templates.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                showToast('Template form berhasil diimpor', 'success');
                setFile(null);
                setParsedData(null);
                setLoading(false);
                onClose();
            },
            onError: (errors: any) => {
                setError(errors.error || 'Gagal mengimpor template form.');
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
            title="Impor Template Form"
            description="Unggah berkas konfigurasi template form builder berformat JSON"
            maxWidth="md"
        >
            <div className="flex flex-col gap-6">
                <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${dragActive ? 'border-primary bg-primary/[0.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }`}
                >
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleChange} className="hidden" disabled={loading} />

                    <div className="bg-primary/5 text-primary mb-4 rounded-2xl p-4">
                        <Upload size={24} />
                    </div>

                    <p className="text-foreground mb-1 text-sm font-normal">{file ? file.name : 'Seret & letakkan berkas JSON template di sini'}</p>
                    <p className="text-text-main text-xs">atau klik untuk memilih berkas dari perangkat Anda</p>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs leading-relaxed font-normal text-rose-500">
                        {error}
                    </div>
                )}

                {parsedData && (
                    <div className="border-border/50 bg-muted/20 rounded-2xl border p-5">
                        <h4 className="text-foreground mb-3 text-xs font-normal tracking-wide uppercase">
                            Informasi Berkas ({parsedData.length} Template Terdeteksi)
                        </h4>
                        <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                            {parsedData.map((item, index) => (
                                <div
                                    key={item.name || index}
                                    className="border-border/40 bg-card flex items-start gap-3 rounded-xl border p-3.5 shadow-sm"
                                >
                                    <div className="bg-primary/5 text-primary mt-0.5 rounded-lg p-2.5">
                                        <FileJson size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-[12px] font-normal">{item.name}</p>
                                        <p className="text-text-main mt-0.5 line-clamp-1 text-[10px]">
                                            {item.description || 'Tidak ada deskripsi'}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="border-border/30 bg-muted text-text-main rounded-xs border px-1.5 py-0.5 text-[8px] font-normal  uppercase">
                                                {item.document_type || 'Custom'}
                                            </span>
                                            <span className="bg-primary/10 text-primary rounded-xs px-1.5 py-0.5 text-[8px] font-normal  uppercase">
                                                {item.fields?.length || 0} Elemen
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-border/30 flex items-center justify-end gap-3 border-t pt-5">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="h-10 rounded-xl px-5 text-xs font-normal">
                        Batal
                    </Button>
                    <Button onClick={handleImport} disabled={!file || loading} className="h-10 gap-2 rounded-xl px-6 text-xs font-normal shadow-md">
                        {loading && <Loader2 size={12} className="animate-spin" />}
                        {loading ? 'Mengimpor...' : 'Mulai Impor'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default function FormTemplates({ templates, contract_types }: Props) {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
    const [selectedRows, setSelectedRows] = useState<any[]>([]);

    const handleExport = (id: string) => {
        window.location.href = route('admin.form-templates.export', id);
    };

    // Filter States
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
        document_type: [],
        is_active: [],
    });

    const editForm = useForm({
        name: '',
        description: '',
        document_type: '',
        contract_type_id: '',
        is_active: true as boolean,
    });

    const createForm = useForm({
        name: '',
        description: '',
        document_type: 'f1',
        contract_type_id: '',
        is_active: true as boolean,
    });


    // Filtering Logic
    const filteredTemplates = useMemo(() => {
        return templates.filter((t) => {
            const matchesSearch =
                searchQuery === '' ||
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = activeFilters.document_type.length === 0 || activeFilters.document_type.includes(t.document_type || 'other');

            const matchesStatus = activeFilters.is_active.length === 0 || activeFilters.is_active.includes(t.is_active ? '1' : '0');

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [templates, searchQuery, activeFilters]);

    // Tree view collapsed state
    const [collapsedClassifications, setCollapsedClassifications] = useState<Set<string>>(new Set());

    const toggleClassificationCollapse = (classification: string) => {
        setCollapsedClassifications((prev) => {
            const next = new Set(prev);
            if (next.has(classification)) {
                next.delete(classification);
            } else {
                next.add(classification);
            }
            return next;
        });
    };

    // Group and flatten filtered templates by classification
    const groupedAndFlattenedTemplates = useMemo(() => {
        const groups: Record<string, FormTemplate[]> = {};
        filteredTemplates.forEach((t) => {
            const type = (t.document_type || 'Custom').toUpperCase();
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(t);
        });

        const rows: any[] = [];
        Object.entries(groups).forEach(([classification, items]) => {
            const isCollapsed = collapsedClassifications.has(classification);
            rows.push({
                id: `parent_${classification}`,
                isParent: true,
                classificationName: classification,
                count: items.length,
            });

            if (!isCollapsed) {
                items.forEach((item) => {
                    rows.push({
                        ...item,
                        isParent: false,
                        parentClassification: classification,
                    });
                });
            }
        });

        return rows;
    }, [filteredTemplates, collapsedClassifications]);

    const columns: Column<any>[] = [
        {
            header: 'Template Name',
            accessorKey: 'name',
            cell: (row) => {
                if (row.isParent) {
                    const isCollapsed = collapsedClassifications.has(row.classificationName);
                    return (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleClassificationCollapse(row.classificationName);
                            }}
                            className="flex items-center gap-2 cursor-pointer py-1.5 text-primary hover:text-primary-hover font-semibold text-xs transition-colors"
                        >
                            {isCollapsed ? <ChevronRight size={14} className="text-primary/50" /> : <ChevronDown size={14} className="text-primary" />}
                            <span className="uppercase tracking-wider font-bold text-[11px] text-text-main dark:text-foreground">
                                Kategori: {row.classificationName} ({row.count} Template)
                            </span>
                        </div>
                    );
                }
                return (
                    <div
                        style={{ paddingLeft: '20px' }}
                        className="flex items-start gap-1.5 font-normal text-text-main"
                    >
                        <span className="text-text-main font-mono select-none mt-0.5">
                            └─
                        </span>
                        <div className="flex flex-col">
                            <span className="text-foreground text-[12px] font-normal tracking-tight uppercase">{row.name}</span>
                            <span className="text-text-main max-w-[200px] truncate text-[10px] font-normal uppercase">
                                {row.description || 'No description'}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            cell: (row) => {
                if (row.isParent) return null;
                return row.is_active ? (
                    <span className="text-text-main text-[10px] font-normal uppercase">Published</span>
                ) : (
                    <span className="bg-red-100 px-2 py-0.5 text-[10px] font-normal text-red-800 uppercase dark:bg-red-950/40 dark:text-red-300">
                        Draft
                    </span>
                );
            },
        },
        {
            header: 'Fields',
            accessorKey: 'fields_count',
            cell: (row) => {
                if (row.isParent) return null;
                return (
                    <span className="text-foreground text-[11px] font-normal">
                        {row.fields_count} <span className="text-text-main/60">ITEMS</span>
                    </span>
                );
            },
        },
        {
            header: 'Modified',
            accessorKey: 'updated_at',
            cell: (row) => {
                if (row.isParent) return null;
                return <span className="text-text-main text-[11px] font-normal">{new Date(row.updated_at).toLocaleDateString()}</span>;
            },
        },
    ];

    const handleFilterChange = (key: string, value: any) => {
        setActiveFilters((prev) => {
            if (Array.isArray(value)) {
                return { ...prev, [key]: value };
            }
            const current = [...(prev[key] || [])];
            const valStr = String(value);
            const idx = current.indexOf(valStr);
            if (idx > -1) current.splice(idx, 1);
            else current.push(valStr);
            return { ...prev, [key]: current };
        });
    };

    const handleResetFilters = () => setActiveFilters({ document_type: [], is_active: [] });

    const handleDelete = () => {
        if (!selectedTemplate) return;
        router.delete(route('admin.form-templates.destroy', selectedTemplate.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedTemplate(null);
            },
        });
    };

    const handleDuplicate = (id: string) => {
        router.post(route('admin.form-templates.duplicate', id));
    };

    const openEditModal = (template: FormTemplate) => {
        setSelectedTemplate(template);
        editForm.setData({
            name: template.name,
            description: template.description || '',
            document_type: template.document_type || '',
            contract_type_id: template.contract_type_id || '',
            is_active: template.is_active,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateMetadata = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;
        editForm.patch(route('admin.form-templates.metadata.update', selectedTemplate.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedTemplate(null);
            },
        });
    };

    const handleCreateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.form-templates.save'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const hasActiveFilters = Object.values(activeFilters).some((v) => v.length > 0);

    const filterCategories: FilterCategory[] = [
        {
            label: 'Kategori Dokumen',
            key: 'document_type',
            options: [
                { label: 'Form F1 (Request)', value: 'f1', icon: FileText, color: 'text-amber-500 bg-amber-50' },
                { label: 'Form F2 (Resume)', value: 'f2', icon: FileCheck, color: 'text-cyan-500 bg-cyan-50' },
                { label: 'Ad-hoc Form', value: 'adhoc', icon: Layout, color: 'text-indigo-500 bg-indigo-50' },
                { label: 'Lainnya', value: 'other', icon: FileJson, color: 'text-slate-500 bg-slate-50' },
            ],
        },
        {
            label: 'Status Template',
            key: 'is_active',
            options: [
                { label: 'Published / Aktif', value: '1' },
                { label: 'Draft / Inaktif', value: '0' },
            ],
        },
    ];

    return (
        <>
            <Head title="Form Template" />

            <PageTable
                title="Form Template"
                subtitle="Kelola dan konfigurasi formulir persetujuan dinamis dalam sistem"
                icon={FileText}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari template form..."
                filters={filterCategories}
                activeFilters={activeFilters}
                onFilterChange={(newFilters: any) => {
                    setActiveFilters((prev) => ({ ...prev, ...newFilters }));
                }}
                onResetFilters={() => {
                    setActiveFilters({
                        document_type: [],
                        is_active: [],
                    });
                }}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2 h-9 rounded-xl text-xs font-normal bg-card">
                            <Upload size={14} /> Impor Template
                        </Button>
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                            <Plus size={16} /> Tambah Baru
                        </Button>
                    </div>
                }
            >
                <TableMasterData
                    columns={columns}
                    borderless={true}
                    data={groupedAndFlattenedTemplates}
                    onRowClick={(t: any) => {
                        if (t.isParent) {
                            toggleClassificationCollapse(t.classificationName);
                            return;
                        }
                        window.open(route('admin.form-templates.builder', t.id), '_blank');
                    }}
                    selectedRows={selectedRows}
                    onSelectionChange={setSelectedRows}
                    isRowSelectable={(row: any) => !row.isParent}
                    bulkActions={(selected: any[]) => (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                const ids = selected.map((r) => r.id);
                                if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} template terpilih?`)) {
                                    router.post(
                                        '/admin/form-templates/bulk-delete',
                                        { ids },
                                        {
                                            onSuccess: () => {
                                                showToast(`${ids.length} template telah dihapus`, 'success');
                                                setSelectedRows([]);
                                            },
                                        },
                                    );
                                }
                            }}
                            className="h-8 gap-1.5 px-3 text-[10px] font-semibold tracking-wider uppercase bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                        >
                            <Trash2 size={12} />
                            Hapus Terpilih
                        </Button>
                    )}
                    rowActions={(row: any) => {
                        if (row.isParent) return null;
                        return (
                            <div
                                className="flex items-center justify-end gap-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(route('admin.form-templates.builder', row.id), '_blank');
                                    }}
                                    className="text-text-main/20 hover:text-text-main hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all cursor-pointer"
                                    title="Open Builder"
                                >
                                    <Edit2 size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openEditModal(row);
                                    }}
                                    className="text-text-main/20 hover:text-text-main hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all cursor-pointer"
                                    title="Metadata"
                                >
                                    <Settings size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDuplicate(row.id);
                                    }}
                                    className="text-text-main/20 hover:text-text-main hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all cursor-pointer"
                                    title="Clone Asset"
                                >
                                    <Copy size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleExport(row.id);
                                    }}
                                    className="text-text-main/20 hover:text-text-main hover:bg-primary/[0.05] h-9 w-9 rounded-xl transition-all cursor-pointer"
                                    title="Export JSON"
                                >
                                    <Download size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedTemplate(row);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="text-text-main/20 hover:bg-danger/5 hover:text-danger h-9 w-9 rounded-xl transition-all cursor-pointer"
                                    title="Purge Asset"
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        );
                    }}
                />
            </PageTable>

            {/* FilterPopover is now used as a wrapper for the filter button above */}

            {/* Modals - High Density */}
            {/* Create Template Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 overflow-hidden rounded-[8px] border p-0 shadow-2xl sm:max-w-[850px]">
                    <form onSubmit={handleCreateTemplate}>
                        <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[8px]">
                            <div className="flex items-center gap-3 z-10 pr-10">
                                <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                    <FileJson size={18} />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                        Tambah Template Formulir
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                        Konfigurasi asset formulir dinamis baru dalam sistem
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5 p-6 bg-white dark:bg-zinc-900">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Template Name</Label>
                                    <Input
                                        className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                        placeholder="e.g., F1 General Inquiry"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Status Asset</Label>
                                    <div className="border-border bg-muted/40 flex h-10 items-center gap-2.5 rounded-lg border px-3">
                                        <input
                                            type="checkbox"
                                            id="create_is_active_check"
                                            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                            checked={createForm.data.is_active}
                                            onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                        />
                                        <Label htmlFor="create_is_active_check" className="cursor-pointer text-xs font-medium text-muted-foreground">
                                            {createForm.data.is_active ? 'Published / Aktif' : 'Draft / Inaktif'}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Classification</Label>
                                    <Select value={createForm.data.document_type} onValueChange={(v) => createForm.setData('document_type', v)}>
                                        <SelectTrigger className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-border bg-card text-card-foreground rounded-lg shadow-lg">
                                            <SelectItem value="f1" className="py-2 text-xs font-normal">
                                                Form F1 (Request)
                                            </SelectItem>
                                            <SelectItem value="f2" className="py-2 text-xs font-normal">
                                                Form F2 (Resume)
                                            </SelectItem>
                                            <SelectItem value="adhoc" className="py-2 text-xs font-normal">
                                                Ad-hoc Form
                                            </SelectItem>
                                            <SelectItem value="other" className="py-2 text-xs font-normal">
                                                Lainnya
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Workflow Related</Label>
                                    <TreeSelect
                                        value={createForm.data.contract_type_id}
                                        onValueChange={(val) => createForm.setData('contract_type_id', val)}
                                        items={contract_types.map((ct) => ({
                                            id: ct.id,
                                            name: ct.name,
                                            parent_id: (ct as any).parent_id,
                                        }))}
                                        placeholder="PILIH JENIS KONTRAK"
                                        triggerClassName="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal shadow-none"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium text-foreground">Narrative / Description</Label>
                                <Textarea
                                    className="border-border bg-background focus:ring-primary h-20 resize-none rounded-lg text-xs leading-relaxed font-normal"
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    placeholder="Brief template explanation..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-[8px]">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 rounded-lg px-4 text-xs font-medium border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="h-9 rounded-lg px-5 text-xs font-bold shadow-xs"
                                disabled={createForm.processing}
                            >
                                Tambah
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Metadata Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 overflow-hidden rounded-[8px] border p-0 shadow-2xl sm:max-w-[850px]">
                    <form onSubmit={handleUpdateMetadata}>
                        <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[8px]">
                            <div className="flex items-center gap-3 z-10 pr-10">
                                <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                    <FileJson size={18} />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                        Ubah Konfigurasi Template
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                        Pengaturan profil dan klasifikasi asset template
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5 p-6 bg-white dark:bg-zinc-900">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Template Name</Label>
                                    <Input
                                        required
                                        className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Status Asset</Label>
                                    <div className="border-border bg-muted/40 flex h-10 items-center gap-2.5 rounded-lg border px-3">
                                        <input
                                            type="checkbox"
                                            id="is_active_check"
                                            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                            checked={editForm.data.is_active}
                                            onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                        />
                                        <Label htmlFor="is_active_check" className="cursor-pointer text-xs font-medium text-muted-foreground">
                                            {editForm.data.is_active ? 'Published / Aktif' : 'Draft / Inaktif'}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Classification</Label>
                                    <Select value={editForm.data.document_type || ''} onValueChange={(v) => editForm.setData('document_type', v)}>
                                        <SelectTrigger className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal">
                                            <SelectValue placeholder="PILIH KLASIFIKASI" />
                                        </SelectTrigger>
                                        <SelectContent className="border-border bg-card text-card-foreground rounded-lg shadow-lg">
                                            <SelectItem value="f1" className="py-2 text-xs font-normal">
                                                Form F1 (Request)
                                            </SelectItem>
                                            <SelectItem value="f2" className="py-2 text-xs font-normal">
                                                Form F2 (Resume)
                                            </SelectItem>
                                            <SelectItem value="adhoc" className="py-2 text-xs font-normal">
                                                Ad-hoc Form
                                            </SelectItem>
                                            <SelectItem value="other" className="py-2 text-xs font-normal">
                                                Lainnya
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium text-foreground">Workflow Related</Label>
                                    <TreeSelect
                                        value={editForm.data.contract_type_id || ''}
                                        onValueChange={(val) => editForm.setData('contract_type_id', val)}
                                        items={contract_types.map((ct) => ({
                                            id: ct.id,
                                            name: ct.name,
                                            parent_id: (ct as any).parent_id,
                                        }))}
                                        placeholder="PILIH JENIS KONTRAK"
                                        triggerClassName="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal shadow-none"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium text-foreground">Narrative / Description</Label>
                                <Textarea
                                    className="border-border bg-background focus:ring-primary h-20 resize-none rounded-lg text-xs leading-relaxed font-normal"
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    placeholder="Tuliskan keterangan mengenai fungsi template ini..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-[8px]">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 rounded-lg px-4 text-xs font-medium border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="h-9 rounded-lg px-5 text-xs font-bold shadow-xs"
                                disabled={editForm.processing}
                            >
                                Simpan
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog - High Density */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="border-border bg-card text-card-foreground overflow-hidden rounded-xl border p-8 shadow-2xl sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-inner dark:bg-red-950/20">
                            <Trash2 size={28} />
                        </div>
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-foreground mb-2 text-[16px] font-normal tracking-tight uppercase">
                                Delete Asset?
                            </DialogTitle>
                            <DialogDescription className="text-text-main max-w-[280px] text-[11px] leading-relaxed font-normal uppercase antialiased">
                                Hapus permanen <span className="font-normal text-red-500">"{selectedTemplate?.name}"</span>. <br />
                                Proses ini irreversibel.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-8 grid w-full grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border text-text-main hover:bg-muted h-11 text-[10px] font-normal uppercase"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-11 text-[10px] font-normal uppercase shadow-xl transition-all active:scale-95"
                                onClick={handleDelete}
                            >
                                Delete Asset
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ImportFormTemplateModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} showToast={showToast} />

            <style aria-hidden="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </>
    );
}
