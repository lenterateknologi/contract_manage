import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
                        <Label htmlFor="name" className="text-[var(--font-size-small)] font-[var(--font-weight-bold)] text-[var(--text-dark)] tracking-tight uppercase">Nama Lengkap</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Nama Lengkap Anda"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 text-[var(--font-size-body)] text-[var(--text-dark)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-[var(--font-size-small)] font-[var(--font-weight-bold)] text-[var(--text-dark)] tracking-tight uppercase">Alamat Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 text-[var(--font-size-body)] text-[var(--text-dark)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-[var(--font-size-small)] font-[var(--font-weight-bold)] text-[var(--text-dark)] tracking-tight uppercase">Kata Sandi</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Min 8 Karakter"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 text-[var(--font-size-body)] text-[var(--text-dark)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation" className="text-[var(--font-size-small)] font-[var(--font-weight-bold)] text-[var(--text-dark)] tracking-tight uppercase">Konfirmasi</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Masukkan Kembali"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 text-[var(--font-size-body)] text-[var(--text-dark)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button 
                        type="submit" 
                        className="h-[48px] w-full rounded-[var(--radius-lg)] bg-[var(--primary)] text-[var(--font-size-body)] font-[var(--font-weight-bold)] text-[var(--white)] transition-all hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] active:scale-[0.98]" 
                        tabIndex={5} 
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Buat Akun Baru
                    </Button>
                </div>

                <div className="text-center text-[var(--font-size-small)] text-[var(--text-muted)] font-[var(--font-weight-medium)]">
                    Sudah punya akun?{' '}
                    <TextLink href={route('login')} className="font-[var(--font-weight-bold)] text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline" tabIndex={6}>
                        Masuk Disini
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
