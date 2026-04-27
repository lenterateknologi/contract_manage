import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, router } from '@inertiajs/react';
import { Plus, Trash2, FileJson, Info, Zap, UploadCloud, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { ManagementForm, FormSection, FormDangerZone } from './ManagementForm';

interface ContractTypeManagementProps {
    contractTypes: any;
    formTemplates: any[] | null | undefined;
    contractTemplates: any[] | null | undefined;
    filters: any;
}

export function ContractTypeManagement({ contractTypes, formTemplates, contractTemplates, filters }: ContractTypeManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_TYPES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingType, setEditingType] = React.useState<any>(null);

    // Defensive array handling
    const templates = Array.isArray(formTemplates) ? formTemplates : [];
    const physTemplates = Array.isArray(contractTemplates) ? contractTemplates : [];

    const form = useForm({
        name: '',
        description: '',
        f1_input_mechanism: 'digital',
        f1_form_template_id: 'none',
        f1_contract_template_id: 'none',
        f2_input_mechanism: 'digital',
        f2_form_template_id: 'none',
        f2_contract_template_id: 'none',
    });

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Jenis Kontrak',
            accessorKey: 'name',
            sortable: true,
            className: 'font-black text-slate-900 uppercase tracking-tight text-[11px] antialiased',
        },
        {
            header: 'F1 (Internal)',
            accessorKey: 'f1_input_mechanism',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.f1_input_mechanism === 'digital' ? (
                        <Badge className="bg-black text-white text-[8px] font-black tracking-widest uppercase rounded-none px-2 border-none">
                             Digital Form
                        </Badge>
                    ) : row.f1_input_mechanism === 'folder' ? (
                        <Badge className="bg-blue-600 text-white text-[8px] font-black tracking-widest uppercase rounded-none px-2 border-none">
                             Contract Folder
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[8px] font-black tracking-widest uppercase rounded-none px-2 shadow-none">
                             Manual
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: 'F2 (External)',
            accessorKey: 'f2_input_mechanism',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.f2_input_mechanism === 'digital' ? (
                        <Badge className="bg-slate-800 text-white text-[8px] font-black tracking-widest uppercase rounded-none px-2 border-none">
                             Digital Form
                        </Badge>
                    ) : row.f2_input_mechanism === 'folder' ? (
                        <Badge className="bg-indigo-600 text-white text-[8px] font-black tracking-widest uppercase rounded-none px-2 border-none">
                             Contract Folder
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[8px] font-black tracking-widest uppercase rounded-none px-2 shadow-none">
                             Manual
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            className: 'text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[200px]',
            cell: (row) => row.description || '-'
        },
    ], []);

    const openCreate = () => {
        setEditingType(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (type: any) => {
        if (!type) return;
        setEditingType(type);
        form.setData({
            name: type.name || '',
            description: type.description || '',
            f1_input_mechanism: type.f1_input_mechanism || 'digital',
            f1_form_template_id: type.f1_form_template_id || 'none',
            f1_contract_template_id: type.f1_contract_template_id || 'none',
            f2_input_mechanism: type.f2_input_mechanism || 'digital',
            f2_form_template_id: type.f2_form_template_id || 'none',
            f2_contract_template_id: type.f2_contract_template_id || 'none',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingType(null);
        form.reset();
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Prepare data - convert 'none' back to null for DB
        const payload = {
            ...form.data,
            f1_form_template_id: form.data.f1_form_template_id === 'none' ? null : form.data.f1_form_template_id,
            f1_contract_template_id: form.data.f1_contract_template_id === 'none' ? null : form.data.f1_contract_template_id,
            f2_form_template_id: form.data.f2_form_template_id === 'none' ? null : form.data.f2_form_template_id,
            f2_contract_template_id: form.data.f2_contract_template_id === 'none' ? null : form.data.f2_contract_template_id,
        };

        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingType ? 'Master tipe diperbarui' : 'Tipe kontrak baru ditambahkan', 'success');
            }
        };
        if (editingType) router.put(`/admin/contract-types/${editingType.id}`, payload, options);
        else router.post('/admin/contract-types', payload, options);
    };

    const handleDelete = () => {
        if (!editingType) return;
        if (confirm(`Hapus tipe kontrak ${editingType.name}?`)) {
            router.delete(`/admin/contract-types/${editingType.id}`, {
                onSuccess: () => {
                    closeForm();
                    showToast('Tipe kontrak telah dihapus', 'success');
                }
            });
        }
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingType ? 'Config Classification' : 'New Classification'}
                subtitle={editingType ? 'Refining dual-stage document metadata' : 'Define a new administrative contract category'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingType}
                headerActions={
                    editingType && canDelete && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={handleDelete}
                            className="h-8 hover:bg-rose-50 text-rose-600 rounded-none px-4 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={14} className="mr-2" /> Purge Classification
                        </Button>
                    )
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 font-inter">
                    <div className="md:col-span-12 lg:col-span-9 space-y-12">
                        <FormSection title="Core Classification Metadata" subtitle="Primary identification for this contract category">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Classification Name</Label>
                                    <Input 
                                        value={form.data.name} 
                                        onChange={e => form.setData('name', e.target.value)} 
                                        required 
                                        placeholder="E.G., PERJANJIAN KERJASAMA JASA" 
                                        className="h-10 rounded-none border-slate-200 bg-slate-50/30 text-xs font-black uppercase tracking-tight px-4 focus:border-black transition-all" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contextual Narrative</Label>
                                    <Input 
                                        value={form.data.description} 
                                        onChange={e => form.setData('description', e.target.value)} 
                                        placeholder="Brief description of when to use this type..." 
                                        className="h-10 rounded-none border-slate-200 text-xs font-medium px-4 focus:border-black transition-all" 
                                    />
                                </div>
                            </div>
                        </FormSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             {/* F1 Configuration */}
                             <FormSection 
                                title="Form F1 Configuration" 
                                subtitle="Internal Request stage workflow"
                                className="border-l-4 border-l-black"
                             >
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Submission Mechanism (F1)</Label>
                                        <Select value={form.data.f1_input_mechanism} onValueChange={v => form.setData('f1_input_mechanism', v)}>
                                            <SelectTrigger className="h-10 rounded-none border-slate-200 text-[10px] font-black uppercase tracking-widest bg-slate-50/30">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-black shadow-2xl">
                                                <SelectItem value="digital" className="text-[9px] uppercase font-black tracking-widest py-3">Digital Form Submission</SelectItem>
                                                <SelectItem value="folder" className="text-[9px] uppercase font-black tracking-widest py-3">Contract Folder Template</SelectItem>
                                                <SelectItem value="manual" className="text-[9px] uppercase font-black tracking-widest py-3">Manual Document Upload</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.data.f1_input_mechanism === 'digital' ? (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Link to Digital F1 Template</Label>
                                            <Select value={form.data.f1_form_template_id} onValueChange={v => form.setData('f1_form_template_id', v)}>
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 text-[10px] font-black uppercase tracking-tight bg-white">
                                                    <SelectValue placeholder="SELECT AN F1 ASSET..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-none border-black shadow-2xl max-h-[200px]">
                                                    <SelectItem value="none" className="text-[9px] font-black uppercase italic text-slate-300">Unlinked / No Template</SelectItem>
                                                    {templates.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.id} className="text-[9px] uppercase font-black tracking-wider py-3">
                                                            {t.name} <span className="ml-2 text-slate-300 font-bold">({t.document_type || 'ADHOC'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : form.data.f1_input_mechanism === 'folder' ? (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Link to Folder Template (F1)</Label>
                                            <Select value={form.data.f1_contract_template_id} onValueChange={v => form.setData('f1_contract_template_id', v)}>
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 text-[10px] font-black uppercase tracking-tight bg-white">
                                                    <SelectValue placeholder="SELECT A PHYSICAL ASSET..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-none border-black shadow-2xl max-h-[200px]">
                                                    <SelectItem value="none" className="text-[9px] font-black uppercase italic text-slate-300">No Template Selected</SelectItem>
                                                    {physTemplates.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.id} className="text-[9px] uppercase font-black tracking-wider py-3">
                                                            {t.name} <span className="ml-2 text-slate-300 font-bold">({t.file_type || 'PDF'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center animate-in fade-in">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">INTERNAL USERS WILL UPLOAD MANUAL PDF FOR F1</p>
                                        </div>
                                    )}
                                </div>
                             </FormSection>

                             {/* F2 Configuration */}
                             <FormSection 
                                title="Form F2 Configuration" 
                                subtitle="External/Vendor Resume stage workflow"
                                className="border-l-4 border-l-slate-400"
                             >
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Submission Mechanism (F2)</Label>
                                        <Select value={form.data.f2_input_mechanism} onValueChange={v => form.setData('f2_input_mechanism', v)}>
                                            <SelectTrigger className="h-10 rounded-none border-slate-200 text-[10px] font-black uppercase tracking-widest bg-slate-50/30">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-black shadow-2xl">
                                                <SelectItem value="digital" className="text-[9px] uppercase font-black tracking-widest py-3">Digital Form Submission</SelectItem>
                                                <SelectItem value="folder" className="text-[9px] uppercase font-black tracking-widest py-3">Contract Folder Template</SelectItem>
                                                <SelectItem value="manual" className="text-[9px] uppercase font-black tracking-widest py-3">Manual Document Upload</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.data.f2_input_mechanism === 'digital' ? (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Link to Digital F2 Template</Label>
                                            <Select value={form.data.f2_form_template_id} onValueChange={v => form.setData('f2_form_template_id', v)}>
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 text-[10px] font-black uppercase tracking-tight bg-white">
                                                    <SelectValue placeholder="SELECT AN F2 ASSET..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-none border-black shadow-2xl max-h-[200px]">
                                                    <SelectItem value="none" className="text-[9px] font-black uppercase italic text-slate-300">Unlinked / No Template</SelectItem>
                                                    {templates.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.id} className="text-[9px] uppercase font-black tracking-wider py-3">
                                                            {t.name} <span className="ml-2 text-slate-300 font-bold">({t.document_type || 'ADHOC'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : form.data.f2_input_mechanism === 'folder' ? (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Link to Folder Template (F2)</Label>
                                            <Select value={form.data.f2_contract_template_id} onValueChange={v => form.setData('f2_contract_template_id', v)}>
                                                <SelectTrigger className="h-10 rounded-none border-slate-200 text-[10px] font-black uppercase tracking-tight bg-white">
                                                    <SelectValue placeholder="SELECT A PHYSICAL ASSET..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-none border-black shadow-2xl max-h-[200px]">
                                                    <SelectItem value="none" className="text-[9px] font-black uppercase italic text-slate-300">No Template Selected</SelectItem>
                                                    {physTemplates.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.id} className="text-[9px] uppercase font-black tracking-wider py-3">
                                                            {t.name} <span className="ml-2 text-slate-300 font-bold">({t.file_type || 'PDF'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center animate-in fade-in">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">VENDORS WILL UPLOAD MANUAL PDF FOR F2</p>
                                        </div>
                                    )}
                                </div>
                             </FormSection>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Registry Klasifikasi Kontrak"
            columns={columns}
            data={contractTypes?.data || []}
            searchKey="name"
            searchPlaceholder="Filter jenis klasifikasi..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            headerActions={
                canCreate && (
                    <Button onClick={openCreate} className="h-10 gap-2 rounded-none bg-black text-white hover:bg-slate-800 transition-all px-6 text-[10px] font-black uppercase tracking-widest shadow-xl">
                        <Plus className="h-4 w-4" /> Initialize Type
                    </Button>
                )
            }
            onRowClick={openEdit}
            pagination={contractTypes && contractTypes.meta ? {
                currentPage: contractTypes.meta.current_page || 1,
                lastPage: contractTypes.meta.last_page || 1,
                total: contractTypes.meta.total || 0,
                from: contractTypes.meta.from || 1,
                to: contractTypes.meta.to || 1,
                perPage: contractTypes.meta.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            } : (contractTypes ? {
                currentPage: contractTypes.current_page || 1,
                lastPage: contractTypes.last_page || 1,
                total: contractTypes.total || 0,
                from: contractTypes.from || 1,
                to: contractTypes.to || 1,
                perPage: contractTypes.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp) => router.get(window.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            } : undefined)}
        />
    );
}
