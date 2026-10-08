import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import TextLink from '@/components/ui/navigation/TextLink';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { Head } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, LoaderCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import { useResetPasswordForm } from '../hooks/useResetPasswordForm';
import { ResetPasswordProps } from '../types/auth.types';
import { AuthErrorAlert } from './AuthErrorAlert';
import { PasswordField } from './PasswordField';

export function ResetPasswordForm({ token, email, error }: Readonly<ResetPasswordProps>) {
    const { data, setData, errors, processing, wasSuccessful, submit } = useResetPasswordForm(token, email);

    return (
        <AuthSplitLayout
            title="Atur Ulang Kata Sandi"
            description="Silakan masukkan kata sandi baru untuk akun Anda."
            isSuccess={wasSuccessful}
            successText="KATA SANDI DIPERBARUI"
            image="https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&q=80&w=1200"
        >
            <Head title="Atur Ulang Kata Sandi" />

            {error ? (
                <div className="flex flex-col gap-6">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 dark:border-rose-900/50 dark:bg-rose-950/40">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Tautan Tidak Valid atau Kedaluwarsa</h3>
                                <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                                    {error === 'This password reset link is invalid or has expired.'
                                        ? 'Tautan atur ulang kata sandi ini sudah tidak berlaku atau telah kedaluwarsa. Silakan ajukan permintaan tautan baru.'
                                        : error}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <TextLink
                            href={route('password.request')}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
                        >
                            <RefreshCw className="size-4" />
                            Minta Tautan Baru
                        </TextLink>

                        <TextLink
                            href={route('login')}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Masuk
                        </TextLink>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <AuthErrorAlert errors={errors} title="Gagal Memperbarui Kata Sandi" />

                    <div className="grid gap-5">
                        <FormInput
                            id="email"
                            type="email"
                            name="email"
                            label="Alamat Email"
                            autoComplete="email"
                            value={data.email}
                            readOnly
                            disabled
                            error={errors.email}
                            className="rounded-xl bg-slate-50 text-slate-500 dark:bg-zinc-800/50"
                        />

                        <PasswordField
                            id="password"
                            name="password"
                            label="Kata Sandi Baru"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Minimal 8 karakter"
                            error={errors.password}
                            autoComplete="new-password"
                            required
                        />

                        <PasswordField
                            id="password_confirmation"
                            name="password_confirmation"
                            label="Konfirmasi Kata Sandi Baru"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Ulangi kata sandi baru"
                            error={errors.password_confirmation}
                            autoComplete="new-password"
                            required
                        />

                        <Button
                            type="submit"
                            className="mt-2 h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                            Simpan Kata Sandi Baru
                        </Button>
                    </div>

                    <div className="text-center text-xs text-slate-500 dark:text-zinc-400">
                        <TextLink href={route('login')} className="font-bold text-primary hover:underline">
                            Kembali ke Masuk
                        </TextLink>
                    </div>
                </form>
            )}
        </AuthSplitLayout>
    );
}

export default ResetPasswordForm;
