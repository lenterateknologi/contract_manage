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
                    <div className="w-8 h-8 rounded-none bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-[10px] shrink-0 border border-black dark:border-white">
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-black dark:text-white uppercase tracking-tight text-[11px] truncate leading-none mb-1">
                            {row.name}
                        </span>
                        <span className="text-[9px] font-bold text-black/50 dark:text-white/50 truncate leading-none uppercase tracking-wider">
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
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider">
                        <Fingerprint size={10} className="text-black/30 dark:text-white/30" />
                        {row.username}
                    </div>
                    {row.phone && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-black/40 dark:text-white/40 tracking-tight uppercase">
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
                    <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-tight leading-none">
                        {row.department?.name || 'GLOBAL'}
                    </span>
                    <span className="text-[9px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest leading-none mt-0.5">
                        {row.position || 'STAF'}
                    </span>
                </div>
            )
        },
        {
            header: 'Otoritas',
            accessorKey: 'role',
            cell: (row) => (
                <Badge variant="outline" className="border-black dark:border-white bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[8px] font-black tracking-widest text-black dark:text-white uppercase rounded-none shadow-none">
                    {row.role}
                </Badge>
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
                        "text-[9px] font-black uppercase tracking-widest",
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
                            variant="ghost" 
                            onClick={handleDelete}
                            className="h-8 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-black dark:text-white rounded-none px-4 text-[10px] font-black uppercase tracking-widest transition-all border border-black dark:border-white"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus User
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
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-black dark:text-white uppercase border-b border-black dark:border-white pb-2">Identitas & Otentikasi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Nama Lengkap Sesuai KTP</Label>
                                    <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} required placeholder="NAMA LENGKAP" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-sm font-black uppercase tracking-tight px-4 text-black dark:text-white placeholder:text-black/20" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Username Akses</Label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 w-3.5 h-3.5" />
                                        <Input value={form.data.username} onChange={e => form.setData('username', e.target.value)} required placeholder="USERNAME" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-sm font-mono pl-10 text-black dark:text-white placeholder:text-black/20" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Email Institusi</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 w-3.5 h-3.5" />
                                        <Input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} required placeholder="user@company.com" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-sm font-bold pl-10 text-black dark:text-white placeholder:text-black/20" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Nomor Telepon</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 w-3.5 h-3.5" />
                                        <Input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} placeholder="08XX XXXX XXXX" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-sm font-bold pl-10 text-black dark:text-white placeholder:text-black/20" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">{editingUser ? 'Reset Password (Opsional)' : 'Set Password Akun'}</Label>
                                    <Input type="password" value={form.data.password} onChange={e => form.setData('password', e.target.value)} required={!editingUser} placeholder="••••••••" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-sm font-bold px-4 text-black dark:text-white placeholder:text-black/20" />
                                </div>
                            </div>
                        </div>

                        {/* Section: Jabatan */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-black dark:text-white uppercase border-b border-black dark:border-white pb-2">Penempatan & Otoritas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Role User</Label>
                                    <Select value={form.data.role} onValueChange={v => form.setData('role', v)}>
                                        <SelectTrigger className="h-10 rounded-none border-black dark:border-white text-[11px] font-black uppercase tracking-tight bg-white dark:bg-black text-black dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none bg-white dark:bg-black border-black dark:border-white">
                                            {roles.map(r => <SelectItem key={r.id} value={r.name} className="text-[10px] uppercase font-black tracking-wider py-2.5 text-black dark:text-white">{r.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Unit / Departemen</Label>
                                    <Select value={String(form.data.department_id)} onValueChange={v => form.setData('department_id', v)}>
                                        <SelectTrigger className="h-10 rounded-none border-black dark:border-white text-[11px] font-black uppercase tracking-tight bg-white dark:bg-black text-black dark:text-white">
                                            <SelectValue placeholder="PILIH UNIT KERJA" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none bg-white dark:bg-black border-black dark:border-white">
                                            {departments.map(d => <SelectItem key={d.id} value={String(d.id)} className="text-[10px] uppercase font-black tracking-wider py-2.5 text-black dark:text-white">{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">Jabatan Struktural</Label>
                                    <Input value={form.data.position} onChange={e => form.setData('position', e.target.value)} placeholder="CONTOH: KEPALA BAGIAN HUKUM" className="h-10 rounded-none border-black dark:border-white bg-white dark:bg-black text-xs font-black uppercase tracking-tight px-4 text-black dark:text-white placeholder:text-black/20" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Column */}
                    <div className="md:col-span-4 flex flex-col gap-10">
                        <FormDangerZone 
                            title="Master Status" 
                            description="Tentukan apakah user ini memiliki hak akses aktif ke portal admin saat ini."
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", form.data.is_active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30")}>
                                    {form.data.is_active ? 'AKUN AKTIF' : 'NONAKTIF'}
                                </span>
                                <Checkbox 
                                    checked={form.data.is_active} 
                                    onCheckedChange={(c) => form.setData('is_active', !!c)} 
                                    className="w-5 h-5 rounded-none border-black dark:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                                />
                            </div>
                        </FormDangerZone>

                        <div className="border border-black dark:border-white p-6 bg-black/5 dark:bg-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <UserCircle size={16} className="text-black/30 dark:text-white/30" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">Preview Profil</span>
                            </div>
                            <div className="flex flex-col items-center py-6 border-y border-black dark:border-white border-dashed">
                                <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-2xl mb-4 border border-black dark:border-white">
                                    {form.data.name ? form.data.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-sm font-black uppercase text-center leading-tight tracking-tight text-black dark:text-white">{form.data.name || 'NAMA BELUM DIISI'}</span>
                                <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase mt-1 tracking-widest">{form.data.position || 'JABATAN BELUM SET'}</span>
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
                    <Button onClick={openCreate} className="h-9 gap-2 rounded-none bg-black dark:bg-white px-6 text-[11px] font-black uppercase tracking-widest text-white dark:text-black shadow-none hover:opacity-90 transition-all active:scale-95 border border-black dark:border-white">
                        <Plus className="h-3.5 w-3.5" /> Registrasi User Baru
                    </Button>
                )
            }
            onRowClick={openEdit}
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
