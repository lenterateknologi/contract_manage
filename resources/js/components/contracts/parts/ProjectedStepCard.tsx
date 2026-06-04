import { UserProfile } from '@/types/contracts';
import { Info } from 'lucide-react';

interface ProjectedStepCardProps {
    creator: UserProfile;
}

export function ProjectedStepCard({ creator }: ProjectedStepCardProps) {
    return (
        <div className="relative flex gap-3 pb-4">
            <div className="bg-border/60 absolute top-6 bottom-0 left-[9.5px] w-0.5" />
            <div className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                <Info size={9} strokeWidth={3} />
            </div>
            <div className="group relative flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3 transition-all hover:border-slate-400 dark:bg-slate-900/20">
                <div className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-slate-300 dark:bg-slate-700" />

                <div className="flex flex-col gap-2">
                    <div className="text-foreground flex items-center justify-between pl-1">
                        <span className="text-[10px] leading-tight font-black tracking-widest text-slate-400 uppercase">Atasan Langsung</span>
                        <div className="flex origin-right scale-85 items-center">
                            <span className="rounded-full bg-slate-200/50 px-2 py-0.5 text-[8px] font-black tracking-wider text-slate-500 uppercase dark:bg-slate-800">
                                Estimasi
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white/40 p-2 dark:border-slate-800 dark:bg-slate-950/20">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-700">
                            <i className="fa-solid fa-user-clock text-[10px]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] leading-none font-bold tracking-tighter text-slate-400 uppercase italic">
                                {creator.department_id ? 'Pemeriksa Otomatis' : 'Departemen Belum Diatur'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
