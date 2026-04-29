import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function Login({ status, canResetPassword, canTestEmail }: LoginProps) {
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
        <AuthSplitLayout 
            title="Selamat Datang!" 
            description="Masuk ke akun Anda dengan aman."
            isSuccess={wasSuccessful}
        >
            <Head title="Masuk" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-[var(--font-size-small)] font-[var(--font-weight-bold)] text-[var(--text-dark)] tracking-tight uppercase">ALAMAT EMAIL</Label>
                        <Input
                            id="email"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Alamat Email Anda"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 text-[var(--font-size-body)] text-[var(--text-dark)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[var(--font-size-small)] font-[var(--font-weight-bold)] text-[var(--text-dark)] tracking-tight uppercase">KATA SANDI</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="text-[var(--font-size-small)] font-[var(--font-weight-bold)] text-[var(--primary)] hover:text-[var(--primary-hover)]" tabIndex={5}>
                                    Lupa?
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Kata Sandi Anda"
                                className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] pr-12 px-4 text-[var(--font-size-body)] text-[var(--text-dark)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-light)]"
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember" name="remember" tabIndex={3} className="h-4 w-4 rounded-[var(--radius-sm)] border-[var(--border)] data-[state=checked]:bg-[var(--primary)]" />
                        <Label htmlFor="remember" className="text-[var(--font-size-small)] font-[var(--font-weight-medium)] text-[var(--text-light)]">Ingat saya</Label>
                    </div>

                    <Button 
                        type="submit" 
                        className="h-[48px] w-full rounded-[var(--radius-lg)] bg-[var(--primary)] text-[var(--font-size-body)] font-[var(--font-weight-bold)] text-[var(--white)] transition-all hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] active:scale-[0.98]" 
                        tabIndex={4} 
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Masuk Ke Akun
                    </Button>
                </div>

                <div className="text-center text-[var(--font-size-small)] text-[var(--text-muted)] font-[var(--font-weight-medium)]">
                    Belum punya akun?{' '}
                    <TextLink href={route('register')} className="font-[var(--font-weight-bold)] text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline" tabIndex={5}>
                        Daftar Gratis
                    </TextLink>
                </div>

                {status && <div className="mt-4 text-center text-sm font-semibold text-[var(--success)]">{status}</div>}
            </form>
        </AuthSplitLayout>
    );
}
