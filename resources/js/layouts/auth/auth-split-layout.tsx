import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

// Import the generated mockup image
import cmsMockup from '../../../../../../../../.gemini/antigravity/brain/77afdc7b-862e-4047-af9f-554820df3e2f/cms_dashboard_mockup_1777367947628.png';

interface AuthSplitLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    isSuccess?: boolean;
    image?: string;
}

export default function AuthSplitLayout({ children, title, description, isSuccess = false, image }: Readonly<AuthSplitLayoutProps>) {
    const [isSliding, setIsSliding] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    const onAnimationEnd = (url: URL, visit: any) => {
        router.visit(url, {
            ...visit,
            onStart: () => {}, // Clear interceptor loop
        });
    };

    const handleNavigation = (event: any) => {
        // If it's an external link or already exiting, don't intercept
        if (isExiting || event.detail.visit.url.origin !== globalThis.location.origin) return;

        // Prevent immediate navigation
        event.preventDefault();

        // Trigger exit animation (Gate opens)
        setIsExiting(true);

        // Wait for the animation to finish (850ms) then perform the visit
        setTimeout(() => onAnimationEnd(event.detail.visit.url, event.detail.visit), 850);
    };

    useEffect(() => {
        // Entry animation: Gate closes to show content
        const timer = setTimeout(() => setIsSliding(false), 50);

        // Intercept navigation to ensure exit animation plays fully before switching pages
        const unbind = router.on('before', handleNavigation);

        return () => {
            clearTimeout(timer);
            unbind();
        };
    }, [isExiting, handleNavigation]);

    const shouldPull = isSuccess || isExiting;
    const isMoving = isSliding || shouldPull;

    // Directional transforms using cubic-bezier for premium mechanical feel
    const leftTransform = isMoving ? '-translate-x-full' : 'translate-x-0';
    const rightTransform = isMoving ? 'translate-x-full' : 'translate-x-0';

    return (
        <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[var(--background)] font-sans text-[var(--text-dark)]">
            {/* Split Screen Container */}
            <div className="flex min-h-svh w-full overflow-hidden">
                {/* Left Panel: Form Content - Using Theme Colors */}
                <div
                    className={cn(
                        'cubic-bezier(0.23, 1, 0.32, 1) fixed inset-y-0 left-0 z-40 flex w-full flex-col items-center justify-center border-r border-[var(--border)] bg-[var(--white)] shadow-[var(--shadow-xl)] transition-all duration-[800ms] md:w-1/2',
                        leftTransform,
                    )}
                >
                    {/* Main Content Area - Vertically Centered and High-Density */}
                    <div className="w-full max-w-[380px] p-6 md:max-w-[480px] lg:p-8">
                        <div className="mb-8 space-y-1.5 text-center md:text-left">
                            <h1 className="leading-[var(--line-height-heading)] font-[var(--font-weight-bold)] tracking-tight text-[var(--font-size-h1)]">
                                {title || 'Selamat Datang!'}
                            </h1>
                            <p className="leading-[var(--line-height-body)] font-[var(--font-weight-medium)] text-[var(--font-size-small)]">
                                {description || 'Silakan lengkapi data Anda untuk melanjutkan.'}
                            </p>
                        </div>

                        <div className="compact-form-container">{children}</div>
                    </div>
                </div>

                {/* Right Panel: Fullscreen Visual Mockup */}
                <div
                    className={cn(
                        'cubic-bezier(0.23, 1, 0.32, 1) fixed inset-y-0 right-0 z-40 hidden flex-col items-center justify-center overflow-hidden border-l border-[var(--primary-active)] bg-[var(--primary-active)] transition-transform duration-[1000ms] md:flex md:w-1/2',
                        rightTransform,
                    )}
                >
                    {/* Fullscreen Sample Image */}
                    <img
                        src={image || cmsMockup}
                        alt="CMS Dashboard"
                        className="h-full w-full object-cover object-left opacity-90 transition-opacity duration-700 hover:opacity-100"
                    />
                    {/* Professional Blue Gradient Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--primary-active)]/50 to-transparent" />
                </div>
            </div>

            {/* Success/Navigation Overlay - High Contrast */}
            {(isSuccess || isExiting) && (
                <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[var(--white)]/40 backdrop-blur-[4px]">
                    <div className="animate-in zoom-in fade-in flex flex-col items-center gap-6 transition-all duration-[var(--transition-slow)]">
                        {/* Lottie Animation Player */}
                        <div className="relative flex h-32 w-32 items-center justify-center">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: '<lottie-player src="/assets/lottie/loading.json" background="transparent" speed="1.2" style="width: 160px; height: 160px;" loop autoplay></lottie-player>',
                                }}
                            />
                        </div>
                        <span className="font-[var(--font-weight-bold)] tracking-[0.4em] text-[var(--font-size-small)] uppercase">
                            {isSuccess ? 'BERHASIL MASUK' : 'MEMUAT'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
