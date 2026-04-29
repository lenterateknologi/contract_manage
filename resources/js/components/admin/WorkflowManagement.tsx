import React, { useState, useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from '@inertiajs/react';
import { 
    GitBranch, Trash2, GripVertical, Edit3,
    Shield, Users as UsersIcon, CheckCircle2, Plus, PlusCircle, UserCheck
} from 'lucide-react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
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

    // Cascading Filter Logic
    const activeRoles = Array.isArray(step.role) ? step.role : (step.role ? [step.role] : []);
    const activeDepts = Array.isArray(step.department_ids) ? step.department_ids : (step.department_ids ? [step.department_ids] : []);
    const activeUsers = Array.isArray(step.user_ids) ? step.user_ids : [];

    // 1. Filter Departments based on selected Roles
    // If no roles selected, show all departments that have users
    const filteredDepartments = useMemo(() => {
        const base = activeRoles.length === 0 ? departments : departments.filter(d => 
            users.some(u => activeRoles.includes(u.role) && u.department_id === d.id)
        );
        if (!deptSearchText) return base;
        return base.filter(d => d.name.toLowerCase().includes(deptSearchText.toLowerCase()));
    }, [departments, activeRoles, users, deptSearchText]);

    const filteredRolesBySearch = useMemo(() => {
        if (!roleSearchText) return roles;
        return roles.filter(r => r.name.toLowerCase().includes(roleSearchText.toLowerCase()));
    }, [roles, roleSearchText]);

    // 2. Filter Users based on selected Roles AND Departments
    const filteredUsersByHierarchy = useMemo(() => {
        return users.filter(u => {
            const matchesRole = activeRoles.length === 0 || activeRoles.includes(u.role);
            const matchesDept = activeDepts.length === 0 || activeDepts.includes(u.department_id);
            const matchesSearch = !userSearchText || u.name.toLowerCase().includes(userSearchText.toLowerCase());
            return matchesRole && matchesDept && matchesSearch;
        });
    }, [users, activeRoles, activeDepts, userSearchText]);

    const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;

    return (
        <div ref={setNodeRef} style={style} className={cn(
            "group/step relative flex gap-4 border border-black/10 dark:border-white/10 bg-white dark:bg-black p-3 transition-all hover:bg-black/5 dark:hover:bg-white/5",
            isDragging && "shadow-2xl grayscale border-black dark:border-white scale-[1.01] z-50",
            !isAnySelected && "border-dashed"
        )}>
            {/* Index & Handle */}
            <div className="flex flex-col items-center gap-1 shrink-0">
                <div {...attributes} {...listeners} className="flex h-8 w-8 cursor-grab items-center justify-center bg-white dark:bg-black border border-black/10 dark:border-white/10 group-hover/step:bg-black dark:group-hover/step:bg-white group-hover/step:text-white dark:group-hover/step:text-black transition-colors">
                    <span className="text-[10px] font-black">{idx + 1}</span>
                </div>
            </div>

            {/* Summary View */}
            <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                        {!isAnySelected ? (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border-none text-[8px] font-black tracking-widest px-2 h-5 rounded-none uppercase">SEMUA PERSONEL</Badge>
                                <span className="text-[7px] font-bold text-black/30 dark:text-white/30 uppercase tracking-tighter">Otoritas Terbuka</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 items-center">
                                {activeRoles.length > 0 && (
                                    <div className="flex items-center gap-1.5 p-1 bg-black dark:bg-white text-white dark:text-black rounded-none">
                                        <Shield size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter max-w-[150px] truncate">
                                            {activeRoles.length === 1 ? activeRoles[0] : `${activeRoles.length} ROLE`}
                                        </span>
                                    </div>
                                )}
                                
                                {activeDepts.length > 0 && (
                                    <div className="flex items-center gap-1.5 p-1 border border-black dark:border-white text-black dark:text-white rounded-none">
                                        <GitBranch size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter max-w-[150px] truncate">
                                            {activeDepts.length === 1 ? departments.find(d => d.id === activeDepts[0])?.name : `${activeDepts.length} DEPT`}
                                        </span>
                                    </div>
                                )}

                                {activeUsers.length > 0 && (
                                    <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 text-black dark:text-white rounded-none border border-black/10 dark:border-white/10">
                                        <UserCheck size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter max-w-[150px] truncate">
                                            {activeUsers.length === 1 ? users.find(u => u.id === activeUsers[0])?.name : `${activeUsers.length} PERSONEL`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            {step.status_id && (
                                <Badge variant="secondary" className="bg-black dark:bg-white text-white dark:text-black border-none text-[7px] font-black tracking-widest px-1.5 h-4 rounded-none uppercase">STATUS MAP</Badge>
                            )}
                            {step.description && <span className="text-[7px] font-bold text-black/40 dark:text-white/40 uppercase italic truncate tracking-tight">{step.description}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-4">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2 rounded-none border-2 border-black px-4 text-[9px] font-black uppercase transition-all hover:bg-black hover:text-white">
                                <Edit3 size={12} /> Atur Otoritas
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl rounded-none border border-black dark:border-white p-0 overflow-hidden bg-white dark:bg-black">
                            <DialogHeader className="p-4 bg-black dark:bg-white text-white dark:text-black flex-row items-center justify-between space-y-0">
                                <div>
                                    <DialogTitle className="text-[12px] font-black uppercase tracking-[0.2em]">Tahap {idx + 1}: Konfigurasi Otoritas</DialogTitle>
                                    <p className="text-[8px] font-bold text-white/50 dark:text-black/50 uppercase mt-1">Gunakan Drill-down Hierarchy (Role → Dept → Personel)</p>
                                </div>
                            </DialogHeader>

                            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex gap-6">
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Deskripsi Tahapan (Opsional)</Label>
                                    <Input
                                        placeholder="CONTOH: REVIEW LEGAL DRAFT"
                                        value={step.description || ''}
                                        onChange={(e) => updateLocalStep(idx, { description: e.target.value })}
                                        className="h-9 rounded-none border-black dark:border-white bg-white dark:bg-black font-black uppercase text-[10px] tracking-tight shadow-none focus-visible:ring-0 transition-colors text-black dark:text-white"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Label Status (Opsional)</Label>
                                    <select
                                        className="w-full h-9 rounded-none border border-black dark:border-white bg-white dark:bg-black px-3 text-[10px] font-black uppercase tracking-tight shadow-none focus:outline-none focus:ring-0 transition-colors text-black dark:text-white"
                                        value={step.status_id || ''}
                                        onChange={(e) => updateLocalStep(idx, { status_id: e.target.value || null })}
                                    >
                                        <option value="">-- TANPA PERUBAHAN STATUS --</option>
                                        {contractStatuses.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white min-h-[350px]">
                                {/* 1. ROLE SELECTION */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-2">
                                            <Shield size={12} className="text-black" />
                                            <Label className="text-[10px] font-black tracking-widest text-slate-900 uppercase">1. Role / Jabatan</Label>
                                        </div>
                                        {activeRoles.length > 0 && <Badge className="rounded-none bg-black text-white text-[8px]">{activeRoles.length}</Badge>}
                                    </div>
                                    
                                    <div className="relative">
                                        <Input 
                                            placeholder="CARI ROLE..." 
                                            value={roleSearchText} 
                                            onChange={e => setRoleSearchText(e.target.value)} 
                                            className="h-8 pl-8 rounded-none border-slate-200 text-[10px] font-bold uppercase shadow-none focus-visible:ring-0 focus-visible:border-black" 
                                        />
                                        <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-1 max-h-[250px] overflow-y-auto pr-1 customize-scrollbar">
                                        {filteredRolesBySearch.map(r => {
                                            const isActive = activeRoles.includes(r.name);
                                            return (
                                                <button
                                                    key={r.id} type="button"
                                                    onClick={() => {
                                                        const next = isActive ? activeRoles.filter((n: string) => n !== r.name) : [...activeRoles, r.name];
                                                        updateLocalStep(idx, { role: next });
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between p-2.5 border text-[9px] font-black uppercase transition-all",
                                                        isActive ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-slate-300 text-slate-500"
                                                    )}
                                                >
                                                    {r.name}
                                                    {isActive && <CheckCircle2 size={10} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. DEPARTMENT SELECTION */}
                                <div className="space-y-3 border-x border-slate-100 px-6">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={12} className="text-black" />
                                            <Label className="text-[10px] font-black tracking-widest text-slate-900 uppercase">2. Departemen</Label>
                                        </div>
                                        {activeDepts.length > 0 && <Badge className="rounded-none bg-black text-white text-[8px]">{activeDepts.length}</Badge>}
                                    </div>

                                    <div className="relative">
                                        <Input 
                                            placeholder="CARI DEPARTEMEN..." 
                                            value={deptSearchText} 
                                            onChange={e => setDeptSearchText(e.target.value)} 
                                            className="h-8 pl-8 rounded-none border-slate-200 text-[10px] font-bold uppercase shadow-none focus-visible:ring-0 focus-visible:border-black" 
                                        />
                                        <GitBranch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-1 max-h-[250px] overflow-y-auto pr-1 customize-scrollbar">
                                        {filteredDepartments.map(d => {
                                            const isActive = activeDepts.includes(d.id);
                                            return (
                                                <button
                                                    key={d.id} type="button"
                                                    onClick={() => {
                                                        const next = isActive ? activeDepts.filter((id: string) => id !== d.id) : [...activeDepts, d.id];
                                                        updateLocalStep(idx, { department_ids: next });
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between p-2.5 border text-[9px] font-black uppercase transition-all",
                                                        isActive ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-slate-300 text-slate-500"
                                                    )}
                                                >
                                                    {d.name}
                                                    {isActive && <CheckCircle2 size={10} />}
                                                </button>
                                            );
                                        })}
                                        {filteredDepartments.length === 0 && <div className="py-20 text-center text-[8px] font-black text-slate-300 uppercase italic">Tidak ada departemen tersedia</div>}
                                    </div>
                                </div>

                                {/* 3. PERSONEL SELECTION */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-2">
                                            <UsersIcon size={12} className="text-black" />
                                            <Label className="text-[10px] font-black tracking-widest text-slate-900 uppercase">3. Personel Spesifik</Label>
                                        </div>
                                        {activeUsers.length > 0 && <Badge className="rounded-none bg-black text-white text-[8px]">{activeUsers.length}</Badge>}
                                    </div>
                                    
                                    <div className="relative">
                                        <Input 
                                            placeholder="CARI..." 
                                            value={userSearchText} 
                                            onChange={e => setUserSearchText(e.target.value)} 
                                            className="h-9 pl-8 rounded-none border-slate-200 text-[10px] font-bold uppercase shadow-none focus-visible:ring-0 focus-visible:border-black" 
                                        />
                                        <UsersIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-1 max-h-[250px] overflow-y-auto pr-1 customize-scrollbar">
                                        {filteredUsersByHierarchy.map(u => {
                                            const isSelected = activeUsers.includes(u.id);
                                            return (
                                                <button
                                                    key={u.id} type="button"
                                                    onClick={() => {
                                                        const next = isSelected ? activeUsers.filter((id: string) => id !== u.id) : [...activeUsers, u.id];
                                                        updateLocalStep(idx, { user_ids: next });
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2.5 border transition-all text-left",
                                                        isSelected ? "bg-black text-white border-black" : "bg-white border-slate-50 hover:border-slate-200 text-slate-500"
                                                    )}
                                                >
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-[10px] font-black uppercase truncate leading-none">{u.name}</span>
                                                        <span className={cn("text-[7px] font-bold mt-1 uppercase opacity-50", isSelected ? "text-slate-400" : "text-slate-400")}>{u.role}</span>
                                                    </div>
                                                    {isSelected && <CheckCircle2 size={12} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-3 bg-slate-50 border-t flex items-center justify-between sm:justify-between">
                                <div className="text-[8px] font-black uppercase text-slate-400 italic">Perubahan Tersimpan Otomatis di Draft</div>
                                <Button type="button" onClick={() => setIsDialogOpen(false)} className="h-8 rounded-none bg-black text-white text-[10px] font-black uppercase px-8">Tutup</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="icon" onClick={() => removeLocalStep(idx)} className="h-8 w-8 text-black/20 dark:text-white/20 hover:text-black dark:hover:text-white transition-colors">
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
    contractStatuses: any[];
    filters: any;
}

export function WorkflowManagement({ workflows, contractTypes, departments, roles, users, contractStatuses, filters }: WorkflowManagementProps) {
    const { showToast } = useToast();
    const { canUpdate } = usePermissions('ADMIN_WORKFLOWS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
    const [isInitiatorDialogOpen, setIsInitiatorDialogOpen] = useState(false);
    const [initiatorUserSearch, setInitiatorUserSearch] = useState('');
    const [initiatorRoleSearch, setInitiatorRoleSearch] = useState('');
    const [initiatorDeptSearch, setInitiatorDeptSearch] = useState('');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: '',
        contract_type: '',
        description: '',
        is_default: true as boolean,
        initiator_type: 'all', // all, role, user
        initiator_roles: [] as string[],
        initiator_users: [] as string[],
        initiator_departments: [] as string[],
        steps: [] as any[],
    });

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Alur Kerja',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-tight">{row.name}</span>
                        {row.is_default && <div className="text-white dark:text-black bg-black dark:bg-white px-1.5 py-0.5 rounded-none text-[6px] font-black tracking-widest leading-none uppercase">DEFAULT</div>}
                    </div>
                    <div className="mt-1 text-[8px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        {row.contract_type || 'GLOBAL'} 
                    </div>
                </div>
            )
        },
        {
            header: 'Inisiator',
            accessorKey: 'initiator_type',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-black dark:text-white tracking-widest">
                         {row.initiator_type === 'all' ? 'Publik' : row.initiator_type === 'role' ? `${row.initiator_roles?.length || 0} Role` : `${row.initiator_users?.length || 0} User`}
                    </span>
                </div>
            )
        },
        {
            header: 'Tahapan',
            accessorKey: 'steps_count',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                        {row.steps?.slice(0, 3).map((s:any, i:number) => (
                            <div key={i} className="w-6 h-6 rounded-none border border-black dark:border-white bg-white dark:bg-black flex items-center justify-center text-[8px] font-black text-black dark:text-white" title={Array.isArray(s.role) ? s.role.join(', ') : s.role}>
                                {Array.isArray(s.role) ? s.role[0]?.charAt(0) : s.role?.charAt(0)}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black uppercase text-black dark:text-white leading-none tracking-widest">{row.steps?.length || 0}</span>
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
            role: [] as string[],
            department_ids: [] as string[],
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
            description: w.description || '',
            is_default: !!w.is_default,
            initiator_type: w.initiator_type || 'all',
            initiator_roles: w.initiator_roles || [],
            initiator_users: w.initiator_users || [],
            initiator_departments: w.initiator_departments || [],
            steps: w.steps?.map((s: any) => ({
                id: s.id,
                role: Array.isArray(s.role) ? s.role : (s.role ? [s.role] : []),
                approver_type: s.approver_type || 'role',
                user_ids: s.user_ids || [],
                department_ids: s.department_ids || [],
                status_id: s.status_id || null,
                description: s.description || '',
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
                <div className="space-y-8 pb-12 animate-in slide-in-from-bottom-2 duration-500 w-full px-2">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Primary Identity Section */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-black/60 dark:text-white/60 uppercase border-b border-black/10 dark:border-white/10 pb-2 text-left">Konfigurasi Utama Alur</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-4">
                                <div className="md:col-span-3 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Nama Alur Kerja</Label>
                                    <Input 
                                        value={form.data.name} 
                                        onChange={e => form.setData('name', e.target.value)} 
                                        required 
                                        placeholder="CONTOH: PENGADAAN REGULER" 
                                        className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black font-black uppercase text-[10px] tracking-tight shadow-none focus-visible:ring-0 transition-colors text-black dark:text-white" 
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Klasifikasi</Label>
                                    <SearchableSelect
                                        value={form.data.contract_type || 'all'}
                                        onValueChange={v => form.setData('contract_type', v === 'all' ? '' : v)}
                                        placeholder="Pilih Klasifikasi"
                                        searchPlaceholder="Cari klasifikasi..."
                                        options={[
                                            { value: 'all', label: 'Semua Klasifikasi', italic: true },
                                            ...contractTypes.map((t: any) => ({ value: t.name, label: t.name }))
                                        ]}
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-1.5">
                                    <Label className="text-[9px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest opacity-0 select-none">‌</Label>
                                    <label className="flex h-10 items-center gap-2.5 cursor-pointer group border border-black dark:border-white bg-white dark:bg-black px-3 hover:bg-black dark:hover:bg-white transition-colors">
                                        <Checkbox 
                                            id="f-default"
                                            checked={form.data.is_default} 
                                            onCheckedChange={(checked) => form.setData('is_default', checked as boolean)} 
                                            className="w-4 h-4 rounded-none border-black dark:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                                        />
                                        <span className="text-[9px] font-black uppercase text-black/40 dark:text-white/40 group-hover:text-white dark:group-hover:text-black transition-colors leading-none tracking-widest">Alur Standar</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Initiator Control Section */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-black/60 dark:text-white/60 uppercase border-b border-black/10 dark:border-white/10 pb-2 text-left">Hak Akses Inisiator</h3>
                            {(() => {
                                const activeRoles = form.data.initiator_roles || [];
                                const activeDepts = form.data.initiator_departments || [];
                                const activeUsers = form.data.initiator_users || [];
                                const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;

                                // Cascading Logic
                                const filteredDepts = activeRoles.length === 0 ? departments : departments.filter(d => 
                                    users.some(u => activeRoles.includes(u.role) && u.department_id === d.id)
                                );
                                const searchedRoles = !initiatorRoleSearch ? roles : roles.filter(r => r.name.toLowerCase().includes(initiatorRoleSearch.toLowerCase()));
                                const searchedDepts = !initiatorDeptSearch ? filteredDepts : filteredDepts.filter(d => d.name.toLowerCase().includes(initiatorDeptSearch.toLowerCase()));
                                const filteredUsers = users.filter(u => {
                                    const matchesRole = activeRoles.length === 0 || activeRoles.includes(u.role);
                                    const matchesDept = activeDepts.length === 0 || activeDepts.includes(u.department_id);
                                    const matchesSearch = !initiatorUserSearch || u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase());
                                    return matchesRole && matchesDept && matchesSearch;
                                });

                                return (
                                    <div className={cn(
                                        "relative flex items-center justify-between border border-black dark:border-white bg-white dark:bg-black p-4 transition-all hover:bg-black/5 dark:hover:bg-white/5",
                                        !isAnySelected && "border-dashed"
                                    )}>
                                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                                            {!isAnySelected ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border-none text-[8px] font-black tracking-widest px-2 h-5 rounded-none">SEMUA PERSONEL</Badge>
                                                    <span className="text-[7px] font-bold text-black/30 dark:text-white/30 uppercase tracking-tighter">Akses Terbuka (Publik)</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {activeRoles.length > 0 && (
                                                        <div className="flex items-center gap-1.5 p-1 bg-black text-white rounded-none">
                                                            <Shield size={10} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter max-w-[150px] truncate">
                                                                {activeRoles.length === 1 ? activeRoles[0] : `${activeRoles.length} ROLE`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {activeDepts.length > 0 && (
                                                        <div className="flex items-center gap-1.5 p-1 border-2 border-black text-black rounded-none">
                                                            <GitBranch size={10} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter max-w-[150px] truncate">
                                                                {activeDepts.length === 1 ? departments.find(d => d.id === activeDepts[0])?.name : `${activeDepts.length} DEPT`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {activeUsers.length > 0 && (
                                                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 text-slate-900 rounded-none border border-slate-200">
                                                            <UserCheck size={10} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter max-w-[150px] truncate">
                                                                {activeUsers.length === 1 ? users.find(u => u.id === activeUsers[0])?.name : `${activeUsers.length} USER`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <Dialog open={isInitiatorDialogOpen} onOpenChange={setIsInitiatorDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 gap-2 rounded-none border-2 border-black px-4 text-[9px] font-black uppercase transition-all hover:bg-black hover:text-white">
                                                    <Edit3 size={12} /> Atur Akses Inisiator
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-5xl rounded-none border border-black dark:border-white p-0 overflow-hidden bg-white dark:bg-black">
                                                <DialogHeader className="p-4 bg-black dark:bg-white text-white dark:text-black flex-row items-center justify-between space-y-0">
                                                    <div>
                                                        <DialogTitle className="text-[12px] font-black uppercase tracking-[0.2em]">Otoritas Inisiator Kontrak</DialogTitle>
                                                        <p className="text-[8px] font-bold text-white/50 dark:text-black/50 uppercase mt-1">Gunakan Drill-down Hierarchy (Role → Dept → User)</p>
                                                    </div>
                                                </DialogHeader>

                                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white min-h-[400px]">
                                                    {/* 1. ROLE */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between pb-2 border-b">
                                                            <div className="flex items-center gap-2">
                                                                <Shield size={12} className="text-black" />
                                                                <Label className="text-[10px] font-black tracking-widest text-slate-900 uppercase">1. Role / Jabatan</Label>
                                                            </div>
                                                            {activeRoles.length > 0 && <Badge className="rounded-none bg-black text-white text-[8px]">{activeRoles.length}</Badge>}
                                                        </div>
                                                        <div className="relative">
                                                            <Input 
                                                                placeholder="CARI ROLE..." 
                                                                value={initiatorRoleSearch} 
                                                                onChange={e => setInitiatorRoleSearch(e.target.value)} 
                                                                className="h-8 pl-8 rounded-none border-black dark:border-white bg-white dark:bg-black text-[10px] font-black uppercase shadow-none focus-visible:ring-0 transition-colors text-black dark:text-white" 
                                                            />
                                                            <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={12} />
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-1 customize-scrollbar">
                                                            {searchedRoles.map(r => {
                                                                const isActive = activeRoles.includes(r.name);
                                                                return (
                                                                    <button
                                                                        key={r.id} type="button"
                                                                        onClick={() => {
                                                                            const next = isActive ? activeRoles.filter((n: string) => n !== r.name) : [...activeRoles, r.name];
                                                                            form.setData('initiator_roles', next);
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-2.5 border text-[9px] font-black uppercase transition-all",
                                                                            isActive ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-slate-300 text-slate-500"
                                                                        )}
                                                                    >
                                                                        {r.name}
                                                                        {isActive && <CheckCircle2 size={10} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* 2. DEPT */}
                                                    <div className="space-y-3 border-x border-slate-100 px-6">
                                                        <div className="flex items-center justify-between pb-2 border-b">
                                                            <div className="flex items-center gap-2">
                                                                <GitBranch size={12} className="text-black" />
                                                                <Label className="text-[10px] font-black tracking-widest text-slate-900 uppercase">2. Departemen</Label>
                                                            </div>
                                                            {activeDepts.length > 0 && <Badge className="rounded-none bg-black text-white text-[8px]">{activeDepts.length}</Badge>}
                                                        </div>
                                                        <div className="relative">
                                                            <Input 
                                                                placeholder="CARI DEPARTEMEN..." 
                                                                value={initiatorDeptSearch} 
                                                                onChange={e => setInitiatorDeptSearch(e.target.value)} 
                                                                className="h-8 pl-8 rounded-none border-black dark:border-white bg-white dark:bg-black text-[10px] font-black uppercase shadow-none focus-visible:ring-0 transition-colors text-black dark:text-white" 
                                                            />
                                                            <GitBranch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={12} />
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-1 customize-scrollbar">
                                                            {searchedDepts.map(d => {
                                                                const isActive = activeDepts.includes(d.id);
                                                                return (
                                                                    <button
                                                                        key={d.id} type="button"
                                                                        onClick={() => {
                                                                            const next = isActive ? activeDepts.filter((id: string) => id !== d.id) : [...activeDepts, d.id];
                                                                            form.setData('initiator_departments', next);
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-2.5 border text-[9px] font-black uppercase transition-all",
                                                                            isActive ? "bg-black text-white border-black" : "bg-white border-slate-100 hover:border-slate-300 text-slate-500"
                                                                        )}
                                                                    >
                                                                        {d.name}
                                                                        {isActive && <CheckCircle2 size={10} />}
                                                                    </button>
                                                                );
                                                            })}
                                                            {searchedDepts.length === 0 && <div className="py-20 text-center text-[8px] font-black text-slate-300 uppercase italic">Tidak ada departemen tersedia</div>}
                                                        </div>
                                                    </div>

                                                    {/* 3. USER */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between pb-2 border-b">
                                                            <div className="flex items-center gap-2">
                                                                <UsersIcon size={12} className="text-black" />
                                                                <Label className="text-[10px] font-black tracking-widest text-slate-900 uppercase">3. User Spesifik</Label>
                                                            </div>
                                                            {activeUsers.length > 0 && <Badge className="rounded-none bg-black text-white text-[8px]">{activeUsers.length}</Badge>}
                                                        </div>
                                                        <div className="relative">
                                                            <Input 
                                                                placeholder="CARI USER..." 
                                                                value={initiatorUserSearch} 
                                                                onChange={e => setInitiatorUserSearch(e.target.value)} 
                                                                className="h-8 pl-8 rounded-none border-black dark:border-white bg-white dark:bg-black text-[10px] font-black uppercase shadow-none focus-visible:ring-0 transition-colors text-black dark:text-white" 
                                                            />
                                                            <UsersIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={12} />
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-1 customize-scrollbar">
                                                            {filteredUsers.map(u => {
                                                                const isSelected = activeUsers.includes(u.id);
                                                                return (
                                                                    <button
                                                                        key={u.id} type="button"
                                                                        onClick={() => {
                                                                            const next = isSelected ? activeUsers.filter((id: string) => id !== u.id) : [...activeUsers, u.id];
                                                                            form.setData('initiator_users', next);
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center gap-3 p-2.5 border transition-all text-left",
                                                                            isSelected ? "bg-black text-white border-black" : "bg-white border-slate-50 hover:border-slate-200 text-slate-500"
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col min-w-0 flex-1">
                                                                            <span className="text-[10px] font-black uppercase truncate leading-none">{u.name}</span>
                                                                            <span className={cn("text-[7px] font-bold mt-1 uppercase opacity-50", isSelected ? "text-slate-400" : "text-slate-400")}>{u.role}</span>
                                                                        </div>
                                                                        {isSelected && <CheckCircle2 size={12} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <DialogFooter className="p-3 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex items-center justify-between sm:justify-between">
                                                    <div className="text-[8px] font-black uppercase text-black/40 dark:text-white/40 italic">Perubahan Tersimpan Otomatis di Draft</div>
                                                    <Button type="button" onClick={() => setIsInitiatorDialogOpen(false)} className="h-8 rounded-none bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase px-8">Tutup</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-3">
                                <GitBranch size={16} />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white leading-none">Tahapan Persetujuan</h3>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addLocalStep} 
                                className="h-8 gap-2 rounded-none border-2 border-black px-4 text-[9px] font-black uppercase shadow-sm hover:bg-black hover:text-white transition-all active:translate-y-0.5"
                            >
                                <PlusCircle size={14} /> Tambah Tahap
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {form.data.steps.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center border border-dashed border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 rounded-none">
                                    <div className="w-16 h-16 rounded-none border border-black/10 dark:border-white/10 bg-white dark:bg-black flex items-center justify-center text-black/20 dark:text-white/20 mb-6 shadow-none"><PlusCircle size={32} /></div>
                                    <span className="text-[11px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.4em]">Struktur Kosong</span>
                                    <Button type="button" variant="link" onClick={addLocalStep} className="text-black dark:text-white text-[10px] font-black uppercase mt-4 underline decoration-black/20 dark:decoration-white/20 underline-offset-8 hover:decoration-black dark:hover:decoration-white transition-all">Definisikan Tahapan Persetujuan Awal</Button>
                                </div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                                    <SortableContext items={form.data.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="grid gap-4">
                                            {form.data.steps.map((step, idx) => (
                                                <SortableStepItem 
                                                    key={step.id} 
                                                    step={step} 
                                                    idx={idx} 
                                                    users={users} 
                                                    roles={roles} 
                                                    departments={departments} 
                                                    contractStatuses={contractStatuses}
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
                                    <div className="flex items-center gap-4 py-8 opacity-20">
                                        <div className="h-px flex-1 bg-black" />
                                        <div className="flex items-center gap-2 px-4 py-2 border-2 border-black rotate-[-1deg]">
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] leading-none">ALUR SELESAI</span>
                                        </div>
                                        <div className="h-px flex-1 bg-black" />
                                    </div>
                            )}
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black animate-in fade-in duration-500">
            <DataTable
                title="Master Alur Kerja (Workflow)"
                columns={columns}
                data={workflows.data || []}
                searchKey="name"
                searchPlaceholder="Cari alur kerja atau tipe..."
                onRowClick={openEdit}
                headerActions={
                    <Button onClick={openCreate} className="h-10 gap-2 rounded-none px-8 text-[11px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all border border-black dark:border-white shadow-none">
                        <Plus className="h-4 w-4" /> Registrasi Alur Baru
                    </Button>
                }
            />
        </div>
    );
}
