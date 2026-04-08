import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Users, Settings2, GitBranch, Plus, Pencil, Trash2, Check, AlertCircle, ChevronRight, ChevronDown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useState, FormEvent } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    currentView: 'users' | 'contract-types' | 'workflows' | 'roles';
    users?: any[];
    types?: any[];
    workflows?: any[];
    contractTypes?: any[];
    roles?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/users',
    },
    {
        title: 'Data Master',
        href: '#',
    },
];

export default function AdminIndex({ currentView, users, types, workflows, contractTypes, roles }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const viewTitle = {
        'users': 'Manajemen Pengguna',
        'roles': 'Manajemen Role',
        'contract-types': 'Manajemen Tipe Kontrak',
        'workflows': 'Manajemen Alur Kerja',
    }[currentView];

    const viewIcon = {
        'users': Users,
        'roles': ShieldCheck,
        'contract-types': Settings2,
        'workflows': GitBranch,
    }[currentView];

    const Icon = viewIcon;

    // Forms
    const userForm = useForm({
        name: '',
        email: '',
        role: roles?.[0]?.name || 'Initiator',
        password: '',
    });

    const roleForm = useForm({
        name: '',
        description: '',
    });

    const typeForm = useForm({
        name: '',
        description: '',
    });

    const workflowForm = useForm({
        name: '',
        contract_type: '',
        description: '',
        is_default: true as boolean,
    });

    const openCreate = () => {
        setEditingItem(null);
        userForm.reset();
        roleForm.reset();
        typeForm.reset();
        workflowForm.reset();
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        if (currentView === 'users') {
            userForm.setData({
                name: item.name,
                email: item.email,
                role: item.role,
                password: '', // Don't pre-fill password
            });
        } else if (currentView === 'roles') {
            roleForm.setData({
                name: item.name,
                description: item.description || '',
            });
        } else if (currentView === 'contract-types') {
            typeForm.setData({
                name: item.name,
                description: item.description || '',
            });
        } else if (currentView === 'workflows') {
            workflowForm.setData({
                name: item.name,
                contract_type: item.contract_type,
                description: item.description || '',
                is_default: !!item.is_default as boolean,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingItem(null);
            },
        };

        if (currentView === 'users') {
            if (editingItem) {
                userForm.put(route('admin.users.update', editingItem.id), options);
            } else {
                userForm.post(route('admin.users.store'), options);
            }
        } else if (currentView === 'roles') {
            if (editingItem) {
                roleForm.put(route('admin.roles.update', editingItem.id), options);
            } else {
                roleForm.post(route('admin.roles.store'), options);
            }
        } else if (currentView === 'contract-types') {
            if (editingItem) {
                typeForm.put(route('admin.contract-types.update', editingItem.id), options);
            } else {
                typeForm.post(route('admin.contract-types.store'), options);
            }
        } else if (currentView === 'workflows') {
            if (editingItem) {
                workflowForm.put(route('admin.workflows.update', editingItem.id), options);
            } else {
                workflowForm.post(route('admin.workflows.store'), options);
            }
        }
    };

    const handleDelete = (id: any) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            const url = {
                'users': route('admin.users.destroy', id),
                'roles': route('admin.roles.destroy', id),
                'contract-types': route('admin.contract-types.destroy', id),
                'workflows': route('admin.workflows.destroy', id),
            }[currentView];
            router.delete(url);
        }
    };

    // Helper to get route by name (Inertia might not have global route helper depending on config)
    // Here we assume ziggy is available or we use hardcoded paths if needed. 
    // Usually standard in Laravel starters.
    const route = (name: string, id?: any) => {
        const base = name.split('.').slice(1).join('/').replace('destroy', '').replace('update', '').replace('store', '');
        if (id) return `/admin/${base}/${id}`;
        return `/admin/${base}`;
    };

    const [expandedWorkflowId, setExpandedWorkflowId] = useState<any>(null);

    const toggleExpand = (id: any) => {
        setExpandedWorkflowId(expandedWorkflowId === id ? null : id);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Admin - ${viewTitle}`} />

            <div className="flex h-full flex-col flex-1 divide-y divide-border">
                {/* Header Section */}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold leading-none">{viewTitle}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Kelola data {viewTitle.toLowerCase()} sistem Anda.</p>
                        </div>
                    </div>
                    <Button className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Tambah {currentView === 'users' ? 'Pengguna' : currentView === 'roles' ? 'Role' : currentView === 'contract-types' ? 'Tipe' : 'Alur'}
                    </Button>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-auto p-6 text-foreground bg-background">
                    <div className="rounded-lg border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">{currentView === 'users' ? 'Nama' : 'Nama Item'}</th>
                                    <th className="px-4 py-3">{currentView === 'users' ? 'Email / Role' : 'Detail'}</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {currentView === 'users' && users?.map((u) => (
                                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{String(u.id).substring(0, 8)}</td>
                                        <td className="px-4 py-3 font-medium">{u.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {u.email} • <span className="text-primary font-medium">{u.role}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(u.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'roles' && roles?.map((r) => (
                                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{String(r.id).substring(0, 8)}</td>
                                        <td className="px-4 py-3 font-medium">{r.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{r.description || '-'}</td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'contract-types' && types?.map((t) => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{String(t.id).substring(0, 8)}</td>
                                        <td className="px-4 py-3 font-medium">{t.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{t.description || '-'}</td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'workflows' && workflows?.map((w) => (
                                    <React.Fragment key={w.id}>
                                        <tr className={cn(
                                            "hover:bg-muted/30 transition-colors",
                                            expandedWorkflowId === w.id && "bg-muted/20"
                                        )}>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{String(w.id).substring(0, 8)}</td>
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleExpand(w.id)}
                                                        className="p-1 hover:bg-muted rounded"
                                                    >
                                                        {expandedWorkflowId === w.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </button>
                                                    {w.name}
                                                    {w.is_default && <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">Default</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {w.contract_type} • {w.steps?.length || 0} tahapan
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(w)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(w.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                        {expandedWorkflowId === w.id && (
                                            <tr className="bg-muted/10">
                                                <td colSpan={4} className="px-12 py-4">
                                                    <div className="flex flex-col gap-3 max-w-md border-l-2 border-primary/20 pl-6 py-2">
                                                        {w.steps?.sort((a: any, b: any) => a.step - b.step).map((step: any) => (
                                                            <div key={step.id} className="flex items-center gap-3 relative">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                                                                    {step.step}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm">{step.role}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{step.name}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!w.steps || w.steps.length === 0) && (
                                                            <p className="text-sm text-muted-foreground italic">Belum ada tahapan yang dikonfigurasi.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CRUD Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} {currentView === 'users' ? 'Pengguna' : currentView === 'roles' ? 'Role' : currentView === 'contract-types' ? 'Tipe' : 'Alur'}</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk {editingItem ? 'memperbarui' : 'menambahkan'} data.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {currentView === 'users' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <Input id="name" value={userForm.data.name} onChange={e => userForm.setData('name', e.target.value)} required />
                                        {userForm.errors.name && <p className="text-xs text-destructive">{userForm.errors.name}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={userForm.data.email} onChange={e => userForm.setData('email', e.target.value)} required />
                                        {userForm.errors.email && <p className="text-xs text-destructive">{userForm.errors.email}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={userForm.data.role} onValueChange={v => userForm.setData('role', v)}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                                            <SelectContent>
                                                {roles?.map(r => (
                                                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                                ))}
                                                {(!roles || roles.length === 0) && (
                                                    <>
                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                        <SelectItem value="Initiator">Initiator</SelectItem>
                                                        <SelectItem value="Legal">Legal</SelectItem>
                                                        <SelectItem value="Tax">Tax</SelectItem>
                                                        <SelectItem value="Management">Management</SelectItem>
                                                        <SelectItem value="Direksi">Direksi</SelectItem>
                                                        <SelectItem value="Vendor">Vendor</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">{editingItem ? 'Password Baru (Kosongkan jika tidak ganti)' : 'Password'}</Label>
                                        <Input id="password" type="password" value={userForm.data.password} onChange={e => userForm.setData('password', e.target.value)} required={!editingItem} />
                                        {userForm.errors.password && <p className="text-xs text-destructive">{userForm.errors.password}</p>}
                                    </div>
                                </>
                            )}

                            {currentView === 'roles' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-name">Nama Role</Label>
                                        <Input id="role-name" value={roleForm.data.name} onChange={e => roleForm.setData('name', e.target.value)} required />
                                        {roleForm.errors.name && <p className="text-xs text-destructive">{roleForm.errors.name}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-description">Deskripsi</Label>
                                        <Input id="role-description" value={roleForm.data.description} onChange={e => roleForm.setData('description', e.target.value)} />
                                    </div>
                                </>
                            )}

                            {currentView === 'contract-types' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type-name">Nama Tipe</Label>
                                        <Input id="type-name" value={typeForm.data.name} onChange={e => typeForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Deskripsi</Label>
                                        <Input id="description" value={typeForm.data.description} onChange={e => typeForm.setData('description', e.target.value)} />
                                    </div>
                                </>
                            )}

                            {currentView === 'workflows' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wf-name">Nama Alur Kerja</Label>
                                        <Input id="wf-name" value={workflowForm.data.name} onChange={e => workflowForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ct">Tipe Kontrak</Label>
                                        <Select value={workflowForm.data.contract_type} onValueChange={v => workflowForm.setData('contract_type', v)}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                            <SelectContent>
                                                {contractTypes?.map(ct => (
                                                    <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wf-desc">Deskripsi</Label>
                                        <Input id="wf-desc" value={workflowForm.data.description} onChange={e => workflowForm.setData('description', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_default"
                                            checked={workflowForm.data.is_default}
                                            onChange={e => workflowForm.setData('is_default', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="is_default">Jadikan Default</Label>
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={userForm.processing || roleForm.processing || typeForm.processing || workflowForm.processing}>
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
