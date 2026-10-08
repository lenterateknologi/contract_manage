import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, LoaderCircle, RefreshCw } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import TextLink from '@/components/ui/navigation/TextLink';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { AuthErrorAlert } from './components/AuthErrorAlert';
import { PasswordField } from './components/PasswordField';

interface ResetPasswordProps {
    token: string;
    email: string;
    error?: string;
}

interface ResetPasswordForm extends Record<string, any> {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function ResetPassword({ token, email, error }: Readonly<ResetPasswordProps>) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

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

                    <div className="grid gap-3">
                        <Button
                            type="button"
                            onClick={() => (window.location.href = route('password.request'))}
                            className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                        >
                            <RefreshCw className="mr-2 size-4" />
                            Minta Tautan Baru
                        </Button>

                        <div className="pt-2 text-center text-sm font-medium">
                            <TextLink
                                href={route('login')}
                                className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 font-bold hover:underline"
                            >
                                <ArrowLeft className="size-4" />
                                Kembali ke Halaman Masuk
                            </TextLink>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <AuthErrorAlert errors={errors} title="Gagal Mengatur Ulang Kata Sandi" />

                    <div className="grid gap-5">
                        <FormInput
                            id="email"
                            label="Email Terdaftar"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            readOnly
                            disabled
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                            className="cursor-not-allowed rounded-xl bg-slate-50 opacity-80 dark:bg-zinc-800/50"
                        />

                        <PasswordField
                            id="password"
                            label="Kata Sandi Baru"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Minimal 8 karakter"
                            error={errors.password}
                            autoComplete="new-password"
                            disabled={processing}
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
                            disabled={processing}
                        />

                        <Button
                            type="submit"
                            className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                            Simpan Kata Sandi Baru
                        </Button>
                    </div>

                    <div className="text-center text-sm font-medium">
                        Atau, kembali ke{' '}
                        <TextLink href={route('login')} className="text-primary hover:text-primary/80 font-bold hover:underline">
                            Halaman Masuk
                        </TextLink>
                    </div>
                </form>
            )}
        </AuthSplitLayout>
    );
}
