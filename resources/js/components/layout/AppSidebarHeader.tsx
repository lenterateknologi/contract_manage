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
                'dark:bg-background bg-white/80 backdrop-blur-xl',
                'border-primary/10 shadow-primary/5 border shadow-2xl dark:border-white/10 dark:shadow-black/20',
            )}
        >
            {/* Left Section: Context & Navigation */}
            <div className="flex items-center gap-5">
                <div className="flex items-center">
                    <SidebarTrigger
                        className={cn(
                            'h-9 w-9 rounded-xl transition-all duration-300',
                            'text-primary/60 dark:text-white/60',
                            'hover:text-primary hover:bg-primary/[0.08] dark:hover:bg-white/[0.08] dark:hover:text-white',
                            'active:scale-90',
                        )}
                    />
                </div>

                <div className="bg-primary/10 hidden h-4 w-px md:block dark:bg-white/10" />

                <div className="hidden md:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center gap-1.5">
                {/* Action Group */}
                <div className="bg-primary/[0.03] border-primary/5 flex items-center gap-0.5 rounded-xl border px-1 py-1 dark:border-white/5 dark:bg-white/[0.03]">
                    <HeaderLanguage />
                    <HeaderChat />
                    <HeaderNotifications />
                    <HeaderHelp />
                </div>

                {/* Separator */}
                <div className="bg-primary/10 mx-1 h-5 w-px dark:bg-white/10" />

                {/* System Group */}
                <div className="flex items-center gap-1">
                    <SiteCustomizer />
                    <AppearanceToggleDropdown />
                </div>

                {/* Profile Section */}
                <div className="border-primary/10 ml-2 border-l pl-2 dark:border-white/10">
                    <HeaderUserMenu />
                </div>
            </div>

            {/* Subtle Bottom Accent */}
            <div className="absolute bottom-0 left-1/2 h-[1px] w-[40%] -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent dark:via-white" />
        </header>
    );
});
