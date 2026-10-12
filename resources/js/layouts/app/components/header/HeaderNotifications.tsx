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
    Trash2,
    UserCheck,
    X,
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
    const dismissedStorageKey = `dismissed_notifications_${currentUserId}`;

    const [open, setOpen] = useState(false);
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
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(dismissedStorageKey) || '[]');
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
        try {
            setDismissedIds(JSON.parse(localStorage.getItem(dismissedStorageKey) || '[]'));
        } catch {
            setDismissedIds([]);
        }
    }, [storageKey, dismissedStorageKey]);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playNotificationSound = () => {
        try {
            // Using Web Audio API for a crisp, gentle push chime (no external audio file required)
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const now = ctx.currentTime;
                
                // Tone 1 (High bell chime)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(587.33, now); // D5
                osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
                gain1.gain.setValueAtTime(0.15, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.4);

                // Tone 2 (Harmonic echo)
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, now + 0.08); // A5
                osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22); // D6
                gain2.gain.setValueAtTime(0.12, now + 0.08);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.08);
                osc2.stop(now + 0.6);
            }
        } catch {
            // Audio Context not allowed or unsupported
        }
    };

    const [floatingAlert, setFloatingAlert] = useState<{
        id: string;
        title: string;
        description: string;
        badge?: string;
        actor_name?: string;
        targetUrl: string;
    } | null>(null);
    const floatingAlertTimeoutRef = useRef<any>(null);

    const showDesktopNotification = useCallback((item: NotificationItem) => {
        if (typeof window === 'undefined') {
            return;
        }

        playNotificationSound();

        const title = item.badge ? `[${item.badge}] ${item.title}` : item.title;
        const body = `${item.actor_name ? item.actor_name + ': ' : ''}${item.description}`;
        const targetUrl = item.type === 'new_message' ? `/admin/chat/${item.contract_id}` : `/contracts/${item.contract_id}`;

        // 1. Show floating in-app banner alert (guaranteed visible on screen regardless of OS / Brave shield blocking)
        setFloatingAlert({
            id: item.id,
            title,
            description: body,
            badge: item.badge,
            actor_name: item.actor_name,
            targetUrl,
        });

        if (floatingAlertTimeoutRef.current) {
            clearTimeout(floatingAlertTimeoutRef.current);
        }
        floatingAlertTimeoutRef.current = setTimeout(() => {
            setFloatingAlert(null);
        }, 8000);

        // 2. Also trigger native OS desktop notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notifOptions: NotificationOptions = {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: item.id,
                requireInteraction: true,
                silent: false,
                data: { url: targetUrl },
            };

            // Spawn directly via Notification constructor first (most immediate on desktop)
            spawnStandardNotification(title, body, targetUrl, item.id);

            // Also try Service Worker registration
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                    .then((reg) => {
                        reg.showNotification(title, notifOptions);
                    })
                    .catch(() => {});
            }
        }
    }, []);

    const spawnStandardNotification = (title: string, body: string, targetUrl: string, tag: string) => {
        try {
            const notif = new Notification(title, {
                body,
                icon: '/favicon.ico',
                tag,
                requireInteraction: true,
            });

            notif.onclick = () => {
                window.focus();
                if (targetUrl) {
                    window.location.href = targetUrl;
                }
                notif.close();
            };
        } catch (err) {
            console.warn('Fallback desktop notification failed', err);
        }
    };

    const triggerTestPushAlert = () => {
        showDesktopNotification({
            id: `test-${Date.now()}`,
            type: 'contract_update',
            badge: 'Test Web Push',
            title: 'Notifikasi Web Push Aktif',
            actor_name: 'Sistem Corixa',
            description: 'Alert mengambang desktop berhasil diaktifkan dan siap menerima pembaruan.',
            contract_id: '',
            contract_title: 'Sistem Notifikasi',
            created_at_formatted: 'Baru saja',
        });
    };

    const requestPushPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            alert('Browser ini tidak mendukung Web Push Notification.');
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setPushPermission(permission);
            if (permission === 'granted') {
                triggerTestPushAlert();
            } else {
                alert('Izin notifikasi ditolak oleh browser/sistem. Silakan izinkan di icon gembok (kiri address bar browser) atau pengaturan OS.');
            }
        } catch (err) {
            console.error('Failed to request notification permission', err);
        }
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const res: any = await notificationsService.list();
            const items: NotificationItem[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
            
            // Filter out locally dismissed items if any
            const activeItems = items.filter((n) => !dismissedIds.includes(n.id));
            setNotifications(activeItems);

            const isPermitted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

            const notifiedStorageKey = `notified_desktop_${currentUserId}`;
            let notifiedIds: string[] = [];
            try {
                notifiedIds = JSON.parse(sessionStorage.getItem(notifiedStorageKey) || '[]');
            } catch {
                notifiedIds = [];
            }
            const notifiedSet = new Set([...notifiedIds, ...Array.from(knownIdsRef.current)]);

            // Trigger desktop push notification for unread items that haven't been popped up yet
            if (isPermitted) {
                const newItems = activeItems.filter((n) => !notifiedSet.has(n.id) && !readIds.includes(n.id));
                if (newItems.length > 0) {
                    newItems.slice(0, 3).forEach((item) => {
                        showDesktopNotification(item);
                        notifiedSet.add(item.id);
                    });
                    try {
                        sessionStorage.setItem(notifiedStorageKey, JSON.stringify(Array.from(notifiedSet)));
                    } catch {}
                }
            }

            // Record known IDs
            activeItems.forEach((n) => knownIdsRef.current.add(n.id));
            isInitialLoadRef.current = false;
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    }, [dismissedIds, readIds, showDesktopNotification]);

    useEffect(() => {
        fetchNotifications();

        // Polling setiap 4 detik (tetap berjalan di background tab agar notifikasi desktop mengambang ter-trigger)
        const interval = setInterval(fetchNotifications, 4000);

        const handleWindowFocus = () => {
            fetchNotifications();
        };

        window.addEventListener('focus', handleWindowFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [fetchNotifications]);

    const saveReadIds = (ids: string[]) => {
        setReadIds(ids);
        localStorage.setItem(storageKey, JSON.stringify(ids));
    };

    const saveDismissedIds = (ids: string[]) => {
        setDismissedIds(ids);
        localStorage.setItem(dismissedStorageKey, JSON.stringify(ids));
    };

    const handleDismissNotification = async (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Optimistically remove from state and store locally
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const newDismissedIds = [...new Set([...dismissedIds, id])];
        saveDismissedIds(newDismissedIds);

        try {
            await notificationsService.dismiss(id);
        } catch (err) {
            console.error('Failed to dismiss notification', err);
        }
    };

    const handleNotificationClick = (item: NotificationItem) => {
        if (item.type === 'new_message' && item.contract_id) {
            chatService.markConversationAsRead(item.contract_id);
        }
        if (!readIds.includes(item.id)) {
            const newReadIds = [...readIds, item.id];
            saveReadIds(newReadIds);
        }

        // Otomatis hapus / sembunyikan notifikasi saat dibuka
        handleDismissNotification(item.id);

        // Tutup dialog notifikasi
        setOpen(false);
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

    const clearAllNotifications = async () => {
        const allIds = notifications.map((n) => n.id);
        if (allIds.length === 0) return;

        // Optimistically clear all notifications from local view
        setNotifications([]);
        const newDismissedIds = [...new Set([...dismissedIds, ...allIds])];
        saveDismissedIds(newDismissedIds);

        try {
            await notificationsService.clearAll(allIds);
        } catch (err) {
            console.error('Failed to clear all notifications', err);
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
        <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
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
                        <div className="flex items-center gap-2">
                            {unreadNotifications.length > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-medium transition-colors"
                                    title="Tandai semua telah dibaca"
                                >
                                    <CheckCheck className="size-3" />
                                    <span>Tandai dibaca</span>
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAllNotifications}
                                    className="text-muted-foreground hover:text-rose-600 inline-flex cursor-pointer items-center text-[10.5px] font-medium transition-colors"
                                    title="Bersihkan semua notifikasi"
                                >
                                    <span>Hapus semua</span>
                                </button>
                            )}
                        </div>
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

                    {/* Push Notification Opt-in / Status Banner */}
                    {pushPermission === 'default' && (
                        <div className="flex items-center justify-between rounded-lg bg-indigo-50/70 p-1.5 text-[10.5px] dark:bg-indigo-950/30">
                            <div className="flex items-center gap-1.5 font-medium text-indigo-900 dark:text-indigo-200">
                                <BellRing className="size-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <span>Web Push Alert: Belum aktif</span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={requestPushPermission}
                                className="h-5 cursor-pointer rounded bg-indigo-600 px-2 text-[9.5px] font-semibold text-white hover:bg-indigo-700"
                            >
                                Izinkan Pop-up
                            </Button>
                        </div>
                    )}
                    {pushPermission === 'granted' && (
                        <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 p-1.5 text-[10.5px] dark:bg-emerald-950/30">
                            <div className="flex items-center gap-1.5 font-medium text-emerald-900 dark:text-emerald-200">
                                <CheckCircle2 className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>Web Push Desktop: Aktif</span>
                            </div>
                            <button
                                type="button"
                                onClick={triggerTestPushAlert}
                                className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer text-[9.5px] font-medium"
                                title="Kirim notifikasi uji coba ke layar desktop Anda sekarang"
                            >
                                Tes Notifikasi
                            </button>
                        </div>
                    )}
                    {pushPermission === 'denied' && (
                        <div className="flex items-center justify-between rounded-lg bg-rose-50/70 p-1.5 text-[10.5px] dark:bg-rose-950/30">
                            <div className="flex items-center gap-1.5 font-medium text-rose-900 dark:text-rose-200">
                                <XCircle className="size-3 shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>Notifikasi diblokir browser</span>
                            </div>
                            <span className="text-muted-foreground text-[9px]">Ubah di ikon gembok URL</span>
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

                                    {/* Action button: Hapus notifikasi */}
                                    <button
                                        type="button"
                                        title="Hapus notifikasi"
                                        onClick={(e) => handleDismissNotification(item.id, e)}
                                        className="text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 -mr-1 flex size-5.5 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* Footer Quick Action */}
                <div className="p-2 text-center">
                    <Link
                        href="/contracts"
                        onClick={() => setOpen(false)}
                        className="text-primary hover:text-primary/80 inline-flex items-center justify-center gap-1 text-[10.5px] font-medium transition-colors"
                    >
                        <span>Buka Daftar Kontrak</span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>

        {/* Floating Web Push Alert Card (Always Visible on Screen when Notification fires) */}
        {floatingAlert && (
            <div
                role="alert"
                className="fixed bottom-6 right-6 z-[999999] max-w-[380px] w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto"
            >
                <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-background/95 p-4 shadow-2xl backdrop-blur-md ring-1 ring-black/5 dark:bg-zinc-900/95 dark:ring-white/10 dark:shadow-black/70">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BellRing className="size-5 animate-bounce" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                                {floatingAlert.badge || 'Notifikasi Baru'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">Baru saja</span>
                        </div>
                        <h4 className="text-[12px] font-bold text-foreground leading-snug line-clamp-1">
                            {floatingAlert.title}
                        </h4>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {floatingAlert.description}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                            {floatingAlert.targetUrl && (
                                <Link
                                    href={floatingAlert.targetUrl}
                                    onClick={() => setFloatingAlert(null)}
                                    className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                                >
                                    Buka Kontrak
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={() => setFloatingAlert(null)}
                                className="inline-flex items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFloatingAlert(null)}
                        className="text-muted-foreground/60 hover:text-foreground p-1 rounded-md cursor-pointer transition-colors"
                        aria-label="Tutup notifikasi"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>
        )}
        </>
    );
});
