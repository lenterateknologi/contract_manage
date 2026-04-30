import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/ui/base/InputError';
import TextLink from '@/components/ui/base/TextLink';
import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

interface RegisterForm {
    [key: string]: any;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
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
        >
            <Head title="Daftar" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="font-[var(--font-weight-bold)] tracking-tight text-[var(--font-size-small)] uppercase">
                            Nama Lengkap
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Nama Lengkap Anda"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-[var(--font-weight-bold)] tracking-tight uppercase">
                            Alamat Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password" className="font-[var(--font-weight-bold)] tracking-tight uppercase">
                            Kata Sandi
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Min 8 Karakter"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation" className="font-[var(--font-weight-bold)] tracking-tight uppercase">
                            Konfirmasi
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Masukkan Kembali"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button
                        type="submit"
                        className="h-[48px] w-full rounded-[var(--radius-lg)] bg-[var(--primary)] font-[var(--font-weight-bold)] transition-all hover:bg-[var(--primary-hover)] active:scale-[0.98] active:bg-[var(--primary-active)]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Buat Akun Baru
                    </Button>
                </div>

                <div className="text-center font-[var(--font-weight-medium)] text-[var(--font-size-small)]">
                    Sudah punya akun?{' '}
                    <TextLink
                        href={route('login')}
                        className="font-[var(--font-weight-bold)] text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                    >
                        Masuk Disini
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
