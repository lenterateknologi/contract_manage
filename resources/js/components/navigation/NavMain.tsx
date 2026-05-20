import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/base/Collapsible';
import { HighlightingCell } from '@/components/ui/data/Highlighter';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/navigation/Sidebar';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { memo } from 'react';

export const NavMain = memo(function NavMain({ title, items = [], search = '' }: Readonly<{ title?: string; items: NavItem[]; search?: string }>) {
    const page = usePage();

    return (
        <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="px-2 py-0">
                {title && (
                    <CollapsibleTrigger asChild>
                        <div className="group/trigger mt-6 mb-2 flex cursor-pointer items-center justify-between px-3">
                            <SidebarGroupLabel className="text-sidebar-foreground/40 group-hover/trigger:text-sidebar-foreground h-auto p-0 text-[11px] font-bold tracking-[0.15em] uppercase antialiased transition-colors duration-200">
                                {title}
                            </SidebarGroupLabel>
                            <ChevronRight className="text-sidebar-foreground/20 h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </div>
                    </CollapsibleTrigger>
                )}
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5 px-1.5">
                            {items.map((item) => {
                                const isActive = page.url.split('?')[0] === item.url.split('?')[0];
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={cn(
                                                'group/btn relative h-9 overflow-hidden rounded-xl px-3 transition-all duration-300',
                                                isActive
                                                    ? 'bg-sidebar-accent/80 border-sidebar-border/60 text-sidebar-primary animate-in fade-in slide-in-from-left-1 border font-semibold shadow-sm duration-300 dark:shadow-black/20'
                                                    : 'hover:bg-sidebar-accent/40 text-sidebar-foreground/70 hover:text-sidebar-foreground font-medium',
                                            )}
                                        >
                                            <Link href={item.url} className="flex h-full w-full items-center gap-3">
                                                {item.icon && (
                                                    <item.icon
                                                        className={cn(
                                                            'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
                                                            isActive
                                                                ? 'text-sidebar-primary'
                                                                : 'text-sidebar-foreground/40 group-hover/btn:text-sidebar-foreground/70',
                                                        )}
                                                    />
                                                )}
                                                <span className="truncate text-[13.5px] tracking-tight">
                                                    <HighlightingCell text={item.title} search={search} />
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
});
