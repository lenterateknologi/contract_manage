import AppearanceToggleDropdown from '@/components/layout/AppearanceDropdown';
import { HeaderChat } from '@/components/layout/header/HeaderChat';
import { HeaderHelp } from '@/components/layout/header/HeaderHelp';
import { HeaderLanguage } from '@/components/layout/header/HeaderLanguage';
import { HeaderNotifications } from '@/components/layout/header/HeaderNotifications';
import { HeaderUserMenu } from '@/components/layout/header/HeaderUserMenu';
import { SiteCustomizer } from '@/components/layout/SiteCustomizer';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { SidebarTrigger } from '@/components/ui/navigation/Sidebar';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';
import { memo } from 'react';

export const AppSidebarHeader = memo(function AppSidebarHeader({ breadcrumbs = [] }: { readonly breadcrumbs?: BreadcrumbItemType[] }) {
    const { url } = usePage();
    const path = url.split('?')[0];
    const isDetailRoute = /^\/contracts\/[a-zA-Z0-9-]+$/.test(path) && !['/contracts/mine', '/contracts/pending', '/contracts/expiry'].includes(path);

    return (
        <div
            className={cn(
                'origin-top overflow-hidden transition-all duration-300 ease-in-out',
                isDetailRoute ? 'pointer-events-none h-0 opacity-0' : 'h-[88px] opacity-100',
            )}
        >
            <header
                className={cn(
                    'm-4 flex h-14 items-center justify-between rounded-2xl px-6',
                    'bg-card/90 dark:bg-card/90 backdrop-blur-xl',
                    'border-border/60 dark:border-border/60 border shadow-sm dark:shadow-black/20',
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
                            const path = typeof window !== 'undefined' ? window.location.pathname : '';
                            let currentBreadcrumbs = [...breadcrumbs];
                            if (currentBreadcrumbs.length === 0) {
                                if (path.includes('/contracts')) {
                                    currentBreadcrumbs = [
                                        { title: 'Modul Kontrak', href: '/dashboard' },
                                        { title: 'Draft saya', href: '/dashboard' },
                                        { title: 'Detail kontrak', href: '#' },
                                    ];
                                } else if (path.includes('/dashboard')) {
                                    currentBreadcrumbs = [
                                        { title: 'Modul Kontrak', href: '/dashboard' },
                                        { title: 'Draft saya', href: '#' },
                                    ];
                                } else if (path.includes('/admin/contracts')) {
                                    currentBreadcrumbs = [
                                        { title: 'Modul Kontrak', href: '/admin/contracts' },
                                        { title: 'Daftar Kontrak', href: '#' },
                                    ];
                                } else {
                                    currentBreadcrumbs = [{ title: 'Modul Kontrak', href: '#' }];
                                }
                            }
                            return <Breadcrumbs breadcrumbs={currentBreadcrumbs} />;
                        })()}
                        {(() => {
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
                        })()}
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
