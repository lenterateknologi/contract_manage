import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export function NavMain({ title, items = [] }: { title?: string; items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            {title && (
                <SidebarGroupLabel className="text-[9px] uppercase tracking-widest font-bold opacity-60 px-2 mt-2">
                    {title}
                </SidebarGroupLabel>
            )}
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                            asChild 
                            isActive={item.url === page.url}
                            tooltip={item.title}
                            className={cn(
                                "h-8 px-0 transition-all duration-200 overflow-hidden",
                                item.url === page.url ? "bg-primary/5 text-primary font-bold shadow-sm" : "hover:bg-muted/50"
                            )}
                        >
                            <Link href={item.url} prefetch className="flex items-center gap-2 w-full h-full px-2">
                                {item.icon && <item.icon className={cn("h-3.5 w-3.5 shrink-0", item.url === page.url ? "text-primary" : "text-muted-foreground")} />}
                                <span className="text-[11px] truncate tracking-tight">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
