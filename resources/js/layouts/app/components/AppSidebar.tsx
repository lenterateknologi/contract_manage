// ponytail: double sidebar with dynamic width adjustment for content
import { HeaderNotifications } from '@/layouts/app/components/header/HeaderNotifications';
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
import { useDetailSidebar, type DetailSidebarTabItem } from '@/stores/useDetailSidebarStore';
import {
    Archive,
    ArrowLeft,
    BarChart3,
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Clock,
    FileCheck,
    FileCode,
    FileEdit,
    FilePlus,
    FileText,
    FolderClosed,
    GitBranch,
    History,
    KeyRound,
    Layers,
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
    User,
    UserCheck,
    UserCog,
    Users,
    Workflow,
    X,
    Zap,
    ExternalLink,
    MessageSquare,
    type LucideIcon,
} from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

const iconMap: Record<string, LucideIcon> = {
    Archive,
    LayoutGrid,
    FileText,
    FileCheck,
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
    Layers,
    Zap,
};

const PRIMARY_WIDTH = 72; // px
const SUB_WIDTH = 260; // px

const NavTreeItem = memo(function NavTreeItem({
    item,
    isMobile,
    setOpenMobile,
    checkActive,
    isAnyChildActive,
    onNavigate,
}: {
    item: NavItem;
    isMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    checkActive: (url: string) => boolean;
    isAnyChildActive: (item: NavItem) => boolean;
    onNavigate?: () => void;
}) {
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isChildActive = hasChildren ? isAnyChildActive(item) : false;
    const isSelfActive = checkActive(item.url);

    // Default minimized, only expand when this specific item or its child is selected/active
    const [isExpanded, setIsExpanded] = useState<boolean>(() => isChildActive || isSelfActive);

    // When active selection changes (user navigates to another menu), collapse this item if not active
    useEffect(() => {
        setIsExpanded(isChildActive || isSelfActive);
    }, [isChildActive, isSelfActive]);

    const ItemIcon = item.icon ?? FileText;

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center w-full group/nav">
                <Link
                    href={item.url}
                    onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        onNavigate?.();
                    }}
                    className={cn(
                        'group relative flex flex-1 items-start gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 min-w-0',
                        isSelfActive
                            ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                            : isChildActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                    )}
                >
                    <ItemIcon
                        className={cn(
                            'size-4.5 shrink-0 transition-colors mt-0.5',
                            isSelfActive
                                ? 'text-primary-foreground'
                                : isChildActive
                                    ? 'text-primary'
                                    : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80',
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
                                    isSelfActive ? 'text-primary-foreground/80' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70',
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
                                isSelfActive
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-sidebar-accent/80 text-sidebar-foreground/70 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground',
                            )}
                            title={`${item.badge} data sistem aktif`}
                        >
                            {item.badge}
                        </span>
                    )}
                </Link>

                {hasChildren && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsExpanded((prev) => !prev);
                        }}
                        className="ml-1 p-1.5 rounded-lg text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors cursor-pointer shrink-0"
                        title={isExpanded ? 'Sembunyikan sub-menu' : 'Buka sub-menu'}
                    >
                        <ChevronRight
                            size={14}
                            className={cn('transition-transform duration-200', isExpanded && 'rotate-90')}
                        />
                    </button>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="relative ml-4.5 pl-3.5 my-1 space-y-1 border-l-2 border-sidebar-border/70">
                    {item.children!.map((child) => {
                        const isSubActive = checkActive(child.url);
                        const ChildIcon = child.icon ?? FileText;

                        return (
                            <Link
                                key={child.url}
                                href={child.url}
                                onClick={() => {
                                    if (isMobile) setOpenMobile(false);
                                    onNavigate?.();
                                }}
                                className={cn(
                                    'relative group flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150 min-w-0',
                                    'before:absolute before:-left-[15px] before:top-1/2 before:-translate-y-1/2 before:w-2.5 before:h-[2px] before:bg-sidebar-border/80 before:rounded-full',
                                    isSubActive
                                        ? 'bg-primary text-primary-foreground shadow-xs font-semibold before:bg-primary'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                                )}
                            >
                                <ChildIcon
                                    className={cn(
                                        'size-3.5 shrink-0 transition-colors mt-0.5',
                                        isSubActive
                                            ? 'text-primary-foreground'
                                            : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80',
                                    )}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="truncate tracking-tight leading-tight">
                                        {child.title}
                                    </span>
                                    {child.description && (
                                        <span
                                            className={cn(
                                                'text-[10px] leading-tight truncate mt-0.5 font-normal',
                                                isSubActive ? 'text-primary-foreground/80' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70',
                                            )}
                                        >
                                            {child.description}
                                        </span>
                                    )}
                                </div>
                                {child.badge !== undefined && child.badge !== null && (
                                    <span
                                        className={cn(
                                            'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums shrink-0 transition-colors',
                                            isSubActive
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : 'bg-sidebar-accent/80 text-sidebar-foreground/70 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground',
                                        )}
                                        title={`${child.badge} data aktif`}
                                    >
                                        {child.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

const DetailNavTreeItem = memo(function DetailNavTreeItem({
    tab,
    activeTab,
    activeSubTab,
    onSelectTab,
}: {
    tab: DetailSidebarTabItem;
    activeTab: string;
    activeSubTab?: string;
    onSelectTab: (tabId: string, subtabId?: string) => void;
}) {
    const hasChildren = Boolean(tab.children && tab.children.length > 0);
    const isParentActive = activeTab === tab.id;
    const isChildActive = Boolean(
        tab.children?.some((child) => isParentActive && activeSubTab === child.id),
    );
    const [isOpen, setIsOpen] = useState(isParentActive || true);

    useEffect(() => {
        if (isParentActive) {
            setIsOpen(true);
        }
    }, [isParentActive]);

    const TabIcon = tab.icon;

    return (
        <div className="flex flex-col">
            <div
                onClick={() => {
                    if (hasChildren) {
                        const firstChild = tab.children?.[0]?.id;
                        onSelectTab(tab.id, firstChild);
                        setIsOpen(true);
                    } else {
                        onSelectTab(tab.id);
                    }
                }}
                className={cn(
                    'group relative flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer select-none',
                    isParentActive && !isChildActive
                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                        : isParentActive
                          ? 'text-primary font-bold bg-primary/10 dark:bg-primary/20'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <TabIcon
                        className={cn(
                            'size-4 shrink-0 transition-colors',
                            isParentActive && !isChildActive
                                ? 'text-primary-foreground'
                                : isParentActive
                                  ? 'text-primary'
                                  : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground',
                        )}
                    />
                    <span className="truncate">{tab.label}</span>
                </div>

                {hasChildren && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className="p-0.5 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground transition-transform"
                    >
                        <ChevronDown
                            className={cn('size-3.5 transition-transform duration-200', isOpen ? 'rotate-0' : '-rotate-90')}
                        />
                    </button>
                )}
            </div>

            {/* Tree Branch for Children */}
            {hasChildren && isOpen && (
                <div className="relative ml-4 mt-1 flex flex-col space-y-1 pl-3 border-l-2 border-sidebar-border/70">
                    {tab.children!.map((child) => {
                        const isThisChildActive =
                            isParentActive &&
                            (activeSubTab === child.id || (!activeSubTab && tab.children![0].id === child.id));
                        const ChildIcon = child.icon;

                        return (
                            <button
                                key={child.id}
                                type="button"
                                onClick={() => onSelectTab(tab.id, child.id)}
                                className={cn(
                                    'relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-150 cursor-pointer text-left',
                                    'before:absolute before:-left-[14px] before:top-1/2 before:-translate-y-1/2 before:w-2.5 before:h-[2px] before:bg-sidebar-border/70 before:rounded-full',
                                    isThisChildActive
                                        ? 'bg-primary text-primary-foreground font-bold shadow-2xs before:!bg-primary'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
                                )}
                            >
                                {ChildIcon && <ChildIcon className="size-3.5 shrink-0" />}
                                <span className="truncate">{child.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export const AppSidebar = memo(function AppSidebar() {
    const detailSidebar = useDetailSidebar();
    const page = usePage<SharedData>();
    const { sidebarNavGroups, auth } = page.props;
    const currentPath = page.url.split('?')[0];
    const { setOpenMobile, isMobile } = useSidebar();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // subMode: 'detail' (shows contract tabs) or 'main' (shows main system modules)
    const [subMode, setSubMode] = useState<'detail' | 'main'>('detail');

    // Automatically switch to 'detail' mode when a contract is selected / activated
    const prevDetailActiveRef = useRef(detailSidebar?.isActive);
    useEffect(() => {
        if (detailSidebar?.isActive && !prevDetailActiveRef.current) {
            setSubMode('detail');
        }
        prevDetailActiveRef.current = detailSidebar?.isActive;
    }, [detailSidebar?.isActive]);

    // Persisted state for secondary sub-sidebar (default true)
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
        const resolveIcon = (iconName: any) => {
            if (typeof iconName === 'string') return iconMap[iconName] ?? FileText;
            return iconName ?? FileText;
        };

        const mapItem = (item: NavItem): any => ({
            ...item,
            icon: resolveIcon(item.icon),
            children: item.children ? item.children.map(mapItem) : undefined,
        });

        return ((sidebarNavGroups as NavGroup[]) ?? []).map((group) => {
            const items = group.items.map(mapItem);

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
            const hasMatch = (items: NavItem[]): boolean => {
                return items.some((item) => {
                    const itemPath = item.url.split('?')[0];
                    if (itemPath === currentPath) return true;
                    if (itemPath !== '/' && itemPath !== '' && currentPath.startsWith(itemPath)) return true;
                    if (item.children && hasMatch(item.children)) return true;
                    return false;
                });
            };
            if (hasMatch(g.items)) {
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

    const allItems = useMemo(() => {
        const collectItems = (items: NavItem[]): NavItem[] => {
            return items.flatMap((item) => [item, ...(item.children ? collectItems(item.children) : [])]);
        };
        return groups.flatMap((g) => collectItems(g.items));
    }, [groups]);

    const allUrls = useMemo(() => {
        return allItems.map((item) => item.url.split('?')[0]);
    }, [allItems]);

    const checkActive = (itemUrl: string) => {
        const [currentPathname, currentQuery] = page.url.split('?');
        const currentParams = new URLSearchParams(currentQuery || '');

        if (itemUrl.includes('?')) {
            const [itemPath, itemQuery] = itemUrl.split('?');
            if (currentPathname !== itemPath) return false;

            const itemParams = new URLSearchParams(itemQuery);
            for (const [key, val] of itemParams.entries()) {
                const currentVal = currentParams.get(key);
                if (currentVal !== val) return false;
            }
            return true;
        }

        const itemPath = itemUrl.split('?')[0];
        if (currentPathname === itemPath) {
            // Check if there is another nav item with the exact same path that specifically matches the query string
            const hasMoreSpecificMatchingItem = allItems.some((other) => {
                if (other.url === itemUrl || !other.url.includes('?')) return false;
                const [oPath, oQuery] = other.url.split('?');
                if (oPath !== currentPathname) return false;
                const oParams = new URLSearchParams(oQuery);
                for (const [k, v] of oParams.entries()) {
                    if (currentParams.get(k) !== v) return false;
                }
                return true;
            });

            if (hasMoreSpecificMatchingItem) return false;
            return true;
        }

        if (itemPath === '/') return currentPath === '/';
        if (!currentPath.startsWith(itemPath + '/')) return false;

        const hasBetterMatch = allUrls.some((url) => {
            if (url === itemPath) return false;
            return currentPath.startsWith(url) && url.length > itemPath.length;
        });
        return !hasBetterMatch;
    };

    const isAnyChildActive = (item: NavItem): boolean => {
        if (!item.children || item.children.length === 0) return false;
        return item.children.some((child) => checkActive(child.url) || isAnyChildActive(child));
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
                variant="sidebar"
                style={{ '--sidebar-width': `${totalSidebarWidth}px` } as React.CSSProperties}
                className="h-svh max-h-svh overflow-hidden border-r-0 bg-transparent p-0 transition-[width] duration-200 ease-linear" // ponytail: keep outer transparent
            >
                <div className="flex h-full max-h-full w-full select-none overflow-hidden">
                    {/* ========================================================================= */}
                    {/* 1. PRIMARY SIDEBAR (Compact Icon Bar: Logo, Search, Groups with Label)   */}
                    {/* ========================================================================= */}
                    <div
                        style={{ width: `${PRIMARY_WIDTH}px` }}
                        className="bg-primary text-primary-foreground flex h-full max-h-full shrink-0 flex-col items-center justify-between border-r border-primary/20 z-20 overflow-hidden shadow-xs"
                    >
                        {/* Top: Logo with matching h-16 Header and border-b divider */}
                        <div className="flex h-16 w-full shrink-0 items-center justify-center border-b border-white/15">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/dashboard"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-105"
                                    >
                                        <img
                                            src="/images/logo.png"
                                            alt="Logo"
                                            className="size-9 object-contain brightness-0 invert"
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
                                                ? 'bg-white text-primary font-bold shadow-xs'
                                                : 'text-white/80 hover:bg-white/15 hover:text-white',
                                        )}
                                    >
                                        <Search className={cn('size-5 shrink-0 transition-transform duration-200 group-hover:scale-110', isSearchOpen ? 'text-primary' : 'text-white/80 group-hover:text-white')} />
                                        <span className={cn('mt-1 max-w-[58px] truncate text-[10px] leading-tight tracking-tight text-center', isSearchOpen ? 'text-primary font-bold' : 'text-white/80 group-hover:text-white')}>
                                            Cari
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} className="font-medium">
                                    Cari Menu (⌘K / Ctrl+K)
                                </TooltipContent>
                            </Tooltip>

                            <div className="h-px w-8 shrink-0 bg-white/20 my-0.5" />

                            {/* If contract detail is active, show the "Detail Kontrak" icon on top of the module list */}
                            {detailSidebar?.isActive && (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (subMode === 'detail' && isSubOpen) {
                                                        setIsSubOpen(false);
                                                    } else {
                                                        setSubMode('detail');
                                                        setIsSubOpen(true);
                                                    }
                                                }}
                                                className={cn(
                                                    'group relative flex w-[64px] flex-col items-center justify-center rounded-xl py-2 px-1 transition-all duration-200 cursor-pointer',
                                                    subMode === 'detail'
                                                        ? 'bg-white text-primary shadow-xs font-bold ring-2 ring-white/50'
                                                        : 'text-white/80 hover:bg-white/15 hover:text-white',
                                                )}
                                            >
                                                <FileText className={cn('size-5 shrink-0 transition-transform duration-200 group-hover:scale-110', subMode === 'detail' ? 'text-primary' : 'text-white/80 group-hover:text-white')} />
                                                <span className={cn(
                                                    'mt-1 max-w-[58px] truncate text-[9.5px] leading-tight tracking-tight text-center font-bold',
                                                    subMode === 'detail' ? 'text-primary' : 'text-white/80 group-hover:text-white'
                                                )}>
                                                    Pengajuan
                                                </span>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={10} className="font-medium">
                                            {subMode === 'detail' ? 'Buka Menu Utama' : 'Buka Menu Pengajuan'}
                                        </TooltipContent>
                                    </Tooltip>

                                    <div className="h-px w-8 shrink-0 bg-white/20 my-0.5" />
                                </>
                            )}

                            {/* Group List with Label Below */}
                            <div className="flex w-full flex-col items-center gap-1.5 px-1">
                                {groups.map((group) => {
                                    const isSelected = (!detailSidebar?.isActive || subMode === 'main') && group.title === selectedGroupTitle;
                                    const GroupIcon = group.icon;

                                    return (
                                        <Tooltip key={group.title}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (detailSidebar?.isActive) {
                                                            if (subMode === 'detail') {
                                                                setSelectedGroupTitle(group.title);
                                                                setSubMode('main');
                                                                setIsSubOpen(true);
                                                            } else if (selectedGroupTitle === group.title && isSubOpen) {
                                                                setIsSubOpen(false);
                                                            } else {
                                                                setSelectedGroupTitle(group.title);
                                                                setSubMode('main');
                                                                setIsSubOpen(true);
                                                            }
                                                        } else {
                                                            if (selectedGroupTitle === group.title && isSubOpen) {
                                                                setIsSubOpen(false);
                                                            } else {
                                                                setSelectedGroupTitle(group.title);
                                                                setIsSubOpen(true);
                                                            }
                                                        }
                                                    }}
                                                    className={cn(
                                                        'group relative flex w-[64px] flex-col items-center justify-center rounded-xl py-2 px-1 transition-all duration-200 cursor-pointer',
                                                        isSelected
                                                            ? 'bg-white text-primary shadow-xs font-bold'
                                                            : 'text-white/80 hover:bg-white/15 hover:text-white',
                                                    )}
                                                >
                                                    <GroupIcon className={cn('size-5 shrink-0 transition-transform duration-200 group-hover:scale-110', isSelected ? 'text-primary' : 'text-white/80 group-hover:text-white')} />
                                                    <span className={cn(
                                                        'mt-1 max-w-[58px] truncate text-[10px] leading-tight tracking-tight text-center',
                                                        isSelected ? 'text-primary font-bold' : 'text-white/80 group-hover:text-white'
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

                        {/* Bottom: Sub Sidebar Toggle, Notifications & HeaderUserMenu */}
                        <div className="flex w-full shrink-0 flex-col items-center gap-2 pt-2 pb-3 border-t border-white/15">
                            {/* Toggle Sub-Sidebar Expand/Collapse */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={toggleSubSidebar}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
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

                            {/* Notification Bell (Above Profile) */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center">
                                        <HeaderNotifications />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10}>
                                    Notifikasi
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
                        {detailSidebar?.isActive && subMode === 'detail' ? (
                            <>
                                {/* Detail Header Top: Back button + Switch to main menu button */}
                                <div className="flex h-16 items-center justify-between px-3 border-b border-sidebar-border/40 shrink-0 gap-2">
                                    <button
                                        type="button"
                                        onClick={detailSidebar.onClose}
                                        className="flex h-9 items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold text-sidebar-foreground bg-sidebar-accent/40 hover:bg-sidebar-accent/70 cursor-pointer transition-all shrink-0 hover:scale-102"
                                        title="Kembali ke Daftar Pengajuan"
                                    >
                                        <ArrowLeft size={14} strokeWidth={2.5} className="text-primary" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Kembali</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSubMode('main')}
                                        className="flex h-9 items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 cursor-pointer transition-all shrink-0"
                                        title="Buka Sub-side Menu Utama"
                                    >
                                        <LayoutGrid size={13} className="text-sidebar-foreground/60" />
                                        <span className="text-[10.5px] font-medium">Menu Utama</span>
                                    </button>
                                </div>

                                {/* Sub Header: Tabs Pengajuan */}
                                <div className="flex h-11 items-center justify-between px-4 border-b border-primary/20 shrink-0 bg-primary text-primary-foreground shadow-xs">
                                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-white truncate">
                                        Menu Pengajuan
                                    </span>
                                    <span className="text-[10px] text-white font-semibold bg-white/20 px-2 py-0.5 rounded-full tabular-nums">
                                        {detailSidebar.tabs.length} tabs
                                    </span>
                                </div>

                                 {/* Detail Tab Items with Tree hierarchy */}
                                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {detailSidebar.tabs.map((tab) => (
                                        <DetailNavTreeItem
                                            key={tab.id}
                                            tab={tab}
                                            activeTab={detailSidebar.activeTab}
                                            activeSubTab={detailSidebar.activeSubTab}
                                            onSelectTab={detailSidebar.onSelectTab}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* When viewing main menu while contract detail is active, show top button to return to contract tabs */}
                                {detailSidebar?.isActive && (
                                    <div className="p-2 border-b border-sidebar-border/50 bg-primary/5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setSubMode('detail')}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
                                            title="Kembali ke Sub-side Detail Kontrak"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText size={14} />
                                                <span className="truncate">Menu Pengajuan</span>
                                            </div>
                                            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold shrink-0">Buka</span>
                                        </button>
                                    </div>
                                )}

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

                                {/* Sub Header: Group Title (Colored Primary with h-11 matching table header proportion) */}
                                <div className="flex h-11 items-center justify-between px-4 border-b border-primary/20 shrink-0 bg-primary text-primary-foreground shadow-xs">
                                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-white truncate">
                                        {currentGroup?.title ?? 'Menu'}
                                    </span>
                                    <span className="text-[10px] text-white font-semibold bg-white/20 px-2 py-0.5 rounded-full tabular-nums">
                                        {currentGroup?.items.length ?? 0} menu
                                    </span>
                                </div>

                                {/* Sub Menu Item List - Tree and Rounded items */}
                                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {currentGroup?.items.map((item) => (
                                        <NavTreeItem
                                            key={item.title + item.url}
                                            item={item}
                                            isMobile={isMobile}
                                            setOpenMobile={setOpenMobile}
                                            checkActive={checkActive}
                                            isAnyChildActive={isAnyChildActive}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
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
