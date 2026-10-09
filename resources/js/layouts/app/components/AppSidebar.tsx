import { UserSwitchModal } from '@/components/impersonation/UserSwitchModal';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/feedback/Tooltip';
import { Sidebar, useSidebar } from '@/components/ui/navigation/Sidebar';
import { HighlightingCell } from '@/components/ui/utilities/Highlighter';
import { HeaderNotifications } from '@/layouts/app/components/header/HeaderNotifications';
import { HeaderUserMenu } from '@/layouts/app/components/header/HeaderUserMenu';
import { cn } from '@/lib/utils';
import { useDetailSidebar, type DetailSidebarTabItem } from '@/stores/useDetailSidebarStore';
import { usePov } from '@/stores/usePovStore';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Archive,
    ArrowLeft,
    ArrowRightLeft,
    BarChart3,
    Briefcase,
    Building2,
    ChevronDown,
    ChevronRight,
    Clock,
    Database,
    ExternalLink,
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
    MessageSquare,
    Network,
    ScanEye,
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
    Zap,
    type LucideIcon,
} from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

const iconMap: Record<string, LucideIcon> = {
    Archive,
    Briefcase,
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
    Network,
    ScanLine,
    Workflow,
    UserCog,
    KeyRound,
    ShieldAlert,
    MessageSquare,
    LayoutDashboard,
    Layers,
    Database,
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

    // Default expanded as requested
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    const ItemIcon = item.icon ?? FileText;

    return (
        <div className="flex w-full flex-col">
            <div className="group/nav flex w-full items-center">
                <Link
                    href={item.url}
                    onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        onNavigate?.();
                    }}
                    className={cn(
                        'group relative flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] transition-all duration-150',
                        isSelfActive
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-medium dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white',
                    )}
                >
                    {/* Active Icon Card (Card on selected icon) */}
                    <div
                        className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                            isSelfActive
                                ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground shadow-xs'
                                : isChildActive
                                  ? 'bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary'
                                  : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground dark:text-zinc-400 dark:group-hover:text-white',
                        )}
                    >
                        <ItemIcon
                            className={cn(
                                'size-4 transition-colors',
                                isSelfActive
                                    ? 'text-primary-foreground dark:text-primary-foreground'
                                    : isChildActive
                                      ? 'text-primary dark:text-primary'
                                      : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground dark:text-zinc-400 dark:group-hover:text-white',
                            )}
                        />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <span
                            className={cn(
                                'truncate leading-snug tracking-tight',
                                isSelfActive
                                    ? 'text-primary dark:text-primary font-bold'
                                    : 'text-sidebar-foreground group-hover:text-sidebar-foreground font-medium dark:text-zinc-200 dark:group-hover:text-white',
                            )}
                        >
                            {item.title}
                        </span>
                        {item.description && (
                            <span className="text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70 mt-0.5 truncate text-[10.5px] leading-tight font-normal dark:text-zinc-400 dark:group-hover:text-zinc-300">
                                {item.description}
                            </span>
                        )}
                    </div>
                </Link>

                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 shrink-0 cursor-pointer rounded-lg p-1.5 opacity-0 transition-colors group-hover/nav:opacity-100 focus:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
                    title="Buka di tab/jendela baru"
                >
                    <ExternalLink size={13} />
                </a>

                {hasChildren && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsExpanded((prev) => !prev);
                        }}
                        className="text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 ml-1 shrink-0 cursor-pointer rounded-lg p-1.5 transition-colors dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                        title={isExpanded ? 'Sembunyikan sub-menu' : 'Buka sub-menu'}
                    >
                        <ChevronRight size={14} className={cn('transition-transform duration-200', isExpanded && 'rotate-90')} />
                    </button>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="border-sidebar-border/70 relative my-1 ml-4.5 space-y-1 border-l-2 pl-3.5 dark:border-zinc-800">
                    {item.children!.map((child) => {
                        const isSubActive = checkActive(child.url);
                        const ChildIcon = child.icon ?? FileText;

                        return (
                            <div key={child.url} className="group/subnav flex w-full items-center">
                                <Link
                                    href={child.url}
                                    onClick={() => {
                                        if (isMobile) setOpenMobile(false);
                                        onNavigate?.();
                                    }}
                                    className={cn(
                                        'group relative flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12px] transition-all duration-150',
                                        'before:bg-sidebar-border/80 before:absolute before:top-1/2 before:-left-[15px] before:h-[2px] before:w-2.5 before:-translate-y-1/2 before:rounded-full dark:before:bg-zinc-700',
                                        isSubActive
                                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary before:!bg-primary dark:before:!bg-primary font-bold'
                                            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground font-medium dark:text-zinc-300 dark:hover:bg-zinc-800/50 dark:hover:text-white',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex size-5.5 shrink-0 items-center justify-center rounded-md transition-all',
                                            isSubActive
                                                ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground shadow-xs'
                                                : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground dark:text-zinc-400 dark:group-hover:text-white',
                                        )}
                                    >
                                        <ChildIcon
                                            className={cn(
                                                'size-3 transition-colors',
                                                isSubActive
                                                    ? 'text-primary-foreground dark:text-primary-foreground'
                                                    : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground dark:text-zinc-400 dark:group-hover:text-white',
                                            )}
                                        />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                                        <span
                                            className={cn(
                                                'truncate leading-snug tracking-tight',
                                                isSubActive
                                                    ? 'text-primary dark:text-primary font-bold'
                                                    : 'text-sidebar-foreground/80 group-hover:text-sidebar-foreground font-medium dark:text-zinc-300 dark:group-hover:text-white',
                                            )}
                                        >
                                            {child.title}
                                        </span>
                                        {child.description && (
                                            <span className="text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70 mt-0.5 truncate text-[10px] leading-tight font-normal dark:text-zinc-400 dark:group-hover:text-zinc-300">
                                                {child.description}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                <a
                                    href={child.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 ml-1 shrink-0 cursor-pointer rounded-md p-1 opacity-0 transition-colors group-hover/subnav:opacity-100 focus:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
                                    title="Buka di tab/jendela baru"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </div>
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
    contractId,
}: {
    tab: DetailSidebarTabItem;
    activeTab: string;
    activeSubTab?: string;
    onSelectTab: (tabId: string, subtabId?: string) => void;
    contractId?: string;
}) {
    const hasChildren = Boolean(tab.children && tab.children.length > 0);
    const isParentActive = activeTab === tab.id;
    const isChildActive = Boolean(tab.children?.some((child) => isParentActive && activeSubTab === child.id));
    // Default expanded as requested
    const [isOpen, setIsOpen] = useState<boolean>(true);

    const getTabUrl = (tabId: string, subtabId?: string) => {
        let basePath = '';
        if (contractId) {
            basePath = `/contracts/${contractId}`;
        } else if (typeof window !== 'undefined') {
            basePath = window.location.pathname;
        }
        const params = new URLSearchParams();
        params.set('tab', tabId);
        if (subtabId) {
            params.set('subtab', subtabId);
        }
        return `${basePath}?${params.toString()}`;
    };

    const parentUrl = getTabUrl(tab.id, hasChildren ? tab.children?.[0]?.id : undefined);
    const TabIcon = tab.icon;

    return (
        <div className="flex flex-col">
            <div className="group/detailparent flex w-full items-center">
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
                        'group relative flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-all duration-150 select-none',
                        isParentActive && !isChildActive
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-bold'
                            : isChildActive
                              ? 'text-primary dark:text-primary font-bold'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-semibold dark:text-zinc-300 dark:hover:bg-zinc-800/50 dark:hover:text-white',
                    )}
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all',
                                isParentActive && !isChildActive
                                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground shadow-xs'
                                    : isParentActive
                                      ? 'bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary'
                                      : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground dark:text-zinc-400 dark:group-hover:text-white',
                            )}
                        >
                            <TabIcon
                                className={cn(
                                    'size-4 transition-colors',
                                    isParentActive && !isChildActive
                                        ? 'text-primary-foreground dark:text-primary-foreground'
                                        : isParentActive
                                          ? 'text-primary dark:text-primary'
                                          : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground dark:text-zinc-400 dark:group-hover:text-white',
                                )}
                            />
                        </div>
                        <span
                            className={cn(
                                'truncate',
                                isParentActive
                                    ? 'text-primary dark:text-primary font-bold'
                                    : 'text-sidebar-foreground/80 group-hover:text-sidebar-foreground font-semibold dark:text-zinc-300 dark:group-hover:text-white',
                            )}
                        >
                            {tab.label}
                        </span>
                    </div>

                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                            className="text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0 rounded p-0.5 transition-transform dark:text-zinc-400 dark:hover:text-white"
                            title={isOpen ? 'Sembunyikan sub-menu' : 'Buka sub-menu'}
                        >
                            <ChevronDown className={cn('size-3.5 transition-transform duration-200', isOpen ? 'rotate-0' : '-rotate-90')} />
                        </button>
                    )}
                </div>

                <a
                    href={parentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 shrink-0 cursor-pointer rounded-lg p-1.5 opacity-0 transition-colors group-hover/detailparent:opacity-100 focus:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
                    title="Buka di tab/jendela baru"
                >
                    <ExternalLink size={13} />
                </a>
            </div>

            {/* Tree Branch for Children */}
            {hasChildren && isOpen && (
                <div className="border-sidebar-border/70 relative mt-1 ml-4 flex flex-col space-y-1 border-l-2 pl-3 dark:border-zinc-800">
                    {tab.children!.map((child) => {
                        const isThisChildActive =
                            isParentActive && (activeSubTab === child.id || (!activeSubTab && tab.children![0].id === child.id));
                        const ChildIcon = child.icon;
                        const childUrl = getTabUrl(tab.id, child.id);

                        return (
                            <div key={child.id} className="group/detailchild flex w-full items-center">
                                <button
                                    type="button"
                                    onClick={() => onSelectTab(tab.id, child.id)}
                                    className={cn(
                                        'relative flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] transition-all duration-150',
                                        'before:bg-sidebar-border/70 before:absolute before:top-1/2 before:-left-[14px] before:h-[2px] before:w-2.5 before:-translate-y-1/2 before:rounded-full dark:before:bg-zinc-700',
                                        isThisChildActive
                                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary before:!bg-primary dark:before:!bg-primary font-bold'
                                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground font-medium dark:text-zinc-300 dark:hover:bg-zinc-800/50 dark:hover:text-white',
                                    )}
                                >
                                    {ChildIcon && (
                                        <div
                                            className={cn(
                                                'flex size-5 shrink-0 items-center justify-center rounded-md transition-all',
                                                isThisChildActive
                                                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground shadow-xs'
                                                    : 'text-sidebar-foreground/60 group-hover/detailchild:text-sidebar-foreground dark:text-zinc-400 dark:group-hover/detailchild:text-white',
                                            )}
                                        >
                                            <ChildIcon className="size-3" />
                                        </div>
                                    )}
                                    <span
                                        className={cn(
                                            'truncate',
                                            isThisChildActive
                                                ? 'text-primary dark:text-primary font-bold'
                                                : 'text-sidebar-foreground/70 group-hover/detailchild:text-sidebar-foreground dark:text-zinc-300 dark:group-hover/detailchild:text-white',
                                        )}
                                    >
                                        {child.label}
                                    </span>
                                </button>

                                <a
                                    href={childUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 ml-1 shrink-0 cursor-pointer rounded-md p-1 opacity-0 transition-colors group-hover/detailchild:opacity-100 focus:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
                                    title="Buka di tab/jendela baru"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </div>
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
    const { sidebarNavGroups, auth, povOptions, name, tagline, logo } = page.props;
    const appName = name || (import.meta.env.VITE_APP_NAME as string) || 'corixa';
    const appTagline = tagline || (import.meta.env.VITE_APP_TAGLINE as string) || 'Legal Management System';
    const appLogo = logo || (import.meta.env.VITE_APP_LOGO as string) || '/images/logo.png';
    const currentPath = page.url.split('?')[0];
    const { setOpenMobile, isMobile } = useSidebar();

    const pov = usePov(povOptions);
    const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);

    const canImpersonate = Boolean(auth?.impersonation?.can_impersonate);

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // subMode: 'detail' (shows contract tabs) or 'main' (shows main system modules)
    const [subMode, setSubMode] = useState<'detail' | 'main'>('detail');

    // Automatically switch to 'detail' mode when a contract is selected / activated and expand sub sidebar
    const prevDetailActiveRef = useRef(detailSidebar?.isActive);
    useEffect(() => {
        if (detailSidebar?.isActive && !prevDetailActiveRef.current) {
            setSubMode('detail');
            setIsSubOpen(true);
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

        const rawGroups = ((sidebarNavGroups as NavGroup[]) ?? []).map((group) => {
            const items = group.items.map(mapItem);

            // Prefer the group's own icon field, fall back to first item's icon
            const groupIconName = (group as any).icon as string | null | undefined;
            const primaryIcon = groupIconName ? (iconMap[groupIconName] ?? LayoutDashboard) : (items.find((i) => i.icon)?.icon ?? LayoutDashboard);

            return {
                ...group,
                icon: primaryIcon,
                items,
            };
        });

        if (!pov.activeNavPov.allowedRoutes) {
            return rawGroups;
        }

        const allowedSet = new Set(pov.activeNavPov.allowedRoutes);
        return rawGroups
            .map((group) => {
                const filteredItems = group.items.filter((item) => {
                    const basePath = item.url.split('?')[0];
                    return allowedSet.has(basePath) || allowedSet.has(item.url);
                });
                return {
                    ...group,
                    items: filteredItems,
                };
            })
            .filter((group) => group.items.length > 0);
    }, [sidebarNavGroups, pov.activeNavPov]);

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
        const dashboardGroup = groups.find(
            (g) =>
                g.items.some((item) => item.url.includes('/dashboard')) ||
                g.title.toLowerCase().includes('dashboard') ||
                g.title.toLowerCase().includes('utama') ||
                g.title.toLowerCase().includes('main'),
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
                <div className="flex h-full max-h-full w-full overflow-hidden select-none">
                    {/* ========================================================================= */}
                    {/* 1. PRIMARY SIDEBAR (Compact Icon Bar: Logo, Search, Groups with Label)   */}
                    {/* ========================================================================= */}
                    <div
                        style={{ width: `${PRIMARY_WIDTH}px` }}
                        className="bg-primary text-primary-foreground border-primary/20 z-20 flex h-full max-h-full shrink-0 flex-col items-center justify-between overflow-hidden border-r shadow-xs dark:border-zinc-800 dark:bg-[#101216]"
                    >
                        {/* Top: Logo with matching h-16 Header and border-b divider */}
                        <div className="flex h-16 w-full shrink-0 items-center justify-center border-b border-white/15 dark:border-zinc-800">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-all hover:scale-105 hover:bg-white/20"
                                    >
                                        <img src={appLogo} alt="Logo" className="size-9 object-contain brightness-0 invert" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} className="font-semibold">
                                    Beranda
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Middle: Search and Module Groups (Scrollable) */}
                        <div className="no-scrollbar flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-x-hidden overflow-y-auto py-3">
                            {/* Search Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => setIsSearchOpen(true)}
                                        className={cn(
                                            'group relative flex w-[64px] cursor-pointer flex-col items-center justify-center rounded-xl px-1 py-1 transition-all duration-200',
                                            isSearchOpen &&
                                                'dark:before:bg-primary dark:after:bg-primary before:absolute before:top-1 before:-left-1 before:h-9 before:w-2.5 before:rounded-r-full before:bg-white after:absolute after:top-1 after:-right-1 after:h-9 after:w-2.5 after:rounded-l-full after:bg-white',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-9 items-center justify-center rounded-xl transition-all duration-200',
                                                isSearchOpen
                                                    ? 'text-primary dark:bg-primary bg-white shadow-md dark:text-white'
                                                    : 'text-white/75 group-hover:bg-white/15 group-hover:text-white',
                                            )}
                                        >
                                            <Search className="size-5 shrink-0" />
                                        </div>
                                        <span
                                            className={cn(
                                                'mt-1 max-w-[58px] truncate text-center text-[10px] leading-tight tracking-tight transition-colors',
                                                isSearchOpen
                                                    ? 'font-bold text-white dark:text-white'
                                                    : 'font-medium text-white/70 group-hover:text-white',
                                            )}
                                        >
                                            Cari
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} className="font-medium">
                                    Cari Menu (⌘K / Ctrl+K)
                                </TooltipContent>
                            </Tooltip>

                            <div className="my-0.5 h-px w-8 shrink-0 bg-white/20 dark:bg-zinc-800" />

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
                                                    'group relative flex w-[64px] cursor-pointer flex-col items-center justify-center rounded-xl px-1 py-1 transition-all duration-200',
                                                    subMode === 'detail' &&
                                                        'dark:before:bg-primary dark:after:bg-primary before:absolute before:top-1 before:-left-1 before:h-9 before:w-2.5 before:rounded-r-full before:bg-white after:absolute after:top-1 after:-right-1 after:h-9 after:w-2.5 after:rounded-l-full after:bg-white',
                                                )}
                                            >
                                                {/* Icon Card (Active Card on Icon only) */}
                                                <div
                                                    className={cn(
                                                        'flex size-9 items-center justify-center rounded-xl transition-all duration-200',
                                                        subMode === 'detail'
                                                            ? 'text-primary dark:bg-primary bg-white shadow-md dark:text-white'
                                                            : 'text-white/75 group-hover:bg-white/15 group-hover:text-white',
                                                    )}
                                                >
                                                    <FileText className="size-5 shrink-0" />
                                                </div>
                                                <span
                                                    className={cn(
                                                        'mt-1 max-w-[58px] truncate text-center text-[9.5px] leading-tight tracking-tight transition-colors',
                                                        subMode === 'detail'
                                                            ? 'font-bold text-white dark:text-white'
                                                            : 'font-medium text-white/70 group-hover:text-white',
                                                    )}
                                                >
                                                    Pengajuan
                                                </span>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={10} className="font-medium">
                                            {subMode === 'detail' ? 'Buka Menu Utama' : 'Buka Menu Pengajuan'}
                                        </TooltipContent>
                                    </Tooltip>

                                    <div className="my-0.5 h-px w-8 shrink-0 bg-white/20 dark:bg-zinc-800" />
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
                                                        'group relative flex w-[64px] cursor-pointer flex-col items-center justify-center rounded-xl px-1 py-1 transition-all duration-200',
                                                        isSelected &&
                                                            'dark:before:bg-primary dark:after:bg-primary before:absolute before:top-1 before:-left-1 before:h-9 before:w-2.5 before:rounded-r-full before:bg-white after:absolute after:top-1 after:-right-1 after:h-9 after:w-2.5 after:rounded-l-full after:bg-white',
                                                    )}
                                                >
                                                    {/* Icon Card (Active Card on Icon only) */}
                                                    <div
                                                        className={cn(
                                                            'flex size-9 items-center justify-center rounded-xl transition-all duration-200',
                                                            isSelected
                                                                ? 'text-primary dark:bg-primary bg-white shadow-md dark:text-white'
                                                                : 'text-white/75 group-hover:bg-white/15 group-hover:text-white',
                                                        )}
                                                    >
                                                        <GroupIcon className="size-5 shrink-0" />
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'mt-1 max-w-[58px] truncate text-center text-[10px] leading-tight tracking-tight transition-colors',
                                                            isSelected
                                                                ? 'font-bold text-white dark:text-white'
                                                                : 'font-medium text-white/70 group-hover:text-white',
                                                        )}
                                                    >
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

                        {/* Bottom: Switch User, Notifications & HeaderUserMenu */}
                        <div className="flex w-full shrink-0 flex-col items-center gap-2 border-t border-white/15 pt-2 pb-3 dark:border-zinc-800">
                            {/* Switch User Button - Khusus Super Admin / Admin */}
                            {canImpersonate && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => setIsUserSwitchOpen(true)}
                                            className={cn(
                                                'relative flex size-9 cursor-pointer items-center justify-center rounded-xl transition-all',
                                                auth?.impersonation?.is_impersonating
                                                    ? 'bg-amber-500 font-bold text-white shadow-xs ring-2 ring-amber-300'
                                                    : 'text-white/75 hover:bg-white/15 hover:text-white',
                                            )}
                                            aria-label="Ganti User Login (Switch User)"
                                        >
                                            <ArrowRightLeft className="size-4.5" />
                                            {auth?.impersonation?.is_impersonating && (
                                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                                                </span>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={10}>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold">Ganti User Login (Switch User)</span>
                                            <span className="text-muted-foreground text-[11px]">
                                                {auth?.impersonation?.is_impersonating
                                                    ? `Sedang login sebagai ${auth.user?.name} (${auth.user?.role})`
                                                    : 'Pilih & login instan sebagai user lain di database'}
                                            </span>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {/* Notification Bell (Above Profile) */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center">
                                        <HeaderNotifications variant="sidebar" />
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
                            'bg-sidebar/20 border-sidebar-border/60 flex h-full max-h-full flex-col overflow-hidden border-r backdrop-blur-xs transition-all duration-200 ease-linear dark:border-zinc-800 dark:bg-[#141518]',
                            isSubOpen ? 'opacity-100' : 'pointer-events-none overflow-hidden border-r-0 opacity-0',
                        )}
                    >
                        {/* Simulation Indicator Banner on Sub-sidebar */}
                        {pov.isSimulatingAny && (
                            <div className="flex shrink-0 items-center justify-between gap-1.5 border-b border-amber-500/30 bg-amber-500/15 px-3 py-1.5">
                                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                    <ScanEye className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-[10px] leading-tight font-bold text-amber-800 dark:text-amber-200">
                                            Simulasi POV Aktif
                                        </span>
                                        <span className="truncate text-[9px] leading-tight text-amber-700/80 dark:text-amber-300/80">
                                            {[
                                                pov.isSimulatingNav ? `Nav: ${pov.activeNavPov.badge}` : null,
                                                pov.isSimulatingDashboard ? `Dash: ${pov.activeDashboardPov.badge}` : null,
                                                pov.isSimulatingFilter ? `Filter: ${pov.activeFilterPov.badge}` : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' • ')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={pov.resetAll}
                                    className="shrink-0 cursor-pointer text-[9.5px] font-bold text-amber-800 hover:underline dark:text-amber-200"
                                    title="Kembalikan semua POV ke asli"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                        {detailSidebar?.isActive && subMode === 'detail' ? (
                            <>
                                {/* Detail Header Top: Back button + Switch to main menu button */}
                                <div className="border-sidebar-border/40 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-3 dark:border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={detailSidebar.onClose}
                                        className="text-sidebar-foreground bg-sidebar-accent/40 hover:bg-sidebar-accent/70 flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all hover:scale-102 dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                        title="Kembali ke Daftar Pengajuan"
                                    >
                                        <ArrowLeft size={14} strokeWidth={2.5} className="text-primary" />
                                        <span className="text-[11px] font-bold tracking-wider uppercase">Kembali</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSubMode('main')}
                                        className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all dark:text-zinc-300 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                                        title="Buka Sub-side Menu Utama"
                                    >
                                        <LayoutGrid size={13} className="text-sidebar-foreground/60 dark:text-zinc-400" />
                                        <span className="text-[10.5px] font-medium">Menu Utama</span>
                                    </button>
                                </div>

                                {/* Sub Header: Tabs Pengajuan */}
                                <div className="border-primary/20 bg-primary text-primary-foreground flex h-11 shrink-0 items-center border-b px-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                                    <span className="truncate text-[11.5px] font-bold tracking-wider text-white uppercase">Menu Pengajuan</span>
                                </div>

                                {/* Detail Tab Items with Tree hierarchy */}
                                <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                                    {detailSidebar.tabs.map((tab) => (
                                        <DetailNavTreeItem
                                            key={tab.id}
                                            tab={tab}
                                            activeTab={detailSidebar.activeTab}
                                            activeSubTab={detailSidebar.activeSubTab}
                                            onSelectTab={detailSidebar.onSelectTab}
                                            contractId={detailSidebar.contract?.id}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* When viewing main menu while contract detail is active, show top button to return to contract tabs */}
                                {detailSidebar?.isActive && (
                                    <div className="border-sidebar-border/50 bg-primary/5 shrink-0 border-b p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
                                        <button
                                            type="button"
                                            onClick={() => setSubMode('detail')}
                                            className="bg-primary text-primary-foreground flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-bold shadow-xs transition-all hover:opacity-95"
                                            title="Kembali ke Sub-side Detail Kontrak"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText size={14} />
                                                <span className="truncate">Menu Pengajuan</span>
                                            </div>
                                            <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Buka</span>
                                        </button>
                                    </div>
                                )}

                                {/* Sub Header Top: App Name & Tagline (Height h-16 perfectly matching main navbar) */}
                                <div className="border-sidebar-border/40 flex h-16 shrink-0 items-center border-b px-4 dark:border-zinc-800">
                                    <div className="flex flex-col justify-center truncate">
                                        <span className="text-sidebar-foreground text-[15px] leading-tight font-bold tracking-tight dark:text-white">
                                            {appName}
                                        </span>
                                        <span className="text-sidebar-foreground/50 mt-0.5 truncate text-[10px] leading-tight font-medium dark:text-zinc-400">
                                            {appTagline}
                                        </span>
                                    </div>
                                </div>

                                {/* Sub Header: Group Title (Colored Primary with h-11 matching table header proportion) */}
                                <div className="border-primary/20 bg-primary text-primary-foreground flex h-11 shrink-0 items-center border-b px-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                                    <span className="truncate text-[11.5px] font-bold tracking-wider text-white uppercase">
                                        {currentGroup?.title ?? 'Menu'}
                                    </span>
                                </div>

                                {/* Sub Menu Item List - Tree and Rounded items */}
                                <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
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
                <DialogContent className="border-border/80 max-w-xl gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl">
                    <DialogTitle className="sr-only">Cari Menu & Fitur</DialogTitle>

                    {/* Search Input in Dialog */}
                    <div className="border-border/60 bg-muted/20 flex items-center border-b px-4">
                        <Search className="text-muted-foreground/70 mr-3 size-5 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Cari semua menu, modul & fitur... (contoh: Kontrak, User, Vendor)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="placeholder:text-muted-foreground/60 h-14 w-full bg-transparent text-sm outline-none"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-1"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Area */}
                    <div className="max-h-[360px] overflow-y-auto p-2">
                        {searchQuery.trim() === '' ? (
                            <div className="text-muted-foreground p-6 text-center text-xs">
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
                                            className="group hover:bg-primary/10 hover:text-primary flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors"
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <ItemIcon className="text-muted-foreground group-hover:text-primary size-4.5 shrink-0 transition-colors" />
                                                <span className="text-foreground group-hover:text-primary truncate font-medium">
                                                    <HighlightingCell text={item.title} search={searchQuery} />
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="text-muted-foreground/70 bg-muted rounded-md px-2 py-0.5 text-[11px] font-medium">
                                                    {groupTitle}
                                                </span>
                                                <ChevronRight className="text-muted-foreground/40 group-hover:text-primary size-4 transition-colors" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-muted-foreground text-sm font-medium">Tidak ditemukan menu untuk "{searchQuery}"</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="bg-muted/40 border-border/40 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-[11px]">
                        <span>Pilih menu untuk langsung navigasi</span>
                        <div className="flex items-center gap-1.5">
                            <kbd className="border-border bg-background rounded border px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd>
                            <span>tutup</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Switch User (Impersonation) Modal for Super Admin */}
            <UserSwitchModal open={isUserSwitchOpen} onOpenChange={setIsUserSwitchOpen} />
        </TooltipProvider>
    );
});
