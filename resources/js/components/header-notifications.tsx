import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function HeaderNotifications() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all group">
                    <Bell className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:rotate-12" />
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 mt-1" align="end">
                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-sidebar-foreground/40 px-4 py-3">
                    Notifikasi Terbaru
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="py-8 px-4 text-center">
                    <p className="text-sm font-medium text-sidebar-foreground/50 italic">Belum ada notifikasi baru</p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
