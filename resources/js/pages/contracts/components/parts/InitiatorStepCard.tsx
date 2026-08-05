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
            {!isOnly && <div className="bg-emerald-500/60 absolute top-0 -bottom-8 left-[11px] w-0.5" />}
            <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500 text-white shadow-xs transition-transform duration-300">
                <Send size={11} strokeWidth={3} />
            </div>
            <div className="group relative w-fit max-w-[92%] sm:max-w-md rounded-xl border-2 border-emerald-500/60 bg-emerald-500/10 p-3.5 shadow-xs transition-all duration-300 hover:border-emerald-500/80 dark:bg-emerald-950/30">
                <div className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-emerald-500" />

                <div className="flex flex-col gap-2.5">
                    <div className="text-foreground flex flex-wrap items-center justify-between gap-1.5 pl-1">
                        <span className="text-text-main text-xs leading-tight font-semibold tracking-wide uppercase">Pengajuan Awal</span>
                        <div className="flex origin-right scale-90 items-center">
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                                SELESAI
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-surface-base/90 p-2.5 transition-all dark:bg-zinc-900/80">
                        <Avatar user={creator} size="sm" className="h-7 w-7 shadow-sm ring-2 ring-surface-base shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <span className="text-text-main truncate text-xs leading-tight font-semibold">{creator?.name}</span>
                                <Check size={12} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                {creator?.department_name && (
                                    <span className="text-text-soft truncate text-[11px] leading-none font-medium">{creator.department_name}</span>
                                )}
                                <span className="text-text-soft flex items-center gap-1 text-[11px] leading-none font-normal">
                                    <Clock size={10} /> {submittedAt || 'Sudah Diajukan'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
