import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { Label } from '@/components/ui/forms/Label';
import TextLink from '@/components/ui/navigation/TextLink';
import { FormInput } from '@/components/ui/inputs/FormInput';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { AuthErrorAlert } from './components/AuthErrorAlert';
import { PasswordField } from './components/PasswordField';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: Readonly<LoginProps>) {
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
                <AuthErrorAlert errors={errors} title="Gagal Masuk" />

                <div className="grid gap-5">
                    <FormInput
                        id="email"
                        label="Email atau Username"
                        type="text"
                        required
                        autoFocus
                        autoComplete="username"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Email atau username Anda"
                        error={errors.email}
                        className="rounded-xl"
                    />

                    <PasswordField
                        id="password"
                        label="Kata Sandi"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Kata sandi Anda"
                        error={errors.password}
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                name="remember"
                                className="text-primary focus:ring-primary h-4 w-4 rounded border-slate-300 bg-white"
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', !!checked)}
                            />
                            <Label htmlFor="remember" className="cursor-pointer text-sm font-medium text-text-desc select-none">
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

                {status && <div className="mt-4 text-center text-sm font-semibold text-emerald-600">{status}</div>}
            </form>
        </AuthSplitLayout>
    );
}
