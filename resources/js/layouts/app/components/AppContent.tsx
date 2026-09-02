import { SidebarInset } from '@/components/ui/navigation/Sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'div'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return <SidebarInset className="h-screen max-h-screen w-full overflow-hidden p-0 m-0 rounded-none border-0" {...props}>{children}</SidebarInset>;
    }

    return (
        <main className="mx-auto flex h-full w-full max-w-full flex-1 flex-col p-0 m-0 rounded-none border-0" {...props}>
            {children}
        </main>
    );
}
