import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, FileText, Clock, FilePlus, FileEdit, History } from 'lucide-react';
import AppLogo from './app-logo';

const navGroups = [
    {
        title: 'Ringkasan',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
        ],
    },
    {
        title: 'Manajemen Kontrak',
        items: [
            { title: 'Semua Kontrak', url: '/contracts', icon: FileText },
            { title: 'Menunggu Approval', url: '/pending', icon: Clock },
        ],
    },
    {
        title: 'Formulir Standar',
        items: [
            { title: 'Form F1', url: '/f1', icon: FilePlus },
            { title: 'Form F2', url: '/f2', icon: FileEdit },
        ],
    },
    {
        title: 'Laporan',
        items: [
            { title: 'Audit Trail', url: '/audit', icon: History },
        ],
    },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     url: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     url: 'https://laravel.com/docs/starter-kits',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.map((group) => (
                    <NavMain key={group.title} title={group.title} items={group.items} />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
