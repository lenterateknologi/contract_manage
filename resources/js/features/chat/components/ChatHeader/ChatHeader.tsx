import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { StatusBadge } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { membersService } from '@/features/members/services/membersService';
import { ChevronLeft, RefreshCw, Search, Users, X } from 'lucide-react';
import React from 'react';
import { Conversation } from '../../types/conversation.types';
import { usePage } from '@inertiajs/react';

interface ChatHeaderProps {
    conversation: Conversation;
    isSearchingInThread?: boolean;
    threadSearchQuery?: string;
    type?: string;
    onToggleSearchInThread?: () => void;
    onThreadSearchQueryChange?: (q: string) => void;
    onRefresh?: () => void;
    onBack?: () => void;
}

export function ChatHeader({
    conversation,
    isSearchingInThread,
    threadSearchQuery = '',
    type,
    onToggleSearchInThread,
    onThreadSearchQueryChange,
    onRefresh,
    onBack,
}: ChatHeaderProps) {
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;
    const currentUserId = currentUser?.id;
    const title = conversation.title || conversation.form_no || conversation.contract_no || 'Detail Percakapan';
    const subTitle = conversation.contract_no || conversation.form_no || '';
    const status = conversation.status || 'draft';

    const [members, setMembers] = React.useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = React.useState(false);

    // Automatically load members count and list on mount and when conversation/type changes
    React.useEffect(() => {
        let isMounted = true;
        if (!conversation?.id) {
            setMembers([]);
            return;
        }
        setLoadingMembers(true);
        membersService
            .getContractMembers(conversation.id, type)
            .then((data) => {
                if (isMounted) setMembers(Array.isArray(data) ? data : []);
            })
            .catch((e) => {
                console.error('Failed to load contract members:', e);
            })
            .finally(() => {
                if (isMounted) setLoadingMembers(false);
            });

        return () => {
            isMounted = false;
        };
    }, [conversation?.id, type]);

    const displayedMembers = members;

    const isTeamType = type === 'team';

    return (
        <div className="flex flex-col border-b border-border bg-card shadow-2xs">
            <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-3 min-w-0">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="h-8 w-8 md:hidden text-slate-500"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[280px] sm:max-w-md">
                                {title}
                            </h3>
                            <StatusBadge status={status} className="scale-90 origin-left" />
                            {isTeamType ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <Users className="h-3 w-3" />
                                    Tim Internal
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                                    <Users className="h-3 w-3" />
                                    Semua Anggota
                                </span>
                            )}
                        </div>
                        {subTitle && (
                            <p className="truncate text-[10px] font-medium text-slate-400">
                                {subTitle}
                                {conversation.assigned_pic_name && ` • PIC: ${conversation.assigned_pic_name}`}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Member Access Button & Popover */}
                    {conversation?.id && (
                        <Popover className="relative">
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                    title="Lihat personil yang memiliki akses"
                                >
                                    <Users className="h-3.5 w-3.5 text-primary" />
                                    <span className="hidden sm:inline">Akses:</span>
                                    <span className="font-semibold text-foreground">
                                        {isTeamType ? 'Team' : 'All'}
                                    </span>
                                    {displayedMembers.length > 0 && (
                                        <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                                            {displayedMembers.length}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent align="end" className="w-80 p-0 shadow-lg border border-border">
                                <div className="border-b border-border bg-muted/40 p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span className="text-xs font-bold text-foreground">
                                                {isTeamType ? 'Personil Tim Internal' : 'Semua Anggota Berhak Akses'}
                                            </span>
                                        </div>
                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                            {displayedMembers.length} Personil
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[10.5px] text-muted-foreground">
                                        {isTeamType
                                            ? 'Hanya personil tim internal yang dapat melihat dan membalas di ruangan chat ini.'
                                            : 'Semua personil yang terlibat dalam alur proses dan dokumen kontrak ini.'}
                                    </p>
                                </div>

                                <div className="custom-scrollbar max-h-72 overflow-y-auto divide-y divide-border/50 p-1">
                                    {loadingMembers ? (
                                        <div className="flex h-24 items-center justify-center">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        </div>
                                    ) : displayedMembers.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">
                                            Belum ada data anggota termuat.
                                        </div>
                                    ) : (
                                        displayedMembers.map((m: any) => (
                                            <div key={m.user?.id} className="flex items-center gap-2.5 p-2 hover:bg-muted/30 rounded-md">
                                                <UserAvatarIcon user={m.user} size="sm" className="h-7 w-7 text-[10px] shrink-0" />
                                                <div className="flex min-w-0 flex-1 flex-col">
                                                    <span className="truncate text-xs font-semibold text-foreground">
                                                        {m.user?.name}
                                                    </span>
                                                    <span className="truncate text-[10px] text-muted-foreground">
                                                        {m.roles?.join(', ') || m.user?.role || m.user?.department_name || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSearchInThread}
                        className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Cari dalam pesan"
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Segarkan Pesan"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* In-thread search box */}
            {isSearchingInThread && (
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={threadSearchQuery}
                        onChange={(e) => onThreadSearchQueryChange?.(e.target.value)}
                        placeholder="Cari teks dalam pesan..."
                        className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
                        autoFocus
                    />
                    {threadSearchQuery && (
                        <button
                            type="button"
                            onClick={() => onThreadSearchQueryChange?.('')}
                            className="rounded p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
