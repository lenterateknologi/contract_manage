import AppearanceToggleDropdown from '@/layouts/app/components/AppearanceDropdown';
import { HeaderChat } from '@/layouts/app/components/header/HeaderChat';
import { HeaderHelp } from '@/layouts/app/components/header/HeaderHelp';
import { HeaderLanguage } from '@/layouts/app/components/header/HeaderLanguage';
import { HeaderNotifications } from '@/layouts/app/components/header/HeaderNotifications';
import { HeaderUserMenu } from '@/layouts/app/components/header/HeaderUserMenu';
import { SiteCustomizer } from '@/layouts/app/components/SiteCustomizer';
import { Breadcrumbs } from '@/layouts/app/components/nav/Breadcrumbs';
import { SidebarTrigger } from '@/components/ui/navigation/Sidebar';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData, type NavGroup, type NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { memo } from 'react';

export const AppSidebarHeader = memo(function AppSidebarHeader({ breadcrumbs = [] }: { readonly breadcrumbs?: BreadcrumbItemType[] }) {
    const { url } = usePage();
    const path = url.split('?')[0];
    const isDetailRoute = /^\/contracts\/[a-zA-Z0-9-]+$/.test(path) && !['/contracts/mine', '/contracts/pending', '/contracts/expiry'].includes(path);

    return (
        <div
            className={cn(
                'origin-top overflow-hidden transition-all duration-300 ease-in-out border-b border-border/60 bg-background',
                isDetailRoute ? 'pointer-events-none h-0 opacity-0' : 'h-16 opacity-100',
            )}
        >
            <header
                className={cn(
                    'flex h-full items-center justify-between px-6',
                    'transform transition-all duration-300 ease-in-out',
                    isDetailRoute ? 'scale-[0.97] opacity-0' : 'scale-100 opacity-100',
                )}
            >
                {/* Left Section: Context & Navigation */}
                <div className="flex items-center gap-5">
                    <div className="flex items-center">
                        <SidebarTrigger
                            className={cn(
                                'h-9 w-9 rounded-xl transition-all duration-300',
                                'text-foreground/70 dark:text-foreground/70',
                                'hover:text-foreground hover:bg-muted dark:hover:bg-muted dark:hover:text-foreground',
                                'active:scale-90',
                            )}
                        />
                    </div>

                    <div className="bg-border dark:bg-border hidden h-4 w-px md:block" />

                    <div className="hidden flex-col gap-0.5 md:flex">
                         {(() => {
                            const { url, props } = usePage<SharedData>();
                            const path = url.split('?')[0];
                            // Force dynamic breadcrumbs from URL by ignoring controller props
                            let currentBreadcrumbs: BreadcrumbItemType[] = [];
                            
                            if (currentBreadcrumbs.length === 0) {
                                const rawSegments = path.split('/').filter(Boolean);
                                const isUuidOrId = (str: string) => /^[0-9a-fA-F-]{36}$/.test(str) || /^\d+$/.test(str);
                                
                                const filteredSegments: { title: string; href: string }[] = [];
                                let accumulatedPath = '';
                                
                                // ponytail: lookup matching titles from navigation groups registered in sidebarNavGroups
                                const navGroups = (props.sidebarNavGroups as NavGroup[]) ?? [];
                                
                                rawSegments.forEach((seg) => {
                                    accumulatedPath += `/${seg}`;
                                    if (isUuidOrId(seg) || seg === 'admin') {
                                        return;
                                    }
                                    
                                    let title = seg.replace(/-/g, ' ');
                                    let href = accumulatedPath;
                                    
                                    // Try to match with exact registered navigation menu item or group
                                    let matchedItem: NavItem | undefined;
                                    let matchedGroup: NavGroup | undefined;
                                    
                                    for (const g of navGroups) {
                                        if (g.items) {
                                            const item = g.items.find((i: NavItem) => i.url === href || i.url === href + '/create' || href.startsWith(i.url + '/'));
                                            if (item) {
                                                matchedItem = item;
                                                matchedGroup = g;
                                                break;
                                            }
                                        }
                                    }
                                    
                                    if (seg === 'core') {
                                        // Skip core segment, we will get the group and module info from the next segments
                                        return;
                                    }
                                    
                                    if (matchedItem && matchedGroup) {
                                        // Push the group title first if it is not already in the list
                                        const groupAlreadyAdded = filteredSegments.some(s => s.title === matchedGroup!.title);
                                        if (!groupAlreadyAdded) {
                                            filteredSegments.push({
                                                title: matchedGroup.title,
                                                href: '#'
                                            });
                                        }
                                        title = matchedItem.title;
                                    } else {
                                        title = title.charAt(0).toUpperCase() + title.slice(1);
                                    }
                                    
                                    filteredSegments.push({ title, href });
                                });

                                // Set last item's href to '#'
                                if (filteredSegments.length > 0) {
                                    filteredSegments[filteredSegments.length - 1].href = '#';
                                }
                                
                                currentBreadcrumbs = filteredSegments.filter(
                                    (seg) => seg.title !== 'Admin' && seg.title !== 'Administrator'
                                );
                                if (currentBreadcrumbs.length === 0) {
                                    currentBreadcrumbs = [{ title: 'Dashboard', href: '#' }];
                                }
                            }
                            return <Breadcrumbs breadcrumbs={currentBreadcrumbs} />;
                        })()}
                        {/* {(() => {
                            const path = typeof window !== 'undefined' ? window.location.pathname : '';
                            if (path.includes('/admin/contracts'))
                                return (
                                    <span className="text-muted-foreground text-[10px] font-medium">
                                        Kelola seluruh kontrak di sistem (Edit, Review, Approval, Audit Trail)
                                    </span>
                                );
                            if (path.includes('/admin/users'))
                                return (
                                    <span className="text-muted-foreground text-[10px] font-medium">
                                        Manajemen akun pengguna, peran (Roles), dan departemen
                                    </span>
                                );
                            if (path.includes('/admin/contract-types'))
                                return (
                                    <span className="text-muted-foreground text-[10px] font-medium">Pengaturan tipe-tipe kontrak yang berlaku</span>
                                );
                            if (path.includes('/admin/form-templates'))
                                return (
                                    <span className="text-muted-foreground text-[10px] font-medium">
                                        Desain dan konfigurasi template form digital
                                    </span>
                                );
                            if (path.includes('/admin/workflows'))
                                return (
                                    <span className="text-muted-foreground text-[10px] font-medium">
                                        Pengaturan tahapan alur persetujuan (Workflow)
                                    </span>
                                );
                            if (path.includes('/contracts'))
                                return (
                                    <span className="text-muted-foreground text-[10px] font-medium">
                                        Detail kontrak aktif & pemantauan berkas saat ini
                                    </span>
                                );
                            if (path.includes('/dashboard'))
                                return (
                                    <span className="text-muted-foreground text-[10px] font-medium">
                                        Pantau aktivitas, status persetujuan, dan metrik kontrak Anda
                                    </span>
                                );
                            return null;
                        })()} */}
                    </div>
                </div>

                {/* Right Section: Actions & Profile */}
                <div className="flex items-center gap-1.5">
                    {/* Action Group */}
                    <div className="bg-muted border-border flex items-center gap-0.5 rounded-xl border px-1 py-1">
                        <HeaderLanguage />
                        <HeaderChat />
                        <HeaderNotifications />
                        <HeaderHelp />
                    </div>

                    {/* Separator */}
                    <div className="bg-border dark:bg-border mx-1 h-5 w-px" />

                    {/* System Group */}
                    <div className="flex items-center gap-1">
                        <SiteCustomizer />
                        <AppearanceToggleDropdown />
                    </div>

                    {/* Profile Section */}
                    <div className="border-border dark:border-border ml-2 border-l pl-2">
                        <HeaderUserMenu />
                    </div>
                </div>

                {/* Subtle Bottom Accent */}
                <div className="absolute bottom-0 left-1/2 h-[1px] w-[40%] -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent dark:via-white" />
            </header>
        </div>
    );
});
