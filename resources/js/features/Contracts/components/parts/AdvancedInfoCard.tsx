import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Contract } from '@/features/Contracts/types';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useState } from 'react';
import { ContractSlaCalendar } from './ContractSlaCalendar';

export function AdvancedInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);

    const content = (
        <div className="flex flex-col gap-4">
            {/* Kalender Bulanan & Timeline SLA Kontrak */}
            <ContractSlaCalendar selected={selected} />
        </div>
    );

    if (isTabView) {
        return (
            <div className="custom-scrollbar flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:p-4">
                <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4">
                    <div className="text-primary-foreground flex items-center gap-2 text-xs font-semibold tracking-tight uppercase">
                        <Clock size={15} className="text-primary-foreground/90" /> Durasi & SLA Pengajuan
                    </div>
                </div>
                <div className="min-h-0 flex-1">{content}</div>
            </div>
        );
    }

    return (
        <Card className="border-border/60 shadow-none">
            <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0 rounded-t-lg p-3">
                <CardTitle className="text-primary-foreground flex items-center gap-2 text-xs font-semibold tracking-tight uppercase">
                    <Clock size={15} className="text-primary-foreground/90" /> Timeline
                </CardTitle>
                <button
                    type="button"
                    onClick={() => setMinimized(!minimized)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95"
                >
                    {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
            </CardHeader>

            {!minimized && <CardContent className="p-0">{content}</CardContent>}
        </Card>
    );
}
