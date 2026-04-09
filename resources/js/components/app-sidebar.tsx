import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, FileText, Clock, FilePlus, FileEdit, History, ShieldCheck, Users, Settings2, GitBranch } from 'lucide-react';
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
];

const adminGroups = [
    {
        title: 'Data Master',
        items: [
            { title: 'Pengguna', url: '/admin/users', icon: Users },
            { title: 'Role', url: '/admin/roles', icon: ShieldCheck },
            { title: 'Tipe Kontrak', url: '/admin/contract-types', icon: Settings2 },
            { title: 'Alur Kerja', url: '/admin/workflows', icon: GitBranch },
            { title: 'Audit Trail', url: '/audit', icon: History },
        ],
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userRole = (auth.user as any)?.role;
    const isAdmin = userRole === 'Admin';

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

                {isAdmin && adminGroups.map((group) => (
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
