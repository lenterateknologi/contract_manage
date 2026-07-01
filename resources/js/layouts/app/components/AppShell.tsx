import { ToastProvider } from '@/components/ui/feedback/Toast';
import { SidebarProvider } from '@/components/ui/navigation/Sidebar';
import { useEffect, useState } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('sidebar');
        if (stored !== null) {
            setIsOpen(stored !== 'false');
        }
    }, []);

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);
        localStorage.setItem('sidebar', String(open));
    };

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return (
        <ToastProvider>
            <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
                {children}
            </SidebarProvider>
        </ToastProvider>
    );
}
