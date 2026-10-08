import React from 'react';
import { LucideIcon } from 'lucide-react';

export function StaticItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-text-soft text-xs">{label}</span>
            <div className="text-text-main flex items-center gap-2 text-sm font-medium">
                <Icon size={14} className="text-text-soft shrink-0" />
                <span className="truncate">{value}</span>
            </div>
        </div>
    );
}
