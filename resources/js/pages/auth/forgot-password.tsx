// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import InputError from '@/components/ui/base/InputError';
import { Label } from '@/components/ui/base/Label';
import TextLink from '@/components/ui/base/TextLink';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

export default function ForgotPassword({ status }: Readonly<{ status?: string }>) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthSplitLayout
            title="Lupa Kata Sandi"
            description="Masukkan email untuk tautan atur ulang."
            image="https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&q=80&w=1200"
        >
            <Head title="Lupa Kata Sandi" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                {status && <div className="mb-4 text-center font-[var(--font-weight-bold)] text-[var(--font-size-small)]">{status}</div>}

                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label
                            htmlFor="email"
                            className="text-[length:var(--font-size-small)] font-[var(--font-weight-bold)] tracking-tight text-[color:var(--text-dark)] uppercase"
                        >
                            Alamat Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="off"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            className="h-[48px] rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--white)] px-4 text-[var(--font-size-body)] transition-all focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <Button
                        type="submit"
                        className="h-[48px] w-full rounded-[var(--radius-lg)] bg-[var(--primary)] font-[var(--font-weight-bold)] text-[var(--font-size-body)] transition-all hover:bg-[var(--primary-hover)] active:scale-[0.98] active:bg-[var(--primary-active)]"
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Kirim Tautan Atur Ulang
                    </Button>
                </div>

                <div className="text-center font-[var(--font-weight-medium)] text-[var(--font-size-small)]">
                    Atau, kembali ke{' '}
                    <TextLink
                        href={route('login')}
                        className="font-[var(--font-weight-bold)] text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                    >
                        Halaman Masuk
                    </TextLink>
                </div>
            </form>
        </AuthSplitLayout>
    );
}
