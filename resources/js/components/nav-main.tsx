import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroupContent } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export function NavMain({ title, items = [] }: { title?: string; items: NavItem[] }) {
    const page = usePage();
    
    return (
        <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="px-2 py-0">
                {title && (
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between px-3 mt-6 mb-2 cursor-pointer group/trigger">
                            <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.15em] font-bold text-sidebar-foreground/40 antialiased p-0 h-auto group-hover/trigger:text-sidebar-foreground transition-colors duration-200">
                                {title}
                            </SidebarGroupLabel>
                            <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/20 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </div>
                    </CollapsibleTrigger>
                )}
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5 px-1.5">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton 
                                        asChild 
                                        isActive={item.url === page.url}
                                        tooltip={item.title}
                                        className={cn(
                                            "h-9 px-2 transition-all duration-200 overflow-hidden relative group/btn rounded-lg",
                                            item.url === page.url 
                                                ? "bg-sidebar-accent text-sidebar-primary font-semibold" 
                                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground font-medium"
                                        )}
                                    >
                                        <Link href={item.url} className="flex items-center gap-3 w-full h-full">
                                            {item.icon && (
                                                <item.icon 
                                                    className={cn(
                                                        "h-[18px] w-[18px] shrink-0 transition-colors duration-200", 
                                                        item.url === page.url 
                                                            ? "text-sidebar-primary" 
                                                            : "text-sidebar-foreground/40 group-hover/btn:text-sidebar-foreground/70"
                                                    )} 
                                                />
                                            )}
                                            <span className="text-[13.5px] truncate tracking-tight">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}
