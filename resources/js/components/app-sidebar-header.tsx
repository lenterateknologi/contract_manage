import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { HeaderChat } from '@/components/header-chat';
import { HeaderHelp } from '@/components/header-help';
import { HeaderLanguage } from '@/components/header-language';
import { HeaderNotifications } from '@/components/header-notifications';
import { HeaderUserMenu } from '@/components/header-user-menu';
import { SiteCustomizer } from '@/components/site-customizer';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="border-sidebar-border/50 bg-sidebar sticky top-0 z-10 m-2 flex h-12 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent -ml-1 h-8 w-8 shrink-0 transition-all" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-1">
                <HeaderLanguage />
                <HeaderChat />
                <HeaderNotifications />
                <HeaderHelp />
                <div className="bg-sidebar-border/50 mx-1.5 h-4 w-px shrink-0" />
                <SiteCustomizer />
                <AppearanceToggleDropdown />
                <HeaderUserMenu />
            </div>
        </header>
    );
}
