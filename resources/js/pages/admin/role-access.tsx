import { Head, useForm, router } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, CheckSquare, Square, Check, X, LayoutGrid, Shield } from 'lucide-react';
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/contracts/Toast';

interface Props {
    role: {
        id: string;
        name: string;
        description: string;
    };
    modules: Array<{
        id: string;
        identifier: string;
        name: string;
        module_group_id: string;
        module_group: {
            id: string;
            name: string;
        };
        access?: {
            can_read: boolean;
            can_create: boolean;
            can_update: boolean;
            can_delete: boolean;
        };
    }>;
}

const PERMISSIONS = ['can_read', 'can_create', 'can_update', 'can_delete'] as const;
type Permission = typeof PERMISSIONS[number];

const permissionLabels: Record<Permission, string> = {
    can_read: 'Read',
    can_create: 'Create',
    can_update: 'Update',
    can_delete: 'Delete',
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
        })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/admin/roles/${role.id}/access`, {
            onSuccess: () => {
                showToast("Hak akses role berhasil diperbarui.", "success");
            },
            onError: () => {
                showToast("Gagal menyimpan hak akses.", "danger");
            }
        });
    };

    const updateAccess = (moduleId: string, permission: Permission, checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access =>
            access.module_id === moduleId
                ? { ...access, [permission]: checked }
                : access
        ));
    };

    // Bulk Actions
    const setAll = (checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access => ({
            ...access,
            can_read: checked,
            can_create: checked,
            can_update: checked,
            can_delete: checked,
        })));
    };

    const setColumn = (permission: Permission, checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access => ({
            ...access,
            [permission]: checked,
        })));
    };

    const setGroup = (groupId: string, checked: boolean) => {
        const groupModuleIds = modules.filter(m => m.module_group_id === groupId).map(m => m.id);
        form.setData('accesses', form.data.accesses.map(access => 
            groupModuleIds.includes(access.module_id)
                ? { ...access, can_read: checked, can_create: checked, can_update: checked, can_delete: checked }
                : access
        ));
    };

    const setGroupColumn = (groupId: string, permission: Permission, checked: boolean) => {
        const groupModuleIds = modules.filter(m => m.module_group_id === groupId).map(m => m.id);
        form.setData('accesses', form.data.accesses.map(access => 
            groupModuleIds.includes(access.module_id)
                ? { ...access, [permission]: checked }
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

    const isAllChecked = form.data.accesses.every(a => a.can_read && a.can_create && a.can_update && a.can_delete);
    const isColumnAllChecked = (permission: Permission) => form.data.accesses.every(a => a[permission]);

    return (
        <>
            <Head title={`Kelola Akses - ${role.name}`} />

            <div className="flex h-screen flex-col bg-slate-50/50">
                {/* Header Section */}
                <div className="bg-white border-b px-6 py-4 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-lg border mr-4">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-[10px] font-black uppercase tracking-tighter hover:bg-white hover:text-green-600"
                                    onClick={() => setAll(true)}
                                >
                                    <CheckSquare className="h-3 w-3 mr-1.5" /> Pilih Semua
                                </Button>
                                <div className="w-[1px] bg-slate-200 mx-1" />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-[10px] font-black uppercase tracking-tighter hover:bg-white hover:text-red-600"
                                    onClick={() => setAll(false)}
                                >
                                    <Square className="h-3 w-3 mr-1.5" /> Hapus Semua
                                </Button>
                            </div>

                            <Button onClick={handleSubmit} disabled={form.processing} className="shadow-lg shadow-primary/20 font-bold h-9 px-6 rounded-full">
                                <Save className="h-4 w-4 mr-2" />
                                Simpan Perubahan
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-[1400px] mx-auto space-y-4">
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <table className="w-full border-collapse text-[12px]">
                                <thead>
                                    <tr className="bg-slate-950 text-white uppercase tracking-widest text-[10px] font-black">
                                        <th className="px-4 py-3 text-left border-r border-slate-800 font-black">Modul System</th>
                                        {PERMISSIONS.map(p => (
                                            <th key={p} className="px-2 py-3 text-center min-w-[100px] border-r border-slate-800 last:border-r-0">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span>{permissionLabels[p]}</span>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setColumn(p, true)}
                                                            className="p-1 hover:bg-green-500 rounded transition-colors"
                                                            title={`Pilih Semua ${permissionLabels[p]}`}
                                                        >
                                                            <Check className="h-2.5 w-2.5" />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setColumn(p, false)}
                                                            className="p-1 hover:bg-red-500 rounded transition-colors"
                                                            title={`Hapus Semua ${permissionLabels[p]}`}
                                                        >
                                                            <X className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(groupedModules).map(([groupId, group]) => (
                                        <React.Fragment key={groupId}>
                                            {/* Group Row */}
                                            <tr className="bg-slate-100 border-b border-t border-slate-200 group/row">
                                                <td className="px-4 py-2 font-black text-slate-800 flex items-center gap-2">
                                                    <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="uppercase tracking-tight text-[11px]">{group.name}</span>
                                                </td>
                                                {PERMISSIONS.map(p => (
                                                    <td key={p} className="px-2 py-2 text-center border-l bg-slate-50/50 group-hover/row:bg-slate-100 transition-colors">
                                                        <div className="flex justify-center gap-1">
                                                            <button 
                                                                type="button"
                                                                onClick={() => setGroupColumn(groupId, p, true)}
                                                                className="text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-200 tracking-tighter uppercase transition-all"
                                                            >
                                                                Pilih
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setGroupColumn(groupId, p, false)}
                                                                className="text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 tracking-tighter uppercase transition-all"
                                                            >
                                                                Reset
                                                            </button>
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                            {/* Module Rows */}
                                            {group.modules.map((module) => (
                                                <tr key={module.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors group/module">
                                                    <td className="px-4 py-2 border-r">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 group-hover/module:text-primary transition-colors">{module.name}</span>
                                                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{module.identifier}</span>
                                                        </div>
                                                    </td>
                                                    {PERMISSIONS.map(p => (
                                                        <td key={p} className={cn(
                                                            "px-2 py-2 text-center border-r last:border-r-0 transition-colors",
                                                            form.data.accesses.find(a => a.module_id === module.id)?.[p] 
                                                                ? "bg-green-50/30" 
                                                                : "bg-transparent"
                                                        )}>
                                                            <div className="flex justify-center">
                                                                <Checkbox
                                                                    className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                    checked={form.data.accesses.find(a => a.module_id === module.id)?.[p] || false}
                                                                    onCheckedChange={(checked) => updateAccess(module.id, p, checked as boolean)}
                                                                />
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Summary Info */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                            <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Catatan Keamanan</h4>
                                <p className="text-xs text-amber-700 leading-relaxed mt-1">
                                    Setiap perubahan pada role ini akan langsung berdampak pada seluruh pengguna yang memiliki role <span className="font-bold underline">{role.name}</span>. 
                                    Pastikan pembatasan akses telah sesuai dengan kebijakan operasional perusahaan sebelum menyimpan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}