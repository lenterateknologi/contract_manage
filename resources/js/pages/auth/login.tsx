import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/ui/base/InputError';
import TextLink from '@/components/ui/base/TextLink';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canTestEmail?: boolean;
}

export default function Login({ status, canResetPassword }: Readonly<LoginProps>) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthSplitLayout title="Selamat Datang!" description="Masuk ke akun Anda dengan aman." isSuccess={wasSuccessful}>
            <Head title="Masuk" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-[var(--font-weight-bold)] tracking-tight text-[var(--font-size-small)] uppercase">
                            ALAMAT EMAIL
                        </Label>
                        <Input
                            id="email"
                            type="text"
                            required
                            autoFocus
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Alamat Email Anda"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 text-[var(--font-size-body)] transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="password"
                                className="font-[var(--font-weight-bold)] tracking-tight text-[var(--font-size-small)] uppercase"
                            >
                                KATA SANDI
                            </Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="font-[var(--font-weight-bold)] text-[var(--font-size-small)] hover:text-[var(--primary-hover)]"
                                >
                                    Lupa?
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Kata Sandi Anda"
                                className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 pr-12 text-[var(--font-size-body)] transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-light)]"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            className="h-4 w-4 rounded-[var(--radius-sm)] border-[var(--border)] data-[state=checked]:bg-[var(--primary)]"
                        />
                        <Label htmlFor="remember" className="font-[var(--font-weight-medium)] text-[var(--font-size-small)]">
                            Ingat saya
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="h-[48px] w-full rounded-[var(--radius-lg)] bg-[var(--primary)] font-[var(--font-weight-bold)] text-[var(--font-size-body)] transition-all hover:bg-[var(--primary-hover)] active:scale-[0.98] active:bg-[var(--primary-active)]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Masuk Ke Akun
                    </Button>
                </div>

                <div className="text-center font-[var(--font-weight-medium)] text-[var(--font-size-small)]">
                    Belum punya akun?{' '}
                    <TextLink
                        href={route('register')}
                        className="font-[var(--font-weight-bold)] text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                    >
                        Daftar Gratis
                    </TextLink>
                </div>

                {status && <div className="mt-4 text-center text-sm font-semibold text-[var(--success)]">{status}</div>}
            </form>
        </AuthSplitLayout>
    );
}
