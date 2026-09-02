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
import { Bell, FileCheck, MessageSquare, RefreshCw } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

interface NotificationItem {
    id: string;
    type: 'contract_update' | 'approval_required' | 'new_message';
    title: string;
    description: string;
    contract_id: string;
    contract_title: string;
    created_at_formatted: string;
}

export const HeaderNotifications = memo(function HeaderNotifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
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
        // ponytail: 15-second polling interval for keeping notifications real-time
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

    const getIcon = (type: string) => {
        switch (type) {
            case 'approval_required':
                return <FileCheck className="h-4 w-4 text-primary" />;
            case 'new_message':
                return <MessageSquare className="h-4 w-4 text-primary" />;
            default:
                return <RefreshCw className="h-4 w-4 text-primary" />;
        }
    };

    const getLink = (item: NotificationItem) => {
        if (item.type === 'new_message') {
            return `/admin/chat?contract_id=${item.contract_id}`;
        }
        return `/contracts/${item.contract_id}`;
    };

    const unreadNotifications = notifications.filter((n) => !readIds.includes(n.id));

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
            <DropdownMenuContent className="w-80 p-0 border border-border shadow-2xl rounded-2xl z-[99999]" side="right" align="end" sideOffset={14}>
                <div className="flex items-center justify-between px-4 py-3">
                    <DropdownMenuLabel className="text-text-main text-xs uppercase font-medium flex items-center gap-1.5">
                        <span>Notifikasi</span>
                        {unreadNotifications.length > 0 ? (
                            <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                {unreadNotifications.length} Baru
                            </span>
                        ) : notifications.length > 0 ? (
                            <span className="bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                                {notifications.length}
                            </span>
                        ) : null}
                    </DropdownMenuLabel>
                    {unreadNotifications.length > 0 && (
                        <button
                            onClick={markAllRead}
                            className="text-[10px] text-primary hover:underline uppercase font-medium cursor-pointer"
                        >
                            Tandai semua dibaca
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[320px] overflow-y-auto">
                    {loading ? (
                        <div className="px-4 py-8 text-center text-xs text-text-main">Memuat...</div>
                    ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <p className="text-text-main text-xs font-medium">Belum ada notifikasi baru</p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-surface-border/40">
                            {notifications.map((item) => (
                                <Link
                                    key={item.id}
                                    href={getLink(item)}
                                    onClick={() => handleNotificationClick(item)}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted/30 transition-colors"
                                >
                                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                                        {getIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {/* ponytail: uniform text styling, no bold or gray */}
                                        <p className="text-[11px] text-text-main leading-relaxed">
                                            {item.description}
                                        </p>
                                        <p className="text-[9px] text-text-main mt-0.5 truncate">
                                            {item.contract_title}
                                        </p>
                                        <p className="text-[8px] text-text-main mt-1 tabular-nums">
                                            {item.created_at_formatted}
                                        </p>
                                    </div>
                                    {/* ponytail: blue unread indicator dot on the right */}
                                    {!readIds.includes(item.id) && (
                                        <div className="flex h-5 items-center justify-center shrink-0 pl-1">
                                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
