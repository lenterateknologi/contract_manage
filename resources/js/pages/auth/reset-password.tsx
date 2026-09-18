import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import AuthLayout from '@/layouts/auth-layout';
import { AuthErrorAlert } from './components/AuthErrorAlert';
import { PasswordField } from './components/PasswordField';

interface ResetPasswordProps {
    token: string;
    email: string;
}

interface ResetPasswordForm extends Record<string, any> {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function ResetPassword({ token, email }: Readonly<ResetPasswordProps>) {
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
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
        <AuthLayout title="Atur Ulang Kata Sandi" description="Silakan masukkan kata sandi baru Anda di bawah ini">
            <Head title="Atur Ulang Kata Sandi" />

            <div className="rounded-xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <AuthErrorAlert errors={errors} title="Gagal Mengatur Ulang Kata Sandi" />

                    <div className="grid gap-5">
                        <FormInput
                            id="email"
                            label="Email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            readOnly
                            disabled
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                            className="rounded-xl bg-slate-50 dark:bg-zinc-800/50"
                        />

                        <PasswordField
                            id="password"
                            label="Kata Sandi Baru"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Kata sandi baru"
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
                            Atur Ulang Kata Sandi
                        </Button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
