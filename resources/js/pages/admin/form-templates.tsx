import { Badge } from '@/components/ui/base/Badge';
import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import { Textarea } from '@/components/ui/base/Textarea';
import { FilterCategory, FilterSheet } from '@/components/ui/data/FilterSheet';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { LayoutToggle } from '@/components/ui/navigation/LayoutToggle';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/overlays/Dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/overlays/DropdownMenu';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { Copy, Edit2, FileCheck, FileJson, FileText, Filter, Layout, MoreHorizontal, Plus, Settings, Trash2, Download, Upload, Loader2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/overlays/Modal';
import { useToast } from '@/components/contracts/Toast';

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
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
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
                        {file ? file.name : 'Seret & letakkan berkas JSON template di sini'}
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
                            Informasi Berkas ({parsedData.length} Template Terdeteksi)
                        </h4>
                        <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                            {parsedData.map((item, index) => (
                                <div key={item.name || index} className="border-border/40 bg-card flex items-start gap-3 rounded-xl border p-3.5 shadow-sm">
                                    <div className="bg-primary/5 text-primary mt-0.5 rounded-lg p-2.5">
                                        <FileJson size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-[12px] font-bold">{item.name}</p>
                                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[10px]">{item.description || 'Tidak ada deskripsi'}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="border-border/30 bg-muted text-muted-foreground rounded-xs border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                                                {item.document_type || 'Custom'}
                                            </span>
                                            <span className="bg-primary/10 text-primary rounded-xs px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
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
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="h-10 rounded-xl px-5 text-xs font-semibold"
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

export default function FormTemplates({ templates, contract_types }: Props) {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

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
    });

    const [layout, setLayout] = useState<'grid' | 'table'>('grid');

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

    const columns: Column<FormTemplate>[] = [
        {
            header: 'Template Name',
            accessorKey: 'name',
            cell: (t) => (
                <div className="flex flex-col">
                    <span className="text-foreground text-[12px] font-semibold tracking-tight uppercase">{t.name}</span>
                    <span className="text-muted-foreground max-w-[200px] truncate text-[10px] font-medium uppercase">
                        {t.description || 'No description'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Classification',
            accessorKey: 'document_type',
            cell: (t) => (
                <span className="border-border bg-muted text-foreground border px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {t.document_type || 'Custom'}
                </span>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            cell: (t) =>
                t.is_active ? (
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase">Published</span>
                ) : (
                    <span className="bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 uppercase dark:bg-red-950/40 dark:text-red-300">
                        Draft
                    </span>
                ),
        },
        {
            header: 'Fields',
            accessorKey: 'fields_count',
            cell: (t) => (
                <span className="text-foreground text-[11px] font-semibold">
                    {t.fields_count} <span className="text-muted-foreground/60">ITEMS</span>
                </span>
            ),
        },
        {
            header: 'Modified',
            accessorKey: 'updated_at',
            cell: (t) => <span className="text-muted-foreground text-[11px] font-semibold">{new Date(t.updated_at).toLocaleDateString()}</span>,
        },
    ];

    const handleFilterChange = (key: string, value: any) => {
        setActiveFilters((prev) => {
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

            <div className="bg-background text-foreground flex h-[calc(100vh-64px)] flex-col overflow-hidden font-sans antialiased">
                {/* Unified Toolbar — Identical to Contracts workspace */}
                <div className="border-border/40 bg-card text-card-foreground sticky top-0 z-20 flex items-center gap-6 border-b px-5 py-4">
                    <div className="relative w-full max-w-sm flex-1">
                        <SearchInput placeholder="Cari template form..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <LayoutToggle value={layout} onChange={setLayout} className="mr-2" />

                        <Button
                            variant="outline"
                            onClick={() => setIsFilterOpen(true)}
                            className={cn(
                                'text-foreground hover:bg-muted border-border relative h-10 px-4 transition-all active:scale-95',
                                hasActiveFilters && 'bg-primary text-primary-foreground border-primary',
                            )}
                        >
                            <Filter size={14} />
                            Filter
                            {hasActiveFilters && (
                                <span
                                    className={cn(
                                        'ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-bold',
                                        hasActiveFilters ? 'text-primary bg-white' : 'bg-primary text-white',
                                    )}
                                >
                                    {Object.values(activeFilters).flat().length}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsImportModalOpen(true)}
                            className="border-border/40 bg-card text-foreground hover:bg-muted/60 hover:border-border/60 h-10 gap-2 rounded-xl border px-5 text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                        >
                            <Upload size={14} />
                            Impor Template
                        </Button>
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="h-10 px-6 shadow-xl active:scale-95">
                            <Plus size={14} />
                            Initialize Form
                        </Button>
                    </div>
                </div>

                <div className="custom-scrollbar bg-background text-foreground flex-1 overflow-y-auto">
                    {layout === 'grid' ? (
                        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="group border-border bg-card hover:border-primary/40 text-card-foreground relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border p-6 shadow-sm transition-all hover:shadow-xl"
                                >
                                    <div className="absolute top-4 right-4 z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="text-muted-foreground border-border/40 bg-card hover:bg-muted hover:text-foreground h-8 w-8 shadow-sm transition-all"
                                                >
                                                    <MoreHorizontal size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="border-border bg-card text-card-foreground w-56 rounded-xl border p-2 shadow-2xl"
                                            >
                                                <DropdownMenuItem asChild className="focus:bg-muted cursor-pointer rounded-lg py-2.5">
                                                    <a
                                                        href={route('admin.form-templates.builder', template.id)}
                                                        target="_blank"
                                                        className="flex items-center"
                                                    >
                                                        <Edit2 className="text-muted-foreground mr-3 h-4 w-4" />
                                                        <span className="text-foreground text-[10px] font-semibold uppercase">Open Builder</span>
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openEditModal(template)}
                                                    className="focus:bg-muted cursor-pointer rounded-lg py-2.5"
                                                >
                                                    <Settings className="text-muted-foreground mr-3 h-4 w-4" />
                                                    <span className="text-foreground text-[10px] font-semibold uppercase">Metadata</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDuplicate(template.id)}
                                                    className="focus:bg-muted cursor-pointer rounded-lg py-2.5"
                                                >
                                                    <Copy className="text-muted-foreground mr-3 h-4 w-4" />
                                                    <span className="text-foreground text-[10px] font-semibold uppercase">Clone Asset</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleExport(template.id)}
                                                    className="focus:bg-muted cursor-pointer rounded-lg py-2.5"
                                                >
                                                    <Download className="text-muted-foreground mr-3 h-4 w-4" />
                                                    <span className="text-foreground text-[10px] font-semibold uppercase">Export JSON</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border my-1" />
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-lg py-2.5 text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-3 h-4 w-4" />
                                                    <span className="text-[10px] font-semibold uppercase">Purge Asset</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="border-border bg-muted text-muted-foreground group-hover:text-foreground flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition-all">
                                            {template.document_type === 'f1' ? (
                                                <FileText size={24} />
                                            ) : template.document_type === 'f2' ? (
                                                <FileCheck size={24} />
                                            ) : (
                                                <Layout size={24} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 pr-8">
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="border-border bg-muted text-muted-foreground rounded-lg px-2 py-0.5 text-[8px] font-semibold uppercase"
                                                >
                                                    {template.document_type || 'Custom'}
                                                </Badge>
                                                {!template.is_active && (
                                                    <span className="rounded-lg bg-red-100 px-2 py-0.5 text-[8px] font-semibold text-red-800 uppercase dark:bg-red-950/40 dark:text-red-300">
                                                        DRAFT
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-foreground line-clamp-1 text-[14px] font-bold tracking-tight uppercase antialiased">
                                                {template.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-muted-foreground mt-1 line-clamp-2 h-8 text-[11px] leading-relaxed font-bold tracking-tight uppercase antialiased">
                                        {template.description || 'No asset description provided.'}
                                    </p>

                                    <div className="border-border/60 mt-auto grid grid-cols-2 gap-4 border-y py-4">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground mb-1 text-[8px] font-semibold uppercase">Elements</span>
                                            <span className="text-foreground text-[11px] font-bold">
                                                {template.fields_count} <span className="text-[8px] opacity-40">FIELDS</span>
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-muted-foreground mb-1 text-[8px] font-semibold uppercase">Modified</span>
                                            <span className="text-foreground text-[11px] font-bold tabular-nums">
                                                {new Date(template.updated_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <a href={route('admin.form-templates.builder', template.id)} target="_blank" className="flex-1">
                                            <Button className="h-11 w-full text-[10px] font-semibold tracking-[0.2em] uppercase shadow-xl active:scale-95">
                                                Open Builder
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <TableMasterData
                            columns={columns}
                            data={filteredTemplates}
                            onRowClick={(t: any) => window.open(route('admin.form-templates.builder', t.id), '_blank')}
                            bulkActions={[
                                {
                                    label: 'Hapus Terpilih',
                                    icon: Trash2,
                                    variant: 'destructive',
                                    onClick: (ids: string[]) => {
                                        if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} template terpilih?`)) {
                                            router.post(
                                                '/admin/form-templates/bulk-delete',
                                                { ids },
                                                {
                                                    onSuccess: () => alert(`${ids.length} template telah dihapus`),
                                                },
                                            );
                                        }
                                    },
                                },
                            ]}
                        />
                    )}

                    {filteredTemplates.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 opacity-30">
                            <div className="mb-6 rounded-3xl border border-dashed border-black/[0.1] bg-black/[0.02] p-6 dark:border-white/[0.1] dark:bg-white/[0.02]">
                                <FileJson size={64} className="text-black/20 dark:text-white/20" strokeWidth={1} />
                            </div>
                            <span className="text-muted-foreground text-[11px] font-bold tracking-[0.4em] uppercase">No Assets Matching Filter</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Global UI Filter Component */}
            <FilterSheet
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                title="Library Filter"
                description="Manage your template collection visibility."
                categories={filterCategories}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                totalResults={filteredTemplates.length}
            />

            {/* Modals - High Density */}
            {/* Create Template Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="border-border bg-card text-card-foreground overflow-hidden rounded-xl border p-0 shadow-2xl sm:max-w-[420px]">
                    <form onSubmit={handleCreateTemplate}>
                        <div className="bg-muted text-foreground border-border relative border-b px-8 py-6">
                            <DialogTitle className="mb-1 text-[14px] font-semibold tracking-[0.2em] uppercase">Asset Initialization</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-[10px] font-medium uppercase antialiased">
                                Form Builder Repository
                            </DialogDescription>
                        </div>
                        <div className="space-y-6 p-8">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground ml-1 text-[10px] font-semibold uppercase">Template Name</Label>
                                <Input
                                    className="border-border bg-muted focus:border-primary h-11 rounded-xl text-xs font-bold transition-all"
                                    placeholder="e.g., F1 General Inquiry"
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground ml-1 text-[10px] font-semibold uppercase">Document Category</Label>
                                <Select value={createForm.data.document_type} onValueChange={(v) => createForm.setData('document_type', v)}>
                                    <SelectTrigger className="border-border bg-muted focus:border-primary h-11 rounded-xl text-xs font-bold transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-border bg-card text-card-foreground rounded-xl shadow-2xl">
                                        <SelectItem value="f1" className="py-2.5 text-xs font-bold uppercase">
                                            Form F1 (Request)
                                        </SelectItem>
                                        <SelectItem value="f2" className="py-2.5 text-xs font-bold uppercase">
                                            Form F2 (Resume)
                                        </SelectItem>
                                        <SelectItem value="adhoc" className="py-2.5 text-xs font-bold uppercase">
                                            Ad-hoc Form
                                        </SelectItem>
                                        <SelectItem value="other" className="py-2.5 text-xs font-bold uppercase">
                                            Lainnya
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground ml-1 text-[10px] font-semibold uppercase">Description</Label>
                                <Textarea
                                    className="border-border bg-muted focus:border-primary h-24 resize-none rounded-xl text-xs leading-relaxed font-medium transition-all"
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-8 pb-8">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:bg-muted h-10 rounded-xl px-6 text-[10px] font-semibold uppercase"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-8 text-[10px] font-semibold uppercase shadow-xl transition-all active:scale-95"
                                disabled={createForm.processing}
                            >
                                Initialize
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Metadata Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="border-border bg-card text-card-foreground overflow-hidden rounded-xl border p-0 shadow-2xl sm:max-w-[480px]">
                    <form onSubmit={handleUpdateMetadata}>
                        <div className="bg-muted text-foreground border-border flex shrink-0 items-center gap-5 border-b p-8">
                            <div className="border-border bg-card text-foreground flex h-11 w-11 items-center justify-center rounded-xl border shadow-inner backdrop-blur-sm">
                                <Settings size={20} />
                            </div>
                            <div>
                                <DialogTitle className="mb-1 text-[14px] font-semibold tracking-[0.2em] uppercase">Sync Configuration</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-[10px] font-medium uppercase antialiased">
                                    Asset Profile Control
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="space-y-6 p-8">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground ml-1 text-[10px] font-semibold uppercase">Metadata Name</Label>
                                <Input
                                    required
                                    className="border-border bg-muted focus:border-primary h-11 rounded-xl text-xs font-bold transition-all"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="grid gap-2">
                                    <Label className="text-muted-foreground ml-1 text-[10px] font-semibold uppercase">Classification</Label>
                                    <Select value={editForm.data.document_type} onValueChange={(v) => editForm.setData('document_type', v)}>
                                        <SelectTrigger className="border-border bg-muted focus:border-primary h-11 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-border bg-card text-card-foreground rounded-xl shadow-2xl">
                                            <SelectItem value="f1" className="py-2.5 text-xs font-bold uppercase">
                                                Form F1 (Request)
                                            </SelectItem>
                                            <SelectItem value="f2" className="py-2.5 text-xs font-bold uppercase">
                                                Form F2 (Resume)
                                            </SelectItem>
                                            <SelectItem value="adhoc" className="py-2.5 text-xs font-bold uppercase">
                                                Ad-hoc Form
                                            </SelectItem>
                                            <SelectItem value="other" className="py-2.5 text-xs font-bold uppercase">
                                                Lainnya
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-muted-foreground ml-1 text-[10px] font-semibold uppercase">Workflow Related</Label>
                                    <Select value={editForm.data.contract_type_id} onValueChange={(v) => editForm.setData('contract_type_id', v)}>
                                        <SelectTrigger className="border-border bg-muted focus:border-primary h-11 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-border bg-card text-card-foreground max-h-48 rounded-xl shadow-2xl">
                                            <SelectItem value="none" className="py-2.5 text-[10px] font-bold italic opacity-40">
                                                Global / Unlinked
                                            </SelectItem>
                                            {contract_types.map((ct) => (
                                                <SelectItem key={ct.id} value={ct.id} className="py-2.5 text-xs font-bold uppercase">
                                                    {ct.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground ml-1 text-[10px] font-semibold uppercase">Narrative</Label>
                                <Textarea
                                    className="border-border bg-muted focus:border-primary h-20 resize-none rounded-xl text-xs leading-relaxed font-medium transition-all"
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-8 pb-8">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:bg-muted h-10 px-6 text-[10px] font-semibold uppercase"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="h-10 px-10 text-[10px] font-semibold uppercase shadow-xl transition-all active:scale-95"
                                disabled={editForm.processing}
                            >
                                Save Profile
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
                            <DialogTitle className="text-foreground mb-2 text-[16px] font-semibold tracking-tight uppercase">
                                Delete Asset?
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground max-w-[280px] text-[11px] leading-relaxed font-medium uppercase antialiased">
                                Hapus permanen <span className="font-semibold text-red-500">"{selectedTemplate?.name}"</span>. <br />
                                Proses ini irreversibel.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-8 grid w-full grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border text-muted-foreground hover:bg-muted h-11 text-[10px] font-semibold uppercase"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-11 text-[10px] font-semibold uppercase shadow-xl transition-all active:scale-95"
                                onClick={handleDelete}
                            >
                                Delete Asset
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ImportFormTemplateModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                showToast={showToast}
            />

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
