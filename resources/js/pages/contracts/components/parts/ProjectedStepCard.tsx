import { UserProfile } from '@/pages/contracts/types';
import { Info } from 'lucide-react';

interface ProjectedStepCardProps {
    creator: UserProfile;
}

export function ProjectedStepCard({ creator }: ProjectedStepCardProps) {
    return (
        <div className="relative flex gap-3 pb-4">
            <div className="bg-surface-border absolute top-6 bottom-0 left-[11px] w-0.5" />
            <div className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-surface-border bg-surface-muted text-text-soft shadow-2xs">
                <Info size={11} strokeWidth={3} />
            </div>
            <div className="group relative flex-1 rounded-xl border border-dashed border-surface-border bg-surface-muted/30 p-3.5 transition-all hover:bg-surface-muted/50">
                <div className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-surface-border" />

                <div className="flex flex-col gap-2">
                    <div className="text-foreground flex items-center justify-between pl-1">
                        <span className="text-xs leading-tight font-extrabold tracking-wide text-text-soft uppercase">Atasan Langsung</span>
                        <div className="flex origin-right scale-90 items-center">
                            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] font-bold text-text-soft uppercase border border-surface-border">
                                Estimasi
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-surface-border bg-surface-base/80 p-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-text-soft">
                            <i className="fa-solid fa-user-clock text-xs" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs leading-none font-bold tracking-tight text-text-main uppercase">
                                {creator.department_id ? 'Pemeriksa Otomatis' : 'Departemen Belum Diatur'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
