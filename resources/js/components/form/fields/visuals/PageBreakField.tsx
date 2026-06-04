import { cn } from '@/lib/utils';
import { Scissors } from 'lucide-react';
import React from 'react';

export const PageBreakField: React.FC<{ isBuilder?: boolean }> = ({ isBuilder }) => {
    return (
        <div className={cn('my-4 w-full print:my-0', isBuilder ? 'relative py-4' : 'h-0 overflow-hidden')}>
            {isBuilder && (
                <div className="flex items-center gap-3 opacity-60 transition-opacity hover:opacity-100">
                    <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
                    <div className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[9px] font-semibold text-white uppercase shadow-sm">
                        <Scissors size={10} />
                        Halaman Baru Mulai Di Sini
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
                </div>
            )}
            {!isBuilder && <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />}
        </div>
    );
};
