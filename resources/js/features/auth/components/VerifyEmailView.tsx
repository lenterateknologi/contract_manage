import { Button } from '@/components/ui/buttons/Button';
import TextLink from '@/components/ui/navigation/TextLink';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import React, { FormEventHandler } from 'react';
import { VerifyEmailProps } from '../types/auth.types';

export function VerifyEmailView({ status }: Readonly<VerifyEmailProps>) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthLayout title="Verifikasi Email" description="Silakan verifikasi alamat email Anda dengan mengeklik tautan yang baru saja kami kirimkan.">
            <Head title="Verifikasi Email" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl p-3 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300">
                    Tautan verifikasi baru telah dikirimkan ke alamat email yang Anda berikan saat pendaftaran.
                </div>
            )}

            <form onSubmit={submit} className="space-y-6 text-center">
                <Button disabled={processing} variant="secondary" className="w-full h-11 rounded-xl font-bold">
                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Kirim Ulang Email Verifikasi
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200">
                    Keluar (Log Out)
                </TextLink>
            </form>
        </AuthLayout>
    );
}

export default VerifyEmailView;
