import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Loader2, 
    MapPin, 
    Eye,
    EyeOff,
    Camera,
    User as UserIcon,
    Lock,
    Phone,
    Mail,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import { cn } from '@/lib/utils';

export function ProfileView({ meUser, showToast }: { meUser: any; showToast: any }) {
    const {
        data: pData,
        setData: setPData,
        patch,
        processing: pProcessing,
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
        reset: resetQ,
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
            onSuccess: () => showToast('Profil diperbarui!', 'success'),
            onError: () => showToast('Gagal memperbarui profil.', 'danger'),
        });
    };

    const updatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Password diperbarui!', 'success');
                resetQ();
            },
            onError: (err: any) => {
                const msg = (Object.values(err)[0] as string) || 'Gagal memperbarui password.';
                showToast(msg, 'danger');
            },
        });
    };

    return (
        <div className="mx-auto max-w-[760px] px-4 py-8 select-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Section */}
            <div className="mb-6 flex items-center gap-6 border-b border-surface-border/50 pb-8 text-left">
                <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-surface-muted shadow-sm">
                        {meUser?.avatar_url ? (
                            <img src={meUser.avatar_url} alt={meUser.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-2xl uppercase bg-primary/10 text-primary">
                                {meUser?.name?.substring(0, 2).toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer border border-white">
                        <Camera size={10} />
                    </button>
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold text-text-main tracking-tight">{meUser.name}</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-soft flex items-center gap-1">
                            <Shield size={12} className="text-primary/70" /> {meUser?.role || 'User'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-600 uppercase tracking-tighter border border-green-100">
                            Active Account
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-base border border-surface-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-surface-border/40">
                    {/* --- LEFT: PROFILE --- */}
                    <div className="p-6 lg:p-8 space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                            <UserIcon size={16} className="text-primary" />
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-soft">Informasi Profil</h2>
                        </div>

                        <form onSubmit={updateProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-text-desc ml-0.5">Nama Lengkap</Label>
                                <Input
                                    value={pData.name}
                                    onChange={(e) => setPData('name', e.target.value)}
                                    className="h-9 rounded-lg border-surface-border bg-surface-muted/5 text-xs focus:bg-white transition-all shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-text-desc ml-0.5">Email Kerja</Label>
                                <Input
                                    type="email"
                                    value={pData.email}
                                    onChange={(e) => setPData('email', e.target.value)}
                                    className="h-9 rounded-lg border-surface-border bg-surface-muted/5 text-xs focus:bg-white transition-all shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-text-desc ml-0.5">Nomor Telepon</Label>
                                <Input
                                    value={pData.phone}
                                    onChange={(e) => setPData('phone', e.target.value)}
                                    className="h-9 rounded-lg border-surface-border bg-surface-muted/5 text-xs focus:bg-white transition-all shadow-none"
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={pProcessing}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] tracking-widest uppercase h-9 rounded-lg shadow-sm cursor-pointer"
                                >
                                    {pProcessing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                                    Simpan Profil
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* --- RIGHT: PASSWORD --- */}
                    <div className="p-6 lg:p-8 space-y-5 bg-surface-muted/5">
                        <div className="flex items-center gap-2 mb-1">
                            <Lock size={16} className="text-primary" />
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-soft">Keamanan Akun</h2>
                        </div>

                        <form onSubmit={updatePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-text-desc ml-0.5">Password Saat Ini</Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={qData.current_password}
                                        onChange={(e) => setQData('current_password', e.target.value)}
                                        placeholder="••••••••"
                                        className="h-9 rounded-lg border-surface-border bg-white text-xs pr-10 shadow-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-text-desc ml-0.5">Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? 'text' : 'password'}
                                        value={qData.password}
                                        onChange={(e) => setQData('password', e.target.value)}
                                        className="h-9 rounded-lg border-surface-border bg-white text-xs pr-10 shadow-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-text-desc ml-0.5">Konfirmasi Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={qData.password_confirmation}
                                        onChange={(e) => setQData('password_confirmation', e.target.value)}
                                        className="h-9 rounded-lg border-surface-border bg-white text-xs pr-10 shadow-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={qProcessing}
                                    variant="outline"
                                    className="w-full h-9 rounded-lg border-surface-border text-[9px] tracking-widest uppercase font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-none"
                                >
                                    {qProcessing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Account Metadata / Footer */}
            <div className="mt-8 pt-6 border-t border-surface-border/40 text-center">
                <p className="text-[9px] text-text-soft uppercase tracking-widest font-medium opacity-60">
                    ID: {meUser.id} • {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
        </div>
    );
}
