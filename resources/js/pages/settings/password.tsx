import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, KeyRound, Lock, ShieldAlert } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';

import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import InputError from '@/components/ui/base/InputError';
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
                    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
                        <div className="border-border bg-muted/30 flex items-center justify-between border-b px-6 py-4">
                            <h3 className="text-foreground text-sm font-black uppercase">Update Kata Sandi</h3>
                            <Lock size={16} className="text-muted-foreground/60" />
                        </div>

                        <div className="flex gap-3 border-b border-amber-500/20 bg-amber-500/10 p-6">
                            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-500">Keamanan Akun</p>
                                <p className="text-[11px] font-medium text-amber-500/80">
                                    Pastikan Anda menggunakan kata sandi yang panjang, unik, dan acak untuk menjaga keamanan akun Anda.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={updatePassword} className="space-y-8 p-8">
                            <div className="mx-auto max-w-md space-y-6">
                                {/* Current Password */}
                                <div className="group space-y-2">
                                    <Label
                                        htmlFor="current_password"
                                        className="text-muted-foreground group-focus-within:text-primary text-xs font-bold tracking-wider uppercase transition-colors"
                                    >
                                        Kata Sandi Saat Ini
                                    </Label>
                                    <div className="relative">
                                        <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            value={data.current_password}
                                            onChange={(e) => setData('current_password', e.target.value)}
                                            type="password"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm transition-all focus:bg-white"
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <InputError message={errors.current_password} />
                                </div>

                                {/* New Password */}
                                <div className="group space-y-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-muted-foreground group-focus-within:text-primary text-xs font-bold tracking-wider uppercase transition-colors"
                                    >
                                        Kata Sandi Baru
                                    </Label>
                                    <div className="relative">
                                        <Lock className="text-muted-foreground/40 group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                        <Input
                                            id="password"
                                            ref={passwordInput}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            type="password"
                                            className="bg-muted/20 border-border focus:bg-background h-11 rounded-xl pl-10 text-sm transition-all"
                                            autoComplete="new-password"
                                            placeholder="Min. 8 karakter"
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Password Confirmation */}
                                <div className="group space-y-2">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-muted-foreground group-focus-within:text-primary text-xs font-bold tracking-wider uppercase transition-colors"
                                    >
                                        Konfirmasi Kata Sandi Baru
                                    </Label>
                                    <div className="relative">
                                        <Lock className="text-muted-foreground/40 group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                        <Input
                                            id="password_confirmation"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            type="password"
                                            className="bg-muted/20 border-border focus:bg-background h-11 rounded-xl pl-10 text-sm transition-all"
                                            autoComplete="new-password"
                                            placeholder="Ketik ulang kata sandi baru"
                                        />
                                    </div>
                                    <InputError message={errors.password_confirmation} />
                                </div>
                            </div>

                            <div className="border-border flex items-center justify-center gap-3 border-t pt-4">
                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-out duration-300"
                                    enterFrom="opacity-0 translate-y-2"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <p className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500">
                                        <CheckCircle2 size={12} />
                                        Kata Sandi Diperbarui
                                    </p>
                                </Transition>

                                <Button
                                    className="bg-foreground hover:bg-foreground/90 text-background shadow-foreground/10 h-10 rounded-xl px-8 text-xs font-black uppercase shadow-lg transition-all active:scale-95"
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
