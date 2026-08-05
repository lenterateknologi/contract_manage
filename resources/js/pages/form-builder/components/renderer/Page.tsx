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
    isBuilder?: boolean;
}

export const Page: React.FC<PageProps> = ({
    pageNumber,
    children,
    margins = { top: 15, bottom: 15, left: 15, right: 15 },
    className,
    showMargins = false,
    isBuilder = false,
}) => {
    return (
        <div className="relative print:m-0 w-full mt-10 mb-20 last:mb-0">
            {/* Floating Page Info */}
            <div className="absolute -top-8 left-0 flex items-center gap-3 print:hidden">
                <div className="bg-primary/10 text-primary ring-primary/20 flex h-6 items-center justify-center rounded-none px-3 text-[10px] font-semibold tracking-widest uppercase ring-1">
                    Halaman {pageNumber}
                </div>
                <div className="text-muted-foreground/40 text-[9px] font-semibold tracking-tight uppercase">
                    A4 (210mm x 297mm) • Margins: {margins.top}mm {margins.right}mm {margins.bottom}mm {margins.left}mm
                </div>
            </div>

            {/* The A4 Paper Container */}
            <div
                className={cn(
                    'bg-white text-slate-900 force-light relative mx-auto flex flex-col transition-all print:m-0 print:shadow-none print:ring-0 print:border-none w-[210mm]',
                    'border-slate-300 border shadow-md my-4 rounded-none shrink-0',
                    isBuilder ? 'h-[297mm] max-h-[297mm] overflow-hidden' : 'min-h-[297mm]',
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
                        <div
                            className="pointer-events-none absolute h-4 w-4 border-t border-l border-blue-400/30 print:hidden"
                            style={{ top: `${margins.top}mm`, left: `${margins.left}mm` }}
                        />
                        {/* Top-Right Corner */}
                        <div
                            className="pointer-events-none absolute h-4 w-4 border-t border-r border-blue-400/30 print:hidden"
                            style={{ top: `${margins.top}mm`, right: `${margins.right}mm` }}
                        />
                        {/* Bottom-Left Corner */}
                        <div
                            className="pointer-events-none absolute h-4 w-4 border-b border-l border-blue-400/30 print:hidden"
                            style={{ bottom: `${margins.bottom}mm`, left: `${margins.left}mm` }}
                        />
                        {/* Bottom-Right Corner */}
                        <div
                            className="pointer-events-none absolute h-4 w-4 border-r border-b border-blue-400/30 print:hidden"
                            style={{ bottom: `${margins.bottom}mm`, right: `${margins.right}mm` }}
                        />
 
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
            {isBuilder && (
                <div className="via-border pointer-events-none absolute right-[10%] -bottom-10 left-[10%] h-px bg-gradient-to-r from-transparent to-transparent print:hidden" />
            )}
        </div>
    );
};
