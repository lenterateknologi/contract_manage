import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import TextLink from '@/components/ui/navigation/TextLink';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import React from 'react';
import { useLoginForm } from '../hooks/useLoginForm';
import { LoginProps } from '../types/auth.types';
import { AuthErrorAlert } from './AuthErrorAlert';
import { PasswordField } from './PasswordField';

export function LoginForm({ status, canResetPassword }: Readonly<LoginProps>) {
    const { data, setData, errors, processing, wasSuccessful, submit } = useLoginForm();

    return (
        <AuthSplitLayout title="Selamat Datang!" description="Masuk ke akun Anda dengan aman." isSuccess={wasSuccessful}>
            <Head title="Masuk" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <AuthErrorAlert errors={errors} title="Gagal Masuk" />

                <div className="grid gap-5">
                    <FormInput
                        id="email"
                        label="Email atau Username"
                        type="text"
                        required
                        autoFocus
                        autoComplete="username"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Email atau username Anda"
                        error={errors.email}
                        className="rounded-xl"
                    />

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <PasswordField
                                id="password"
                                label="Kata Sandi"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Kata sandi Anda"
                                error={errors.password}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', Boolean(checked))}
                                className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <label htmlFor="remember" className="text-xs font-semibold text-slate-600 dark:text-zinc-400 select-none cursor-pointer">
                                Ingat saya
                            </label>
                        </div>

                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="text-xs font-semibold text-primary hover:underline">
                                Lupa kata sandi?
                            </TextLink>
                        )}
                    </div>

                    {status && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {status}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Masuk Sekarang
                    </Button>
                </div>
            </form>
        </AuthSplitLayout>
    );
}

export default LoginForm;
