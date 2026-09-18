import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import AuthLayout from '@/layouts/auth-layout';
import { AuthErrorAlert } from './components/AuthErrorAlert';
import { PasswordField } from './components/PasswordField';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Konfirmasi Kata Sandi"
            description="Ini adalah area aman aplikasi. Silakan konfirmasi kata sandi Anda sebelum melanjutkan."
        >
            <Head title="Konfirmasi Kata Sandi" />

            <div className="rounded-xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <AuthErrorAlert errors={errors} title="Konfirmasi Gagal" />

                    <div className="grid gap-5">
                        <PasswordField
                            id="password"
                            label="Kata Sandi"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Kata sandi Anda"
                            error={errors.password}
                            autoComplete="current-password"
                            disabled={processing}
                        />

                        <Button
                            type="submit"
                            className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                            Konfirmasi Kata Sandi
                        </Button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
