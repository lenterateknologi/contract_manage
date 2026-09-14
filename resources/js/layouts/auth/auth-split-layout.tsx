import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import React, { useEffect, useState } from 'react';

interface AuthSplitLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    isSuccess?: boolean;
    image?: string;
}

const loadLottie = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="lottie-player"]')) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load lottie-player'));
        document.body.appendChild(script);
    });
};

export default function AuthSplitLayout({ children, title, description, isSuccess = false, image }: Readonly<AuthSplitLayoutProps>) {
    const { name, tagline, logo } = usePage<SharedData>().props;
    const appName = name || import.meta.env.VITE_APP_NAME || 'corixa';
    const appTagline = tagline || import.meta.env.VITE_APP_TAGLINE || 'Legal Management System';
    const appLogo = logo || import.meta.env.VITE_APP_LOGO || '/images/logo.png';

    const [isSliding, setIsSliding] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Entry animation: Gate closes to show content
        const timer = setTimeout(() => setIsSliding(false), 50);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (isSuccess || isExiting) {
            loadLottie().catch(err => console.error(err));
        }
    }, [isSuccess, isExiting]);

    const shouldPull = isSuccess || isExiting;
    const isMoving = isSliding || shouldPull;

    // Directional transforms using cubic-bezier for premium mechanical feel
    const leftTransform = isMoving ? '-translate-x-full' : 'translate-x-0';
    const rightTransform = isMoving ? 'translate-x-full' : 'translate-x-0';

    return (
        <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-surface-muted dark:bg-background text-text-main">
            {/* Split Screen Container */}
            <div className="flex min-h-svh w-full overflow-hidden">
                {/* Left Panel: Form Content - Using Theme Colors with Soft Ambient Gradients */}
                <div
                    className={cn(
                        'cubic-bezier(0.23, 1, 0.32, 1) fixed inset-y-0 left-0 z-40 flex w-full flex-col items-center justify-center overflow-hidden border-r border-surface-border bg-surface-base shadow-xl transition-all duration-[800ms] md:w-1/2',
                        leftTransform,
                    )}
                >
                    {/* Soft Multi-layered Ambient Glows (Halus & Elegan) */}
                    <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-[110px]" />
                    <div className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-to-tl from-indigo-400/10 via-blue-400/5 to-transparent blur-[110px] dark:from-primary/20" />
                    <div className="pointer-events-none absolute top-1/2 -left-16 h-72 w-72 -translate-y-1/2 rounded-full bg-sky-300/10 blur-[90px] dark:bg-sky-500/10" />

                    {/* Clean decorative continuous concentric rings - subtle */}
                    <svg className="pointer-events-none absolute -top-12 -right-12 h-80 w-80 stroke-primary/10 dark:stroke-white/5" fill="none" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="45" strokeWidth="1" />
                        <circle cx="100" cy="100" r="75" strokeWidth="0.75" />
                        <circle cx="100" cy="100" r="105" strokeWidth="0.5" />
                    </svg>

                    {/* Bottom subtle accent wave/arc */}
                    <svg className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 stroke-indigo-400/10 dark:stroke-primary/10" fill="none" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="60" strokeWidth="0.75" />
                        <circle cx="100" cy="100" r="90" strokeWidth="0.5" />
                    </svg>
                    
                    {/* Main Content Area - Vertically Centered and High-Density */}
                    <div className="relative z-10 w-full max-w-[380px] p-6 md:max-w-[480px] lg:p-8">
                        {/* App Logo */}
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 p-2 shadow-xs ring-1 ring-primary/15 backdrop-blur-md dark:bg-primary/20 dark:ring-primary/30">
                                <img
                                    src={appLogo}
                                    alt={`${appName} Logo`}
                                    className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base leading-none font-bold tracking-tight text-text-main">{appName}</span>
                                <span className="mt-1 text-[10px] leading-none font-medium text-text-desc">{appTagline}</span>
                            </div>
                        </div>

                        <div className="mb-8 space-y-1.5 text-center md:text-left">
                            <h1 className="text-2xl leading-tight font-bold tracking-tight text-text-main">{title || 'Selamat Datang!'}</h1>
                            <p className="text-sm leading-normal font-medium text-text-desc">
                                {description || 'Silakan lengkapi data Anda untuk melanjutkan.'}
                            </p>
                        </div>

                        <div className="compact-form-container">{children}</div>
                    </div>
                </div>

                {/* Right Panel: Fullscreen Visual Mockup with Soft Ambient Glow */}
                <div
                    className={cn(
                        'cubic-bezier(0.23, 1, 0.32, 1) fixed inset-y-0 right-0 z-40 hidden flex-col items-center justify-center overflow-hidden border-l border-zinc-800 bg-zinc-950 transition-transform duration-[1000ms] md:flex md:w-1/2',
                        rightTransform,
                    )}
                >
                    <img
                        src={image || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1920&q=80'}
                        alt="CMS Dashboard"
                        className="h-full w-full object-cover object-left opacity-90 transition-opacity duration-700 hover:opacity-100"
                    />
                    
                    {/* Soft gradient ambient lighting */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-96 w-96 rounded-full bg-gradient-to-bl from-primary/25 via-indigo-600/15 to-transparent blur-[120px]" />
                    <div className="pointer-events-none absolute -bottom-10 left-10 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-600/20 via-cyan-500/10 to-transparent blur-[120px]" />

                    {/* Atmospheric Dark Charcoal Gradient Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/45 to-zinc-950/15" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                </div>
            </div>

            {/* Success/Navigation Overlay - High Contrast */}
            {(isSuccess || isExiting) && (
                <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-[4px]">
                    <div className="animate-in zoom-in fade-in flex flex-col items-center gap-6 transition-all duration-300">
                        {/* Lottie Animation Player */}
                        <div className="relative flex h-32 w-32 items-center justify-center">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: '<lottie-player src="/assets/lottie/loading.json" background="transparent" speed="1.2" style="width: 160px; height: 160px;" loop autoplay></lottie-player>',
                                }}
                            />
                        </div>
                        <span className="text-sm font-bold tracking-[0.4em] text-text-main uppercase">{isSuccess ? 'BERHASIL MASUK' : 'MEMUAT'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
