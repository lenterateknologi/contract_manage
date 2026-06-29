import { Button } from '@/components/ui/buttons/Button';
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
                className="hover:bg-sidebar-accent group h-9 w-9 rounded-lg transition-all duration-300"
            >
                <Sun className="text-sidebar-foreground/70 group-hover:text-sidebar-primary h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="text-sidebar-foreground/70 group-hover:text-sidebar-primary absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
    );
}
