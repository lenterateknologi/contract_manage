import { Button } from '@/components/ui/button';
import { Languages, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const languages = [
    { code: 'ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'EN', name: 'English', flag: '🇺🇸' },
];

export function HeaderLanguage() {
    const [currentLang, setCurrentLang] = useState('ID');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all group">
                    <Languages className="h-[1.1rem] w-[1.1rem] transition-transform group-hover:rotate-12" />
                    <span className="text-[12px] font-bold tracking-wider">{currentLang}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-1" align="end">
                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-sidebar-foreground/40 px-4 py-3">
                    Pilih Bahasa
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                    <DropdownMenuItem 
                        key={lang.code}
                        onClick={() => setCurrentLang(lang.code)}
                        className="cursor-pointer py-2.5 px-4"
                    >
                        <span className="mr-3 text-lg">{lang.flag}</span>
                        <span className={cn("text-sm font-medium", currentLang === lang.code ? "text-sidebar-primary font-bold" : "")}>
                            {lang.name}
                        </span>
                        {currentLang === lang.code && <Check className="ml-auto h-4 w-4 text-sidebar-primary" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
