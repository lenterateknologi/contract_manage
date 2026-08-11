import { cn } from '@/lib/utils';
import * as React from 'react';

/**
 * FloatingPanel
 * ─────────────
 * Reusable floating card panel used inside MasterPageLayout.
 * Provides consistent rounded card look: border, bg, overflow-hidden.
 *
 * Usage:
 *   <FloatingPanel>…left sidebar content…</FloatingPanel>
 *   <FloatingPanel className="flex-1 min-w-0">…main content…</FloatingPanel>
 *   <FloatingPanel padded>…right filter sidebar…</FloatingPanel>
 */
interface FloatingPanelProps {
    children: React.ReactNode;
    className?: string;
    /** Add p-4 inner padding */
    padded?: boolean;
    /** Make card shrink-0 (default for sidebars) */
    shrink?: boolean;
    /** Additional inline style */
    style?: React.CSSProperties;
}

export function FloatingPanel({
    children,
    className,
    padded = false,
    shrink = false,
    style,
}: FloatingPanelProps) {
    return (
        <div
            style={style}
            className={cn(
                'rounded-2xl border border-border bg-card dark:bg-zinc-900/95 overflow-hidden',
                padded && 'p-4',
                shrink && 'shrink-0',
                className,
            )}
        >
            {children}
        </div>
    );
}
