import { SidebarInset } from '@/components/ui/navigation/Sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'div'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return (
            <SidebarInset className="m-0 h-screen max-h-screen w-full overflow-hidden rounded-none border-0 p-0" {...props}>
                {children}
            </SidebarInset>
        );
    }

    return (
        <main className="m-0 mx-auto flex h-full w-full max-w-full flex-1 flex-col rounded-none border-0 p-0" {...props}>
            {children}
        </main>
    );
}
