import React, { useMemo, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { ManagementForm, FormSection } from '@/components/admin/ManagementForm';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/overlays/Dialog';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    CheckCircle2, 
    Edit3, 
    GitBranch, 
    PlusCircle, 
    Shield, 
    Trash2, 
    UserCheck, 
    Users as UsersIcon,
    GripVertical,
    Info,
    LayoutTemplate,
    Search,
    Briefcase
} from 'lucide-react';


// --- Sortable Step Item (Compact) ---
function SortableStepItem({
    step,
    idx,
    users,
    roles,
    departments,
    contractStatuses,
    updateLocalStep,
    removeLocalStep,
}: {
    step: any;
    idx: number;
    users: any[];
    roles: any[];
    departments: any[];
    contractStatuses: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const [userSearchText, setUserSearchText] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [deptSearchText, setDeptSearchText] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const activeRoles = Array.isArray(step.role) ? step.role : step.role ? [step.role] : [];
    const activeDepts = Array.isArray(step.department_ids) ? step.department_ids : step.department_ids ? [step.department_ids] : [];
    const activeUsers = Array.isArray(step.user_ids) ? step.user_ids : [];

    const filteredDepartments = useMemo(() => {
        const base = activeRoles.length === 0 ? departments : departments.filter((d) => users.some((u) => activeRoles.includes(u.role) && u.department_id === d.id));
        return deptSearchText ? base.filter((d) => d.name.toLowerCase().includes(deptSearchText.toLowerCase())) : base;
    }, [departments, activeRoles, users, deptSearchText]);

    const filteredRolesBySearch = useMemo(() => {
        return roleSearchText ? roles.filter((r) => r.name.toLowerCase().includes(roleSearchText.toLowerCase())) : roles;
    }, [roles, roleSearchText]);

    const filteredUsersByHierarchy = useMemo(() => {
        return users.filter((u) => {
            const matchesRole = activeRoles.length === 0 || activeRoles.includes(u.role);
            const matchesDept = activeDepts.length === 0 || activeDepts.includes(u.department_id);
            const matchesSearch = !userSearchText || u.name.toLowerCase().includes(userSearchText.toLowerCase());
            return matchesRole && matchesDept && matchesSearch;
        });
    }, [users, activeRoles, activeDepts, userSearchText]);

    const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group/step relative flex gap-3 rounded-xl border border-primary/10 bg-white dark:bg-black p-3 transition-all hover:bg-primary/[0.02] dark:hover:bg-white/[0.02]',
                isDragging && 'z-50 scale-[1.01] border-primary shadow-xl dark:border-white ring-2 ring-primary/5',
                !isAnySelected && 'border-dashed border-primary/20',
            )}
        >
            <div className="flex shrink-0 flex-col items-center gap-1.5">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg border border-primary/10 bg-primary/[0.03] dark:bg-white/[0.03] transition-all hover:bg-primary hover:text-white group-hover/step:shadow-md"
                >
                    <GripVertical size={12} className="opacity-30" />
                </div>
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[7px] font-black text-primary/20 dark:text-white/20 uppercase">STP</span>
                    <span className="text-[12px] font-black">{idx + 1}</span>
                </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {!isAnySelected ? (
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-primary/5 text-[8px] font-black tracking-widest text-primary/40 uppercase">Akses Terbuka</span>
                            <span className="text-[8px] font-bold text-primary/20 uppercase tracking-tighter italic">Personel Terkait</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {activeRoles.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary dark:bg-white text-white dark:text-black shadow-sm">
                                    <Shield size={8} />
                                    <span className="text-[8px] font-black tracking-tight uppercase">
                                        {activeRoles.length === 1 ? activeRoles[0] : `${activeRoles.length} ROLE`}
                                    </span>
                                </div>
                            )}
                            {activeDepts.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-primary/20 dark:border-white/20 text-primary dark:text-white">
                                    <GitBranch size={8} />
                                    <span className="text-[8px] font-black tracking-tight uppercase">
                                        {activeDepts.length === 1 ? departments.find((d) => d.id === activeDepts[0])?.name : `${activeDepts.length} DEPT`}
                                    </span>
                                </div>
                            )}
                            {activeUsers.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/[0.05] dark:bg-white/[0.05] border border-primary/10 text-primary dark:text-white">
                                    <UserCheck size={8} />
                                    <span className="text-[8px] font-black tracking-tight uppercase">
                                        {activeUsers.length === 1 ? users.find((u) => u.id === activeUsers[0])?.name : `${activeUsers.length} PERSONEL`}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        {step.status_id && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[7px] font-black uppercase tracking-widest">
                                <LayoutTemplate size={8} /> {contractStatuses.find(s => s.id === step.status_id)?.label || 'STATUS'}
                            </div>
                        )}
                        {step.description && (
                            <span className="text-[8px] font-bold text-primary/30 dark:text-white/40 uppercase italic tracking-tight truncate max-w-[200px]">
                                {step.description}
                            </span>
                        )}
                    </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-7 gap-1.5 rounded-lg border-primary/10 px-3 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-primary hover:text-white active:scale-95"
                            >
                                <Edit3 size={10} /> Otoritas
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-[2rem] border border-primary/10 bg-white dark:bg-black shadow-2xl">
                            <DialogHeader className="bg-primary dark:bg-white p-6 text-white dark:text-black">
                                <div className="flex items-center gap-3">
                                    <GitBranch size={20} />
                                    <div>
                                        <DialogTitle className="text-lg font-black tracking-tight uppercase mb-0.5">Konfigurasi Tahap {idx + 1}</DialogTitle>
                                        <p className="text-[8px] font-bold text-white/50 dark:text-black/50 uppercase tracking-widest">Tentukan personel penyetuju melalui hirarki</p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-4 p-6 border-b border-primary/5 bg-primary/[0.01]">
                                <CompactInput label="Judul Tahapan" value={step.description || ''} onChange={(e) => updateLocalStep(idx, { description: e.target.value })} icon={Info} />
                                <CompactSelect 
                                    label="Target Status" 
                                    value={step.status_id || 'none'} 
                                    onChange={(v) => updateLocalStep(idx, { status_id: v === 'none' ? null : v })} 
                                    options={[{ label: '-- TETAP --', value: 'none' }, ...contractStatuses.map((s: any) => ({ label: s.label, value: s.id }))]} 
                                    icon={LayoutTemplate} 
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-6 p-6 min-h-[400px]">
                                {[
                                    { label: 'Filter Role', icon: Shield, active: activeRoles, search: roleSearchText, setSearch: setRoleSearchText, data: filteredRolesBySearch, onSelect: (r:any) => updateLocalStep(idx, { role: activeRoles.includes(r.name) ? activeRoles.filter((n:string)=>n!==r.name) : [...activeRoles, r.name] }), display: (r:any)=>r.name },
                                    { label: 'Filter Dept', icon: GitBranch, active: activeDepts, search: deptSearchText, setSearch: setDeptSearchText, data: filteredDepartments, onSelect: (d:any) => updateLocalStep(idx, { department_ids: activeDepts.includes(d.id) ? activeDepts.filter((id:string)=>id!==d.id) : [...activeDepts, d.id] }), display: (d:any)=>d.name },
                                    { label: 'Target Personel', icon: UsersIcon, active: activeUsers, search: userSearchText, setSearch: setUserSearchText, data: filteredUsersByHierarchy, onSelect: (u:any) => updateLocalStep(idx, { user_ids: activeUsers.includes(u.id) ? activeUsers.filter((id:string)=>id!==u.id) : [...activeUsers, u.id] }), display: (u:any)=>u.name, sub: (u:any)=>u.role }
                                ].map((col, cIdx) => (
                                    <div key={col.label} className={cn("space-y-3", cIdx === 1 && "border-x border-primary/5 px-6")}>
                                        <div className="flex items-center justify-between border-b border-primary/5 pb-2">
                                            <div className="flex items-center gap-2">
                                                <col.icon size={12} className="text-primary/40" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{col.label}</span>
                                            </div>
                                            {col.active.length > 0 && <div className="h-4 w-4 rounded-full bg-primary text-white text-[8px] font-black flex items-center justify-center">{col.active.length}</div>}
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/20" size={12} />
                                            <input placeholder="CARI..." value={col.search} onChange={(e) => col.setSearch(e.target.value)} className="w-full h-8 pl-8 pr-3 rounded-lg border border-primary/10 bg-primary/[0.01] text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-0.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                            {col.data.map((item:any) => {
                                                const id = item.id || item.name;
                                                const isActive = col.active.includes(id);
                                                return (
                                                    <button key={id} type="button" onClick={() => col.onSelect(item)} className={cn("w-full flex items-center justify-between p-2 rounded-lg border transition-all text-left", isActive ? "bg-primary border-primary text-white shadow-md" : "border-transparent hover:bg-primary/[0.03]")}>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[9px] font-black uppercase truncate">{col.display(item)}</span>
                                                            {col.sub && <span className={cn("text-[7px] font-bold uppercase opacity-50", isActive ? "text-white/60" : "text-primary/40")}>{col.sub(item)}</span>}
                                                        </div>
                                                        {isActive && <CheckCircle2 size={10} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <DialogFooter className="bg-primary/[0.02] p-4 border-t border-primary/5">
                                <Button type="button" onClick={() => setIsDialogOpen(false)} className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Simpan</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="icon" onClick={() => removeLocalStep(idx)} className="h-7 w-7 rounded-lg text-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={12} /></Button>
                </div>
            </div>
        </div>
    );
}

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({ 
    auth, 
    workflow, 
    contractTypes, 
    departments, 
    roles, 
    users, 
    contractStatuses 
}: any) {
    const { showToast } = useToast();
    const [isInitiatorDialogOpen, setIsInitiatorDialogOpen] = useState(false);
    const [initiatorUserSearch, setInitiatorUserSearch] = useState('');
    const [initiatorRoleSearch, setInitiatorRoleSearch] = useState('');
    const [initiatorDeptSearch, setInitiatorDeptSearch] = useState('');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: workflow?.name || '',
        contract_type: workflow?.contract_type || '',
        description: workflow?.description || '',
        is_default: !!workflow?.is_default,
        initiator_type: workflow?.initiator_type || 'all',
        initiator_roles: workflow?.initiator_roles || [],
        initiator_users: workflow?.initiator_users || [],
        initiator_departments: workflow?.initiator_departments || [],
        steps: workflow?.steps || [],
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = form.data.steps.findIndex((i: any) => i.id === active.id);
            const newIdx = form.data.steps.findIndex((i: any) => i.id === over.id);
            form.setData('steps', arrayMove(form.data.steps, oldIdx, newIdx));
        }
    };

    const addLocalStep = () => {
        form.setData('steps', [...form.data.steps, { id: `new-${Date.now()}`, approver_type: 'role', user_ids: [], role: [] as string[], department_ids: [] as string[], step: form.data.steps.length + 1 }]);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = { 
            onSuccess: () => showToast('Konfigurasi alur berhasil disimpan', 'success'),
            onError: (err: any) => showToast(err.error || 'Gagal menyimpan alur', 'danger')
        };
        
        if (workflow) form.put(route('admin.workflows.update', workflow.id), options);
        else form.post(route('admin.workflows.store'), options);
    };

    return (
        <>
            <Head title={workflow ? 'Edit Workflow' : 'Registrasi Workflow Baru'} />
            
            <div className="flex h-full flex-col bg-white dark:bg-black">
                <ManagementForm
                    title={workflow ? 'Parameter Alur' : 'Registrasi Alur'}
                    subtitle={workflow ? `Konfigurasi tahapan untuk ${form.data.name}` : 'Mendefinisikan alur approval baru'}
                    onClose={() => router.visit(route('admin.workflows'))}
                    onSave={handleSubmit}
                    processing={form.processing}
                    isDirty={form.isDirty}
                    isEdit={!!workflow}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: Metadata & Initiator */}
                        <div className="lg:col-span-4 space-y-6">
                            <FormSection title="Arsitektur Alur" subtitle="Identitas & Target">
                                <div className="space-y-4">
                                    <CompactInput label="Nama Alur" value={form.data.name} onChange={e=>form.setData('name', e.target.value)} placeholder="CONTOH: PENGADAAN JASA" icon={Briefcase} />
                                    <CompactSelect label="Klasifikasi" value={form.data.contract_type || 'all'} onChange={v=>form.setData('contract_type', v==='all'?'':String(v))} options={[{label:'GLOBAL',value:'all'},...contractTypes.map((t:any)=>({label:t.name,value:t.name}))]} icon={LayoutTemplate} />
                                    <div onClick={()=>form.setData('is_default', !form.data.is_default)} className="flex items-center gap-3 p-3 rounded-xl bg-primary/[0.02] border border-primary/5 cursor-pointer group hover:bg-primary/[0.04] transition-all">
                                        <Checkbox checked={form.data.is_default} onCheckedChange={()=>{}} className="h-4 w-4" />
                                        <div className="flex flex-col"><span className="text-[9px] font-black uppercase text-primary">Default</span><span className="text-[7px] font-bold text-primary/30 uppercase">Prioritas Sistem</span></div>
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="Inisiator" subtitle="Otoritas Akses">
                                {(() => {
                                    const activeRoles = form.data.initiator_roles || [];
                                    const activeDepts = form.data.initiator_departments || [];
                                    const activeUsers = form.data.initiator_users || [];
                                    const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;
                                    const filteredDepts = activeRoles.length === 0 ? departments : departments.filter((d:any) => users.some((u:any) => activeRoles.includes(u.role) && u.department_id === d.id));
                                    const filteredUsers = users.filter((u:any) => (activeRoles.length === 0 || activeRoles.includes(u.role)) && (activeDepts.length === 0 || activeDepts.includes(u.department_id)) && (!initiatorUserSearch || u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase())));

                                    return (
                                        <div className={cn("p-4 rounded-xl border border-dashed transition-all bg-primary/[0.01]", isAnySelected ? "border-primary/20" : "border-primary/10")}>
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[9px] font-black uppercase text-primary/60">Akses Inisiasi</span>
                                                <Dialog open={isInitiatorDialogOpen} onOpenChange={setIsInitiatorDialogOpen}>
                                                    <DialogTrigger asChild><Button variant="outline" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase transition-all"><Edit3 size={10} className="mr-1.5" /> Atur</Button></DialogTrigger>
                                                    <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-[2rem] bg-white dark:bg-black shadow-2xl">
                                                        <DialogHeader className="bg-primary p-6 text-white"><div className="flex items-center gap-3"><UsersIcon size={20}/><DialogTitle className="text-lg font-black uppercase">Otoritas Inisiator</DialogTitle></div></DialogHeader>
                                                        <div className="grid grid-cols-3 gap-6 p-6 min-h-[400px]">
                                                            {[
                                                                { label: 'Role', active: activeRoles, search: initiatorRoleSearch, setSearch: setInitiatorRoleSearch, data: roles, onSelect: (r:any)=>form.setData('initiator_roles', activeRoles.includes(r.name)?activeRoles.filter((n:any)=>n!==r.name):[...activeRoles, r.name]), display: (r:any)=>r.name },
                                                                { label: 'Dept', active: activeDepts, search: initiatorDeptSearch, setSearch: setInitiatorDeptSearch, data: filteredDepts, onSelect: (d:any)=>form.setData('initiator_departments', activeDepts.includes(d.id)?activeDepts.filter((id:any)=>id!==d.id):[...activeDepts, d.id]), display: (d:any)=>d.name },
                                                                { label: 'User', active: activeUsers, search: initiatorUserSearch, setSearch: setInitiatorUserSearch, data: filteredUsers, onSelect: (u:any)=>form.setData('initiator_users', activeUsers.includes(u.id)?activeUsers.filter((id:any)=>id!==u.id):[...activeUsers, u.id]), display: (u:any)=>u.name }
                                                            ].map((col, idx) => (
                                                                <div key={col.label} className={cn("space-y-3", idx === 1 && "border-x border-primary/5 px-6")}>
                                                                    <span className="text-[10px] font-black uppercase text-primary/40 pb-2 border-b border-primary/5 flex justify-between">{col.label} {col.active.length > 0 && <span className="text-primary">{col.active.length}</span>}</span>
                                                                    <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/20" size={12}/><input placeholder="CARI..." value={col.search} onChange={e=>col.setSearch(e.target.value)} className="w-full h-8 pl-8 pr-3 rounded-lg border border-primary/10 bg-primary/[0.01] text-[9px] font-black uppercase outline-none" /></div>
                                                                    <div className="space-y-0.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                                                        {col.data.filter((d:any)=>!col.search || col.display(d).toLowerCase().includes(col.search.toLowerCase())).map((item:any)=>(
                                                                            <button key={item.id||item.name} type="button" onClick={()=>col.onSelect(item)} className={cn("w-full flex items-center justify-between p-2 rounded-lg text-[9px] font-black uppercase transition-all", col.active.includes(item.id||item.name)?"bg-primary text-white":"hover:bg-primary/5")}><span>{col.display(item)}</span>{col.active.includes(item.id||item.name) && <CheckCircle2 size={10}/>}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <DialogFooter className="p-4 bg-primary/[0.02] border-t border-primary/5"><Button type="button" onClick={()=>setIsInitiatorDialogOpen(false)} className="h-9 px-8 rounded-xl text-[10px] font-black">Selesai</Button></DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {!isAnySelected ? <span className="text-[8px] font-bold text-primary/30 uppercase italic">Akses Publik (Semua Personel)</span> : (
                                                    <>
                                                        {activeRoles.map((r:any)=><div key={r} className="px-2 py-0.5 rounded-md bg-primary text-white text-[7px] font-black uppercase">{r}</div>)}
                                                        {activeDepts.map((id:any)=><div key={id} className="px-2 py-0.5 rounded-md border border-primary text-primary text-[7px] font-black uppercase">{departments.find((d:any)=>d.id===id)?.name}</div>)}
                                                        {activeUsers.map((id:any)=><div key={id} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[7px] font-black uppercase">{users.find((u:any)=>u.id===id)?.name}</div>)}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </FormSection>
                        </div>

                        {/* RIGHT COLUMN: Approval Steps */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between border-b border-primary/5 pb-4">
                                <div className="flex flex-col"><h3 className="text-[12px] font-black tracking-tight text-primary uppercase flex items-center gap-2"><GitBranch size={16} /> Struktur Tahapan</h3><p className="text-[8px] font-bold text-primary/30 uppercase">Hirarki Approval Berjenjang</p></div>
                                <Button type="button" onClick={addLocalStep} className="h-8 px-4 rounded-lg text-[9px] shadow-md group"><PlusCircle size={12} className="mr-1.5 group-hover:rotate-90 transition-transform" /> Tambah Tahap</Button>
                            </div>

                            {form.data.steps.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/5 bg-primary/[0.01] py-20 text-center">
                                    <PlusCircle size={32} className="text-primary/10 mb-4" />
                                    <span className="text-[9px] font-black tracking-widest text-primary/20 uppercase mb-4">Alur Belum Terdefinisi</span>
                                    <Button type="button" variant="outline" onClick={addLocalStep} className="h-8 px-6 rounded-lg text-[8px] font-black uppercase">Mulai Membangun</Button>
                                </div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                                    <SortableContext items={form.data.steps.map((s:any)=>s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="grid gap-3 relative">
                                            <div className="absolute left-[17px] top-6 bottom-6 w-px bg-dashed border-l border-dashed border-primary/10 z-0" />
                                            {form.data.steps.map((step: any, idx: number) => (
                                                <SortableStepItem 
                                                    key={step.id} 
                                                    step={step} 
                                                    idx={idx} 
                                                    users={users} 
                                                    roles={roles} 
                                                    departments={departments} 
                                                    contractStatuses={contractStatuses} 
                                                    updateLocalStep={(i,data)=>{const s=[...form.data.steps];s[i]={...s[i],...data};form.setData('steps',s);}} 
                                                    removeLocalStep={(i: number)=>form.setData('steps',form.data.steps.filter((_:any,index:number)=>index!==i))} 
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}

                            {form.data.steps.length > 0 && (
                                <div className="flex items-center gap-4 py-6">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/5 to-primary/5" />
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/10 bg-primary/[0.01] text-[8px] font-black text-primary/30 uppercase tracking-[0.3em]"><CheckCircle2 size={12}/> FINISH</div>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/5 to-primary/5" />
                                </div>
                            )}
                        </div>
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
