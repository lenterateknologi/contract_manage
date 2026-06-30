import { Button } from '@/components/ui/buttons/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';
import { MessageSquare } from 'lucide-react';
import { memo } from 'react';

export const HeaderChat = memo(function HeaderChat() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent group relative h-9 w-9 rounded-lg transition-all"
                >
                    <MessageSquare className="h-[1.1rem] w-[1.1rem]" />
                    <span className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5">
                        <span className="bg-primary relative inline-flex h-1.5 w-1.5 rounded-full opacity-40 transition-opacity group-hover:opacity-100 dark:bg-white"></span>
                    </span>
                    <span className="sr-only">Chat</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-1 w-80" align="end">
                <DropdownMenuLabel className="text-sidebar-foreground/40 px-4 py-3 text-xs font-bold uppercase">Pesan Internal</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-4 py-8 text-center">
                    <p className="text-sidebar-foreground/50 text-sm font-medium italic">Belum ada percakapan aktif</p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
