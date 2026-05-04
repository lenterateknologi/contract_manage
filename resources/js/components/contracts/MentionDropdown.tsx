import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './ui';

interface MentionDropdownProps {
    isOpen: boolean;
    users: any[];
    mentionIndex: number;
    setMentionIndex: (idx: number) => void;
    insertMention: (user: any) => void;
}

export function MentionDropdown({
    isOpen,
    users,
    mentionIndex,
    setMentionIndex,
    insertMention,
}: MentionDropdownProps) {
    if (!isOpen || users.length === 0) return null;

    return (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border border-border bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-bottom-1 duration-200">
            <div className="border-b border-border bg-muted/60 dark:bg-white/5 px-3 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                    PILIH PENGGUNA
                </span>
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                    {users.length}
                </span>
            </div>
            <div className="max-h-[200px] overflow-y-auto divide-y divide-border/40">
                {users.map((u: any, i: number) => (
                    <button
                        key={u.id || i}
                        onClick={() => insertMention(u)}
                        onMouseEnter={() => setMentionIndex(i)}
                        className={cn(
                            'flex w-full items-center gap-2.5 p-2.5 text-left transition-all',
                            i === mentionIndex
                                ? 'bg-primary text-white dark:bg-primary dark:text-white shadow-sm'
                                : 'hover:bg-muted dark:hover:bg-white/5',
                        )}
                    >
                        <Avatar user={u} size="sm" className="ring-1 ring-border/50" />
                        <div className="flex min-w-0 flex-col">
                            <span
                                className={cn(
                                    'truncate text-xs font-bold leading-tight',
                                    i === mentionIndex ? 'text-inherit' : 'text-foreground dark:text-white',
                                )}
                            >
                                {u.name}
                            </span>
                            <span
                                className={cn(
                                    'text-[10px] font-medium mt-0.5 leading-none opacity-85',
                                    i === mentionIndex ? 'text-inherit' : 'text-muted-foreground dark:text-white/60',
                                )}
                            >
                                {u.role || 'User'} • {u.department?.name || u.department_name || 'Umum'}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
