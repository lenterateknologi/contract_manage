import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-[var(--background)] flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--white)] shadow-[var(--shadow-sm)] border border-[var(--border)] overflow-hidden">
                                <AppLogoIcon className="size-8 fill-[var(--primary)]" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>
 
                        <div className="space-y-2 text-center">
                            <h1 className="text-[var(--font-size-h2)] font-[var(--font-weight-bold)] text-[var(--text-dark)] tracking-tight">{title}</h1>
                            <p className="text-[var(--text-light)] text-center text-[var(--font-size-body)] max-w-[280px]">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
