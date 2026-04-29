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
    Tags,
    Users,
    X,
    Building2,
    Truck,
    UserCheck,
    FolderClosed,
    FileCode,
    ScanLine,
    Workflow,
    UserCog,
    KeyRound,
    ShieldAlert,
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
    Tags,
    Building2,
    Truck,
    UserCheck,
    FolderClosed,
    FileCode,
    ScanLine,
    Workflow,
    UserCog,
    KeyRound,
    ShieldAlert,
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
                                <Search className="text-sidebar-foreground/40 group-focus-within/search:text-sidebar-primary absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 transition-colors duration-300" />
                                <input
                                    type="text"
                                    placeholder="Cari fitur..."
                                    className="bg-sidebar-accent/50 border-sidebar-border/50 focus:ring-sidebar-primary/20 w-full h-9 rounded-lg border py-2 pr-12 pl-10 text-[13px] font-semibold transition-all duration-300 outline-none focus:bg-sidebar-accent focus:ring-2 text-sidebar-foreground placeholder:text-sidebar-foreground/30"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus={search !== ''}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 opacity-40 group-focus-within/search:opacity-0 transition-opacity duration-300">
                                    <kbd className="flex h-5 items-center justify-center rounded border border-sidebar-foreground/20 px-1.5 font-sans text-[10px] font-bold text-sidebar-foreground">
                                        K
                                    </kbd>
                                </div>
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="hover:bg-white/10 absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 transition-colors"
                                    >
                                        <X className="text-sidebar-foreground/60 h-3.5 w-3.5" />
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
