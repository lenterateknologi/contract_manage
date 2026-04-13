import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData, type NavGroup } from '@/types';
import { usePage } from '@inertiajs/react';
import { 
    LayoutGrid, 
    FileText, 
    Clock, 
    FilePlus, 
    FileEdit, 
    History, 
    ShieldCheck, 
    Users, 
    Settings2, 
    GitBranch, 
    BarChart3,
    type LucideIcon 
} from 'lucide-react';
import React from 'react';

const iconMap: Record<string, LucideIcon> = {
    LayoutGrid,
    FileText,
    Clock,
    FilePlus,
    FileEdit,
    History,
    Users,
    ShieldCheck,
    Settings2,
    GitBranch,
    BarChart3,
};

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { sidebarNavGroups } = usePage<SharedData>().props;
    
    // Fallback: Find active menu from sidebar navigation if breadcrumbs are missing or incomplete
    const findActiveMenuItem = () => {
        const currentUrl = window.location.pathname;
        for (const group of (sidebarNavGroups as NavGroup[] || [])) {
            const activeItem = group.items.find(item => item.url === currentUrl || currentUrl.startsWith(item.url + '/'));
            if (activeItem) return activeItem;
        }
        return null;
    };

    const activeItem = findActiveMenuItem();
    
    const lastItem = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;
    const pageTitle = lastItem?.title || activeItem?.title || '';
    const pageDescription = lastItem?.description || '';
    
    const iconName = lastItem?.icon || activeItem?.icon;
    const Icon = typeof iconName === 'string' ? iconMap[iconName] : iconName;

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-4 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-1" />
                <div className="flex items-center gap-3">
                    {pageTitle && (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                <div className="flex items-center gap-2">
                                    {Icon && <Icon className="h-4 w-4 text-primary" />}
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">
                                        {pageTitle}
                                    </span>
                                </div>
                                {pageDescription && (
                                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap hidden sm:block">
                                        — {pageDescription}
                                    </span>
                                )}
                            </div>
                            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
                        </div>
                    )}
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
        </header>
    );
}
