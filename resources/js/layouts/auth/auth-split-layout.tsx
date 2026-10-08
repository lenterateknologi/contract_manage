import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface AuthSplitLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    isSuccess?: boolean;
    successText?: string;
    image?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
    isSuccess = false,
    successText = 'BERHASIL MASUK',
    image,
}: Readonly<AuthSplitLayoutProps>) {
    const { name, tagline, logo } = usePage<SharedData>().props;
    const appName = name || import.meta.env.VITE_APP_NAME || 'corixa';
    const appTagline = tagline || import.meta.env.VITE_APP_TAGLINE || 'Legal Management System';
    const appLogo = logo || import.meta.env.VITE_APP_LOGO || '/images/logo.png';

    return (
        <div className="bg-surface-muted dark:bg-background text-text-main relative flex min-h-svh w-full items-center justify-center overflow-hidden">
            {/* Split Screen Container */}
            <div className="flex min-h-svh w-full overflow-hidden">
                {/* Left Panel: Form Content */}
                <div className="border-surface-border bg-surface-base fixed inset-y-0 left-0 z-40 flex w-full flex-col items-center justify-center overflow-hidden border-r shadow-xl md:w-1/2">
                    {/* Soft Ambient Glows */}
                    <div className="from-primary/15 via-primary/5 pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br to-transparent blur-[110px]" />
                    <div className="dark:from-primary/20 pointer-events-none absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full bg-gradient-to-tl from-indigo-400/10 via-blue-400/5 to-transparent blur-[110px]" />
                    <div className="pointer-events-none absolute top-1/2 -left-16 h-72 w-72 -translate-y-1/2 rounded-full bg-sky-300/10 blur-[90px] dark:bg-sky-500/10" />

                    {/* Main Content Area */}
                    <div className="relative z-10 w-full max-w-[380px] p-6 md:max-w-[480px] lg:p-8">
                        {/* App Logo */}
                        <div className="mb-6 flex items-center gap-3">
                            <div className="bg-primary/10 ring-primary/15 dark:bg-primary/20 dark:ring-primary/30 flex size-11 items-center justify-center rounded-2xl p-2 shadow-xs ring-1 backdrop-blur-md">
                                <img src={appLogo} alt={`${appName} Logo`} className="h-7 w-auto object-contain dark:brightness-0 dark:invert" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-text-main text-base leading-none font-bold tracking-tight">{appName}</span>
                                <span className="text-text-desc mt-1 text-[10px] leading-none font-medium">{appTagline}</span>
                            </div>
                        </div>

                        <div className="mb-8 space-y-1.5 text-center md:text-left">
                            <h1 className="text-text-main text-2xl leading-tight font-bold tracking-tight">{title || 'Selamat Datang!'}</h1>
                            <p className="text-text-desc text-sm leading-normal font-medium">
                                {description || 'Silakan lengkapi data Anda untuk melanjutkan.'}
                            </p>
                        </div>

                        <div className="compact-form-container">{children}</div>
                    </div>
                </div>

                {/* Right Panel: Fullscreen Visual Mockup */}
                <div className="fixed inset-y-0 right-0 z-40 hidden flex-col items-center justify-center overflow-hidden border-l border-zinc-800 bg-zinc-950 md:flex md:w-1/2">
                    <img
                        src={image || '/images/auth-bg.jpg'}
                        alt="CMS Dashboard"
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-left opacity-90 transition-opacity duration-700 hover:opacity-100"
                    />

                    {/* Ambient Glows */}
                    <div className="from-primary/25 pointer-events-none absolute -top-10 -right-10 h-96 w-96 rounded-full bg-gradient-to-bl via-indigo-600/15 to-transparent blur-[120px]" />
                    <div className="pointer-events-none absolute -bottom-10 left-10 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-600/20 via-cyan-500/10 to-transparent blur-[120px]" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/45 to-zinc-950/15" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                </div>
            </div>

            {/* Success Overlay */}
            {isSuccess && (
                <div className="bg-background/60 pointer-events-none fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xs">
                    <div className="animate-in zoom-in fade-in flex flex-col items-center gap-4 transition-all duration-300">
                        <Loader2 className="text-primary size-10 animate-spin" />
                        <span className="text-text-main text-xs font-bold tracking-[0.3em] uppercase">{successText}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
