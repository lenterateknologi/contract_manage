import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Loader2, 
    MapPin, 
    Eye,
    EyeOff,
    Camera
} from 'lucide-react';
import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';

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
        <div className="mx-auto max-w-[1200px] px-6 py-12 select-none animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                {/* --- LEFT COLUMN: AVATAR CARD --- */}
                <div className="md:col-span-4 bg-white dark:bg-surface-base border border-surface-border/60 rounded-2xl p-6 shadow-xs h-fit flex flex-col items-center">
                    {/* Avatar Rounded Square */}
                    <div className="relative w-44 h-44 rounded-2xl overflow-hidden bg-surface-muted/30 border border-surface-border/40 group">
                        {meUser?.avatar_url ? (
                            <img
                                src={meUser.avatar_url}
                                alt={meUser.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-4xl uppercase bg-primary/10 text-primary">
                                {meUser?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                            </div>
                        )}
                        <button
                            type="button"
                            className="absolute bottom-2.5 right-2.5 bg-black/60 text-white h-8 w-8 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Change Photo"
                        >
                            <Camera size={14} />
                        </button>
                    </div>

                    {/* Name & Location */}
                    <h2 className="mt-5 text-xl font-bold text-text-main text-center">{meUser.name}</h2>
                    
                    <div className="mt-3 flex items-start gap-2 text-xs text-text-soft justify-center text-center">
                        <MapPin size={15} className="shrink-0 text-text-soft mt-0.5" />
                        <div>
                            <p className="font-medium text-text-main">{meUser?.location || '-'}</p>
                            <p className="text-text-desc">{meUser?.position || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: PROFILE & PASSWORD FORMS --- */}
                <div className="md:col-span-8 bg-white dark:bg-surface-base border border-surface-border/60 rounded-2xl p-6 md:p-8 shadow-xs">
                    <h1 className="text-xl font-bold text-text-main mb-6">Profile</h1>

                    {/* User Information Subsection */}
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-soft border-b border-surface-border/40 pb-2 mb-4">
                        User Information
                    </h3>

                    <form onSubmit={updateProfile} className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-text-main">Name</Label>
                            <Input
                                value={pData.name}
                                onChange={(e) => setPData('name', e.target.value)}
                                className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-text-main">Email</Label>
                            <Input
                                type="email"
                                value={pData.email}
                                onChange={(e) => setPData('email', e.target.value)}
                                className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-text-main">Phone</Label>
                            <Input
                                value={pData.phone}
                                onChange={(e) => setPData('phone', e.target.value)}
                                className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={pProcessing}
                            className="bg-slate-500 hover:bg-slate-600 text-white font-semibold text-xs tracking-wider uppercase px-6 h-10 rounded-lg shadow-sm cursor-pointer"
                        >
                            {pProcessing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                            Save Now
                        </Button>
                    </form>

                    {/* Password Subsection */}
                    <h3 className="mt-10 text-[11px] font-bold uppercase tracking-wider text-text-soft border-b border-surface-border/40 pb-2 mb-4">
                        Password
                    </h3>

                    <form onSubmit={updatePassword} className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-text-main">Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={qData.current_password}
                                    onChange={(e) => setQData('current_password', e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-text-main transition-colors cursor-pointer"
                                >
                                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-text-main">New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    value={qData.password}
                                    onChange={(e) => setQData('password', e.target.value)}
                                    placeholder="New Password"
                                    className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-text-main transition-colors cursor-pointer"
                                >
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-text-main">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={qData.password_confirmation}
                                    onChange={(e) => setQData('password_confirmation', e.target.value)}
                                    placeholder="Confirm New Password"
                                    className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-text-soft hover:text-text-main transition-colors cursor-pointer"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={qProcessing}
                            variant="outline"
                            className="h-10 rounded-lg border-surface-border text-xs uppercase font-semibold hover:bg-surface-muted cursor-pointer"
                        >
                            {qProcessing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                            Change Password
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
