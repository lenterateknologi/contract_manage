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

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Nama Lengkap',
            accessorKey: 'name',
            sortable: true,
            className: 'font-black text-slate-950 uppercase tracking-tight text-[11px]',
        },
        {
            header: 'Username',
            accessorKey: 'username',
            cell: (row) => (
                <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    {row.username}
                </span>
            )
        },
        {
            header: 'Email',
            accessorKey: 'email',
            className: 'font-medium text-slate-500 text-[10px] lowercase',
        },
        {
            header: 'Role',
            accessorKey: 'role',
            cell: (row) => (
                <Badge variant="outline" className="border-slate-200 bg-slate-50 px-2 py-0.5 text-[8px] font-black tracking-widest text-slate-600 uppercase">
                    {row.role}
                </Badge>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            cell: (row) => (
                <Badge className={cn('px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] shadow-none border-none', row.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                    {row.is_active ? 'Online' : 'Paused'}
                </Badge>
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
        if (!editingUser) return;
        if (confirm(`Hapus user ${editingUser.name}? Seluruh data akses akan dicabut.`)) {
            router.delete(`/admin/users/${editingUser.id}`, {
                onSuccess: () => {
                    closeForm();
                    showToast('User telah dihapus dari sistem', 'success');
                },
            });
        }
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
                            className="h-8 hover:bg-rose-50 text-rose-600 rounded-none px-4 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus User
                        </Button>
                    )
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Main Column */}
                    <div className="md:col-span-8 space-y-10">
                        {/* Section: Akun & Identitas */}
                        <FormSection title="Identitas & Otentikasi" subtitle="Informasi masuk dan profil dasar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap Sesuai KTP</Label>
                                    <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} required placeholder="NAMA LENGKAP" className="h-10 rounded-none border-slate-200 bg-slate-50/20 text-sm font-black uppercase tracking-tight px-4" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username Akses</Label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                                        <Input value={form.data.username} onChange={e => form.setData('username', e.target.value)} required placeholder="USERNAME" className="h-10 rounded-none border-slate-200 text-sm font-mono pl-10" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Institusi</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                                        <Input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} required placeholder="user@company.com" className="h-10 rounded-none border-slate-200 text-sm font-medium pl-10" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nomor Telepon</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                                        <Input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} placeholder="08XX XXXX XXXX" className="h-10 rounded-none border-slate-200 text-sm font-medium pl-10" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingUser ? 'Reset Password (Opsional)' : 'Set Password Akun'}</Label>
                                    <Input type="password" value={form.data.password} onChange={e => form.setData('password', e.target.value)} required={!editingUser} placeholder="••••••••" className="h-10 rounded-none border-slate-200 text-sm font-medium px-4" />
                                </div>
                            </div>
                        </FormSection>

                        {/* Section: Jabatan */}
                        <FormSection title="Penempatan & Otoritas" subtitle="Struktur organisasi dan peran sistem">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role User</Label>
                                    <Select value={form.data.role} onValueChange={v => form.setData('role', v)}>
                                        <SelectTrigger className="h-10 rounded-none border-slate-200 text-[11px] font-black uppercase tracking-tight bg-slate-50/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            {roles.map(r => <SelectItem key={r.id} value={r.name} className="text-[10px] uppercase font-black tracking-wider py-2.5">{r.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit / Departemen</Label>
                                    <Select value={String(form.data.department_id)} onValueChange={v => form.setData('department_id', v)}>
                                        <SelectTrigger className="h-10 rounded-none border-slate-200 text-[11px] font-black uppercase tracking-tight bg-slate-50/20">
                                            <SelectValue placeholder="PILIH UNIT KERJA" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            {departments.map(d => <SelectItem key={d.id} value={String(d.id)} className="text-[10px] uppercase font-black tracking-wider py-2.5">{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jabatan Struktural</Label>
                                    <Input value={form.data.position} onChange={e => form.setData('position', e.target.value)} placeholder="CONTOH: KEPALA BAGIAN HUKUM" className="h-10 rounded-none border-slate-200 bg-slate-50/20 text-xs font-black uppercase tracking-tight px-4" />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    {/* Side Column */}
                    <div className="md:col-span-4 flex flex-col gap-10">
                        <FormDangerZone 
                            title="Master Status" 
                            description="Tentukan apakah user ini memiliki hak akses aktif ke portal admin saat ini."
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", form.data.is_active ? "text-emerald-600" : "text-rose-600")}>
                                    {form.data.is_active ? 'AKUN AKTIF' : 'NONAKTIF'}
                                </span>
                                <Checkbox 
                                    checked={form.data.is_active} 
                                    onCheckedChange={(c) => form.setData('is_active', !!c)} 
                                    className="w-5 h-5 rounded-none border-black"
                                />
                            </div>
                        </FormDangerZone>

                        <div className="border border-slate-200 p-6 bg-slate-50/50">
                            <div className="flex items-center gap-2 mb-4">
                                <UserCircle size={16} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preview Profil</span>
                            </div>
                            <div className="flex flex-col items-center py-6 border-y border-slate-200 border-dashed">
                                <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-black text-2xl mb-4">
                                    {form.data.name ? form.data.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-sm font-black uppercase text-center leading-tight tracking-tight">{form.data.name || 'NAMA BELUM DIISI'}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{form.data.position || 'JABATAN BELUM SET'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Management User"
            columns={columns}
            data={users.data || []}
            searchKey="name"
            searchPlaceholder="Cari nama, email, atau username..."
            searchValue={filters.search || ''}
            onSearchChange={(v) => router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            headerActions={
                canCreate && (
                    <Button onClick={openCreate} className="h-9 gap-2 rounded-xl px-5 text-[11px] font-black tracking-widest uppercase shadow-lg shadow-primary/20">
                        <Plus className="h-3.5 w-3.5" /> Tambah User
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
