import { Button } from '@/components/ui/button';
import { HelpCircle, ExternalLink, Book } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function HeaderHelp() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all group">
                    <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Help</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-1" align="end">
                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-sidebar-foreground/40 px-4 py-3">
                    Pusat Bantuan
                </DropdownMenuLabel>
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
}
