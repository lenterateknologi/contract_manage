import { Button } from '@/components/ui/base/Button';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const toggleAppearance = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className={className} {...props}>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleAppearance}
                className="h-9 w-9 rounded-lg hover:bg-sidebar-accent transition-all duration-300 group"
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-sidebar-foreground/70 group-hover:text-sidebar-primary" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sidebar-foreground/70 group-hover:text-sidebar-primary" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
    );
}
