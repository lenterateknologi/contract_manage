import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, router } from '@inertiajs/react';
import { Trash2, Plus, Mail, Fingerprint, Phone, UserCircle, ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/contracts/Toast';
import { ManagementForm, FormSection, FormDangerZone } from './ManagementForm';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface UserManagementProps {
    users: any;
    roles: any[];
    departments: any[];
    filters: any;
}

export function UserManagement({ users, roles, departments, filters }: UserManagementProps) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_USERS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        email: '',
        username: '',
        role: roles?.[0]?.name || 'Staff',
        department_id: '',
        position: '',
        phone: '',
        is_active: true as boolean,
        password: '',
    });

    const filterConfig = useMemo(() => [
        {
            label: 'Role Akses',
            key: 'role',
            type: 'searchable',
            options: roles.map(r => ({ label: r.name, value: r.name }))
        },
        {
            label: 'Departemen',
            key: 'department_id',
            type: 'searchable',
            options: departments.map(d => ({ label: d.name, value: d.id }))
        }
    ], [roles, departments]);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(window.location.pathname, { 
            ...filters, 
            ...newFilters, 
            page: 1 
        }, { preserveState: true, replace: true });
    };

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Pengguna',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-black dark:text-white flex items-center justify-center font-black text-[11px] shrink-0 border border-black/[0.05] dark:border-white/[0.05]">
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-black dark:text-white text-[13px] truncate leading-tight">
                            {row.name}
                        </span>
                        <span className="text-[10px] font-bold text-black/40 dark:text-white/40 truncate leading-none uppercase tracking-widest mt-1">
                            {row.email}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Identitas',
            accessorKey: 'username',
            cell: (row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest">
                        <Fingerprint size={10} className="text-black/30 dark:text-white/30" />
                        {row.username}
                    </div>
                    {row.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/40 dark:text-white/40 tracking-tight uppercase">
                            <Phone size={10} className="text-black/30 dark:text-white/30" />
                            {row.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Penempatan',
            accessorKey: 'department.name',
            cell: (row) => (
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-black dark:text-white uppercase tracking-wider">
                        {row.department?.name || 'GLOBAL'}
                    </span>
                    <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">
                        {row.position || 'STAF'}
                    </span>
                </div>
            )
        },
        {
            header: 'Otoritas',
            accessorKey: 'role',
            cell: (row) => (
                <span className="text-[10px] font-black tracking-[0.15em] text-black/60 dark:text-white/60 uppercase">
                    {row.role}
                </span>
            ),
        },
        {
            header: 'Akses',
            accessorKey: 'is_active',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        row.is_active ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20"
                    )} />
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        row.is_active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
                    )}>
                        {row.is_active ? 'AKTIF' : 'SUSPENDED'}
                    </span>
                </div>
            ),
        },
    ], []);

    const openCreate = () => {
        setEditingUser(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (user: any) => {
        setEditingUser(user);
        form.setData({
            name: user.name,
            email: user.email,
            username: user.username || '',
            role: user.role,
            department_id: user.department_id ? String(user.department_id) : '',
            position: user.position || '',
            phone: user.phone || '',
            is_active: !!user.is_active,
            password: '',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingUser(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingUser ? 'Akses user telah diperbarui' : 'User baru telah ditambahkan', 'success');
            },
        };
        if (editingUser) {
            form.put(`/admin/users/${editingUser.id}`, options);
        } else {
            form.post('/admin/users', options);
        }
    };

    const handleDelete = () => {
        setIsConfirmOpen(true);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingUser ? 'Edit Detail Pengguna' : 'Registrasi User Baru'}
                subtitle={editingUser ? 'Personal data dan pengaturan akses' : 'Masukan data otentikasi user'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingUser}
                headerActions={
                    editingUser && canDelete && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleDelete}
                            className="h-9 px-4 active:scale-95 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                            <Trash2 size={14} /> Hapus User
                        </Button>
                    )
                }
            >
                <ConfirmationModal 
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        setIsConfirmOpen(false);
                        router.delete(`/admin/users/${editingUser.id}`, { 
                            onSuccess: () => {
                                closeForm();
                                showToast('User telah dihapus dari sistem', 'success');
                            }
                        });
                    }}
                    title="Hapus Data Pengguna"
                    description={`Apakah Anda yakin ingin menghapus user ${editingUser?.name}? Seluruh data akses dan riwayat aktivitas user ini akan dicabut.`}
                    confirmText="Hapus User"
                />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Main Column */}
                    <div className="md:col-span-8 space-y-10">
                        {/* Section: Akun & Identitas */}
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black tracking-[0.2em] text-black dark:text-white uppercase border-b border-black/[0.05] dark:border-white/[0.05] pb-3 ml-1">Identitas & Otentikasi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8 p-1">
                                <div className="space-y-2 md:col-span-3">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Nama Lengkap Sesuai KTP</Label>
                                    <Input 
                                        value={form.data.name} 
                                        onChange={e => form.setData('name', e.target.value)} 
                                        required 
                                        placeholder="NAMA LENGKAP" 
                                        className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-sm font-black uppercase tracking-tight px-5 text-black dark:text-white placeholder:text-black/20 focus:border-black dark:focus:border-white transition-all shadow-sm" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Username Akses</Label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 w-4 h-4" />
                                        <Input 
                                            value={form.data.username} 
                                            onChange={e => form.setData('username', e.target.value)} 
                                            required 
                                            placeholder="USERNAME" 
                                            className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-sm font-mono pl-11 text-black dark:text-white placeholder:text-black/20 focus:border-black dark:focus:border-white transition-all shadow-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Email Institusi</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 w-4 h-4" />
                                        <Input 
                                            type="email" 
                                            value={form.data.email} 
                                            onChange={e => form.setData('email', e.target.value)} 
                                            required 
                                            placeholder="user@company.com" 
                                            className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-sm font-bold pl-11 text-black dark:text-white placeholder:text-black/20 focus:border-black dark:focus:border-white transition-all shadow-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Nomor Telepon</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 w-4 h-4" />
                                        <Input 
                                            value={form.data.phone} 
                                            onChange={e => form.setData('phone', e.target.value)} 
                                            placeholder="08XX XXXX XXXX" 
                                            className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-sm font-bold pl-11 text-black dark:text-white placeholder:text-black/20 focus:border-black dark:focus:border-white transition-all shadow-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">{editingUser ? 'Reset Password (Opsional)' : 'Set Password Akun'}</Label>
                                    <Input 
                                        type="password" 
                                        value={form.data.password} 
                                        onChange={e => form.setData('password', e.target.value)} 
                                        required={!editingUser} 
                                        placeholder="••••••••" 
                                        className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-sm font-bold px-5 text-black dark:text-white placeholder:text-black/20 focus:border-black dark:focus:border-white transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Jabatan */}
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black tracking-[0.2em] text-black dark:text-white uppercase border-b border-black/[0.05] dark:border-white/[0.05] pb-3 ml-1">Penempatan & Otoritas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8 p-1">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Role User</Label>
                                    <Select value={form.data.role} onValueChange={v => form.setData('role', v)}>
                                        <SelectTrigger className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] text-[11px] font-black uppercase tracking-tight bg-black/[0.03] dark:bg-white/[0.03] text-black dark:text-white focus:ring-0 transition-all shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl bg-white dark:bg-black border-black/[0.08] dark:border-white/[0.08] shadow-2xl">
                                            {roles.map(r => <SelectItem key={r.id} value={r.name} className="text-[10px] uppercase font-black tracking-wider py-3 text-black dark:text-white">{r.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Unit / Departemen</Label>
                                    <Select value={String(form.data.department_id)} onValueChange={v => form.setData('department_id', v)}>
                                        <SelectTrigger className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] text-[11px] font-black uppercase tracking-tight bg-black/[0.03] dark:bg-white/[0.03] text-black dark:text-white focus:ring-0 transition-all shadow-sm">
                                            <SelectValue placeholder="PILIH UNIT KERJA" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl bg-white dark:bg-black border-black/[0.08] dark:border-white/[0.08] shadow-2xl">
                                            {departments.map(d => <SelectItem key={d.id} value={String(d.id)} className="text-[10px] uppercase font-black tracking-wider py-3 text-black dark:text-white">{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest ml-1">Jabatan Struktural</Label>
                                    <Input 
                                        value={form.data.position} 
                                        onChange={e => form.setData('position', e.target.value)} 
                                        placeholder="CONTOH: KEPALA BAGIAN HUKUM" 
                                        className="h-10 rounded-xl border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-xs font-black uppercase tracking-tight px-5 text-black dark:text-white placeholder:text-black/20 focus:border-black dark:focus:border-white transition-all shadow-sm" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Column */}
                    <div className="md:col-span-4 flex flex-col gap-10">
                        <FormDangerZone 
                            title="Master Status" 
                            description="Tentukan apakah user ini memiliki hak akses aktif ke portal admin saat ini."
                            className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.05] dark:border-white/[0.05]"
                        >
                            <div className="flex items-center gap-4 bg-white dark:bg-black/40 p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm">
                                <span className={cn("text-[10px] font-black uppercase tracking-widest ml-1", form.data.is_active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30")}>
                                    {form.data.is_active ? 'AKUN AKTIF' : 'NONAKTIF'}
                                </span>
                                <Checkbox 
                                    checked={form.data.is_active} 
                                    onCheckedChange={(c) => form.setData('is_active', !!c)} 
                                    className="w-5 h-5 rounded-lg border-black/[0.1] dark:border-white/[0.1] data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black transition-all"
                                />
                            </div>
                        </FormDangerZone>

                        <div className="border border-black/[0.05] dark:border-white/[0.05] p-8 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <UserCircle size={18} className="text-black/20 dark:text-white/20" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 dark:text-white/30">Preview Profil</span>
                            </div>
                            <div className="flex flex-col items-center py-10 border-y border-black/[0.05] dark:border-white/[0.05] border-dashed">
                                <div className="w-20 h-20 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-3xl mb-6 rounded-2xl shadow-xl shadow-black/10 dark:shadow-white/5 border border-black/[0.1] dark:border-white/[0.1]">
                                    {form.data.name ? form.data.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-base font-black uppercase text-center leading-tight tracking-tight text-black dark:text-white px-4">{form.data.name || 'NAMA BELUM DIISI'}</span>
                                <span className="text-[11px] font-bold text-black/40 dark:text-white/40 uppercase mt-2 tracking-widest px-4 text-center">{form.data.position || 'JABATAN BELUM SET'}</span>
                                
                                <div className="mt-8 pt-8 border-t border-black/[0.05] dark:border-white/[0.05] w-full flex flex-col items-center gap-3 opacity-40">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <Mail size={12} />
                                        {form.data.email || 'EMail@NOTSET'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <ShieldAlert size={12} />
                                        ROLE: {form.data.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Database Pengguna"
            columns={columns}
            data={users.data || []}
            searchKey="name"
            searchPlaceholder="Cari nama, email, atau username..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            headerActions={
                canCreate && (
                    <Button 
                        variant="primary"
                        onClick={openCreate} 
                        className="h-10 px-8 shadow-xl active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Registrasi User Baru
                    </Button>
                )
            }
            onRowClick={openEdit}
            bulkActions={canDelete ? [
                {
                    label: 'Hapus Terpilih',
                    icon: Trash2,
                    variant: 'destructive',
                    onClick: (ids) => {
                        if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} user terpilih?`)) {
                            router.post('/admin/users/bulk-delete', { ids }, {
                                onSuccess: () => showToast(`${ids.length} user telah dihapus`, 'success')
                            });
                        }
                    }
                }
            ] : undefined}
            pagination={{
                currentPage: users.current_page || 1,
                lastPage: users.last_page || 1,
                total: users.total || 0,
                from: users.from || 1,
                to: users.to || 1,
                perPage: users.per_page || 10,
                onPageChange: (page) => router.get(window.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (perPage) => router.get(window.location.pathname, { ...filters, per_page: perPage, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
