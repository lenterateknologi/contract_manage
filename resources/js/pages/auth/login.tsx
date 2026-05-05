import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { Input } from '@/components/ui/base/Input';
import InputError from '@/components/ui/base/InputError';
import { Label } from '@/components/ui/base/Label';
import TextLink from '@/components/ui/base/TextLink';
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
                {(Object.keys(errors).length > 0) && (
                    <div className="rounded-xl bg-red-50 p-4 border border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-3">
                            <div className="size-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">!</div>
                            <div>
                                <h3 className="text-xs font-bold text-red-900 leading-none mb-1">Gagal Masuk</h3>
                                <div className="text-[11px] text-red-700/80 font-medium">
                                    {errors.email || errors.password || Object.values(errors)[0]}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                            Alamat Email
                        </Label>
                        <Input
                            id="email"
                            type="text"
                            required
                            autoFocus
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Alamat email Anda"
                            className="focus:border-primary focus:ring-primary h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition-all focus:ring-1"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                Kata Sandi
                            </Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Kata sandi Anda"
                                className="focus:border-primary focus:ring-primary h-11 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 transition-all focus:ring-1"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                name="remember"
                                className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300 bg-white"
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', !!checked)}
                            />
                            <Label htmlFor="remember" className="cursor-pointer text-sm font-medium text-slate-600 select-none">
                                Ingat saya
                            </Label>
                        </div>
                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="text-primary hover:text-primary/80 text-sm font-medium">
                                Lupa sandi?
                            </TextLink>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Masuk ke Akun
                    </Button>
                </div>

                <div className="text-center text-sm font-medium text-slate-600">
                    Belum punya akun?{' '}
                    <TextLink href={route('register')} className="text-primary hover:text-primary/80 font-bold hover:underline">
                        Daftar gratis
                    </TextLink>
                </div>

                {status && <div className="mt-4 text-center text-sm font-semibold text-emerald-600">{status}</div>}
            </form>
        </AuthSplitLayout>
    );
}
