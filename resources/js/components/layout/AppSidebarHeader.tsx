import AppearanceToggleDropdown from '@/components/layout/AppearanceDropdown';
import { HeaderChat } from '@/components/layout/header/HeaderChat';
import { HeaderHelp } from '@/components/layout/header/HeaderHelp';
import { HeaderLanguage } from '@/components/layout/header/HeaderLanguage';
import { HeaderNotifications } from '@/components/layout/header/HeaderNotifications';
import { HeaderUserMenu } from '@/components/layout/header/HeaderUserMenu';
import { SiteCustomizer } from '@/components/layout/SiteCustomizer';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { SidebarTrigger } from '@/components/ui/navigation/Sidebar';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { memo } from 'react';

export const AppSidebarHeader = memo(function AppSidebarHeader({ breadcrumbs = [] }: { readonly breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header
            className={cn(
                'sticky top-0 z-40 transition-all duration-300',
                'm-4 flex h-14 items-center justify-between rounded-2xl px-6',
                'bg-card/90 dark:bg-card/90 backdrop-blur-xl',
                'border border-border/60 shadow-xl dark:border-border/60 dark:shadow-black/20',
            )}
        >
            {/* Left Section: Context & Navigation */}
            <div className="flex items-center gap-5">
                <div className="flex items-center">
                    <SidebarTrigger
                        className={cn(
                            'h-9 w-9 rounded-xl transition-all duration-300',
                            'text-foreground/70 dark:text-foreground/70',
                            'hover:text-foreground hover:bg-muted dark:hover:bg-muted dark:hover:text-foreground',
                            'active:scale-90',
                        )}
                    />
                </div>

                <div className="bg-border hidden h-4 w-px md:block dark:bg-border" />

                <div className="hidden md:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center gap-1.5">
                {/* Action Group */}
                <div className="bg-muted flex items-center gap-0.5 rounded-xl border border-border px-1 py-1">
                    <HeaderLanguage />
                    <HeaderChat />
                    <HeaderNotifications />
                    <HeaderHelp />
                </div>

                {/* Separator */}
                <div className="bg-border mx-1 h-5 w-px dark:bg-border" />

                {/* System Group */}
                <div className="flex items-center gap-1">
                    <SiteCustomizer />
                    <AppearanceToggleDropdown />
                </div>

                {/* Profile Section */}
                <div className="border-border ml-2 border-l pl-2 dark:border-border">
                    <HeaderUserMenu />
                </div>
            </div>

            {/* Subtle Bottom Accent */}
            <div className="absolute bottom-0 left-1/2 h-[1px] w-[40%] -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent dark:via-white" />
        </header>
    );
});
