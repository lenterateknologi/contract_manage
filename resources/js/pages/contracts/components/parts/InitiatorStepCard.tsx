import { cn } from '@/lib/utils';
import { UserProfile } from '@/pages/contracts/types';
import { Check, Clock, Send } from 'lucide-react';
import { Avatar } from '../ui/ui';

interface InitiatorStepCardProps {
    isOnly: boolean;
    creator: UserProfile;
    submittedAt?: string;
}

export function InitiatorStepCard({ isOnly, creator, submittedAt }: InitiatorStepCardProps) {
    return (
        <div className={cn('flex gap-3', !isOnly ? 'relative pb-4' : '')}>
            {!isOnly && <div className="bg-border/60 absolute top-6 bottom-0 left-[9.5px] w-0.5" />}
            <div className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500 text-white shadow-xs transition-transform duration-300">
                <Send size={9} strokeWidth={3} />
            </div>
            <div className="group relative flex-1 rounded-xl border border-emerald-500/20 bg-emerald-50/10 p-3 shadow-xs transition-all duration-300 hover:border-emerald-500/40 dark:bg-emerald-500/5">
                <div className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-emerald-500" />

                <div className="flex flex-col gap-2.5">
                    <div className="text-foreground flex flex-wrap items-center justify-between gap-1.5 pl-1">
                        <span className="text-text-main text-[10px] leading-tight font-semibold tracking-widest uppercase">Pengajuan Awal --ss</span>
                        <div className="flex origin-right scale-85 items-center">
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-semibold  text-emerald-600 uppercase dark:text-emerald-400">
                                SELESAI
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-white/60 p-2 transition-all dark:border-emerald-900/30 dark:bg-slate-950/40">
                        <Avatar user={creator} size="sm" className="h-6 w-6 shadow-sm ring-2 ring-white dark:ring-slate-900" />
                        <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <span className="text-text-main truncate text-[10px] leading-tight font-semibold">{creator?.name}</span>
                                <Check size={10} className="shrink-0 text-emerald-500" strokeWidth={4} />
                            </div>
                            <span className="text-text-soft mt-0.5 flex items-center gap-1 text-[8.5px] leading-none font-bold">
                                <Clock size={8} /> {submittedAt || 'Sudah Diajukan'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
