import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { Label } from '@/components/ui/forms/Label';
import TextLink from '@/components/ui/navigation/TextLink';
import { FormInput } from '@/components/ui/inputs/FormInput';
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
                {Object.keys(errors).length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-red-200 bg-red-50 p-4 duration-300">
                        <div className="flex gap-3">
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                !
                            </div>
                            <div>
                                <h3 className="mb-1 text-xs leading-none font-bold text-red-900">Gagal Masuk</h3>
                                <div className="text-[11px] font-medium text-red-700/80">
                                    {errors.email || errors.password || Object.values(errors)[0]}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="grid gap-5">
                    <FormInput
                        id="email"
                        label="Alamat Email"
                        type="email"
                        required
                        autoFocus
                        autoComplete="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Alamat email Anda"
                        error={errors.email}
                        className="rounded-xl"
                    />

                    <div className="grid gap-2">
                        <div className="relative">
                            <FormInput
                                id="password"
                                label="Kata Sandi"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Kata sandi Anda"
                                error={errors.password}
                                className="rounded-xl pr-12"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-10 right-4 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
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
                        className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
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
