import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import TextLink from '@/components/ui/navigation/TextLink';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { Head } from '@inertiajs/react';
import { Clock, LoaderCircle } from 'lucide-react';
import React from 'react';
import { useForgotPasswordForm } from '../hooks/useForgotPasswordForm';
import { ForgotPasswordProps } from '../types/auth.types';
import { AuthErrorAlert } from './AuthErrorAlert';

export function ForgotPasswordForm({ status }: Readonly<ForgotPasswordProps>) {
    const { data, setData, errors, processing, countdown, submit } = useForgotPasswordForm(status);

    return (
        <AuthSplitLayout
            title="Lupa Kata Sandi?"
            description="Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
            image="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200"
            isSuccess={Boolean(status)}
            successText="TAUTAN TERKIRIM"
        >
            <Head title="Lupa Kata Sandi" />

            {status && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                    <div className="flex items-start gap-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white dark:bg-emerald-500">
                            ✓
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Email Pemulihan Berhasil Dikirim</h3>
                            <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                                Kami telah mengirimkan tautan atur ulang kata sandi ke alamat email Anda. Silakan periksa kotak masuk (Inbox) atau folder Spam.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-6">
                <AuthErrorAlert errors={errors} title="Gagal Mengirim Tautan" />

                <div className="grid gap-5">
                    <FormInput
                        id="email"
                        type="email"
                        name="email"
                        label="Alamat Email Terdaftar"
                        autoComplete="email"
                        value={data.email}
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="contoh@domain.com"
                        error={errors.email}
                        required
                        disabled={processing || countdown > 0}
                        className="rounded-xl"
                    />

                    {countdown > 0 && (
                        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                            <Clock className="size-4 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
                            <span>
                                Mohon tunggu <strong className="font-bold">{countdown} detik</strong> sebelum mengirim ulang.
                            </span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                        disabled={processing || countdown > 0}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        {countdown > 0 ? `Kirim Ulang (${countdown}s)` : 'Kirim Tautan Atur Ulang'}
                    </Button>
                </div>

                <div className="text-center text-xs text-slate-500 dark:text-zinc-400">
                    Ingat kata sandi Anda?{' '}
                    <TextLink href={route('login')} className="font-bold text-primary hover:underline">
                        Kembali ke Masuk
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}

export default ForgotPasswordForm;
