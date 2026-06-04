import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import { useForm } from '@inertiajs/react';
import { Camera, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import React, { useState } from 'react';

export function ProfileView({ meUser, showToast }: { meUser: any; showToast: any }) {
    const {
        data: pData,
        setData: setPData,
        patch,
        processing: pProcessing,
        reset: pReset,
    } = useForm({
        name: meUser?.name || '',
        email: meUser?.email || '',
        phone: meUser?.phone || '',
    });

    const {
        data: qData,
        setData: setQData,
        put,
        processing: qProcessing,
        reset: qReset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingSecurity, setIsEditingSecurity] = useState(false);

    const updateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Profil diperbarui!', 'success');
                setIsEditingInfo(false);
            },
            onError: () => showToast('Gagal memperbarui profil.', 'danger'),
        });
    };

    const updatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Password diperbarui!', 'success');
                qReset();
                setIsEditingSecurity(false);
            },
            onError: (err: any) => {
                const msg = (Object.values(err)[0] as string) || 'Gagal memperbarui password.';
                showToast(msg, 'danger');
            },
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-[760px] px-4 py-8 duration-500 select-none">
            {/* Header Section */}
            <div className="border-surface-border/50 mb-6 flex items-center gap-6 border-b pb-8 text-left">
                <div className="group relative shrink-0">
                    <div className="border-surface-muted h-20 w-20 overflow-hidden rounded-full border-2 shadow-sm">
                        {meUser?.avatar_url ? (
                            <img src={meUser.avatar_url} alt={meUser.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center text-2xl font-bold uppercase">
                                {meUser?.name?.substring(0, 2).toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                    <button className="bg-primary absolute -right-1 -bottom-1 cursor-pointer rounded-full border border-white p-1.5 text-white shadow-md transition-transform hover:scale-110">
                        <Camera size={10} />
                    </button>
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-text-main text-xl font-bold tracking-tight">{meUser.name}</h1>
                    <div className="mt-1 flex items-center gap-4">
                        <span className="text-text-soft flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
                            <Shield size={12} className="text-primary/70" /> {meUser?.role || 'User'}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[9px] font-bold tracking-tighter text-green-600 uppercase">
                            Active Account
                        </span>
                    </div>
                </div>
            </div>

            {/* Personal Information Card */}
            <div className="border-surface-border/50 dark:bg-surface-base mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-surface-border/30 bg-surface-muted/5 flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-text-soft text-[11px] font-bold tracking-widest uppercase">Personal Information</h2>
                    {!isEditingInfo ? (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)} className="text-primary cursor-pointer text-[10px] font-bold uppercase">
                            Edit
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsEditingInfo(false);
                                    pReset();
                                }}
                                className="text-text-soft cursor-pointer text-[10px] font-bold uppercase"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={updateProfile}
                                disabled={pProcessing}
                                className="text-primary cursor-pointer text-[10px] font-bold uppercase"
                            >
                                {pProcessing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                Save
                            </Button>
                        </div>
                    )}
                </div>
                <div className="p-6">
                    {!isEditingInfo ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <span className="text-text-soft text-[10px] font-bold uppercase">Full Name</span>
                                <span className="col-span-2 text-sm font-medium">{meUser.name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <span className="text-text-soft text-[10px] font-bold uppercase">Work Email</span>
                                <span className="col-span-2 text-sm font-medium">{meUser.email}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <span className="text-text-soft text-[10px] font-bold uppercase">Phone</span>
                                <span className="col-span-2 text-sm font-medium">{meUser.phone || '-'}</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={updateProfile} className="max-w-md space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-text-desc ml-0.5 text-[9px] font-bold tracking-widest uppercase">Nama Lengkap</Label>
                                <Input
                                    value={pData.name}
                                    onChange={(e) => setPData('name', e.target.value)}
                                    className="border-surface-border bg-surface-muted/5 h-9 rounded-lg text-xs shadow-none transition-all focus:bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-text-desc ml-0.5 text-[9px] font-bold tracking-widest uppercase">Email Kerja</Label>
                                <Input
                                    type="email"
                                    value={pData.email}
                                    onChange={(e) => setPData('email', e.target.value)}
                                    className="border-surface-border bg-surface-muted/5 h-9 rounded-lg text-xs shadow-none transition-all focus:bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-text-desc ml-0.5 text-[9px] font-bold tracking-widest uppercase">Nomor Telepon</Label>
                                <Input
                                    value={pData.phone}
                                    onChange={(e) => setPData('phone', e.target.value)}
                                    className="border-surface-border bg-surface-muted/5 h-9 rounded-lg text-xs shadow-none transition-all focus:bg-white"
                                />
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Security Card */}
            <div className="dark:bg-surface-base border-surface-border/50 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-surface-border/30 bg-surface-muted/5 flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-text-soft text-[11px] font-bold tracking-widest uppercase">Security</h2>
                    {!isEditingSecurity ? (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingSecurity(true)} className="text-primary cursor-pointer text-[10px] font-bold uppercase">
                            Change Password
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsEditingSecurity(false);
                                    qReset();
                                }}
                                className="text-text-soft cursor-pointer text-[10px] font-bold uppercase"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={updatePassword}
                                disabled={qProcessing}
                                className="text-primary cursor-pointer text-[10px] font-bold uppercase"
                            >
                                {qProcessing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                Update
                            </Button>
                        </div>
                    )}
                </div>
                <div className="p-6">
                    {!isEditingSecurity ? (
                        <div className="flex items-center gap-4">
                            <span className="text-text-soft text-[10px] font-bold uppercase">Password</span>
                            <span className="text-sm font-medium">••••••••••••••••</span>
                        </div>
                    ) : (
                        <form onSubmit={updatePassword} className="max-w-md space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-text-desc ml-0.5 text-[9px] font-bold tracking-widest uppercase">Password Saat Ini</Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={qData.current_password}
                                        onChange={(e) => setQData('current_password', e.target.value)}
                                        placeholder="••••••••"
                                        className="border-surface-border bg-surface-muted/5 h-9 rounded-lg pr-10 text-xs shadow-none transition-all focus:bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="text-text-soft hover:text-primary absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                                    >
                                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-text-desc ml-0.5 text-[9px] font-bold tracking-widest uppercase">Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? 'text' : 'password'}
                                        value={qData.password}
                                        onChange={(e) => setQData('password', e.target.value)}
                                        className="border-surface-border bg-surface-muted/5 h-9 rounded-lg pr-10 text-xs shadow-none transition-all focus:bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="text-text-soft hover:text-primary absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                                    >
                                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-text-desc ml-0.5 text-[9px] font-bold tracking-widest uppercase">Konfirmasi Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={qData.password_confirmation}
                                        onChange={(e) => setQData('password_confirmation', e.target.value)}
                                        className="border-surface-border bg-surface-muted/5 h-9 rounded-lg pr-10 text-xs shadow-none transition-all focus:bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="text-text-soft hover:text-primary absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                                    >
                                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Account Metadata / Footer */}
            <div className="border-surface-border/40 mt-8 border-t pt-6 text-center">
                <p className="text-text-soft text-[9px] font-medium tracking-widest uppercase opacity-60">
                    ID: {meUser.id} • {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
        </div>
    );
}
