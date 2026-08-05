import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { User } from '@/types';
import { useForm } from '@inertiajs/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

export function ProfileView({ meUser, showToast }: { meUser: User; showToast: (msg: string, type: 'success' | 'danger' | 'info') => void }) {
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
        reset: qReset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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
                qReset();
            },
            onError: (err: Record<string, string>) => {
                const msg = (Object.values(err)[0] as string) || 'Gagal memperbarui password.';
                showToast(msg, 'danger');
            },
        });
    };

    return (
        <div className="mx-auto max-w-2xl p-6 space-y-6 select-none overflow-y-auto max-h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* --- PERSONAL INFO CARD --- */}
            <section className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-xs backdrop-blur-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                    <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">Profil Saya</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Kelola informasi dasar dan kontak akun Anda.</p>
                </div>

                <form onSubmit={updateProfile} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap</Label>
                        <Input
                            value={pData.name}
                            onChange={(e) => setPData('name', e.target.value)}
                            className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-xs focus:bg-white dark:focus:bg-zinc-800"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</Label>
                            <Input
                                type="email"
                                value={pData.email}
                                onChange={(e) => setPData('email', e.target.value)}
                                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-xs focus:bg-white dark:focus:bg-zinc-800"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telepon</Label>
                            <Input
                                value={pData.phone}
                                onChange={(e) => setPData('phone', e.target.value)}
                                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-xs focus:bg-white dark:focus:bg-zinc-800"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            type="submit"
                            disabled={pProcessing}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-5 h-9.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                            {pProcessing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Simpan Profil
                        </Button>
                    </div>
                </form>
            </section>

            {/* --- SECURITY CARD --- */}
            <section className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-xs backdrop-blur-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">Keamanan & Sandi</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Perbarui kata sandi untuk melindungi keamanan akun Anda.</p>
                </div>

                <form onSubmit={updatePassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Saat Ini</Label>
                        <div className="relative">
                            <Input
                                type={showCurrent ? 'text' : 'password'}
                                value={qData.current_password}
                                onChange={(e) => setQData('current_password', e.target.value)}
                                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-xs pr-10 focus:bg-white dark:focus:bg-zinc-800"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                            >
                                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Baru</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    value={qData.password}
                                    onChange={(e) => setQData('password', e.target.value)}
                                    className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-xs pr-10 focus:bg-white dark:focus:bg-zinc-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                >
                                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Konfirmasi Password Baru</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={qData.password_confirmation}
                                    onChange={(e) => setQData('password_confirmation', e.target.value)}
                                    className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-xs pr-10 focus:bg-white dark:focus:bg-zinc-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                >
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            type="submit"
                            disabled={qProcessing}
                            variant="outline"
                            className="text-xs font-semibold px-5 h-9.5 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer active:scale-95"
                        >
                            {qProcessing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Ganti Password
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
