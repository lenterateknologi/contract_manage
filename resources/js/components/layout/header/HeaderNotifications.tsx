import { Button } from '@/components/ui/base/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/overlays/DropdownMenu';
import { Bell } from 'lucide-react';
import { memo } from 'react';

export const HeaderNotifications = memo(function HeaderNotifications() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent group relative h-9 w-9 rounded-lg transition-all"
                >
                    <Bell className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:rotate-12" />
                    <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                        <span className="bg-primary/40 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 dark:bg-white/40"></span>
                        <span className="bg-primary relative inline-flex h-2 w-2 rounded-full dark:bg-white"></span>
                    </span>
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-1 w-80" align="end">
                <DropdownMenuLabel className="text-sidebar-foreground/40 px-4 py-3 text-xs font-bold uppercase">Notifikasi Terbaru</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-4 py-8 text-center">
                    <p className="text-sidebar-foreground/50 text-sm font-medium italic">Belum ada notifikasi baru</p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
