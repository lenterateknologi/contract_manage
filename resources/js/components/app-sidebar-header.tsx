import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type NavGroup, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    BarChart3,
    Clock,
    FileEdit,
    FilePlus,
    FileText,
    GitBranch,
    History,
    LayoutGrid,
    Settings2,
    ShieldCheck,
    Users,
    type LucideIcon,
} from 'lucide-react';

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
        for (const group of (sidebarNavGroups as NavGroup[]) || []) {
            const activeItem = group.items.find((item) => item.url === currentUrl || currentUrl.startsWith(item.url + '/'));
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
                                    {Icon && <Icon className="text-primary h-4 w-4" />}
                                    <span className="text-sm font-black tracking-widest whitespace-nowrap text-slate-900 uppercase">{pageTitle}</span>
                                </div>
                                {pageDescription && (
                                    <span className="hidden text-[11px] font-medium whitespace-nowrap text-slate-400 sm:block">
                                        — {pageDescription}
                                    </span>
                                )}
                            </div>
                            <div className="hidden h-4 w-[1px] bg-slate-200 sm:block" />
                        </div>
                    )}
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
        </header>
    );
}
