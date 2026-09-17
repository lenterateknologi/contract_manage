import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Contract } from '@/pages/contracts/types';
import { Calendar, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
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
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3 h-full min-h-0 overflow-y-auto custom-scrollbar">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <Clock size={15} className="text-primary-foreground/90" /> Timeline & Kalender SLA
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <Card className="border-border/60 shadow-none">
            <CardHeader className="p-3 bg-primary text-primary-foreground flex flex-row items-center justify-between rounded-t-lg space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-tight text-primary-foreground flex items-center gap-2">
                    <Clock size={15} className="text-primary-foreground/90" /> Timeline
                </CardTitle>
                <button
                    type="button"
                    onClick={() => setMinimized(!minimized)}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                >
                    {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
            </CardHeader>

            {!minimized && (
                <CardContent className="p-0">
                    {content}
                </CardContent>
            )}
        </Card>
    );
}
