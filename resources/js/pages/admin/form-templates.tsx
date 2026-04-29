import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FilterCategory, FilterSheet } from '@/components/ui/FilterSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutToggle } from '@/components/ui/layout-toggle';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { Copy, Edit2, FileCheck, FileJson, FileText, Filter, Layout, MoreHorizontal, Plus, Settings, Trash2 } from 'lucide-react';
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

export default function FormTemplates({ templates, contract_types }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

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
                    <span className="text-[11px] font-black tracking-tight text-slate-900 uppercase">{t.name}</span>
                    <span className="max-w-[200px] truncate text-[9px] font-bold text-slate-400 uppercase">{t.description || 'No description'}</span>
                </div>
            ),
        },
        {
            header: 'Classification',
            accessorKey: 'document_type',
            cell: (t) => (
                <span className="border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    {t.document_type || 'Custom'}
                </span>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            cell: (t) =>
                t.is_active ? (
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Published</span>
                ) : (
                    <span className="bg-black px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase">Draft</span>
                ),
        },
        {
            header: 'Fields',
            accessorKey: 'fields_count',
            cell: (t) => (
                <span className="text-[10px] font-black text-slate-600">
                    {t.fields_count} <span className="text-slate-300">ITEMS</span>
                </span>
            ),
        },
        {
            header: 'Modified',
            accessorKey: 'updated_at',
            cell: (t) => <span className="text-[10px] font-black text-slate-500">{new Date(t.updated_at).toLocaleDateString()}</span>,
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

            <div className="font-inter flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-white antialiased dark:bg-black">
                {/* Unified Toolbar — Identical to Contracts workspace */}
                <div className="sticky top-0 z-20 flex items-center gap-6 border-b border-black/[0.05] bg-white px-5 py-4 dark:border-white/[0.05] dark:bg-black">
                    <div className="relative w-full max-w-sm flex-1">
                        <SearchInput placeholder="Cari template form..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <LayoutToggle value={layout} onChange={setLayout} className="mr-2" />

                        <Button
                            variant="outline"
                            onClick={() => setIsFilterOpen(true)}
                            className={cn(
                                'relative h-10 px-4 transition-all active:scale-95',
                                hasActiveFilters && 'border-[var(--primary)] bg-[var(--primary)] text-white',
                            )}
                        >
                            <Filter size={14} />
                            Filter
                            {hasActiveFilters && (
                                <span
                                    className={cn(
                                        'ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-bold',
                                        hasActiveFilters ? 'bg-white text-[var(--primary)]' : 'bg-[var(--primary)] text-white',
                                    )}
                                >
                                    {Object.values(activeFilters).flat().length}
                                </span>
                            )}
                        </Button>
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="h-10 px-6 shadow-xl active:scale-95">
                            <Plus size={14} />
                            Initialize Form
                        </Button>
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto bg-white dark:bg-black">
                    {layout === 'grid' ? (
                        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border border-black/[0.05] bg-white p-6 shadow-sm transition-all hover:border-black hover:shadow-xl dark:border-white/[0.05] dark:bg-black/20 dark:hover:border-white"
                                >
                                    <div className="absolute top-4 right-4 z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 text-black/30 shadow-sm transition-all hover:text-black dark:text-white/30 dark:hover:text-white"
                                                >
                                                    <MoreHorizontal size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-56 rounded-xl border border-black/[0.05] bg-white p-2 shadow-2xl dark:border-white/[0.05] dark:bg-black"
                                            >
                                                <DropdownMenuItem
                                                    asChild
                                                    className="cursor-pointer rounded-lg py-2.5 focus:bg-black/[0.03] dark:focus:bg-white/[0.03]"
                                                >
                                                    <a
                                                        href={route('admin.form-templates.builder', template.id)}
                                                        target="_blank"
                                                        className="flex items-center"
                                                    >
                                                        <Edit2 className="mr-3 h-4 w-4 text-black/40 dark:text-white/40" />
                                                        <span className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                            Open Builder
                                                        </span>
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openEditModal(template)}
                                                    className="cursor-pointer rounded-lg py-2.5 focus:bg-black/[0.03] dark:focus:bg-white/[0.03]"
                                                >
                                                    <Settings className="mr-3 h-4 w-4 text-black/40 dark:text-white/40" />
                                                    <span className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                        Metadata
                                                    </span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDuplicate(template.id)}
                                                    className="cursor-pointer rounded-lg py-2.5 focus:bg-black/[0.03] dark:focus:bg-white/[0.03]"
                                                >
                                                    <Copy className="mr-3 h-4 w-4 text-black/40 dark:text-white/40" />
                                                    <span className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                        Clone Asset
                                                    </span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 bg-black/[0.05] dark:bg-white/[0.05]" />
                                                <DropdownMenuItem
                                                    className="cursor-pointer rounded-lg py-2.5 text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-3 h-4 w-4" />
                                                    <span className="text-[10px] font-black tracking-widest uppercase">Purge Asset</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/[0.05] bg-black/[0.03] text-black/30 shadow-sm transition-all group-hover:text-black dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white/30 dark:group-hover:text-white">
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
                                                    className="rounded-lg border-black/[0.05] bg-black/[0.02] px-2 py-0.5 text-[8px] font-black tracking-widest text-black/40 uppercase dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-white/40"
                                                >
                                                    {template.document_type || 'Custom'}
                                                </Badge>
                                                {!template.is_active && (
                                                    <span className="rounded-lg bg-black px-2 py-0.5 text-[8px] font-black tracking-widest text-white uppercase dark:bg-white dark:text-black">
                                                        DRAFT
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="line-clamp-1 text-[14px] font-bold tracking-tight text-black uppercase antialiased dark:text-white">
                                                {template.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="mt-1 line-clamp-2 h-8 text-[11px] leading-relaxed font-bold tracking-tight text-black/40 uppercase antialiased dark:text-white/40">
                                        {template.description || 'No asset description provided.'}
                                    </p>

                                    <div className="mt-auto grid grid-cols-2 gap-4 border-y border-black/[0.05] py-4 dark:border-white/[0.05]">
                                        <div className="flex flex-col">
                                            <span className="mb-1 text-[8px] font-black tracking-widest text-black/20 uppercase dark:text-white/20">
                                                Elements
                                            </span>
                                            <span className="text-[11px] font-bold text-black/60 dark:text-white/60">
                                                {template.fields_count} <span className="text-[8px] opacity-40">FIELDS</span>
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="mb-1 text-[8px] font-black tracking-widest text-black/20 uppercase dark:text-white/20">
                                                Modified
                                            </span>
                                            <span className="text-[11px] font-bold text-black/60 tabular-nums dark:text-white/60">
                                                {new Date(template.updated_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <a href={route('admin.form-templates.builder', template.id)} target="_blank" className="flex-1">
                                            <Button className="h-11 w-full text-[10px] font-black tracking-[0.2em] uppercase shadow-xl active:scale-95">
                                                Open Builder
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredTemplates}
                            onRowClick={(t) => window.open(route('admin.form-templates.builder', t.id), '_blank')}
                            bulkActions={[
                                {
                                    label: 'Hapus Terpilih',
                                    icon: Trash2,
                                    variant: 'destructive',
                                    onClick: (ids) => {
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
                            <span className="text-[11px] font-black tracking-[0.4em] text-black/40 uppercase dark:text-white/40">
                                No Assets Matching Filter
                            </span>
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
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl sm:max-w-[420px] dark:bg-black">
                    <form onSubmit={handleCreateTemplate}>
                        <div className="relative bg-black px-8 py-6 text-white dark:bg-white dark:text-black">
                            <DialogTitle className="mb-1 text-[14px] font-black tracking-[0.2em] uppercase">Asset Initialization</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold tracking-widest text-white/50 uppercase antialiased dark:text-black/50">
                                Form Builder Repository
                            </DialogDescription>
                        </div>
                        <div className="space-y-6 p-8">
                            <div className="grid gap-2">
                                <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Template Name
                                </Label>
                                <Input
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] text-xs font-bold transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    placeholder="e.g., F1 General Inquiry"
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Document Category
                                </Label>
                                <Select value={createForm.data.document_type} onValueChange={(v) => createForm.setData('document_type', v)}>
                                    <SelectTrigger className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] text-xs font-bold transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-black/[0.08] shadow-2xl dark:border-white/[0.08]">
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
                                <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Description
                                </Label>
                                <Textarea
                                    className="h-24 resize-none rounded-xl border-black/[0.08] bg-black/[0.03] text-xs leading-relaxed font-medium transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
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
                                className="h-10 rounded-xl px-6 text-[10px] font-black text-black/40 uppercase hover:bg-black/[0.05] dark:text-white/40 dark:hover:bg-white/[0.05]"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="h-10 rounded-xl bg-black px-8 text-[10px] font-black text-white uppercase shadow-xl shadow-black/20 transition-all active:scale-95 dark:bg-white dark:text-black dark:shadow-white/10"
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
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl sm:max-w-[480px] dark:bg-black">
                    <form onSubmit={handleUpdateMetadata}>
                        <div className="flex shrink-0 items-center gap-5 bg-black p-8 text-white dark:bg-white dark:text-black">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-inner backdrop-blur-sm dark:border-black/10 dark:bg-black/10 dark:text-black">
                                <Settings size={20} />
                            </div>
                            <div>
                                <DialogTitle className="mb-1 text-[14px] font-black tracking-[0.2em] uppercase">Sync Configuration</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold tracking-widest text-white/50 uppercase antialiased dark:text-black/50">
                                    Asset Profile Control
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="space-y-6 p-8">
                            <div className="grid gap-2">
                                <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Metadata Name
                                </Label>
                                <Input
                                    required
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] text-xs font-bold transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="grid gap-2">
                                    <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Classification
                                    </Label>
                                    <Select value={editForm.data.document_type} onValueChange={(v) => editForm.setData('document_type', v)}>
                                        <SelectTrigger className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] text-xs font-bold transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-black/[0.08] shadow-2xl dark:border-white/[0.08]">
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
                                    <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                        Workflow Related
                                    </Label>
                                    <Select value={editForm.data.contract_type_id} onValueChange={(v) => editForm.setData('contract_type_id', v)}>
                                        <SelectTrigger className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] text-xs font-bold transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-48 rounded-xl border-black/[0.08] shadow-2xl dark:border-white/[0.08]">
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
                                <Label className="ml-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                                    Narrative
                                </Label>
                                <Textarea
                                    className="h-20 resize-none rounded-xl border-black/[0.08] bg-black/[0.03] text-xs leading-relaxed font-medium transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
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
                                className="h-10 px-6 text-[10px] font-black text-black/40 uppercase dark:text-white/40"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="h-10 px-10 text-[10px] font-black uppercase shadow-xl transition-all active:scale-95"
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
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-8 shadow-2xl sm:max-w-[400px] dark:bg-black">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-inner dark:bg-red-950/20">
                            <Trash2 size={28} />
                        </div>
                        <DialogHeader className="p-0">
                            <DialogTitle className="mb-2 text-[16px] font-black tracking-tight text-black uppercase dark:text-white">
                                Delete Asset?
                            </DialogTitle>
                            <DialogDescription className="max-w-[280px] text-[11px] leading-relaxed font-bold tracking-widest text-black/50 uppercase antialiased dark:text-white/50">
                                Hapus permanen <span className="font-black text-red-500">"{selectedTemplate?.name}"</span>. <br />
                                Proses ini irreversibel.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-8 grid w-full grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-11 border-black/[0.08] text-[10px] font-black text-black/40 uppercase hover:bg-black/[0.02] dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.02]"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-11 text-[10px] font-black uppercase shadow-xl shadow-red-500/20 transition-all active:scale-95"
                                onClick={handleDelete}
                            >
                                Delete Asset
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
