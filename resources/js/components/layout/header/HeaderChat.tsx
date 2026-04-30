import React, { memo } from 'react';
import { Button } from '@/components/ui/base/Button';
import { MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';

export const HeaderChat = memo(function HeaderChat() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all group">
                    <MessageSquare className="h-[1.1rem] w-[1.1rem]" />
                    <span className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary dark:bg-white opacity-40 group-hover:opacity-100 transition-opacity"></span>
                    </span>
                    <span className="sr-only">Chat</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 mt-1" align="end">
                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-sidebar-foreground/40 px-4 py-3">
                    Pesan Internal
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="py-8 px-4 text-center">
                    <p className="text-sm font-medium text-sidebar-foreground/50 italic">Belum ada percakapan aktif</p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
