import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import TextLink from '@/components/ui/navigation/TextLink';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { AuthErrorAlert } from './components/AuthErrorAlert';

export default function ForgotPassword({ status }: Readonly<{ status?: string }>) {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthSplitLayout
            title="Lupa Kata Sandi"
            description="Masukkan email atau username terdaftar Anda untuk tautan atur ulang."
            image="https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&q=80&w=1200"
            isSuccess={wasSuccessful}
        >
            <Head title="Lupa Kata Sandi" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <AuthErrorAlert errors={errors} title="Gagal Mengirim Tautan" />

                {status && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40 p-4 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                        {status}
                    </div>
                )}

                <div className="grid gap-5">
                    <FormInput
                        id="email"
                        label="Email atau Username"
                        type="text"
                        name="email"
                        autoComplete="username"
                        value={data.email}
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Email atau username Anda"
                        error={errors.email}
                        disabled={processing}
                        className="rounded-xl"
                    />

                    <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Kirim Tautan Atur Ulang
                    </Button>
                </div>

                <div className="text-center text-sm font-medium">
                    Atau, kembali ke{' '}
                    <TextLink
                        href={route('login')}
                        className="font-bold text-primary hover:text-primary/80 hover:underline"
                    >
                        Halaman Masuk
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
