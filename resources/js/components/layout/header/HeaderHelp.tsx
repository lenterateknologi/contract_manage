import { Button } from '@/components/ui/base/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/overlays/DropdownMenu';
import { Book, ExternalLink, HelpCircle } from 'lucide-react';
import { memo } from 'react';

export const HeaderHelp = memo(function HeaderHelp() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent group h-9 w-9 rounded-lg transition-all"
                >
                    <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Help</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-1 w-56" align="end">
                <DropdownMenuLabel className="text-sidebar-foreground/40 px-4 py-3 text-xs font-bold uppercase">Pusat Bantuan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-2">
                    <Book className="mr-2 h-4 w-4 opacity-70" />
                    <span>Dokumentasi</span>
                    <ExternalLink className="ml-auto h-3 w-3 opacity-30" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2">
                    <HelpCircle className="mr-2 h-4 w-4 opacity-70" />
                    <span>Panduan Cepat</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
