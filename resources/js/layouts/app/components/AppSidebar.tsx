import { NavFooter } from '@/layouts/app/components/nav/NavFooter';
import { NavMain } from '@/layouts/app/components/nav/NavMain';
import { NavUser } from '@/layouts/app/components/nav/NavUser';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/navigation/Sidebar';
import { cn } from '@/lib/utils';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    Clock,
    FileCode,
    FileEdit,
    FilePlus,
    FileText,
    FolderClosed,
    GitBranch,
    History,
    KeyRound,
    LayoutGrid,
    ScanLine,
    Search,
    Settings2,
    ShieldAlert,
    ShieldCheck,
    Tags,
    Truck,
    UserCheck,
    UserCog,
    Users,
    Workflow,
    X,
    MessageSquare,
    type LucideIcon,
} from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import AppLogo from './AppLogo';

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
    MessageSquare,
};

const footerNavItems: NavItem[] = [];

export const AppSidebar = memo(function AppSidebar() {
    const { sidebarNavGroups } = usePage<SharedData>().props;
    const { state, setOpen } = useSidebar();
    const [search, setSearch] = useState('');

    const groups = useMemo(() => {
        return ((sidebarNavGroups as NavGroup[]) ?? []).map((group) => {
            return {
                ...group,
                items: group.items.map((item) => {
                    return {
                        ...item,
                        icon: typeof item.icon === 'string' ? (iconMap[item.icon] ?? FileText) : item.icon,
                    };
                }),
            };
        });
    }, [sidebarNavGroups]);

    const filteredGroups = useMemo(() => {
        if (!search) return groups;
        const lowerSearch = search.toLowerCase();
        return groups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => item.title.toLowerCase().includes(lowerSearch)),
            }))
            .filter((group) => group.items.length > 0);
    }, [groups, search]);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
                inputRef.current?.focus();
            }
        };
        globalThis.window.addEventListener('keydown', handleKeyDown);
        return () => globalThis.window.removeEventListener('keydown', handleKeyDown);
    }, [setOpen]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            tooltip="Dashboard"
                            className="group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-0"
                        >
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
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    ) : (
                        <div className="px-2">
                            <div className="group/search relative">
                                <SearchInput
                                    ref={inputRef}
                                    placeholder="Cari fitur..."
                                    className="bg-sidebar-accent/50 border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/30 h-9 w-full rounded-lg pr-12 text-[13px] font-semibold transition-all duration-300"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus={search !== ''}
                                />
                                <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 opacity-40 transition-opacity duration-300 group-focus-within/search:opacity-0">
                                    <kbd className="border-sidebar-foreground/20 text-sidebar-foreground flex h-5 items-center justify-center rounded border px-1.5 font-sans text-[10px] font-bold">
                                        K
                                    </kbd>
                                </div>
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-white/10"
                                    >
                                        <X className="text-sidebar-foreground/60 h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {filteredGroups.map((group) => (
                    <NavMain key={group.title} title={group.title} items={group.items} search={search} />
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
});
