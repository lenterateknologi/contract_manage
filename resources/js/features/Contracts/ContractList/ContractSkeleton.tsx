import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import React from 'react';

export function ContractTableSkeleton({ message = 'Memuat data kontrak...' }: { rows?: number; message?: string }) {
    return (
        <div className="flex h-full min-h-[360px] w-full flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <LoadingLottie width={110} height={110} />
            <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-text-main">{message}</p>
                <p className="text-[11px] text-text-desc">Menyiapkan daftar dan status kontrak terbaru</p>
            </div>
        </div>
    );
}

export function ContractCardSkeleton({ message = 'Memuat data kontrak...' }: { message?: string }) {
    return (
        <div className="flex h-full min-h-[360px] w-full flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <LoadingLottie width={110} height={110} />
            <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-text-main">{message}</p>
                <p className="text-[11px] text-text-desc">Menyiapkan tampilan kartu kontrak</p>
            </div>
        </div>
    );
}

export default ContractTableSkeleton;
