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
        <div className="relative mb-12 last:mb-0 print:m-0">
            {/* Page Number Indicator (Visual only) */}
            <div className="absolute top-0 -left-12 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-500 shadow-sm print:hidden">
                {pageNumber}
            </div>

            {/* The A4 Paper */}
            <div
                className={cn(
                    'relative mx-auto flex flex-col bg-white text-black shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-slate-200 transition-all print:m-0 print:shadow-none print:ring-0',
                    'h-[297mm] w-[210mm] overflow-hidden', // Fixed A4 Size
                    className,
                )}
                style={{
                    paddingTop: `${margins.top}mm`,
                    paddingBottom: `${margins.bottom}mm`,
                    paddingLeft: `${margins.left}mm`,
                    paddingRight: `${margins.right}mm`,
                }}
            >
                {/* Margin Visual Guides */}
                {showMargins && (
                    <div
                        className="pointer-events-none absolute inset-0 border border-dashed border-blue-200 opacity-50 print:hidden"
                        style={{
                            top: `${margins.top}mm`,
                            bottom: `${margins.bottom}mm`,
                            left: `${margins.left}mm`,
                            right: `${margins.right}mm`,
                        }}
                    />
                )}

                <div className="relative flex-1">{children}</div>
            </div>

            {/* Page Limit Marker (Visual only) */}
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 border-b border-dashed border-slate-200" />
        </div>
    );
};
