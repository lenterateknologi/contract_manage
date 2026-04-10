import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export function NavMain({ title, items = [] }: { title?: string; items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            {title && (
                <SidebarGroupLabel className="text-[12px] uppercase tracking-widest font-bold opacity-80 px-2 mt-4 mb-1 text-slate-500">
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
                                "h-10 px-0 transition-all duration-200 overflow-hidden",
                                item.url === page.url ? "bg-primary/8 text-primary font-bold shadow-sm" : "hover:bg-muted/50"
                            )}
                        >
                            <Link href={item.url} prefetch className="flex items-center gap-3 w-full h-full px-3">
                                {item.icon && <item.icon className={cn("h-[18px] w-[18px] shrink-0", item.url === page.url ? "text-primary" : "text-muted-foreground/80")} />}
                                <span className="text-[14.5px] truncate tracking-tight">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
