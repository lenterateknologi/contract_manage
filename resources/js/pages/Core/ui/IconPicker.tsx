import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import LucideIcons from '@/lib/lucide-dynamic';
import React, { useState } from 'react';

const COMMON_ICONS = [
    'Clock',
    'CheckCircle',
    'CheckCircle2',
    'CheckCheck',
    'XCircle',
    'AlertCircle',
    'AlertTriangle',
    'FileText',
    'FileCheck',
    'FileX',
    'FileClock',
    'FileEdit',
    'FileQuestion',
    'Folder',
    'FolderClosed',
    'FolderOpen',
    'Inbox',
    'Send',
    'User',
    'Users',
    'Settings',
    'Shield',
    'Database',
    'Key',
    'Lock',
    'Unlock',
    'Eye',
    'EyeOff',
    'Trash2',
    'Plus',
    'Check',
    'X',
    'HelpCircle',
    'Info',
    'CheckSquare',
    'Square',
    'Minus',
    'ChevronRight',
    'ChevronDown',
    'Search',
    'Zap',
    'Ban',
    'RefreshCw',
    'Archive',
    'ListOrdered',
];

interface IconPickerProps {
    value: string;
    onChange: (val: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredIcons = COMMON_ICONS.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));
    const SelectedIcon = value && (LucideIcons as any)[value] ? (LucideIcons as any)[value] : null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="border-surface-border bg-surface-base hover:bg-surface-muted/30 flex h-11 w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-normal shadow-xs transition-all outline-none"
                >
                    <div className="flex items-center gap-2">
                        {SelectedIcon ? (
                            <SelectedIcon className="text-primary h-4 w-4" />
                        ) : (
                            <div className="border-muted-foreground/55 h-4 w-4 rounded-full border border-dashed" />
                        )}
                        <span className={value ? 'text-foreground font-normal' : 'text-text-main font-normal'}>{value || 'Pilih Ikon...'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {value && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange('');
                                }}
                                className="text-text-main cursor-pointer rounded-md p-1 transition-all hover:bg-rose-50 hover:text-rose-500"
                                title="Hapus Ikon"
                            >
                                <LucideIcons.X className="h-3.5 w-3.5" />
                            </span>
                        )}
                        <LucideIcons.ChevronDown className="text-text-main animate-all h-4 w-4 duration-200" />
                    </div>
                </button>
            </PopoverTrigger>

            <PopoverContent align="start" className="border-surface-border bg-surface-base z-50 flex max-h-60 w-[280px] flex-col gap-2 overflow-y-auto rounded-lg border p-2 shadow-lg">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari ikon..."
                    className="border-surface-border bg-surface-base focus-visible:ring-primary focus-visible:border-primary flex h-9 w-full rounded-md border px-3 py-1 text-xs outline-hidden focus-visible:ring-1"
                />
                <div className="grid grid-cols-4 gap-1 overflow-y-auto pr-1">
                    {filteredIcons.map((iconName) => {
                        const Icon = (LucideIcons as any)[iconName];
                        return (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => {
                                    onChange(iconName);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className={`hover:bg-primary/10 hover:text-primary flex flex-col items-center justify-center gap-1 rounded-md border border-transparent p-2 text-center text-[10px] font-normal transition-all ${
                                    value === iconName ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-main'
                                }`}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                <span className="w-full truncate text-[9px]">{iconName}</span>
                            </button>
                        );
                    })}
                    {filteredIcons.length === 0 && (
                        <div className="text-text-main col-span-full py-4 text-center text-xs font-normal">Tidak ada ikon ditemukan</div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
export default IconPicker;
