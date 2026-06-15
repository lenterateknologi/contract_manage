import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
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
        <div className="mx-auto max-w-[500px] px-6 py-12 space-y-12 select-none">
            {/* --- PERSONAL INFO --- */}
            <section className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-text-main">Profil Saya</h1>
                    <p className="text-xs text-text-soft">Kelola informasi dasar akun Anda.</p>
                </div>

                <form onSubmit={updateProfile} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Nama Lengkap</Label>
                        <Input
                            value={pData.name}
                            onChange={(e) => setPData('name', e.target.value)}
                            className="h-10 rounded-lg border-surface-border bg-white text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Email</Label>
                        <Input
                            type="email"
                            value={pData.email}
                            onChange={(e) => setPData('email', e.target.value)}
                            className="h-10 rounded-lg border-surface-border bg-white text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Telepon</Label>
                        <Input
                            value={pData.phone}
                            onChange={(e) => setPData('phone', e.target.value)}
                            className="h-10 rounded-lg border-surface-border bg-white text-sm"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={pProcessing}
                        className="bg-primary text-white text-xs font-bold px-6 h-10 rounded-lg"
                    >
                        {pProcessing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Simpan Profil
                    </Button>
                </form>
            </section>

            <div className="h-px bg-surface-border/50" />

            {/* --- SECURITY --- */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-text-main">Keamanan</h2>
                    <p className="text-xs text-text-soft">Perbarui kata sandi untuk melindungi akun Anda.</p>
                </div>

                <form onSubmit={updatePassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Password Saat Ini</Label>
                        <div className="relative">
                            <Input
                                type={showCurrent ? 'text' : 'password'}
                                value={qData.current_password}
                                onChange={(e) => setQData('current_password', e.target.value)}
                                className="h-10 rounded-lg border-surface-border bg-white text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-primary transition-colors"
                            >
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Password Baru</Label>
                        <div className="relative">
                            <Input
                                type={showNew ? 'text' : 'password'}
                                value={qData.password}
                                onChange={(e) => setQData('password', e.target.value)}
                                className="h-10 rounded-lg border-surface-border bg-white text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-primary transition-colors"
                            >
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Konfirmasi Password Baru</Label>
                        <div className="relative">
                            <Input
                                type={showConfirm ? 'text' : 'password'}
                                value={qData.password_confirmation}
                                onChange={(e) => setQData('password_confirmation', e.target.value)}
                                className="h-10 rounded-lg border-surface-border bg-white text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-primary transition-colors"
                            >
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={qProcessing}
                        variant="outline"
                        className="text-xs font-bold px-6 h-10 rounded-lg border-surface-border"
                    >
                        {qProcessing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Ganti Password
                    </Button>
                </form>
            </section>
        </div>
    );
}
