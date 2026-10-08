import { notificationsService } from '@/services/notificationsService';
import { chatService } from '@/features/chat/services/chatService';
import { Button } from '@/components/ui/buttons/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import {
    AtSign,
    Bell,
    BellRing,
    CheckCheck,
    CheckCircle2,
    Clock,
    FileCheck,
    Inbox,
    MessageSquare,
    RefreshCw,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

interface NotificationItem {
    id: string;
    type: 'contract_update' | 'approval_required' | 'new_message';
    category?: string;
    badge?: string;
    title: string;
    actor_name?: string;
    description: string;
    contract_id: string;
    contract_title: string;
    contract_no?: string;
    created_at_formatted: string;
    created_at_exact?: string;
}

interface HeaderNotificationsProps {
    variant?: 'header' | 'sidebar';
    className?: string;
}

export const HeaderNotifications = memo(function HeaderNotifications({ variant = 'header', className }: HeaderNotificationsProps) {
    const pageProps = usePage().props;
    const currentUserId = (pageProps.auth as any)?.user?.id || 'guest';
    const storageKey = `read_notifications_${currentUserId}`;

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'approvals'>('all');
    const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            return Notification.permission;
        }
        return 'unsupported';
    });
    const [readIds, setReadIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch {
            return [];
        }
    });

    const isInitialLoadRef = useRef(true);
    const knownIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        try {
            setReadIds(JSON.parse(localStorage.getItem(storageKey) || '[]'));
        } catch {
            setReadIds([]);
        }
    }, [storageKey]);

    const showDesktopNotification = useCallback((item: NotificationItem) => {
        if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        try {
            const title = item.badge ? `[${item.badge}] ${item.title}` : item.title;
            const body = `${item.actor_name ? item.actor_name + ': ' : ''}${item.description}`;
            const notif = new Notification(title, {
                body,
                icon: '/favicon.ico',
                tag: item.id,
            });

            notif.onclick = () => {
                window.focus();
                const link = item.type === 'new_message' ? `/admin/chat/${item.contract_id}` : `/contracts/${item.contract_id}`;
                window.location.href = link;
                notif.close();
            };
        } catch (e) {
            console.error('Desktop notification error', e);
        }
    }, []);

    const requestPushPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setPushPermission(permission);
            if (permission === 'granted') {
                new Notification('Notifikasi Desktop Aktif', {
                    body: 'Anda akan menerima pemberitahuan otomatis saat ada persetujuan atau pesan baru.',
                    icon: '/favicon.ico',
                });
            }
        } catch (err) {
            console.error('Failed to request notification permission', err);
        }
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const res: any = await notificationsService.list();
            const items: NotificationItem[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
            setNotifications(items);

            // Trigger desktop push notification for newly arrived unread items
            if (!isInitialLoadRef.current && pushPermission === 'granted') {
                const newItems = items.filter((n) => !knownIdsRef.current.has(n.id) && !readIds.includes(n.id));
                newItems.slice(0, 3).forEach((item) => {
                    showDesktopNotification(item);
                });
            }

            // Record known IDs
            items.forEach((n) => knownIdsRef.current.add(n.id));
            isInitialLoadRef.current = false;
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    }, [pushPermission, readIds, showDesktopNotification]);

    useEffect(() => {
        fetchNotifications();

        let interval: NodeJS.Timeout | null = null;

        const startPolling = () => {
            if (!interval) {
                interval = setInterval(fetchNotifications, 4000);
            }
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                fetchNotifications();
                startPolling();
            }
        };

        const handleWindowFocus = () => {
            fetchNotifications();
        };

        startPolling();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [fetchNotifications]);

    const saveReadIds = (ids: string[]) => {
        setReadIds(ids);
        localStorage.setItem(storageKey, JSON.stringify(ids));
    };

    const handleNotificationClick = (item: NotificationItem) => {
        if (item.type === 'new_message' && item.contract_id) {
            chatService.markConversationAsRead(item.contract_id);
        }
        if (!readIds.includes(item.id)) {
            const newReadIds = [...readIds, item.id];
            saveReadIds(newReadIds);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationsService.markAllRead();
            const currentIds = notifications.map((n) => n.id);
            const newReadIds = Array.from(new Set([...readIds, ...currentIds]));
            saveReadIds(newReadIds);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    const getItemConfig = (item: NotificationItem) => {
        if (item.type === 'approval_required') {
            return {
                icon: <FileCheck className="size-3.5 text-amber-600 dark:text-amber-400" />,
                bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                badgeBg: 'text-amber-700 dark:text-amber-300 bg-amber-500/10',
                label: item.badge || 'Perlu Respon',
            };
        }
        if (item.type === 'new_message') {
            const isMention = item.category === 'MENTION';
            return {
                icon: isMention ? (
                    <AtSign className="size-3.5 text-purple-600 dark:text-purple-400" />
                ) : (
                    <MessageSquare className="size-3.5 text-blue-600 dark:text-blue-400" />
                ),
                bg: isMention ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                badgeBg: isMention ? 'text-purple-700 dark:text-purple-300 bg-purple-500/10' : 'text-blue-700 dark:text-blue-300 bg-blue-500/10',
                label: item.badge || (isMention ? 'Mention' : 'Diskusi'),
            };
        }

        switch (item.category) {
            case 'APPROVAL_APPROVED':
            case 'CONTRACT_APPROVED':
                return {
                    icon: <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />,
                    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    badgeBg: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10',
                    label: item.badge || 'Disetujui',
                };
            case 'APPROVAL_REJECTED':
                return {
                    icon: <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />,
                    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                    badgeBg: 'text-rose-700 dark:text-rose-300 bg-rose-500/10',
                    label: item.badge || 'Revisi',
                };
            case 'WORKFLOW_ASSIGNED':
                return {
                    icon: <UserCheck className="size-3.5 text-indigo-600 dark:text-indigo-400" />,
                    bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                    badgeBg: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10',
                    label: item.badge || 'PIC Baru',
                };
            default:
                return {
                    icon: <RefreshCw className="text-primary size-3.5" />,
                    bg: 'bg-primary/10 text-primary',
                    badgeBg: 'text-primary bg-primary/10',
                    label: item.badge || 'Update',
                };
        }
    };

    const getLink = (item: NotificationItem) => {
        if (item.type === 'new_message') {
            return `/admin/chat/${item.contract_id}`;
        }
        return `/contracts/${item.contract_id}`;
    };

    const unreadNotifications = notifications.filter((n) => !readIds.includes(n.id));
    const pendingApprovalCount = notifications.filter((n) => n.type === 'approval_required' && !readIds.includes(n.id)).length;

    const filteredNotifications = notifications.filter((n) => {
        if (filter === 'unread') return !readIds.includes(n.id);
        if (filter === 'approvals') return n.type === 'approval_required';
        return true;
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'group relative flex cursor-pointer transition-all active:scale-95',
                        variant === 'sidebar'
                            ? 'size-9 rounded-xl text-white/75 hover:bg-white/15 hover:text-white'
                            : 'text-foreground/75 hover:bg-muted hover:text-foreground ml-2 size-8 rounded-lg',
                        className,
                    )}
                    aria-label="Buka Notifikasi"
                >
                    <Bell className={cn('transition-transform group-hover:rotate-12', variant === 'sidebar' ? 'size-4.5' : 'size-4')} />
                    {unreadNotifications.length > 0 && (
                        <span className="ring-background ring-1.5 absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] leading-none font-bold text-white">
                            {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="bg-popover/95 text-popover-foreground border-border/70 animate-in fade-in-50 zoom-in-95 z-[99999] w-[340px] max-w-[calc(100vw-1.5rem)] rounded-2xl border p-0 shadow-xl backdrop-blur-md duration-100 sm:w-[380px] dark:shadow-2xl dark:shadow-black/60"
                side={variant === 'sidebar' ? 'right' : 'bottom'}
                align="end"
                sideOffset={variant === 'sidebar' ? 14 : 8}
            >
                {/* Header with quick stats and filter tabs */}
                <div className="space-y-2 p-2.5 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-foreground text-[11px] font-bold tracking-wide uppercase">Notifikasi</h3>
                            {unreadNotifications.length > 0 ? (
                                <span className="py-0.2 rounded bg-rose-500/10 px-1.5 text-[9.5px] font-bold text-rose-600 dark:text-rose-400">
                                    {unreadNotifications.length} Baru
                                </span>
                            ) : (
                                <span className="bg-muted text-muted-foreground py-0.2 rounded px-1.5 text-[9.5px] font-medium">
                                    {notifications.length} Total
                                </span>
                            )}
                        </div>
                        {unreadNotifications.length > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-medium transition-colors"
                            >
                                <CheckCheck className="size-3" />
                                <span>Tandai dibaca</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 text-[10.5px]">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`cursor-pointer rounded-md px-2 py-0.5 text-center transition-all ${
                                filter === 'all' ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Semua ({notifications.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`cursor-pointer rounded-md px-2 py-0.5 text-center transition-all ${
                                filter === 'unread' ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Belum Dibaca ({unreadNotifications.length})
                        </button>
                        {pendingApprovalCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setFilter('approvals')}
                                className={`flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 transition-all ${
                                    filter === 'approvals'
                                        ? 'bg-amber-500 font-semibold text-white'
                                        : 'text-amber-700 hover:bg-amber-500/10 dark:text-amber-400'
                                }`}
                            >
                                <span>Persetujuan</span>
                                <span className="rounded bg-black/10 px-1 text-[8.5px] font-bold dark:bg-white/20">{pendingApprovalCount}</span>
                            </button>
                        )}
                    </div>

                    {/* Push Notification Opt-in Banner */}
                    {pushPermission === 'default' && (
                        <div className="flex items-center justify-between rounded-lg bg-indigo-50/70 p-1.5 text-[10.5px] dark:bg-indigo-950/30">
                            <div className="flex items-center gap-1.5 font-medium text-indigo-900 dark:text-indigo-200">
                                <BellRing className="size-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <span>Aktifkan notifikasi</span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={requestPushPermission}
                                className="h-5 cursor-pointer rounded bg-indigo-600 px-2 text-[9.5px] font-semibold text-white hover:bg-indigo-700"
                            >
                                Izinkan
                            </Button>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[320px] scrollbar-thin overflow-y-auto">
                    {loading ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-8 text-center text-[11px]">
                            <RefreshCw className="text-primary size-4 animate-spin" />
                            <span>Memuat notifikasi...</span>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                            <div className="bg-muted text-muted-foreground/50 mb-2 flex size-8 items-center justify-center rounded-lg">
                                <Inbox className="size-4" />
                            </div>
                            <p className="text-foreground text-[11px] font-medium">Tidak ada notifikasi</p>
                            <p className="text-muted-foreground mt-0.5 text-[10px]">
                                {filter === 'unread'
                                    ? 'Semua notifikasi telah dibaca'
                                    : filter === 'approvals'
                                      ? 'Tidak ada persetujuan yang tertunda'
                                      : 'Belum ada aktivitas baru'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((item) => {
                            const config = getItemConfig(item);
                            const isUnread = !readIds.includes(item.id);

                            return (
                                <Link
                                    key={item.id}
                                    href={getLink(item)}
                                    onClick={() => handleNotificationClick(item)}
                                    className={`group relative flex items-start gap-2.5 px-3 py-2 transition-colors ${
                                        isUnread
                                            ? 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15'
                                            : 'hover:bg-muted/40 bg-transparent'
                                    }`}
                                >
                                    {/* Unread Left Border Indicator */}
                                    {isUnread && <div className="bg-primary absolute top-1.5 bottom-1.5 left-0.5 w-0.5 rounded-full" />}

                                    {/* Icon Avatar */}
                                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        {/* Top row: Badge & Time */}
                                        <div className="mb-0.5 flex items-center justify-between gap-1.5">
                                            <span className={`py-0.2 rounded px-1 text-[8.5px] font-bold uppercase ${config.badgeBg}`}>
                                                {config.label}
                                            </span>
                                            <span
                                                className="text-muted-foreground flex shrink-0 items-center gap-1 text-[9.5px] font-medium tabular-nums"
                                                title={item.created_at_exact}
                                            >
                                                <Clock className="size-2.5 opacity-60" />
                                                {item.created_at_formatted}
                                            </span>
                                        </div>

                                        {/* Contract Title */}
                                        <h4 className="text-foreground group-hover:text-primary truncate text-[11px] font-semibold transition-colors">
                                            {item.contract_title}
                                        </h4>

                                        {/* Action Summary / Message Description */}
                                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[10.5px] leading-tight">{item.description}</p>

                                        {/* Footer Actor / Sub-info */}
                                        {item.actor_name && (
                                            <div className="text-muted-foreground/80 mt-1 flex items-center gap-1 text-[9.5px]">
                                                <span>
                                                    Oleh: <strong className="text-foreground/85 font-medium">{item.actor_name}</strong>
                                                </span>
                                                {item.contract_no && (
                                                    <>
                                                        <span className="text-border">•</span>
                                                        <span className="font-mono text-[9px]">{item.contract_no}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* Footer Quick Action */}
                <div className="p-2 text-center">
                    <Link
                        href="/contracts"
                        className="text-primary hover:text-primary/80 inline-flex items-center justify-center gap-1 text-[10.5px] font-medium transition-colors"
                    >
                        <span>Buka Daftar Kontrak</span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
