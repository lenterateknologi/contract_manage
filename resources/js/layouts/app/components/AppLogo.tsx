import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function AppLogo() {
    const { name, tagline, logo } = usePage<SharedData>().props;
    const appName = name || import.meta.env.VITE_APP_NAME || 'corixa';
    const appTagline = tagline || import.meta.env.VITE_APP_TAGLINE || 'Legal Management System';
    const appLogo = logo || (import.meta.env.VITE_APP_LOGO as string) || '/images/logo.png';

    return (
        <div className="flex w-full items-center gap-2.5 overflow-hidden px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
            <img
                src={appLogo}
                alt={`${appName} Logo`}
                className="size-16 object-contain transition-all duration-300 group-data-[collapsible=icon]:size-10 dark:brightness-0 dark:invert"
            />
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="text-sidebar-foreground text-[13.5px] leading-none font-bold tracking-tight">{appName}</span>
                <span className="text-sidebar-foreground/45 mt-1.5 text-[8.5px] leading-none font-medium">{appTagline}</span>
            </div>
        </div>
    );
}
