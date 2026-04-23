import React, { useState, useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from '@inertiajs/react';
import { 
    GitBranch, Trash2, GripVertical, 
    Shield, Users as UsersIcon, CheckCircle2, Plus, PlusCircle 
} from 'lucide-react';
import { 
    DndContext, closestCenter, KeyboardSensor, PointerSensor, 
    useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
    arrayMove, SortableContext, sortableKeyboardCoordinates, 
    verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { ManagementForm, FormSection, FormDangerZone } from '@/components/admin/ManagementForm';

// --- Sortable Step Item Component ---
function SortableStepItem({
    step,
    idx,
    users,
    roles,
    departments,
    updateLocalStep,
    removeLocalStep,
}: {
    step: any;
    idx: number;
    users: any[];
    roles: any[];
    departments: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const [userSearchText, setUserSearchText] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const filteredRoles = roles.filter((r) => r.name.toLowerCase().includes(roleSearchText.toLowerCase()));
    const filteredUsers = users.filter((u) => {
        const matchesName = u.name.toLowerCase().includes(userSearchText.toLowerCase()) || u.email.toLowerCase().includes(userSearchText.toLowerCase());
        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
        return matchesName && matchesRole;
    });

    return (
        <div ref={setNodeRef} style={style} className="group/step relative flex items-start gap-4 overflow-hidden border border-slate-200 bg-white p-3.5 transition-all hover:border-black active:cursor-grabbing">
            <div className="absolute top-0 left-0 h-full w-1 bg-black opacity-0 transition-opacity group-hover/step:opacity-100" />
            
            <div {...attributes} {...listeners} className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center bg-slate-900 shadow-lg shadow-slate-900/10">
                <GripVertical size={12} className="mr-0.5 text-white/30" />
                <span className="text-[11px] font-black text-white">{idx + 1}</span>
            </div>

            <div className="grid flex-1 grid-cols-12 gap-5">
                <div className="col-span-3 space-y-1.5">
                    <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Otoritas</Label>
                    <div className="flex bg-slate-100 p-0.5 border border-slate-200">
                        <button 
                            type="button" 
                            onClick={() => updateLocalStep(idx, { approver_type: 'role', role: '' })} 
                            className={cn('flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase transition-all', step.approver_type === 'role' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                        >
                            <Shield size={9} /> Role
                        </button>
                        <button 
                            type="button" 
                            onClick={() => updateLocalStep(idx, { approver_type: 'user', user_ids: [] })} 
                            className={cn('flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase transition-all', step.approver_type === 'user' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                        >
                            <UsersIcon size={9} /> User
                        </button>
                    </div>
                </div>

                <div className="col-span-8 space-y-1.5">
                    {step.approver_type === 'role' ? (
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Pilih Role Akses</Label>
                            <Select value={step.role} onValueChange={(val) => updateLocalStep(idx, { role: val })}>
                                <SelectTrigger className="h-9 rounded-none border-slate-200 text-[10px] font-bold uppercase bg-slate-50/30">
                                    <SelectValue placeholder="CARI ROLE..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-none border-2 border-black">
                                    <div className="p-1.5 border-b-2 border-slate-50"><Input placeholder="Search..." value={roleSearchText} onChange={e => setRoleSearchText(e.target.value)} className="h-8 rounded-none border-slate-100 text-[10px]" /></div>
                                    {filteredRoles.map(r => <SelectItem key={r.id} value={r.name} className="text-[10px] font-bold uppercase">{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <Label className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">User Spesifik</Label>
                                <span className="text-[9px] font-black text-primary">{step.user_ids?.length || 0} TERPILIH</span>
                             </div>
                             <div className="flex gap-1.5">
                                 <Input placeholder="Search..." value={userSearchText} onChange={e => setUserSearchText(e.target.value)} className="h-8 rounded-none border-slate-200 text-[10px] font-bold uppercase" />
                                 <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                                     <SelectTrigger className="h-8 w-[120px] rounded-none border-slate-200 text-[9px] font-black uppercase"><SelectValue /></SelectTrigger>
                                     <SelectContent className="rounded-none border-2 border-black">
                                         <SelectItem value="all">ALL ROLES</SelectItem>
                                         {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name.toUpperCase()}</SelectItem>)}
                                     </SelectContent>
                                 </Select>
                             </div>
                             <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 bg-slate-50 border border-slate-200">
                                 {filteredUsers.map(u => (
                                     <label key={u.id} className={cn("flex items-center gap-2.5 p-2 border cursor-pointer transition-all", step.user_ids?.includes(u.id) ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-slate-300")}>
                                         <Checkbox 
                                            checked={step.user_ids?.includes(u.id)} 
                                            onCheckedChange={(checked) => {
                                                const ids = step.user_ids || [];
                                                updateLocalStep(idx, { user_ids: checked ? [...ids, u.id] : ids.filter((id:any) => id !== u.id) });
                                            }} 
                                            className="w-3.5 h-3.5 rounded-none border-slate-300 data-[state=checked]:bg-white data-[state=checked]:text-black"
                                         />
                                         <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-black uppercase truncate leading-none">{u.name}</span>
                                            <span className={cn("text-[8px] font-bold mt-1 uppercase opacity-50", step.user_ids?.includes(u.id) ? "text-white" : "text-slate-500")}>{u.role}</span>
                                         </div>
                                     </label>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                <div className="col-span-1 flex items-start justify-end pt-3">
                    <Button variant="ghost" size="icon" onClick={() => removeLocalStep(idx)} className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-slate-50 transition-colors">
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Workflow Management Component ---
interface WorkflowManagementProps {
    workflows: any;
    contractTypes: any[];
    departments: any[];
    roles: any[];
    users: any[];
    filters: any;
}

export function WorkflowManagement({ workflows, contractTypes, departments, roles, users, filters }: WorkflowManagementProps) {
    const { showToast } = useToast();
    const { canUpdate } = usePermissions('ADMIN_WORKFLOWS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: '',
        contract_type: '',
        department_id: '',
        description: '',
        is_default: true as boolean,
        steps: [] as any[],
    });

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Entity Identifier',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.name}</span>
                        {row.is_default && <Badge className="bg-black text-white text-[7px] font-black tracking-[0.2em] uppercase rounded-none px-1.5 py-0">DEFAULT</Badge>}
                    </div>
                    <div className="mt-1 text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                        {row.contract_type} 
                        {row.department && <><span className="w-0.5 h-0.5 bg-slate-300" /> <span className="text-black">{row.department.name}</span></>}
                    </div>
                </div>
            )
        },
        {
            header: 'Sequential Logic',
            accessorKey: 'steps_count',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                        {row.steps?.slice(0, 4).map((s:any, i:number) => (
                            <div key={i} className="w-7 h-7 rounded-none border border-black bg-white flex items-center justify-center text-[9px] font-black text-black uppercase shadow-sm">
                                {s.role?.charAt(0)}
                            </div>
                        ))}
                        {row.steps?.length > 4 && <div className="w-7 h-7 border border-black bg-black text-white flex items-center justify-center text-[8px] font-black shadow-sm">+{row.steps.length - 4}</div>}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-900 leading-none">{row.steps?.length || 0} STEPS</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ALUR AKTIF</span>
                    </div>
                </div>
            )
        }
    ], []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = form.data.steps.findIndex((i) => i.id === active.id);
            const newIdx = form.data.steps.findIndex((i) => i.id === over.id);
            form.setData('steps', arrayMove(form.data.steps, oldIdx, newIdx));
        }
    };

    const addLocalStep = () => {
        form.setData('steps', [...form.data.steps, {
            id: `new-${Date.now()}`,
            approver_type: 'role',
            user_ids: [],
            role: '',
            department_id: 'none',
            step: form.data.steps.length + 1,
        }]);
    };

    const openCreate = () => {
        setEditingWorkflow(null);
        form.reset();
        setIsModalOpen(true);
    };

    const openEdit = (w: any) => {
        setEditingWorkflow(w);
        form.setData({
            name: w.name,
            contract_type: w.contract_type,
            department_id: w.department_id || '',
            description: w.description || '',
            is_default: !!w.is_default,
            steps: w.steps?.map((s: any) => ({
                id: s.id,
                role: s.role,
                approver_type: s.approver_type || 'role',
                user_ids: s.user_ids || [],
                department_id: s.department_id || 'none',
                step: s.step,
            })) || [],
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = { 
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingWorkflow(null);
                showToast('Struktur Alur Tersimpan', 'success');
            } 
        };
        if (editingWorkflow) form.put(`/admin/workflows/${editingWorkflow.id}`, options);
        else form.post('/admin/workflows', options);
    };

    if (editingWorkflow || (isModalOpen && !editingWorkflow)) {
        const isEdit = !!editingWorkflow;
        
        return (
            <ManagementForm
                title={isEdit ? 'Profil Alur Kerja' : 'Registrasi Alur Baru'}
                onClose={() => { setIsModalOpen(false); setEditingWorkflow(null); }}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={isEdit}
            >
                <div className="space-y-8 pb-16 animate-in slide-in-from-bottom-2 duration-500 w-full px-2">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Primary Identity Section */}
                        <div className="lg:col-span-8">
                            <FormSection title="Arsitektur Identitas">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Alur Kerja</Label>
                                        <Input 
                                            value={form.data.name} 
                                            onChange={e => form.setData('name', e.target.value)} 
                                            required 
                                            placeholder="CONTOH: PROCUREMENT REGULER" 
                                            className="h-9 rounded-none border-slate-200 bg-white font-bold uppercase text-[10px] focus:border-black transition-all" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Spesialisasi</Label>
                                        <Select value={form.data.contract_type} onValueChange={v => form.setData('contract_type', v)}>
                                            <SelectTrigger className="h-9 rounded-none border-slate-200 bg-white text-[10px] font-bold uppercase">
                                                <SelectValue placeholder="PILIH TIPE" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-2 border-black">
                                                {contractTypes.map(t => <SelectItem key={t.id} value={t.name} className="uppercase font-bold text-[10px]">{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Departemen</Label>
                                        <Select value={form.data.department_id} onValueChange={v => form.setData('department_id', v)}>
                                            <SelectTrigger className="h-9 rounded-none border-slate-200 bg-white text-[10px] font-bold uppercase">
                                                <SelectValue placeholder="GLOBAL / SEMUA" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-2 border-black">
                                                <SelectItem value="none" className="text-[10px] font-bold">GLOBAL (SEMUA DEPARTEMEN)</SelectItem>
                                                {departments.map(d => <SelectItem key={d.id} value={d.id} className="uppercase font-bold text-[10px]">{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </FormSection>
                        </div>

                        {/* System Priority Section */}
                        <div className="lg:col-span-4 h-fit">
                            <FormDangerZone 
                                title="Konfigurasi Sistem"
                                description="Pengaturan perilaku global alur kerja ini."
                            >
                                <div className="flex items-center gap-3 p-1">
                                    <Checkbox 
                                        id="f-default"
                                        checked={form.data.is_default} 
                                        onCheckedChange={(checked) => form.setData('is_default', checked as boolean)} 
                                        className="w-5 h-5 rounded-none border-slate-400 data-[state=checked]:bg-black data-[state=checked]:text-white data-[state=checked]:border-black transition-colors"
                                    />
                                    <div className="flex flex-col">
                                        <Label htmlFor="f-default" className="text-[11px] font-black uppercase cursor-pointer leading-tight">AKTIVASI DEFAULT</Label>
                                        <p className="text-[8px] font-bold text-slate-500 mt-0.5 uppercase tracking-tight">GUNAKAN SECARA GLOBAL</p>
                                    </div>
                                </div>
                            </FormDangerZone>
                        </div>
                    </div>

                    {/* Sequential Architecture Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-black text-white shadow-lg shadow-black/10"><GitBranch size={16} /></div>
                                <div>
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-900">Sequential Approval Logic</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Definisikan hierarki otoritas persetujuan</p>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addLocalStep} 
                                className="h-8 gap-2 rounded-none border border-black px-4 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5"
                            >
                                <PlusCircle size={14} /> Tambah Tahap
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {form.data.steps.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 bg-slate-50/30">
                                    <div className="w-12 h-12 rounded-none border border-slate-100 bg-white flex items-center justify-center text-slate-200 mb-4"><PlusCircle size={24} /></div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Belum Ada Struktur</span>
                                    <Button type="button" variant="link" onClick={addLocalStep} className="text-primary text-[9px] font-black uppercase mt-2">Buat Struktur Baru</Button>
                                </div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                                    <SortableContext items={form.data.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="grid gap-3">
                                            {form.data.steps.map((step, idx) => (
                                                <SortableStepItem 
                                                    key={step.id} 
                                                    step={step} 
                                                    idx={idx} 
                                                    users={users} 
                                                    roles={roles} 
                                                    departments={departments} 
                                                    updateLocalStep={(i, data) => {
                                                        const newSteps = [...form.data.steps];
                                                        newSteps[i] = { ...newSteps[i], ...data };
                                                        form.setData('steps', newSteps);
                                                    }} 
                                                    removeLocalStep={(i) => form.setData('steps', form.data.steps.filter((_, index) => index !== i))} 
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}

                            {form.data.steps.length > 0 && (
                                <div className="flex items-center gap-4 py-8 opacity-20 grayscale">
                                    <div className="h-px flex-1 bg-slate-400" />
                                    <div className="flex items-center gap-2 text-black">
                                        <CheckCircle2 size={20} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.4em]">FINALIZED</span>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-400" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <DataTable
                columns={columns}
                data={workflows.data || []}
                searchKey="name"
                searchPlaceholder="Filter Alur..."
                onRowClick={openEdit}
                headerActions={
                    <Button onClick={openCreate} className="h-9 gap-2 rounded-none px-6 text-[10px] font-black uppercase tracking-[0.1em] bg-black text-white hover:bg-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
                        <Plus className="h-3.5 w-3.5" /> Registrasi Alur
                    </Button>
                }
            />
        </div>
    );
}
