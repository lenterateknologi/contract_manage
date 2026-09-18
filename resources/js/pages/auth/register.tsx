import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import TextLink from '@/components/ui/navigation/TextLink';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { AuthErrorAlert } from './components/AuthErrorAlert';
import { PasswordField } from './components/PasswordField';

interface RegisterForm {
    [key: string]: any;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthSplitLayout
            title="Daftar Akun"
            description="Lengkapi data untuk memulai."
            image="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=1200"
            isSuccess={wasSuccessful}
        >
            <Head title="Daftar" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <AuthErrorAlert errors={errors} title="Gagal Mendaftar" />

                <div className="grid gap-5">
                    <FormInput
                        id="name"
                        label="Nama Lengkap"
                        type="text"
                        required
                        autoFocus
                        autoComplete="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        disabled={processing}
                        placeholder="Nama Lengkap Anda"
                        error={errors.name}
                        className="rounded-xl"
                    />

                    <FormInput
                        id="email"
                        label="Alamat Email"
                        type="email"
                        required
                        autoComplete="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        disabled={processing}
                        placeholder="email@example.com"
                        error={errors.email}
                        className="rounded-xl"
                    />

                    <PasswordField
                        id="password"
                        label="Kata Sandi"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        disabled={processing}
                        placeholder="Min 8 Karakter"
                        error={errors.password}
                        autoComplete="new-password"
                    />

                    <PasswordField
                        id="password_confirmation"
                        name="password_confirmation"
                        label="Konfirmasi Kata Sandi"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        disabled={processing}
                        placeholder="Masukkan Kembali"
                        error={errors.password_confirmation}
                        autoComplete="new-password"
                    />

                    <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Buat Akun Baru
                    </Button>
                </div>

                <div className="text-center text-sm font-medium">
                    Sudah punya akun?{' '}
                    <TextLink
                        href={route('login')}
                        className="font-bold text-primary hover:text-primary/80 hover:underline"
                    >
                        Masuk Disini
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
