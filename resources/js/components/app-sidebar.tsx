import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
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
    Search, 
    X,
    type LucideIcon 
} from 'lucide-react';
import React, { useState } from 'react';
import AppLogo from './app-logo';
import { cn } from '@/lib/utils';

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

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { sidebarNavGroups } = usePage<SharedData>().props;
    const { state, setOpen } = useSidebar();
    const [search, setSearch] = useState('');

    const groups = ((sidebarNavGroups as NavGroup[]) ?? []).map((group) => ({
        ...group,
        items: group.items.map((item) => ({
            ...item,
            icon: typeof item.icon === 'string' ? iconMap[item.icon] ?? FileText : item.icon,
        })),
    }));

    const filteredGroups = groups.map(group => ({
        ...group,
        items: group.items.filter(item => 
            item.title.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip="Dashboard">
                            <Link href="/dashboard" prefetch className="flex items-center justify-center w-full h-full">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Global Unified Search */}
                <div className={cn("transition-all", state === 'collapsed' ? "mt-0 mb-2" : "px-2 mt-4 mb-2")}>
                    {state === 'collapsed' ? (
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    tooltip="Cari menu & fitur..."
                                    onClick={() => setOpen(true)}
                                    className="h-9 w-9 p-0 flex items-center justify-center mx-auto"
                                >
                                    <Search className="h-4 w-4" />
                                    <span className="sr-only">Cari...</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    ) : (
                        <div className="px-2">
                            <div className="relative group/search">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
                                <input 
                                    type="text"
                                    placeholder="Cari menu & fitur..."
                                    className="w-full bg-muted/30 border border-border rounded-md pl-9 pr-8 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus={search !== ''}
                                />
                                {search && (
                                    <button 
                                        onClick={() => setSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                                    >
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {filteredGroups.map((group) => (
                    <NavMain key={group.title} title={group.title} items={group.items} />
                ))}

                {search && filteredGroups.length === 0 && (
                    <div className="px-6 py-8 text-center animate-in fade-in zoom-in duration-300">
                        <p className="text-[12px] text-muted-foreground italic font-medium">Tidak ada menu ditemukan untuk "{search}"</p>
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
