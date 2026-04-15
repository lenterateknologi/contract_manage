import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Clock,
    FileEdit,
    FilePlus,
    FileText,
    GitBranch,
    History,
    LayoutGrid,
    Search,
    Settings2,
    ShieldCheck,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from './app-logo';

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
            icon: typeof item.icon === 'string' ? (iconMap[item.icon] ?? FileText) : item.icon,
        })),
    }));

    const filteredGroups = groups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip="Dashboard">
                            <Link href="/dashboard" className="flex h-full w-full items-center justify-center">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Global Unified Search */}
                <div className={cn('transition-all', state === 'collapsed' ? 'mt-0 mb-2' : 'mt-4 mb-2 px-2')}>
                    {state === 'collapsed' ? (
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Cari menu & fitur..."
                                    onClick={() => setOpen(true)}
                                    className="mx-auto flex h-9 w-9 items-center justify-center p-0"
                                >
                                    <Search className="h-4 w-4" />
                                    <span className="sr-only">Cari...</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    ) : (
                        <div className="px-2">
                            <div className="group/search relative">
                                <Search className="text-muted-foreground group-focus-within/search:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari menu & fitur..."
                                    className="bg-muted/30 border-border focus:ring-primary/20 w-full rounded-md border py-2 pr-8 pl-9 text-[14px] font-medium transition-all outline-none focus:ring-1"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus={search !== ''}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="hover:bg-muted absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1"
                                    >
                                        <X className="text-muted-foreground h-3.5 w-3.5" />
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
                    <div className="animate-in fade-in zoom-in px-6 py-8 text-center duration-300">
                        <p className="text-muted-foreground text-[12px] font-medium italic">Tidak ada menu ditemukan untuk "{search}"</p>
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
