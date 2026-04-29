import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square, LayoutGrid, ShieldAlert } from 'lucide-react';
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/contracts/Toast';
import { ManagementForm, FormSection } from '@/components/admin/ManagementForm';

interface Props {
    role: { id: string; name: string; description: string; };
    modules: Array<{
        id: string; identifier: string; name: string; module_group_id: string;
        module_group: { id: string; name: string; };
        access?: { can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean; };
    }>;
}

const PERMISSIONS = ['can_read', 'can_create', 'can_update', 'can_delete', 'can_approve', 'can_bulk_approve', 'can_bulk_delete'] as const;
type Permission = typeof PERMISSIONS[number];

const permissionLabels: Record<Permission, string> = {
    can_read: 'Read', 
    can_create: 'Create', 
    can_update: 'Update', 
    can_delete: 'Delete',
    can_approve: 'Approve',
    can_bulk_approve: 'Bulk Aprv',
    can_bulk_delete: 'Bulk Del',
};

export default function RoleAccess({ role, modules }: Props) {
    const { showToast } = useToast();
    const form = useForm({
        accesses: modules.map(module => ({
            module_id: module.id,
            can_read: module.access?.can_read || false,
            can_create: module.access?.can_create || false,
            can_update: module.access?.can_update || false,
            can_delete: module.access?.can_delete || false,
            can_approve: (module.access as any)?.can_approve || false,
            can_bulk_approve: (module.access as any)?.can_bulk_approve || false,
            can_bulk_delete: (module.access as any)?.can_bulk_delete || false,
        })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/admin/roles/${role.id}/access`, {
            onSuccess: () => showToast("Hak akses role berhasil diperbarui.", "success"),
            onError: () => showToast("Gagal menyimpan hak akses.", "danger")
        });
    };

    const updateAccess = (moduleId: string, permission: Permission, checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access =>
            access.module_id === moduleId ? { ...access, [permission]: checked } : access
        ));
    };

    const setAll = (checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access => ({
            ...access, 
            can_read: checked, 
            can_create: checked, 
            can_update: checked, 
            can_delete: checked,
            can_approve: checked,
            can_bulk_approve: checked,
            can_bulk_delete: checked,
        })));
    };

    const setColumn = (permission: Permission, checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access => ({ ...access, [permission]: checked })));
    };

    const setGroupColumn = (groupId: string, permission: Permission, checked: boolean) => {
        const groupModuleIds = modules.filter(m => m.module_group_id === groupId).map(m => m.id);
        form.setData('accesses', form.data.accesses.map(access => 
            groupModuleIds.includes(access.module_id) ? { ...access, [permission]: checked } : access
        ));
    };

    const setRow = (moduleId: string, checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access => 
            access.module_id === moduleId 
                ? { ...access, can_read: checked, can_create: checked, can_update: checked, can_delete: checked, can_approve: checked, can_bulk_approve: checked, can_bulk_delete: checked } 
                : access
        ));
    };

    const groupedModules = useMemo(() => {
        return modules.reduce((acc, module) => {
            const groupId = module.module_group?.id || 'other';
            const groupName = module.module_group?.name || 'Lainnya';
            if (!acc[groupId]) acc[groupId] = { name: groupName, modules: [] };
            acc[groupId].modules.push(module);
            return acc;
        }, {} as Record<string, { name: string; modules: typeof modules }>);
    }, [modules]);

    return (
        <ManagementForm
            title={`Otoritas Role: ${role.name}`}
            subtitle="Matriks kontrol akses modul sistem"
            onClose={() => window.history.back()}
            onSave={handleSubmit}
            processing={form.processing}
            isDirty={form.isDirty}
            isEdit={true}
            headerActions={
                <div className="flex bg-black/[0.03] dark:bg-white/[0.03] p-1 rounded-lg border border-black/5 dark:border-white/5 mr-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-tight hover:bg-white dark:hover:bg-black/40" onClick={() => setAll(true)}>
                        <CheckSquare className="h-3 w-3 mr-1.5" /> Pilih Semua
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-tight hover:bg-white dark:hover:bg-black/40" onClick={() => setAll(false)}>
                        <Square className="h-3 w-3 mr-1.5" /> Bersihkan
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-10">
                <FormSection title="Matriks Hak Akses" subtitle="Tentukan izin spesifik untuk setiap modul operasional">
                    <div className="border border-slate-200 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[var(--primary)] text-white uppercase tracking-[0.2em] text-[10px] font-black">
                                    <th className="px-5 py-4 text-left font-black border-r border-white/10">Scope Modul</th>
                                    {PERMISSIONS.map(p => {
                                        const isAllChecked = form.data.accesses.every(a => a[p]);
                                        return (
                                            <th key={p} className="px-2 py-4 text-center min-w-[120px] border-r border-white/10 last:border-r-0">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>{permissionLabels[p]}</span>
                                                    <Checkbox 
                                                        className="h-4 w-4 rounded-sm border-white/30 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black"
                                                        checked={isAllChecked}
                                                        onCheckedChange={(checked) => setColumn(p, !!checked)}
                                                    />
                                                </div>
                                            </th>
                                        );
                                    })}
                                    <th className="px-2 py-4 text-center min-w-[80px] bg-black/20 border-l border-white/10">Full</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedModules).map(([groupId, group]) => {
                                    const groupModuleIds = group.modules.map(m => m.id);
                                    const groupAccesses = form.data.accesses.filter(a => groupModuleIds.includes(a.module_id));
                                    const isGroupFullControlChecked = groupAccesses.every(a => a.can_read && a.can_create && a.can_update && a.can_delete && a.can_approve && a.can_bulk_approve && a.can_bulk_delete);

                                    return (
                                        <React.Fragment key={groupId}>
                                            {/* Group Header */}
                                            <tr className="bg-slate-100/80 border-b border-slate-200">
                                                <td className="px-5 py-2.5 font-black text-slate-900 flex items-center gap-3">
                                                    <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="uppercase tracking-widest text-[11px] font-black">{group.name}</span>
                                                </td>
                                                {PERMISSIONS.map(p => {
                                                    const isGroupColumnChecked = groupAccesses.every(a => a[p]);
                                                    return (
                                                        <td key={p} className="px-2 py-2 text-center border-l border-slate-200">
                                                            <div className="flex justify-center">
                                                                <Checkbox 
                                                                    className="h-4 w-4 rounded-none border-slate-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                                                    checked={isGroupColumnChecked}
                                                                    onCheckedChange={(checked) => setGroupColumn(groupId, p, !!checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-2 py-2 text-center border-l border-slate-200 bg-slate-200/50">
                                                     <div className="flex justify-center">
                                                        <Checkbox 
                                                            className="h-4 w-4 rounded-none border-slate-400 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                                            checked={isGroupFullControlChecked}
                                                            onCheckedChange={(checked) => {
                                                                 form.setData('accesses', form.data.accesses.map(access => 
                                                                    groupModuleIds.includes(access.module_id) ? { ...access, can_read: !!checked, can_create: !!checked, can_update: !!checked, can_delete: !!checked, can_approve: !!checked, can_bulk_approve: !!checked, can_bulk_delete: !!checked } : access
                                                                ));
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Module Rows */}
                                            {group.modules.map((module) => {
                                                const moduleAccess = form.data.accesses.find(a => a.module_id === module.id);
                                                const isRowAllChecked = moduleAccess?.can_read && moduleAccess?.can_create && moduleAccess?.can_update && moduleAccess?.can_delete && moduleAccess?.can_approve && moduleAccess?.can_bulk_approve && moduleAccess?.can_bulk_delete;
                                                
                                                return (
                                                    <tr key={module.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors group">
                                                        <td className="px-5 py-3 border-r border-slate-200">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{module.name}</span>
                                                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{module.identifier}</span>
                                                            </div>
                                                        </td>
                                                        {PERMISSIONS.map(p => (
                                                            <td key={p} className={cn("px-2 py-3 text-center border-r border-slate-200 last:border-r-0", form.data.accesses.find(a => a.module_id === module.id)?.[p] ? "bg-emerald-500/5" : "bg-transparent")}>
                                                                <div className="flex justify-center">
                                                                    <Checkbox
                                                                        className="h-5 w-5 rounded-none border-slate-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                                                        checked={form.data.accesses.find(a => a.module_id === module.id)?.[p] || false}
                                                                        onCheckedChange={(checked) => updateAccess(module.id, p, checked as boolean)}
                                                                    />
                                                                </div>
                                                            </td>
                                                        ))}
                                                        <td className="px-2 py-3 text-center bg-slate-50/50 group-hover:bg-slate-100 transition-colors border-l border-slate-200">
                                                            <div className="flex justify-center">
                                                                <Checkbox 
                                                                    className="h-5 w-5 rounded-none border-slate-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                                                    checked={!!isRowAllChecked}
                                                                    onCheckedChange={(checked) => setRow(module.id, !!checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </FormSection>

                <div className="max-w-2xl bg-black p-6 flex items-start gap-4 shadow-2xl">
                    <ShieldAlert className="h-6 w-6 text-white shrink-0 mt-1" />
                    <div>
                        <h4 className="text-[12px] font-black text-white uppercase tracking-widest leading-none">Protokol Keamanan Perubahan</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mt-2.5">
                            Setiap modifikasi hak akses akan langsung mengikat seluruh personil dengan role <span className="text-white underline underline-offset-4">{role.name}</span>. 
                            Pastikan tingkat otorisasi sudah sesuai dengan batas wewenang struktural sebelum menyimpan.
                        </p>
                    </div>
                </div>
            </div>
        </ManagementForm>
    );
}