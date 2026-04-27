import React, { useState, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    FileJson, 
    Plus, 
    Search, 
    MoreHorizontal, 
    Edit2, 
    Trash2, 
    Settings,
    Clock,
    Play,
    Copy,
    Info,
    Layout,
    ArrowUpRight,
    Briefcase,
    FileText,
    FileCheck,
    SlidersHorizontal,
    LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { FilterSheet, FilterCategory } from '@/components/ui/FilterSheet';
import { Column, DataTable } from '@/components/ui/DataTable';

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
        return templates.filter(t => {
            const matchesSearch = searchQuery === '' || 
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (t.description?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = activeFilters.document_type.length === 0 || 
                activeFilters.document_type.includes(t.document_type || 'other');

            const matchesStatus = activeFilters.is_active.length === 0 || 
                activeFilters.is_active.includes(t.is_active ? '1' : '0');

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [templates, searchQuery, activeFilters]);

    const columns: Column<FormTemplate>[] = [
        { 
            header: 'Template Name', 
            accessorKey: 'name',
            cell: (t) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">{t.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{t.description || 'No description'}</span>
                </div>
            )
        },
        { 
            header: 'Classification', 
            accessorKey: 'document_type',
            cell: (t) => (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200">
                    {t.document_type || 'Custom'}
                </span>
            )
        },
        { 
            header: 'Status', 
            accessorKey: 'is_active',
            cell: (t) => (
                t.is_active ? (
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Published</span>
                ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Draft</span>
                )
            )
        },
        { 
            header: 'Fields', 
            accessorKey: 'fields_count',
            cell: (t) => <span className="text-[10px] font-black text-slate-600">{t.fields_count} <span className="text-slate-300">ITEMS</span></span>
        },
        { 
            header: 'Modified', 
            accessorKey: 'updated_at',
            cell: (t) => <span className="text-[10px] font-black text-slate-500">{new Date(t.updated_at).toLocaleDateString()}</span>
        },
    ];

    const handleFilterChange = (key: string, value: any) => {
        setActiveFilters(prev => {
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
            }
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
            }
        });
    };

    const handleCreateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.form-templates.save'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            }
        });
    };

    const stats = {
        total: templates.length,
        f1: templates.filter(t => t.document_type === 'f1').length,
        f2: templates.filter(t => t.document_type === 'f2').length,
    };

    const hasActiveFilters = Object.values(activeFilters).some(v => v.length > 0);

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
            
            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white antialiased font-inter">
                {/* Unified Toolbar — Identical to Contracts workspace */}
                <div className="px-5 py-4 flex items-center gap-6 border-b border-slate-100 bg-white sticky top-0 z-20">
                    <div className="space-y-0.5 min-w-[200px]">
                        <h1 className="text-[12px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Layout size={14} />
                            Library Assets
                        </h1>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">
                            Form Templates Repository
                        </p>
                    </div>

                    <div className="relative flex-1 max-w-sm ml-4">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                            placeholder="Cari template..." 
                            className="pl-10 h-10 border-slate-100 focus:border-black rounded-none bg-slate-50/50 text-[11px] placeholder:text-slate-400 border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all font-medium"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                        {/* Layout Toggle — Monochrome Compact */}
                        <div className="flex bg-slate-50 border border-slate-100 p-0.5 rounded-none mr-2">
                            <button 
                                onClick={() => setLayout('table')}
                                className={cn(
                                    "h-8 w-8 flex items-center justify-center transition-all",
                                    layout === 'table' ? "bg-black text-white" : "text-slate-400 hover:text-black"
                                )}
                            >
                                <MoreHorizontal size={14} className="rotate-90" />
                            </button>
                            <button 
                                onClick={() => setLayout('grid')}
                                className={cn(
                                    "h-8 w-8 flex items-center justify-center transition-all",
                                    layout === 'grid' ? "bg-black text-white" : "text-slate-400 hover:text-black"
                                )}
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>

                        <button 
                            onClick={() => setIsFilterOpen(true)}
                            className={cn(
                                "relative flex h-10 px-4 items-center gap-2 rounded-none border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest",
                                hasActiveFilters 
                                    ? "bg-black border-black text-white hover:bg-slate-800" 
                                    : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-black"
                            )}>
                            <SlidersHorizontal size={14} />
                            Filter
                            {hasActiveFilters && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-none bg-white text-[9px] font-black text-black ml-1 transition-colors group-hover:bg-black group-hover:text-white">
                                    {Object.values(activeFilters).flat().length}
                                </span>
                            )}
                        </button>
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-black text-white hover:bg-slate-800 flex items-center gap-2 rounded-none px-6 h-10 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                            <Plus size={14} />
                            Initialize
                        </button>
                    </div>
                </div>

                {/* Template Grid View — Balanced industrial cards */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                    {layout === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-5">
                            {filteredTemplates.map(template => (
                                <div key={template.id} className="group bg-white border border-slate-100 hover:border-black shadow-sm transition-all cursor-pointer flex flex-col p-4 gap-4 relative">
                                    {/* Action Dropdown — Monochrome */}
                                    <div className="absolute top-3 right-3 z-10 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="h-7 w-7 flex items-center justify-center border border-slate-100 hover:border-black bg-white transition-all">
                                                    <MoreHorizontal size={14} className="text-slate-400 group-hover:text-black" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 p-0 rounded-none border border-black shadow-2xl">
                                                <DropdownMenuItem asChild className="rounded-none py-2 cursor-pointer focus:bg-black focus:text-white">
                                                    <a href={route('admin.form-templates.builder', template.id)} target="_blank" className="flex items-center">
                                                        <Edit2 className="mr-3 h-3.5 w-3.5" /> 
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Open Editor</span>
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditModal(template)} className="rounded-none py-2 cursor-pointer focus:bg-black focus:text-white">
                                                    <Settings className="mr-3 h-3.5 w-3.5" /> 
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Metadata</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicate(template.id)} className="rounded-none py-2 cursor-pointer focus:bg-black focus:text-white">
                                                    <Copy className="mr-3 h-3.5 w-3.5" /> 
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Clone Asset</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-100 m-0" />
                                                <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-600 rounded-none py-2 cursor-pointer" onClick={() => {
                                                    setSelectedTemplate(template);
                                                    setIsDeleteModalOpen(true);
                                                }}>
                                                    <Trash2 className="mr-3 h-3.5 w-3.5" /> 
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Purge Asset</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-black group-hover:border-black transition-all">
                                            {template.document_type === 'f1' ? <FileText size={20} /> : 
                                            template.document_type === 'f2' ? <FileCheck size={20} /> :
                                            <Layout size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-100 text-slate-500 group-hover:bg-black group-hover:text-white transition-all">
                                                    {template.document_type || 'Custom'}
                                                </span>
                                                {!template.is_active && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-black text-white">DRAFT</span>
                                                )}
                                            </div>
                                            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-black transition-all antialiased">
                                                {template.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-[10px] font-bold tracking-tight leading-relaxed text-slate-400 line-clamp-2 h-7 antialiased uppercase opacity-80 group-hover:text-black group-hover:opacity-100 transition-all">
                                        {template.description || 'No asset description provided.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-50 mt-auto group-hover:border-slate-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-500 transition-all">Elements</span>
                                            <span className="text-[10px] font-black text-slate-600 group-hover:text-black transition-all">{template.fields_count} <span className="text-[8px] text-slate-400 group-hover:text-slate-500">FIELDS</span></span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-500 transition-all">Modified</span>
                                            <span className="text-[10px] font-black text-slate-600 tracking-tight group-hover:text-black transition-all">{new Date(template.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <a href={route('admin.form-templates.builder', template.id)} target="_blank" className="flex-1 h-10 flex items-center justify-center bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                                            Open Builder
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
                        />
                    )}

                    {filteredTemplates.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center opacity-40">
                             <FileJson size={48} className="text-slate-300 mb-4" strokeWidth={1} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No Assets Matching Filter</span>
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
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-xl shadow-2xl">
                    <form onSubmit={handleCreateTemplate}>
                        <div className="bg-primary px-6 py-5 text-white relative">
                            <DialogTitle className="text-base font-black uppercase tracking-tight mb-0.5">Asset Initialization</DialogTitle>
                            <DialogDescription className="text-primary-foreground/70 text-[9px] font-bold uppercase tracking-widest antialiased">
                                Form Builder Repository
                            </DialogDescription>
                        </div>
                        <div className="p-6 space-y-4 bg-white">
                            <div className="grid gap-1.5">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Template Name</Label>
                                <Input 
                                    className="h-9 bg-slate-50 border-slate-100 rounded-lg font-bold text-xs" 
                                    placeholder="e.g., F1 General Inquiry" 
                                    required
                                    value={createForm.data.name}
                                    onChange={e => createForm.setData('name', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Category</Label>
                                <Select value={createForm.data.document_type} onValueChange={v => createForm.setData('document_type', v)}>
                                    <SelectTrigger className="h-9 bg-slate-50 border-slate-100 rounded-lg font-bold text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg shadow-xl">
                                        <SelectItem value="f1" className="text-xs font-bold uppercase">Form F1 (Request)</SelectItem>
                                        <SelectItem value="f2" className="text-xs font-bold uppercase">Form F2 (Resume)</SelectItem>
                                        <SelectItem value="adhoc" className="text-xs font-bold uppercase">Ad-hoc Form</SelectItem>
                                        <SelectItem value="other" className="text-xs font-bold uppercase">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</Label>
                                <Textarea 
                                    className="resize-none h-16 bg-slate-50 border-slate-100 rounded-lg text-xs leading-relaxed"
                                    value={createForm.data.description}
                                    onChange={e => createForm.setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="px-6 pb-6 bg-white flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" className="px-4 rounded-lg font-black uppercase text-[10px] h-8 text-slate-400" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" size="sm" className="px-6 rounded-lg font-black uppercase text-[10px] h-8" disabled={createForm.processing}>Initialize</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Metadata Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-xl shadow-2xl">
                    <form onSubmit={handleUpdateMetadata}>
                        <div className="bg-slate-800 p-6 text-white flex items-center gap-4 shrink-0">
                            <div className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
                                <Settings size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-black uppercase tracking-tight">Sync Configuration</DialogTitle>
                                <DialogDescription className="text-slate-400 text-[9px] font-bold uppercase tracking-widest opacity-80">
                                    Asset Profile
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 bg-white">
                            <div className="grid gap-1.5">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Metadata Name</Label>
                                <Input 
                                    required
                                    className="h-9 bg-slate-50 border-slate-100 rounded-lg font-bold text-xs"
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Classification</Label>
                                    <Select value={editForm.data.document_type} onValueChange={v => editForm.setData('document_type', v)}>
                                        <SelectTrigger className="h-9 bg-slate-50 border-slate-100 rounded-lg font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg shadow-xl">
                                            <SelectItem value="f1" className="text-xs font-bold uppercase">Form F1 (Request)</SelectItem>
                                            <SelectItem value="f2" className="text-xs font-bold uppercase">Form F2 (Resume)</SelectItem>
                                            <SelectItem value="adhoc" className="text-xs font-bold uppercase">Ad-hoc Form</SelectItem>
                                            <SelectItem value="other" className="text-xs font-bold uppercase">Lainnya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Workflow Related</Label>
                                    <Select value={editForm.data.contract_type_id} onValueChange={v => editForm.setData('contract_type_id', v)}>
                                        <SelectTrigger className="h-9 bg-slate-50 border-slate-100 rounded-lg font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg shadow-xl max-h-40">
                                            <SelectItem value="none" className="text-[10px] font-bold opacity-50 italic">Global / Unlinked</SelectItem>
                                            {contract_types.map(ct => (
                                                <SelectItem key={ct.id} value={ct.id} className="text-xs font-bold uppercase">{ct.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Narrative</Label>
                                <Textarea 
                                    className="resize-none h-14 bg-slate-50 border-slate-100 rounded-lg text-xs leading-relaxed"
                                    value={editForm.data.description}
                                    onChange={e => editForm.setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="px-6 pb-6 bg-white flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" className="px-5 rounded-lg font-black uppercase text-[10px] h-8 text-slate-400" onClick={() => setIsEditModalOpen(false)}>Discard</Button>
                            <Button type="submit" size="sm" className="px-8 rounded-lg font-black uppercase text-[10px] h-8 bg-slate-800" disabled={editForm.processing}>Save Profile</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog - High Density */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[380px] p-6 rounded-xl border-none shadow-2xl overflow-hidden">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-10 w-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-3">
                            <Trash2 size={20} />
                        </div>
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-sm font-black uppercase tracking-tight text-slate-800 mb-1">Delete Asset?</DialogTitle>
                            <DialogDescription className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed antialiased">
                                 Hapus permanen <strong>"{selectedTemplate?.name}"</strong>. <br/> 
                                 Proses ini irreversibel.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 w-full gap-2 mt-6">
                            <Button variant="outline" size="sm" className="rounded-lg h-8 font-black uppercase text-[9px] border-slate-100" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="rounded-lg h-8 font-black uppercase text-[9px] bg-red-500 shadow-sm" onClick={handleDelete}>Delete</Button>
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
