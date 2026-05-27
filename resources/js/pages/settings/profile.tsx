import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Mail,
    MapPin,
    Palette,
    Phone,
    Lock,
    KeyRound,
    Loader2,
    ShieldCheck,
    Eye,
    EyeOff,
    Camera
} from 'lucide-react';
import { FormEventHandler, useRef, useState, useMemo } from 'react';

import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import InputError from '@/components/ui/base/InputError';
import { Label } from '@/components/ui/base/Label';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/contracts/ui';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    position?: string;
    company?: string;
    location?: string;
    group?: string;
    region?: string;
    bio?: string;
    role?: string;
    created_at?: string;
    avatar_url?: string;
}

export default function Profile() {
    const { auth } = usePage<any>().props;
    const user = auth.user as UserProfile;

    const profileForm = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('user.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <>
            <Head title="Profile Settings" />

            <SettingsLayout>
                <div className="mx-auto max-w-[1200px] px-6 py-12 select-none animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                        {/* --- LEFT COLUMN: AVATAR CARD --- */}
                        <div className="md:col-span-4 bg-white dark:bg-surface-base border border-surface-border/60 rounded-2xl p-6 shadow-xs h-fit flex flex-col items-center">
                            {/* Avatar Rounded Square */}
                            <div className="relative w-44 h-44 rounded-2xl overflow-hidden bg-surface-muted/30 border border-surface-border/40 group">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-4xl uppercase bg-primary/10 text-primary">
                                        {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
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
                            <h2 className="mt-5 text-xl font-bold text-text-main text-center">{user.name}</h2>
                            
                            <div className="mt-3 flex items-start gap-2 text-xs text-text-soft justify-center text-center">
                                <MapPin size={15} className="shrink-0 text-text-soft mt-0.5" />
                                <div>
                                    <p className="font-medium text-text-main">{user?.location || '-'}</p>
                                    <p className="text-text-desc">{user?.position || '-'}</p>
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

                            <form onSubmit={submitProfile} className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-text-main">Name</Label>
                                    <Input
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium"
                                    />
                                    {profileForm.errors.name && <InputError message={profileForm.errors.name} />}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-text-main">Email</Label>
                                    <Input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium"
                                    />
                                    {profileForm.errors.email && <InputError message={profileForm.errors.email} />}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-text-main">Phone</Label>
                                    <Input
                                        value={profileForm.data.phone}
                                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                                        className="h-10 rounded-lg border-surface-border bg-white dark:bg-surface-base text-sm font-medium"
                                    />
                                    {profileForm.errors.phone && <InputError message={profileForm.errors.phone} />}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="bg-slate-500 hover:bg-slate-600 text-white font-semibold text-xs tracking-wider uppercase px-6 h-10 rounded-lg shadow-sm cursor-pointer"
                                >
                                    {profileForm.processing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                                    Save Now
                                </Button>
                            </form>

                            {/* Password Subsection */}
                            <h3 className="mt-10 text-[11px] font-bold uppercase tracking-wider text-text-soft border-b border-surface-border/40 pb-2 mb-4">
                                Password
                            </h3>

                            <form onSubmit={submitPassword} className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-text-main">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={passwordForm.data.current_password}
                                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
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
                                    {passwordForm.errors.current_password && <InputError message={passwordForm.errors.current_password} />}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-text-main">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showNew ? 'text' : 'password'}
                                            value={passwordForm.data.password}
                                            onChange={(e) => passwordForm.setData('password', e.target.value)}
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
                                    {passwordForm.errors.password && <InputError message={passwordForm.errors.password} />}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-text-main">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={passwordForm.data.password_confirmation}
                                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
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
                                    {passwordForm.errors.password_confirmation && <InputError message={passwordForm.errors.password_confirmation} />}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    variant="outline"
                                    className="h-10 rounded-lg border-surface-border text-xs uppercase font-semibold hover:bg-surface-muted cursor-pointer"
                                >
                                    {passwordForm.processing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                                    Change Password
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </>
    );
}
