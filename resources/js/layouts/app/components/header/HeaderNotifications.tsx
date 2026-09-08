import { Button } from '@/components/ui/buttons/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Bell,
    CheckCircle2,
    Clock,
    FileCheck,
    FileText,
    MessageSquare,
    RefreshCw,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';

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
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'approvals'>('all');
    const [readIds, setReadIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
        } catch {
            return [];
        }
    });

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get<NotificationItem[]>('/api/services/notifications');
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    const saveReadIds = (ids: string[]) => {
        setReadIds(ids);
        localStorage.setItem('read_notification_ids', JSON.stringify(ids));
    };

    const handleNotificationClick = (item: NotificationItem) => {
        if (item.type === 'new_message') {
            axios.post(`/api/contracts/${item.contract_id}/messages/read`).catch(console.error);
        }
        if (!readIds.includes(item.id)) {
            const newReadIds = [...readIds, item.id];
            saveReadIds(newReadIds);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.post('/api/services/notifications/mark-read');
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
            return {
                icon: <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
                bg: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
                badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
                label: item.badge || 'Diskusi',
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
                    icon: <RefreshCw className="h-4 w-4 text-primary" />,
                    bg: 'bg-primary/10 border-primary/20 text-primary',
                    badgeBg: 'bg-primary/10 text-primary border-primary/20',
                    label: item.badge || 'Update',
                };
        }
    };

    const getLink = (item: NotificationItem) => {
        if (item.type === 'new_message') {
            return `/admin/chat?contract_id=${item.contract_id}`;
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
                    className="text-white/80 hover:text-white hover:bg-white/15 group relative h-8 w-8 rounded-lg transition-all cursor-pointer"
                >
                    <Bell className="size-4.5 transition-transform group-hover:rotate-12 text-white/80 group-hover:text-white" />
                    {unreadNotifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-xs ring-2 ring-primary leading-none">
                            {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[380px] sm:w-[440px] p-0 border border-border/80 shadow-2xl rounded-2xl z-[99999] overflow-hidden bg-card"
                side="right"
                align="end"
                sideOffset={14}
            >
                {/* Header with quick stats and filter tabs */}
                <div className="p-3.5 bg-muted/40 border-b border-border/60">
                    <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                                Notifikasi
                            </span>
                            {unreadNotifications.length > 0 ? (
                                <span className="bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
                                    {unreadNotifications.length} Baru
                                </span>
                            ) : (
                                <span className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full leading-none">
                                    {notifications.length} Total
                                </span>
                            )}
                        </div>
                        {unreadNotifications.length > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                            >
                                Tandai dibaca
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
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
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
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
                                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                    filter === 'approvals'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                }`}
                            >
                                <span>Persetujuan</span>
                                <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded-full font-bold">
                                    {pendingApprovalCount}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[88vh] max-h-[880px] min-h-[480px] overflow-y-auto divide-y divide-border/40">
                    {loading ? (
                        <div className="px-4 py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span>Memuat notifikasi...</span>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-xs font-medium text-foreground">Tidak ada notifikasi</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
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
                                    className={`group flex items-start gap-3 p-3.5 transition-all relative ${
                                        isUnread
                                            ? 'bg-primary/5 hover:bg-primary/10'
                                            : 'hover:bg-muted/50 bg-background'
                                    }`}
                                >
                                    {/* Unread Left Border Indicator */}
                                    {isUnread && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                                    )}

                                    {/* Icon Avatar */}
                                    <div
                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${config.bg} shadow-xs transition-transform group-hover:scale-105`}
                                    >
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Top row: Badge & Time */}
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span
                                                className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${config.badgeBg}`}
                                            >
                                                {config.label}
                                            </span>
                                            <span
                                                className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0 font-medium tabular-nums"
                                                title={item.created_at_exact}
                                            >
                                                <Clock className="h-2.5 w-2.5 opacity-60" />
                                                {item.created_at_formatted}
                                            </span>
                                        </div>

                                        {/* Contract Title (Bold & Distinct) */}
                                        <h4 className="text-[12px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                            {item.contract_title}
                                        </h4>

                                        {/* Action Summary / Message Description */}
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                            {item.description}
                                        </p>

                                        {/* Footer Actor / Sub-info */}
                                        {item.actor_name && (
                                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-medium">
                                                <span className="h-1.5 w-1.5 rounded-full bg-border" />
                                                <span>Oleh: <strong className="text-foreground/80 font-medium">{item.actor_name}</strong></span>
                                                {item.contract_no && (
                                                    <>
                                                        <span className="text-border">•</span>
                                                        <span className="font-mono text-[9px] text-muted-foreground">{item.contract_no}</span>
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
                <div className="p-2.5 bg-muted/20 border-t border-border/60 text-center">
                    <Link
                        href="/contracts"
                        className="text-[11px] font-medium text-primary hover:underline inline-flex items-center justify-center gap-1"
                    >
                        <span>Buka Daftar Kontrak</span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
