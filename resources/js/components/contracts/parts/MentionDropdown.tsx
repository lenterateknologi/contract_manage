import { cn } from '@/lib/utils';
import { Avatar } from '../ui/ui';

interface MentionDropdownProps {
    isOpen: boolean;
    users: any[];
    mentionIndex: number;
    setMentionIndex: (idx: number) => void;
    insertMention: (user: any) => void;
}

export function MentionDropdown({ isOpen, users, mentionIndex, setMentionIndex, insertMention }: MentionDropdownProps) {
    if (!isOpen || users.length === 0) return null;

    return (
        <div className="border-border animate-in slide-in-from-bottom-1 absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border bg-white shadow-2xl duration-200 dark:bg-slate-900">
            <div className="border-border bg-muted/60 flex items-center justify-between border-b px-3 py-1.5 dark:bg-white/5">
                <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">PILIH PENGGUNA</span>
                <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[9px] font-bold">{users.length}</span>
            </div>
            <div className="divide-border/40 max-h-[200px] divide-y overflow-y-auto">
                {users.map((u: any, i: number) => (
                    <button
                        key={u.id || i}
                        onClick={() => insertMention(u)}
                        onMouseEnter={() => setMentionIndex(i)}
                        className={cn(
                            'flex w-full items-center gap-2.5 p-2.5 text-left transition-all',
                            i === mentionIndex
                                ? 'bg-primary dark:bg-primary text-white shadow-sm dark:text-white'
                                : 'hover:bg-muted dark:hover:bg-white/5',
                        )}
                    >
                        <Avatar user={u} size="sm" className="ring-border/50 ring-1" />
                        <div className="flex min-w-0 flex-col">
                            <span
                                className={cn(
                                    'truncate text-xs leading-tight font-bold',
                                    i === mentionIndex ? 'text-inherit' : 'text-foreground dark:text-white',
                                )}
                            >
                                {u.name}
                            </span>
                            <span
                                className={cn(
                                    'mt-0.5 text-[10px] leading-none font-medium opacity-85',
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
