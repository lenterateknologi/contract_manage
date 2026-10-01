import { HeaderNotifications } from '@/layouts/app/components/header/HeaderNotifications';
import { HeaderUserMenu } from '@/layouts/app/components/header/HeaderUserMenu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialogs/Dialog';
import {
    Sidebar,
    useSidebar,
} from '@/components/ui/navigation/Sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/feedback/Tooltip';
import { HighlightingCell } from '@/components/ui/utilities/Highlighter';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useDetailSidebar, type DetailSidebarTabItem } from '@/stores/useDetailSidebarStore';
import {
    Archive,
    ArrowLeft,
    ArrowRightLeft,
    BarChart3,
    Building2,
    ChevronRight,
    ChevronDown,
    Clock,
    Database,
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
    ExternalLink,
    MessageSquare,
    type LucideIcon,
} from 'lucide-react';
import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { UserSwitchModal } from '@/components/impersonation/UserSwitchModal';
import { usePov } from '@/stores/usePovStore';

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
        <div className="flex flex-col w-full">
            <div className="flex items-center w-full group/nav">
                <Link
                    href={item.url}
                    onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        onNavigate?.();
                    }}
                    className={cn(
                        'group relative flex flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] transition-all duration-150 min-w-0',
                        isSelfActive
                            ? 'bg-primary/10 dark:bg-primary/20 font-semibold text-primary dark:text-primary'
                            : 'font-medium text-sidebar-foreground/80 dark:text-zinc-300 hover:bg-sidebar-accent/50 dark:hover:bg-zinc-800/60 hover:text-sidebar-foreground dark:hover:text-white',
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
                                    : 'text-sidebar-foreground/60 dark:text-zinc-400 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                        )}
                    >
                        <ItemIcon
                            className={cn(
                                'size-4 transition-colors',
                                isSelfActive
                                    ? 'text-primary-foreground dark:text-primary-foreground'
                                    : isChildActive
                                        ? 'text-primary dark:text-primary'
                                        : 'text-sidebar-foreground/70 dark:text-zinc-400 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                            )}
                        />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <span
                            className={cn(
                                'truncate tracking-tight leading-snug',
                                isSelfActive
                                    ? 'font-bold text-primary dark:text-primary'
                                    : 'font-medium text-sidebar-foreground dark:text-zinc-200 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                            )}
                        >
                            {item.title}
                        </span>
                        {item.description && (
                            <span className="text-[10.5px] leading-tight truncate mt-0.5 font-normal text-sidebar-foreground/50 dark:text-zinc-400 group-hover:text-sidebar-foreground/70 dark:group-hover:text-zinc-300">
                                {item.description}
                            </span>
                        )}
                    </div>
                    {item.badge !== undefined && item.badge !== null && (
                        <span
                            className={cn(
                                'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0 transition-colors',
                                isSelfActive
                                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground'
                                    : 'bg-sidebar-accent/80 dark:bg-zinc-800 text-sidebar-foreground/70 dark:text-zinc-300 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                            )}
                            title={`${item.badge} data sistem aktif`}
                        >
                            {item.badge}
                        </span>
                    )}
                </Link>

                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-sidebar-foreground/40 dark:text-zinc-500 hover:text-sidebar-foreground dark:hover:text-white hover:bg-sidebar-accent/70 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover/nav:opacity-100 focus:opacity-100 shrink-0 cursor-pointer"
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
                        className="ml-1 p-1.5 rounded-lg text-sidebar-foreground/45 dark:text-zinc-400 hover:text-sidebar-foreground dark:hover:text-white hover:bg-sidebar-accent/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
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
                <div className="relative ml-4.5 pl-3.5 my-1 space-y-1 border-l-2 border-sidebar-border/70 dark:border-zinc-800">
                    {item.children!.map((child) => {
                        const isSubActive = checkActive(child.url);
                        const ChildIcon = child.icon ?? FileText;

                        return (
                            <div key={child.url} className="flex items-center w-full group/subnav">
                                <Link
                                    href={child.url}
                                    onClick={() => {
                                        if (isMobile) setOpenMobile(false);
                                        onNavigate?.();
                                    }}
                                    className={cn(
                                        'relative group flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12px] transition-all duration-150 min-w-0',
                                        'before:absolute before:-left-[15px] before:top-1/2 before:-translate-y-1/2 before:w-2.5 before:h-[2px] before:bg-sidebar-border/80 dark:before:bg-zinc-700 before:rounded-full',
                                        isSubActive
                                            ? 'bg-primary/10 dark:bg-primary/20 font-bold text-primary dark:text-primary before:!bg-primary dark:before:!bg-primary'
                                            : 'font-medium text-sidebar-foreground/75 dark:text-zinc-300 hover:bg-sidebar-accent/40 dark:hover:bg-zinc-800/50 hover:text-sidebar-foreground dark:hover:text-white',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex size-5.5 shrink-0 items-center justify-center rounded-md transition-all',
                                            isSubActive
                                                ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground shadow-xs'
                                                : 'text-sidebar-foreground/60 dark:text-zinc-400 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                                        )}
                                    >
                                        <ChildIcon
                                            className={cn(
                                                'size-3 transition-colors',
                                                isSubActive
                                                    ? 'text-primary-foreground dark:text-primary-foreground'
                                                    : 'text-sidebar-foreground/60 dark:text-zinc-400 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                                        <span
                                            className={cn(
                                                'truncate tracking-tight leading-snug',
                                                isSubActive
                                                    ? 'font-bold text-primary dark:text-primary'
                                                    : 'font-medium text-sidebar-foreground/80 dark:text-zinc-300 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                                            )}
                                        >
                                            {child.title}
                                        </span>
                                        {child.description && (
                                            <span className="text-[10px] leading-tight truncate mt-0.5 font-normal text-sidebar-foreground/50 dark:text-zinc-400 group-hover:text-sidebar-foreground/70 dark:group-hover:text-zinc-300">
                                                {child.description}
                                            </span>
                                        )}
                                    </div>
                                    {child.badge !== undefined && child.badge !== null && (
                                        <span
                                            className={cn(
                                                'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums shrink-0 transition-colors',
                                                isSubActive
                                                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground'
                                                    : 'bg-sidebar-accent/80 dark:bg-zinc-800 text-sidebar-foreground/70 dark:text-zinc-300 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground dark:group-hover:text-white',
                                            )}
                                            title={`${child.badge} data aktif`}
                                        >
                                            {child.badge}
                                        </span>
                                    )}
                                </Link>

                                <a
                                    href={child.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded-md text-sidebar-foreground/40 dark:text-zinc-500 hover:text-sidebar-foreground dark:hover:text-white hover:bg-sidebar-accent/70 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover/subnav:opacity-100 focus:opacity-100 shrink-0 ml-1 cursor-pointer"
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
    const isChildActive = Boolean(
        tab.children?.some((child) => isParentActive && activeSubTab === child.id),
    );
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
            <div className="flex items-center w-full group/detailparent">
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
                        'group relative flex flex-1 items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-all duration-150 cursor-pointer select-none min-w-0',
                        isParentActive && !isChildActive
                            ? 'bg-primary/10 dark:bg-primary/20 font-bold text-primary dark:text-primary'
                            : isChildActive
                              ? 'font-bold text-primary dark:text-primary'
                              : 'font-semibold text-sidebar-foreground/80 dark:text-zinc-300 hover:bg-sidebar-accent/50 dark:hover:bg-zinc-800/50 hover:text-sidebar-foreground dark:hover:text-white',
                    )}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all',
                                isParentActive && !isChildActive
                                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground shadow-xs'
                                    : isParentActive
                                      ? 'bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary'
                                      : 'text-sidebar-foreground/60 dark:text-zinc-400 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                            )}
                        >
                            <TabIcon
                                className={cn(
                                    'size-4 transition-colors',
                                    isParentActive && !isChildActive
                                        ? 'text-primary-foreground dark:text-primary-foreground'
                                        : isParentActive
                                          ? 'text-primary dark:text-primary'
                                          : 'text-sidebar-foreground/70 dark:text-zinc-400 group-hover:text-sidebar-foreground dark:group-hover:text-white',
                                )}
                            />
                        </div>
                        <span
                            className={cn(
                                'truncate',
                                isParentActive
                                    ? 'font-bold text-primary dark:text-primary'
                                    : 'text-sidebar-foreground/80 dark:text-zinc-300 group-hover:text-sidebar-foreground dark:group-hover:text-white font-semibold',
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
                            className="p-0.5 rounded text-sidebar-foreground/50 dark:text-zinc-400 hover:text-sidebar-foreground dark:hover:text-white transition-transform shrink-0"
                            title={isOpen ? 'Sembunyikan sub-menu' : 'Buka sub-menu'}
                        >
                            <ChevronDown
                                className={cn('size-3.5 transition-transform duration-200', isOpen ? 'rotate-0' : '-rotate-90')}
                            />
                        </button>
                    )}
                </div>

                <a
                    href={parentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-sidebar-foreground/40 dark:text-zinc-500 hover:text-sidebar-foreground dark:hover:text-white hover:bg-sidebar-accent/70 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover/detailparent:opacity-100 focus:opacity-100 shrink-0 cursor-pointer"
                    title="Buka di tab/jendela baru"
                >
                    <ExternalLink size={13} />
                </a>
            </div>

            {/* Tree Branch for Children */}
            {hasChildren && isOpen && (
                <div className="relative ml-4 mt-1 flex flex-col space-y-1 pl-3 border-l-2 border-sidebar-border/70 dark:border-zinc-800">
                    {tab.children!.map((child) => {
                        const isThisChildActive =
                            isParentActive &&
                            (activeSubTab === child.id || (!activeSubTab && tab.children![0].id === child.id));
                        const ChildIcon = child.icon;
                        const childUrl = getTabUrl(tab.id, child.id);

                        return (
                            <div key={child.id} className="flex items-center w-full group/detailchild">
                                <button
                                    type="button"
                                    onClick={() => onSelectTab(tab.id, child.id)}
                                    className={cn(
                                        'relative flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] transition-all duration-150 cursor-pointer text-left min-w-0',
                                        'before:absolute before:-left-[14px] before:top-1/2 before:-translate-y-1/2 before:w-2.5 before:h-[2px] before:bg-sidebar-border/70 dark:before:bg-zinc-700 before:rounded-full',
                                        isThisChildActive
                                            ? 'bg-primary/10 dark:bg-primary/20 font-bold text-primary dark:text-primary before:!bg-primary dark:before:!bg-primary'
                                            : 'font-medium text-sidebar-foreground/70 dark:text-zinc-300 hover:bg-sidebar-accent/40 dark:hover:bg-zinc-800/50 hover:text-sidebar-foreground dark:hover:text-white',
                                    )}
                                >
                                    {ChildIcon && (
                                        <div
                                            className={cn(
                                                'flex size-5 shrink-0 items-center justify-center rounded-md transition-all',
                                                isThisChildActive
                                                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground shadow-xs'
                                                    : 'text-sidebar-foreground/60 dark:text-zinc-400 group-hover/detailchild:text-sidebar-foreground dark:group-hover/detailchild:text-white',
                                            )}
                                        >
                                            <ChildIcon className="size-3" />
                                        </div>
                                    )}
                                    <span
                                        className={cn(
                                            'truncate',
                                            isThisChildActive
                                                ? 'font-bold text-primary dark:text-primary'
                                                : 'text-sidebar-foreground/70 dark:text-zinc-300 group-hover/detailchild:text-sidebar-foreground dark:group-hover/detailchild:text-white',
                                        )}
                                    >
                                        {child.label}
                                    </span>
                                    {child.badge && (
                                        <span
                                            className={cn(
                                                'ml-auto text-[9.5px] font-semibold px-1.5 py-0.2 rounded-md tabular-nums shrink-0 transition-colors',
                                                child.badgeVariant === 'success' || child.isReviewed
                                                    ? isThisChildActive
                                                        ? 'bg-emerald-500 text-white font-bold'
                                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                                                    : child.badgeVariant === 'warning'
                                                      ? isThisChildActive
                                                          ? 'bg-amber-400 text-amber-950 font-bold'
                                                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                                                      : isThisChildActive
                                                        ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground font-bold'
                                                        : 'bg-sidebar-accent/80 dark:bg-zinc-800 text-sidebar-foreground/70 dark:text-zinc-300',
                                            )}
                                            title={child.isReviewed ? 'Sudah direview' : 'Perlu direview'}
                                        >
                                            {child.badge}
                                        </span>
                                    )}
                                </button>

                                <a
                                    href={childUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded-md text-sidebar-foreground/40 dark:text-zinc-500 hover:text-sidebar-foreground dark:hover:text-white hover:bg-sidebar-accent/70 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover/detailchild:opacity-100 focus:opacity-100 shrink-0 ml-1 cursor-pointer"
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

    const isSuperAdmin = Boolean(
        auth?.user?.role === 'Super Admin' ||
        auth?.user?.role === 'Admin' ||
        auth?.user?.is_admin ||
        auth?.user?.role?.toLowerCase()?.includes('admin')
    );
    const canImpersonate = Boolean(isSuperAdmin || auth?.impersonation?.can_impersonate);

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

            // Hardcode Backup & Restore inside Pengaturan Sistem if user is admin / super admin
            if (isSuperAdmin && (group.title.toLowerCase().includes('pengaturan') || group.title.toLowerCase().includes('system'))) {
                const hasBackup = items.some((i) => i.url === '/admin/backups');
                if (!hasBackup) {
                    items.push({
                        title: 'Backup & Restore',
                        url: '/admin/backups',
                        description: 'Manajemen pencadangan dan pemulihan database sistem',
                        icon: Database,
                        sequence: 99,
                    });
                }
            }

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

        // If Pengaturan Sistem doesn't exist at all in groups for Admin, add it
        if (isSuperAdmin && !rawGroups.some((g) => g.title.toLowerCase().includes('pengaturan') || g.title.toLowerCase().includes('system'))) {
            rawGroups.push({
                title: 'Pengaturan Sistem',
                icon: Settings2,
                items: [
                    {
                        title: 'Backup & Restore',
                        url: '/admin/backups',
                        description: 'Manajemen pencadangan dan pemulihan database sistem',
                        icon: Database,
                        sequence: 99,
                    },
                ],
            } as any);
        }

        if (!pov.activeNavPov.allowedRoutes) {
            return rawGroups;
        }

        const allowedSet = new Set(pov.activeNavPov.allowedRoutes);
        return rawGroups
            .map((group) => {
                const filteredItems = group.items.filter((item) => {
                    if (isSuperAdmin && item.url === '/admin/backups') return true;
                    const basePath = item.url.split('?')[0];
                    return allowedSet.has(basePath) || allowedSet.has(item.url);
                });
                return {
                    ...group,
                    items: filteredItems,
                };
            })
            .filter((group) => group.items.length > 0);
    }, [sidebarNavGroups, pov.activeNavPov, isSuperAdmin]);

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
                        className="bg-primary dark:bg-[#101216] text-primary-foreground flex h-full max-h-full shrink-0 flex-col items-center justify-between border-r border-primary/20 dark:border-zinc-800 z-20 overflow-hidden shadow-xs"
                    >
                        {/* Top: Logo with matching h-16 Header and border-b divider */}
                        <div className="flex h-16 w-full shrink-0 items-center justify-center border-b border-white/15 dark:border-zinc-800">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/dashboard"
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-105"
                                    >
                                        <img
                                            src={appLogo}
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
                                            'group relative flex w-[64px] flex-col items-center justify-center rounded-xl py-1 px-1 transition-all duration-200 cursor-pointer',
                                            isSearchOpen && 'before:absolute before:-left-1 before:top-1 before:h-9 before:w-2.5 before:bg-white dark:before:bg-primary before:rounded-r-full after:absolute after:-right-1 after:top-1 after:h-9 after:w-2.5 after:bg-white dark:after:bg-primary after:rounded-l-full'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-9 items-center justify-center rounded-xl transition-all duration-200',
                                                isSearchOpen
                                                    ? 'bg-white text-primary dark:bg-primary dark:text-white shadow-md'
                                                    : 'text-white/75 group-hover:bg-white/15 group-hover:text-white',
                                            )}
                                        >
                                            <Search className="size-5 shrink-0" />
                                        </div>
                                        <span
                                            className={cn(
                                                'mt-1 max-w-[58px] truncate text-[10px] leading-tight tracking-tight text-center transition-colors',
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

                            <div className="h-px w-8 shrink-0 bg-white/20 dark:bg-zinc-800 my-0.5" />

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
                                                    'group relative flex w-[64px] flex-col items-center justify-center rounded-xl py-1 px-1 transition-all duration-200 cursor-pointer',
                                                    subMode === 'detail' && 'before:absolute before:-left-1 before:top-1 before:h-9 before:w-2.5 before:bg-white dark:before:bg-primary before:rounded-r-full after:absolute after:-right-1 after:top-1 after:h-9 after:w-2.5 after:bg-white dark:after:bg-primary after:rounded-l-full'
                                                )}
                                            >
                                                {/* Icon Card (Active Card on Icon only) */}
                                                <div
                                                    className={cn(
                                                        'flex size-9 items-center justify-center rounded-xl transition-all duration-200',
                                                        subMode === 'detail'
                                                            ? 'bg-white text-primary dark:bg-primary dark:text-white shadow-md'
                                                            : 'text-white/75 group-hover:bg-white/15 group-hover:text-white',
                                                    )}
                                                >
                                                    <FileText className="size-5 shrink-0" />
                                                </div>
                                                <span
                                                    className={cn(
                                                        'mt-1 max-w-[58px] truncate text-[9.5px] leading-tight tracking-tight text-center transition-colors',
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

                                    <div className="h-px w-8 shrink-0 bg-white/20 dark:bg-zinc-800 my-0.5" />
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
                                                        'group relative flex w-[64px] flex-col items-center justify-center rounded-xl py-1 px-1 transition-all duration-200 cursor-pointer',
                                                        isSelected && 'before:absolute before:-left-1 before:top-1 before:h-9 before:w-2.5 before:bg-white dark:before:bg-primary before:rounded-r-full after:absolute after:-right-1 after:top-1 after:h-9 after:w-2.5 after:bg-white dark:after:bg-primary after:rounded-l-full'
                                                    )}
                                                >
                                                    {/* Icon Card (Active Card on Icon only) */}
                                                    <div
                                                        className={cn(
                                                            'flex size-9 items-center justify-center rounded-xl transition-all duration-200',
                                                            isSelected
                                                                ? 'bg-white text-primary dark:bg-primary dark:text-white shadow-md'
                                                                : 'text-white/75 group-hover:bg-white/15 group-hover:text-white',
                                                        )}
                                                    >
                                                        <GroupIcon className="size-5 shrink-0" />
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'mt-1 max-w-[58px] truncate text-[10px] leading-tight tracking-tight text-center transition-colors',
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
                        <div className="flex w-full shrink-0 flex-col items-center gap-2 pt-2 pb-3 border-t border-white/15 dark:border-zinc-800">
                            {/* Switch User Button - Khusus Super Admin / Admin */}
                            {canImpersonate && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => setIsUserSwitchOpen(true)}
                                            className={cn(
                                                'relative flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer',
                                                auth?.impersonation?.is_impersonating
                                                    ? 'bg-amber-500 text-white font-bold shadow-xs ring-2 ring-amber-300'
                                                    : 'text-white/75 hover:bg-white/15 hover:text-white'
                                            )}
                                            aria-label="Ganti User Login (Switch User)"
                                        >
                                            <ArrowRightLeft className="size-4.5" />
                                            {auth?.impersonation?.is_impersonating && (
                                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                                </span>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={10}>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold">Ganti User Login (Switch User)</span>
                                            <span className="text-[11px] text-muted-foreground">
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
                            'bg-sidebar/20 dark:bg-[#141518] flex h-full max-h-full flex-col border-r border-sidebar-border/60 dark:border-zinc-800 transition-all duration-200 ease-linear backdrop-blur-xs overflow-hidden',
                            isSubOpen ? 'opacity-100' : 'overflow-hidden border-r-0 opacity-0 pointer-events-none',
                        )}
                    >
                        {/* Simulation Indicator Banner on Sub-sidebar */}
                        {pov.isSimulatingAny && (
                            <div className="px-3 py-1.5 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between shrink-0 gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <ScanEye className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 truncate leading-tight">
                                            Simulasi POV Aktif
                                        </span>
                                        <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 truncate leading-tight">
                                            {[
                                                pov.isSimulatingNav ? `Nav: ${pov.activeNavPov.badge}` : null,
                                                pov.isSimulatingDashboard ? `Dash: ${pov.activeDashboardPov.badge}` : null,
                                                pov.isSimulatingFilter ? `Filter: ${pov.activeFilterPov.badge}` : null,
                                            ].filter(Boolean).join(' • ')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={pov.resetAll}
                                    className="text-[9.5px] font-bold text-amber-800 dark:text-amber-200 hover:underline cursor-pointer shrink-0"
                                    title="Kembalikan semua POV ke asli"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                        {detailSidebar?.isActive && subMode === 'detail' ? (
                            <>
                                {/* Detail Header Top: Back button + Switch to main menu button */}
                                <div className="flex h-16 items-center justify-between px-3 border-b border-sidebar-border/40 dark:border-zinc-800 shrink-0 gap-2">
                                    <button
                                        type="button"
                                        onClick={detailSidebar.onClose}
                                        className="flex h-9 items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold text-sidebar-foreground dark:text-zinc-200 bg-sidebar-accent/40 dark:bg-zinc-800/70 hover:bg-sidebar-accent/70 dark:hover:bg-zinc-800 cursor-pointer transition-all shrink-0 hover:scale-102"
                                        title="Kembali ke Daftar Pengajuan"
                                    >
                                        <ArrowLeft size={14} strokeWidth={2.5} className="text-primary" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Kembali</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSubMode('main')}
                                        className="flex h-9 items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold text-sidebar-foreground/70 dark:text-zinc-300 hover:text-sidebar-foreground dark:hover:text-white hover:bg-sidebar-accent/40 dark:hover:bg-zinc-800/50 cursor-pointer transition-all shrink-0"
                                        title="Buka Sub-side Menu Utama"
                                    >
                                        <LayoutGrid size={13} className="text-sidebar-foreground/60 dark:text-zinc-400" />
                                        <span className="text-[10.5px] font-medium">Menu Utama</span>
                                    </button>
                                </div>

                                {/* Sub Header: Tabs Pengajuan */}
                                <div className="flex h-11 items-center justify-between px-4 border-b border-primary/20 dark:border-zinc-800 shrink-0 bg-primary dark:bg-zinc-900 text-primary-foreground shadow-xs">
                                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-white truncate">
                                        Menu Pengajuan
                                    </span>
                                    <span className="text-[10px] text-white font-semibold bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-full tabular-nums">
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
                                            contractId={detailSidebar.contract?.id}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* When viewing main menu while contract detail is active, show top button to return to contract tabs */}
                                {detailSidebar?.isActive && (
                                    <div className="p-2 border-b border-sidebar-border/50 dark:border-zinc-800 bg-primary/5 dark:bg-zinc-900/40 shrink-0">
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
                                <div className="flex h-16 items-center px-4 border-b border-sidebar-border/40 dark:border-zinc-800 shrink-0">
                                    <div className="flex flex-col justify-center truncate">
                                        <span className="text-sidebar-foreground dark:text-white text-[15px] leading-tight font-bold tracking-tight">
                                            {appName}
                                        </span>
                                        <span className="text-sidebar-foreground/50 dark:text-zinc-400 text-[10px] leading-tight font-medium truncate mt-0.5">
                                            {appTagline}
                                        </span>
                                    </div>
                                </div>

                                {/* Sub Header: Group Title (Colored Primary with h-11 matching table header proportion) */}
                                <div className="flex h-11 items-center justify-between px-4 border-b border-primary/20 dark:border-zinc-800 shrink-0 bg-primary dark:bg-zinc-900 text-primary-foreground shadow-xs">
                                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-white truncate">
                                        {currentGroup?.title ?? 'Menu'}
                                    </span>
                                    <span className="text-[10px] text-white font-semibold bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-full tabular-nums">
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

            {/* Switch User (Impersonation) Modal for Super Admin */}
            <UserSwitchModal
                open={isUserSwitchOpen}
                onOpenChange={setIsUserSwitchOpen}
            />
        </TooltipProvider>
    );
});
