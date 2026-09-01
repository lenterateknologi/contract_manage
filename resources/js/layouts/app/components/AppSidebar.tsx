// ponytail: double sidebar with dynamic width adjustment for content
import { HeaderUserMenu } from '@/layouts/app/components/header/HeaderUserMenu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialogs/Dialog';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/navigation/Sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/feedback/Tooltip';
import { HighlightingCell } from '@/components/ui/utilities/Highlighter';
import { cn } from '@/lib/utils';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Archive,
    BarChart3,
    Building2,
    ChevronRight,
    Clock,
    FileCode,
    FileEdit,
    FilePlus,
    FileText,
    FolderClosed,
    GitBranch,
    History,
    KeyRound,
    LayoutDashboard,
    LayoutGrid,
    PanelLeftClose,
    PanelLeftOpen,
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

const iconMap: Record<string, LucideIcon> = {
    Archive,
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
    LayoutDashboard,
};

const PRIMARY_WIDTH = 72; // px
const SUB_WIDTH = 260; // px

export const AppSidebar = memo(function AppSidebar() {
    const page = usePage<SharedData>();
    const { sidebarNavGroups, auth } = page.props;
    const currentPath = page.url.split('?')[0];
    const { setOpenMobile, isMobile } = useSidebar();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Persisted state for secondary sub-sidebar (default true: terbuka)
    const [isSubOpen, setIsSubOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sub_sidebar_open');
            return saved !== null ? saved === 'true' : true;
        }
        return true;
    });

    const toggleSubSidebar = () => {
        setIsSubOpen((prev) => {
            const next = !prev;
            localStorage.setItem('sub_sidebar_open', String(next));
            return next;
        });
    };

    // Listen for header SidebarTrigger button click to toggle sub-sidebar
    const { toggleSidebar: nativeToggleSidebar } = useSidebar();
    useEffect(() => {
        const handleHeaderToggle = () => {
            toggleSubSidebar();
        };
        window.addEventListener('toggle-sidebar', handleHeaderToggle);
        return () => window.removeEventListener('toggle-sidebar', handleHeaderToggle);
    }, []);

    // Keyboard shortcut (⌘K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen((open) => !open);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const groups = useMemo(() => {
        return ((sidebarNavGroups as NavGroup[]) ?? []).map((group) => {
            const items = group.items.map((item) => ({
                ...item,
                icon: typeof item.icon === 'string' ? (iconMap[item.icon] ?? FileText) : item.icon,
            }));

            // Prefer the group's own icon field, fall back to first item's icon
            const groupIconName = (group as any).icon as string | null | undefined;
            const primaryIcon = groupIconName
                ? (iconMap[groupIconName] ?? LayoutDashboard)
                : (items.find((i) => i.icon)?.icon ?? LayoutDashboard);

            return {
                ...group,
                icon: primaryIcon,
                items,
            };
        });
    }, [sidebarNavGroups]);

    // Active group detection
    const activeGroupTitle = useMemo(() => {
        if (!groups.length) return '';
        for (const g of groups) {
            if (g.items.some((item) => {
                const itemPath = item.url.split('?')[0];
                if (itemPath === currentPath) return true;
                if (itemPath !== '/' && itemPath !== '' && currentPath.startsWith(itemPath)) return true;
                return false;
            })) {
                return g.title;
            }
        }
        const dashboardGroup = groups.find((g) =>
            g.items.some((item) => item.url.includes('/dashboard')) ||
            g.title.toLowerCase().includes('dashboard') ||
            g.title.toLowerCase().includes('utama') ||
            g.title.toLowerCase().includes('main')
        );
        return dashboardGroup?.title ?? groups[0]?.title ?? '';
    }, [groups, currentPath]);

    const [selectedGroupTitle, setSelectedGroupTitle] = useState(activeGroupTitle);

    useEffect(() => {
        if (activeGroupTitle) {
            setSelectedGroupTitle(activeGroupTitle);
        } else if (groups.length > 0) {
            setSelectedGroupTitle(groups[0].title);
        }
    }, [activeGroupTitle, groups]);

    const currentGroup = useMemo(() => {
        return groups.find((g) => g.title === selectedGroupTitle) ?? groups[0] ?? null;
    }, [groups, selectedGroupTitle]);

    const allUrls = useMemo(() => {
        return groups.flatMap((g) => g.items).map((item) => item.url.split('?')[0]);
    }, [groups]);

    const checkActive = (itemUrl: string) => {
        const itemPath = itemUrl.split('?')[0];
        if (currentPath === itemPath) return true;
        if (itemPath === '/') return currentPath === '/';
        if (!currentPath.startsWith(itemPath + '/')) return false;

        const hasBetterMatch = allUrls.some((url) => {
            if (url === itemPath) return false;
            return currentPath.startsWith(url) && url.length > itemPath.length;
        });
        return !hasBetterMatch;
    };

    // Calculate dynamic total sidebar width in px
    const totalSidebarWidth = isSubOpen ? PRIMARY_WIDTH + SUB_WIDTH : PRIMARY_WIDTH;

    // Search dialog filtering
    const searchDialogResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const results: Array<{ item: NavItem; groupTitle: string }> = [];

        for (const group of groups) {
            for (const item of group.items) {
                if (item.title.toLowerCase().includes(q) || group.title.toLowerCase().includes(q)) {
                    results.push({ item, groupTitle: group.title });
                }
            }
        }
        return results;
    }, [groups, searchQuery]);

    return (
        <TooltipProvider delayDuration={100}>
            <Sidebar
                collapsible="none"
                variant="inset"
                style={{ '--sidebar-width': `${totalSidebarWidth}px` } as React.CSSProperties}
                className="h-svh max-h-svh overflow-hidden border-r-0 bg-transparent p-0 transition-[width] duration-200 ease-linear" // ponytail: keep outer transparent
            >
                <div className="flex h-full max-h-full w-full select-none overflow-hidden">
                    {/* ========================================================================= */}
                    {/* 1. PRIMARY SIDEBAR (Compact Icon Bar: Logo, Search, Groups with Label)   */}
                    {/* ========================================================================= */}
                    <div
                        style={{ width: `${PRIMARY_WIDTH}px` }}
                        className="bg-sidebar/20 flex h-full max-h-full shrink-0 flex-col items-center justify-between border-r border-sidebar-border/60 z-20 overflow-hidden" // ponytail: lighter background for primary sidebar
                    >
                        {/* Top: Logo with matching h-16 Header and border-b divider */}
                        <div className="flex h-16 w-full shrink-0 items-center justify-center border-b border-sidebar-border/40">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/dashboard"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105"
                                    >
                                        <img
                                            src="/images/logo.png"
                                            alt="Logo"
                                            className="size-10 object-contain dark:brightness-0 dark:invert"
                                        />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} className="font-semibold">
                                    Dashboard
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Middle: Search and Module Groups (Scrollable) */}
                        <div className="flex w-full flex-1 min-h-0 flex-col items-center gap-2 py-3 overflow-y-auto overflow-x-hidden no-scrollbar">
                            {/* Search Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => setIsSearchOpen(true)}
                                        className={cn(
                                            'group relative flex w-[64px] flex-col items-center justify-center rounded-xl py-2 px-1 transition-all duration-200 cursor-pointer',
                                            isSearchOpen
                                                ? 'bg-primary/15 text-primary dark:text-primary-foreground font-semibold'
                                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                                        )}
                                    >
                                        <Search className="size-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                        <span className="mt-1 max-w-[58px] truncate text-[10px] leading-tight tracking-tight text-center">
                                            Cari
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} className="font-medium">
                                    Cari Menu (⌘K / Ctrl+K)
                                </TooltipContent>
                            </Tooltip>

                            <div className="h-px w-8 shrink-0 bg-sidebar-border/60 my-0.5" />

                            {/* Group List with Label Below */}
                            <div className="flex w-full flex-col items-center gap-1.5 px-1">
                                {groups.map((group) => {
                                    const isSelected = group.title === selectedGroupTitle;
                                    const GroupIcon = group.icon;

                                    return (
                                        <Tooltip key={group.title}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedGroupTitle(group.title);
                                                        if (!isSubOpen) setIsSubOpen(true);
                                                    }}
                                                    className={cn(
                                                        'group relative flex w-[64px] flex-col items-center justify-center rounded-xl py-2 px-1 transition-all duration-200 cursor-pointer',
                                                        isSelected
                                                            ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                                                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                                                    )}
                                                >
                                                    <GroupIcon className={cn('size-5 shrink-0 transition-transform duration-200 group-hover:scale-110', isSelected ? 'text-primary-foreground' : 'text-sidebar-foreground/70')} />
                                                    <span className={cn(
                                                        'mt-1 max-w-[58px] truncate text-[10px] leading-tight tracking-tight text-center',
                                                        isSelected ? 'text-primary-foreground font-medium' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                                                    )}>
                                                        {group.title}
                                                    </span>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" sideOffset={10} className="font-medium">
                                                {group.title}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom: Sub Sidebar Toggle & HeaderUserMenu */}
                        <div className="flex w-full shrink-0 flex-col items-center gap-2.5 pt-2 pb-3 border-t border-sidebar-border/40">
                            {/* Toggle Sub-Sidebar Expand/Collapse */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={toggleSubSidebar}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer"
                                    >
                                        {isSubOpen ? (
                                            <PanelLeftClose className="size-4" />
                                        ) : (
                                            <PanelLeftOpen className="size-4" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10}>
                                    {isSubOpen ? 'Sembunyikan Sub-Menu' : 'Tampilkan Sub-Menu'}
                                </TooltipContent>
                            </Tooltip>

                            {/* Exact HeaderUserMenu Component as in Navbar */}
                            <HeaderUserMenu />
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* 2. SECONDARY SUB-SIDEBAR (Collapsible Sub-menu items)                     */}
                    {/* ========================================================================= */}
                    <div
                        style={{ width: isSubOpen ? `${SUB_WIDTH}px` : '0px' }}
                        className={cn(
                            'bg-sidebar/20 flex h-full max-h-full flex-col border-r border-sidebar-border/60 transition-all duration-200 ease-linear backdrop-blur-xs overflow-hidden', // ponytail: lighter background for sub-sidebar
                            isSubOpen ? 'opacity-100' : 'overflow-hidden border-r-0 opacity-0 pointer-events-none',
                        )}
                    >
                        {/* Sub Header Top: App Name & Tagline (Height h-16 perfectly matching main navbar) */}
                        <div className="flex h-16 items-center px-4 border-b border-sidebar-border/40 shrink-0">
                            <div className="flex flex-col justify-center truncate">
                                <span className="text-sidebar-foreground text-[15px] leading-tight font-bold tracking-tight">
                                    ABSAH
                                </span>
                                <span className="text-sidebar-foreground/50 text-[10px] leading-tight font-medium truncate mt-0.5">
                                    Legal Management System
                                </span>
                            </div>
                        </div>

                        {/* Sub Header: Group Title */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-sidebar-border/40 shrink-0 bg-sidebar-accent/15">
                            <span className="text-[11.5px] font-bold uppercase tracking-wider text-sidebar-foreground/75 truncate">
                                {currentGroup?.title ?? 'Menu'}
                            </span>
                            <span className="text-[10px] text-sidebar-foreground/40 font-medium">
                                {currentGroup?.items.length ?? 0} menu
                            </span>
                        </div>

                        {/* Sub Menu Item List - Rounded selected items */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                            {currentGroup?.items.map((item) => {
                                const isActive = checkActive(item.url);
                                const ItemIcon = item.icon ?? FileText;

                                return (
                                    <Link
                                        key={item.title}
                                        href={item.url}
                                        onClick={() => {
                                            if (isMobile) setOpenMobile(false);
                                        }}
                                        className={cn(
                                            'group relative flex w-full items-start gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                                                : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                                        )}
                                    >
                                        <ItemIcon
                                            className={cn(
                                                'size-4.5 shrink-0 transition-colors mt-0.5',
                                                isActive ? 'text-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80',
                                            )}
                                        />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="truncate tracking-tight leading-tight">
                                                {item.title}
                                            </span>
                                            {item.description && (
                                                <span
                                                    className={cn(
                                                        'text-[11px] leading-tight truncate mt-0.5 font-normal',
                                                        isActive ? 'text-primary-foreground/80' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70',
                                                    )}
                                                >
                                                    {item.description}
                                                </span>
                                            )}
                                        </div>
                                        {item.badge !== undefined && item.badge !== null && (
                                            <span
                                                className={cn(
                                                    'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0 transition-colors',
                                                    isActive
                                                        ? 'bg-primary-foreground/20 text-primary-foreground'
                                                        : 'bg-sidebar-accent/80 text-sidebar-foreground/70 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground',
                                                )}
                                                title={`${item.badge} data sistem aktif`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Sidebar>

            {/* ========================================================================= */}
            {/* SEARCH MODAL DIALOG (⌘K / Ctrl+K)                                         */}
            {/* ========================================================================= */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden gap-0 border-border/80 shadow-2xl rounded-2xl">
                    <DialogTitle className="sr-only">Cari Menu & Fitur</DialogTitle>
                    
                    {/* Search Input in Dialog */}
                    <div className="flex items-center px-4 border-b border-border/60 bg-muted/20">
                        <Search className="size-5 text-muted-foreground/70 shrink-0 mr-3" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Cari semua menu, modul & fitur... (contoh: Kontrak, User, Vendor)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 w-full bg-transparent text-sm placeholder:text-muted-foreground/60 outline-none"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="p-1 text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Area */}
                    <div className="max-h-[360px] overflow-y-auto p-2">
                        {searchQuery.trim() === '' ? (
                            <div className="p-6 text-center text-xs text-muted-foreground">
                                Ketik kata kunci untuk mencari menu di seluruh sistem.
                            </div>
                        ) : searchDialogResults.length > 0 ? (
                            <div className="space-y-1">
                                {searchDialogResults.map(({ item, groupTitle }) => {
                                    const ItemIcon = item.icon ?? FileText;
                                    return (
                                        <Link
                                            key={`${groupTitle}-${item.title}`}
                                            href={item.url}
                                            onClick={() => {
                                                setIsSearchOpen(false);
                                                setSearchQuery('');
                                                setSelectedGroupTitle(groupTitle);
                                                if (isMobile) setOpenMobile(false);
                                            }}
                                            className="group flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <ItemIcon className="size-4.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                                                <span className="font-medium truncate text-foreground group-hover:text-primary">
                                                    <HighlightingCell text={item.title} search={searchQuery} />
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[11px] font-medium text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-md">
                                                    {groupTitle}
                                                </span>
                                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Tidak ditemukan menu untuk "{searchQuery}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-t border-border/40 text-[11px] text-muted-foreground">
                        <span>Pilih menu untuk langsung navigasi</span>
                        <div className="flex items-center gap-1.5">
                            <kbd className="border border-border rounded px-1.5 py-0.5 font-mono text-[10px] bg-background">ESC</kbd>
                            <span>tutup</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
});
