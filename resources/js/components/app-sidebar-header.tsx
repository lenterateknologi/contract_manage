import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="border-sidebar-border/50 flex h-12 shrink-0 items-center gap-3 border-b px-4 transition-[width,height] ease-linear">
            <SidebarTrigger className="-ml-1 h-7 w-7 shrink-0" />
            <div className="h-4 w-px bg-slate-200 shrink-0" />
            <Breadcrumbs breadcrumbs={breadcrumbs} />
        </header>
    );
}
