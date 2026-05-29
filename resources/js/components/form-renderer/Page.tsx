import { cn } from '@/lib/utils';
import React from 'react';

interface PageProps {
    pageNumber: number;
    children: React.ReactNode;
    margins?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    className?: string;
    showMargins?: boolean;
}

export const Page: React.FC<PageProps> = ({
    pageNumber,
    children,
    margins = { top: 15, bottom: 15, left: 15, right: 15 },
    className,
    showMargins = false,
}) => {
    return (
        <div className="relative mb-20 last:mb-0 print:m-0">
            {/* Floating Page Info */}
            <div className="absolute -top-8 left-0 flex items-center gap-3 print:hidden">
                <div className="bg-primary/10 text-primary flex h-6 items-center justify-center rounded-full px-3 text-[10px] font-semibold uppercase tracking-widest shadow-sm ring-1 ring-primary/20">
                    Halaman {pageNumber}
                </div>
                <div className="text-muted-foreground/40 text-[9px] font-semibold uppercase tracking-tight">
                    A4 (210mm x 297mm) • Margins: {margins.top}mm {margins.right}mm {margins.bottom}mm {margins.left}mm
                </div>
            </div>

            {/* The A4 Paper Container */}
            <div
                className={cn(
                    'relative mx-auto flex flex-col bg-card text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.2)] border border-border transition-all print:m-0 print:shadow-none print:ring-0',
                    'h-[297mm] w-[210mm] overflow-hidden shrink-0', // Fixed A4 Size
                    className,
                )}
                style={{
                    paddingTop: `${margins.top}mm`,
                    paddingBottom: `${margins.bottom}mm`,
                    paddingLeft: `${margins.left}mm`,
                    paddingRight: `${margins.right}mm`,
                }}
            >
                {/* Margin Visual Guides (Professional L-Corners) */}
                {showMargins && (
                    <>
                        {/* Top-Left Corner */}
                        <div className="pointer-events-none absolute h-4 w-4 border-t border-l border-blue-400/30 print:hidden"
                             style={{ top: `${margins.top}mm`, left: `${margins.left}mm` }} />
                        {/* Top-Right Corner */}
                        <div className="pointer-events-none absolute h-4 w-4 border-t border-r border-blue-400/30 print:hidden"
                             style={{ top: `${margins.top}mm`, right: `${margins.right}mm` }} />
                        {/* Bottom-Left Corner */}
                        <div className="pointer-events-none absolute h-4 w-4 border-b border-l border-blue-400/30 print:hidden"
                             style={{ bottom: `${margins.bottom}mm`, left: `${margins.left}mm` }} />
                        {/* Bottom-Right Corner */}
                        <div className="pointer-events-none absolute h-4 w-4 border-b border-r border-blue-400/30 print:hidden"
                             style={{ bottom: `${margins.bottom}mm`, right: `${margins.right}mm` }} />

                        {/* Dashed Margin Lines */}
                        <div
                            className="pointer-events-none absolute inset-0 border border-dashed border-blue-200/20 print:hidden"
                            style={{
                                top: `${margins.top}mm`,
                                bottom: `${margins.bottom}mm`,
                                left: `${margins.left}mm`,
                                right: `${margins.right}mm`,
                            }}
                        />
                    </>
                )}

                <div className="relative z-10 flex-1">{children}</div>
            </div>

            {/* Page Separator Shadow */}
            <div className="pointer-events-none absolute -bottom-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-border to-transparent print:hidden" />
        </div>
    );
};
