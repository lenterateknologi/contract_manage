import { Head, useForm } from '@inertiajs/react';
import { Clock, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import TextLink from '@/components/ui/navigation/TextLink';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { AuthErrorAlert } from './components/AuthErrorAlert';

const COOLDOWN_KEY = 'forgot_password_cooldown_until';
const COOLDOWN_SECONDS = 120;

function getRemainingCooldown(): number {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(COOLDOWN_KEY);
    if (!stored) return 0;

    const expiry = parseInt(stored, 10);
    const diff = Math.ceil((expiry - Date.now()) / 1000);
    if (diff > 0) {
        return diff;
    }
    localStorage.removeItem(COOLDOWN_KEY);
    return 0;
}

export default function ForgotPassword({ status }: Readonly<{ status?: string }>) {
    const [countdown, setCountdown] = useState<number>(0);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    // Check existing cooldown on mount
    useEffect(() => {
        const remaining = getRemainingCooldown();
        if (remaining > 0) {
            setCountdown(remaining);
        }
    }, []);

    // Set cooldown when status arrives (email sent successfully)
    useEffect(() => {
        if (status) {
            const current = getRemainingCooldown();
            if (current === 0) {
                const target = Date.now() + COOLDOWN_SECONDS * 1000;
                localStorage.setItem(COOLDOWN_KEY, target.toString());
                setCountdown(COOLDOWN_SECONDS);
            }
        }
    }, [status]);

    // Interval ticker for countdown
    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setInterval(() => {
            const remaining = getRemainingCooldown();
            setCountdown(remaining);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (countdown > 0 || processing) return;

        post(route('password.email'), {
            onSuccess: () => {
                const target = Date.now() + COOLDOWN_SECONDS * 1000;
                localStorage.setItem(COOLDOWN_KEY, target.toString());
                setCountdown(COOLDOWN_SECONDS);
            },
        });
    };

    return (
        <AuthSplitLayout
            title="Lupa Kata Sandi"
            description="Masukkan email atau username terdaftar Anda untuk tautan atur ulang."
            image="https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&q=80&w=1200"
        >
            <Head title="Lupa Kata Sandi" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <AuthErrorAlert errors={errors} title="Gagal Mengirim Tautan" />

                {status && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
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
                        disabled={processing || countdown > 0}
                    >
                        {processing ? (
                            <>
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                                Mengirim Permintaan...
                            </>
                        ) : countdown > 0 ? (
                            <span className="flex items-center justify-center gap-1.5">
                                <Clock className="size-4 animate-pulse" />
                                Kirim Ulang ({countdown}d)
                            </span>
                        ) : (
                            'Kirim Tautan Atur Ulang'
                        )}
                    </Button>

                    {countdown > 0 && (
                        <p className="text-muted-foreground text-center text-xs">
                            Mohon tunggu <span className="text-foreground font-semibold">{countdown} detik</span> sebelum meminta tautan baru.
                        </p>
                    )}
                </div>

                <div className="text-center text-sm font-medium">
                    Atau, kembali ke{' '}
                    <TextLink href={route('login')} className="text-primary hover:text-primary/80 font-bold hover:underline">
                        Halaman Masuk
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
