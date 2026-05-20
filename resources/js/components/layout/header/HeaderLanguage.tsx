import { Button } from '@/components/ui/base/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/overlays/DropdownMenu';
import { cn } from '@/lib/utils';
import { Check, Languages } from 'lucide-react';
import { memo, useState } from 'react';

const languages = [
    { code: 'ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'EN', name: 'English', flag: '🇺🇸' },
];

export const HeaderLanguage = memo(function HeaderLanguage() {
    const [currentLang, setCurrentLang] = useState('ID');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent group h-9 gap-2 rounded-lg px-2 transition-all"
                >
                    <Languages className="h-[1.1rem] w-[1.1rem] transition-transform group-hover:rotate-12" />
                    <span className="text-[12px] font-bold tracking-wider">{currentLang}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-1 w-56" align="end">
                <DropdownMenuLabel className="text-sidebar-foreground/40 px-4 py-3 text-xs font-bold uppercase">Pilih Bahasa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} onClick={() => setCurrentLang(lang.code)} className="cursor-pointer px-4 py-2.5">
                        <span className="mr-3 text-lg">{lang.flag}</span>
                        <span className={cn('text-sm font-medium', currentLang === lang.code ? 'text-sidebar-primary font-bold' : '')}>
                            {lang.name}
                        </span>
                        {currentLang === lang.code && <Check className="text-sidebar-primary ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
