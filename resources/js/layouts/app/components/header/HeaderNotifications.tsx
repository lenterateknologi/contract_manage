import { Button } from '@/components/ui/buttons/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { Link, usePage } from '@inertiajs/react';
import { notificationsApi, discussionsApi } from '@/api';
import { AtSign, Bell, BellRing, CheckCircle2, Clock, FileCheck, FileText, MessageSquare, RefreshCw, UserCheck, XCircle } from 'lucide-react';
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

export const HeaderNotifications = memo(function HeaderNotifications() {
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
                new Notification('🔔 Notifikasi Desktop Aktif', {
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
            const res: any = await notificationsApi.list();
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
            discussionsApi.messages.markRead(item.contract_id).catch(console.error);
        }
        if (!readIds.includes(item.id)) {
            const newReadIds = [...readIds, item.id];
            saveReadIds(newReadIds);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
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
                icon: <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
                bg: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
                badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
                label: item.badge || 'Perlu Respon',
            };
        }
        if (item.type === 'new_message') {
            const isMention = item.category === 'MENTION';
            return {
                icon: isMention ? (
                    <AtSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                ) : (
                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ),
                bg: isMention
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
                badgeBg: isMention
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
                label: item.badge || (isMention ? 'Menandai Anda (@Mention)' : 'Pesan Diskusi'),
            };
        }

        switch (item.category) {
            case 'APPROVAL_APPROVED':
            case 'CONTRACT_APPROVED':
                return {
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
                    bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
                    label: item.badge || 'Disetujui',
                };
            case 'APPROVAL_REJECTED':
                return {
                    icon: <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
                    bg: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300',
                    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
                    label: item.badge || 'Perlu Revisi',
                };
            case 'WORKFLOW_ASSIGNED':
                return {
                    icon: <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
                    bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
                    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
                    label: item.badge || 'PIC Baru',
                };
            default:
                return {
                    icon: <RefreshCw className="text-primary h-4 w-4" />,
                    bg: 'bg-primary/10 border-primary/20 text-primary',
                    badgeBg: 'bg-primary/10 text-primary border-primary/20',
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
                    className="group relative h-8 w-8 cursor-pointer rounded-lg text-white/80 transition-all hover:bg-white/15 hover:text-white"
                >
                    <Bell className="size-4.5 text-white/80 transition-transform group-hover:rotate-12 group-hover:text-white" />
                    {unreadNotifications.length > 0 && (
                        <span className="ring-primary absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] leading-none font-bold text-white shadow-xs ring-2">
                            {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="border-border/80 bg-card z-[99999] w-[380px] overflow-hidden rounded-2xl border p-0 shadow-2xl sm:w-[440px]"
                side="right"
                align="end"
                sideOffset={14}
            >
                {/* Header with quick stats and filter tabs */}
                <div className="bg-muted/40 border-border/60 border-b p-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-foreground text-xs font-semibold tracking-wider uppercase">Notifikasi</span>
                            {unreadNotifications.length > 0 ? (
                                <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] leading-none font-bold text-red-600 dark:text-red-400">
                                    {unreadNotifications.length} Baru
                                </span>
                            ) : (
                                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] leading-none font-medium">
                                    {notifications.length} Total
                                </span>
                            )}
                        </div>
                        {unreadNotifications.length > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-primary hover:text-primary/80 cursor-pointer text-[11px] font-medium transition-colors"
                            >
                                Tandai dibaca
                            </button>
                        )}
                    </div>

                    {/* Filter Pills & Push Notification Banner */}
                    <div className="flex items-center gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                                filter === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'bg-background hover:bg-muted text-muted-foreground'
                            }`}
                        >
                            Semua ({notifications.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                                filter === 'unread'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'bg-background hover:bg-muted text-muted-foreground'
                            }`}
                        >
                            Belum Dibaca ({unreadNotifications.length})
                        </button>
                        {pendingApprovalCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setFilter('approvals')}
                                className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                                    filter === 'approvals'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400'
                                }`}
                            >
                                <span>Persetujuan</span>
                                <span className="py-0.2 rounded-full bg-white/20 px-1 text-[9px] font-bold">{pendingApprovalCount}</span>
                            </button>
                        )}
                    </div>

                    {/* Push Notification Opt-in Banner */}
                    {pushPermission === 'default' && (
                        <div className="mt-2.5 flex items-center justify-between rounded-lg border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-1.5 text-[11px] dark:border-indigo-800/60 dark:bg-indigo-950/40">
                            <div className="flex items-center gap-1.5 font-medium text-indigo-900 dark:text-indigo-200">
                                <BellRing className="size-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <span>Aktifkan notifikasi desktop</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={requestPushPermission}
                                className="h-6 cursor-pointer border-0 bg-indigo-600 px-2 text-[10px] font-semibold text-white hover:bg-indigo-700 hover:text-white"
                            >
                                Izinkan
                            </Button>
                        </div>
                    )}
                    {pushPermission === 'granted' && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3 shrink-0" />
                            <span>Push notifikasi browser aktif</span>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="divide-border/40 max-h-[88vh] max-h-[880px] min-h-[480px] divide-y overflow-y-auto">
                    {loading ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-xs">
                            <RefreshCw className="text-primary h-4 w-4 animate-spin" />
                            <span>Memuat notifikasi...</span>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <FileText className="text-muted-foreground/40 mx-auto mb-2 h-8 w-8" />
                            <p className="text-foreground text-xs font-medium">Tidak ada notifikasi</p>
                            <p className="text-muted-foreground mt-0.5 text-[11px]">
                                {filter === 'unread'
                                    ? 'Semua notifikasi telah Anda baca'
                                    : filter === 'approvals'
                                      ? 'Tidak ada persetujuan yang menunggu tindakan'
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
                                    className={`group relative flex items-start gap-3 p-3.5 transition-all ${
                                        isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50 bg-background'
                                    }`}
                                >
                                    {/* Unread Left Border Indicator */}
                                    {isUnread && <div className="bg-primary absolute top-0 bottom-0 left-0 w-1 rounded-r" />}

                                    {/* Icon Avatar */}
                                    <div
                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${config.bg} shadow-xs transition-transform group-hover:scale-105`}
                                    >
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        {/* Top row: Badge & Time */}
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <span
                                                className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase ${config.badgeBg}`}
                                            >
                                                {config.label}
                                            </span>
                                            <span
                                                className="text-muted-foreground flex shrink-0 items-center gap-1 text-[10px] font-medium tabular-nums"
                                                title={item.created_at_exact}
                                            >
                                                <Clock className="h-2.5 w-2.5 opacity-60" />
                                                {item.created_at_formatted}
                                            </span>
                                        </div>

                                        {/* Contract Title (Bold & Distinct) */}
                                        <h4 className="text-foreground group-hover:text-primary truncate text-[12px] font-semibold transition-colors">
                                            {item.contract_title}
                                        </h4>

                                        {/* Action Summary / Message Description */}
                                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-snug">{item.description}</p>

                                        {/* Footer Actor / Sub-info */}
                                        {item.actor_name && (
                                            <div className="text-muted-foreground/80 mt-1.5 flex items-center gap-1.5 text-[10px] font-medium">
                                                <span className="bg-border h-1.5 w-1.5 rounded-full" />
                                                <span>
                                                    Oleh: <strong className="text-foreground/80 font-medium">{item.actor_name}</strong>
                                                </span>
                                                {item.contract_no && (
                                                    <>
                                                        <span className="text-border">•</span>
                                                        <span className="text-muted-foreground font-mono text-[9px]">{item.contract_no}</span>
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
                <div className="bg-muted/20 border-border/60 border-t p-2.5 text-center">
                    <Link
                        href="/contracts"
                        className="text-primary inline-flex items-center justify-center gap-1 text-[11px] font-medium hover:underline"
                    >
                        <span>Buka Daftar Kontrak</span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
