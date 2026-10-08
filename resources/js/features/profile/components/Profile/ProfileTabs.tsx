import React from 'react';
import { Activity, Fingerprint, Palette, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileTabId } from '../../types/profile.types';

interface ProfileTabsProps {
    activeTab: ProfileTabId;
    setActiveTab: (tab: ProfileTabId) => void;
}

const TABS = [
    { id: 'general' as const, label: 'Profil', icon: Fingerprint },
    { id: 'security' as const, label: 'Keamanan', icon: Shield },
    { id: 'activity' as const, label: 'Aktivitas', icon: Activity },
    { id: 'appearance' as const, label: 'Tampilan', icon: Palette },
];

export function ProfileTabs({ activeTab, setActiveTab }: ProfileTabsProps) {
    return (
        <div className="-mb-px flex items-center gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                        'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                        activeTab === id
                            ? 'border-primary text-primary'
                            : 'text-text-soft hover:text-text-main border-transparent',
                    )}
                >
                    <Icon size={14} />
                    {label}
                </button>
            ))}
        </div>
    );
}
