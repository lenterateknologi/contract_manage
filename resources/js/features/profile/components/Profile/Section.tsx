import React from 'react';
import { LucideIcon } from 'lucide-react';

export function Section({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}) {
    return (
        <div className="dark:bg-surface-base border-surface-border rounded-xl border bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
                <Icon size={16} className="text-text-soft" />
                <h3 className="text-text-main text-sm font-semibold">{title}</h3>
            </div>
            {children}
        </div>
    );
}
