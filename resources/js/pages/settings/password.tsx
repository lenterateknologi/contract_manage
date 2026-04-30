import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { KeyRound, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

import InputError from '@/components/ui/base/InputError';
import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import SettingsLayout from '@/layouts/settings/layout';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('user.password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
            },
        });
    };

    return (
        <>
            <Head title="Keamanan Akun" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Update Kata Sandi</h3>
                            <Lock size={16} className="text-muted-foreground/60" />
                        </div>

                        <div className="p-6 bg-amber-500/10 border-b border-amber-500/20 flex gap-3">
                            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-500">Keamanan Akun</p>
                                <p className="text-[11px] text-amber-500/80 font-medium">Pastikan Anda menggunakan kata sandi yang panjang, unik, dan acak untuk menjaga keamanan akun Anda.</p>
                            </div>
                        </div>

                        <form onSubmit={updatePassword} className="p-8 space-y-8">
                            <div className="space-y-6 max-w-md mx-auto">
                                {/* Current Password */}
                                <div className="space-y-2 group">
                                    <Label htmlFor="current_password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-focus-within:text-primary transition-colors">
                                        Kata Sandi Saat Ini
                                    </Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            value={data.current_password}
                                            onChange={(e) => setData('current_password', e.target.value)}
                                            type="password"
                                            className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl text-sm"
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <InputError message={errors.current_password} />
                                </div>

                                {/* New Password */}
                                <div className="space-y-2 group">
                                    <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-focus-within:text-primary transition-colors">
                                        Kata Sandi Baru
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="password"
                                            ref={passwordInput}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            type="password"
                                            className="pl-10 h-11 bg-muted/20 border-border focus:bg-background transition-all rounded-xl text-sm"
                                            autoComplete="new-password"
                                            placeholder="Min. 8 karakter"
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Password Confirmation */}
                                <div className="space-y-2 group">
                                    <Label htmlFor="password_confirmation" className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-focus-within:text-primary transition-colors">
                                        Konfirmasi Kata Sandi Baru
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="password_confirmation"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            type="password"
                                            className="pl-10 h-11 bg-muted/20 border-border focus:bg-background transition-all rounded-xl text-sm"
                                            autoComplete="new-password"
                                            placeholder="Ketik ulang kata sandi baru"
                                        />
                                    </div>
                                    <InputError message={errors.password_confirmation} />
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-out duration-300"
                                    enterFrom="opacity-0 translate-y-2"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                        <CheckCircle2 size={12} />
                                        Kata Sandi Diperbarui
                                    </p>
                                </Transition>

                                <Button 
                                    className="h-10 px-8 bg-foreground hover:bg-foreground/90 text-background font-black text-xs uppercase tracking-widest shadow-lg shadow-foreground/10 rounded-xl transition-all active:scale-95" 
                                    disabled={processing}
                                >
                                    {processing ? 'Menyimpan...' : 'Perbarui Password'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </SettingsLayout>
        </>
    );
}
