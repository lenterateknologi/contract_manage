import { cn } from '@/lib/utils';
import * as React from 'react';

/**
 * MasterPageLayout
 * ─────────────────
 * Outer wrapper shared by ALL master-data / list pages.
 * Provides consistent full-height page background, gap, and inner padding
 * so FloatingPanel children never stick to the edges.
 *
 * Usage:
 *   <MasterPageLayout>
 *     <FloatingPanel>…left sidebar…</FloatingPanel>
 *     <FloatingPanel className="flex-1">…main content…</FloatingPanel>
 *     <FloatingPanel>…right filter…</FloatingPanel>
 *   </MasterPageLayout>
 */
interface MasterPageLayoutProps {
    children: React.ReactNode;
    className?: string;
    /**
     * padded (default: true)
     * Controls inner padding. p-3 gives consistent breathing room on all sides
     * so panels never stick to viewport edges.
     * Pass false only when the page manages its own padding.
     */
    padded?: boolean;
}

export function MasterPageLayout({ children, className, padded = true }: MasterPageLayoutProps) {
    return (
        <div
            className={cn(
                'flex h-[calc(100svh-76px)] overflow-hidden bg-slate-100/60 dark:bg-zinc-950 w-full gap-2',
                padded && 'p-3',
                className,
            )}
        >
            {children}
        </div>
    );
}
