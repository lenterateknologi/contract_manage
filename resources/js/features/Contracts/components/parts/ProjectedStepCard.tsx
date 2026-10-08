import { UserProfile } from '@/features/Contracts/types';
import { Info } from 'lucide-react';

interface ProjectedStepCardProps {
    creator: UserProfile;
}

export function ProjectedStepCard({ creator }: ProjectedStepCardProps) {
    return (
        <div className="relative flex gap-3 pb-4">
            <div className="bg-surface-border absolute top-6 bottom-0 left-[11px] w-0.5" />
            <div className="border-surface-border bg-surface-muted text-text-soft relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border shadow-2xs">
                <Info size={11} strokeWidth={3} />
            </div>
            <div className="group border-surface-border bg-surface-muted/30 hover:bg-surface-muted/50 relative flex-1 rounded-xl border border-dashed p-3.5 transition-all">
                <div className="bg-surface-border absolute top-3 bottom-3 left-0 w-1 rounded-r-full" />

                <div className="flex flex-col gap-2">
                    <div className="text-foreground flex items-center justify-between pl-1">
                        <span className="text-text-soft text-xs leading-tight font-extrabold tracking-wide uppercase">Atasan Langsung</span>
                        <div className="flex origin-right scale-90 items-center">
                            <span className="bg-surface-muted text-text-soft border-surface-border rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase">
                                Estimasi
                            </span>
                        </div>
                    </div>

                    <div className="border-surface-border bg-surface-base/80 flex items-center gap-3 rounded-lg border border-dashed p-2.5">
                        <div className="bg-surface-muted text-text-soft flex h-7 w-7 items-center justify-center rounded-full">
                            <i className="fa-solid fa-user-clock text-xs" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-text-main text-xs leading-none font-bold tracking-tight uppercase">
                                {creator.department_id ? 'Pemeriksa Otomatis' : 'Departemen Belum Diatur'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
