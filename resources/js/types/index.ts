import { LucideIcon } from 'lucide-react';

export interface ImpersonationState {
    is_impersonating: boolean;
    impersonator?: {
        id: string;
        name: string;
        email: string;
        nik?: string;
        username?: string;
    } | null;
    can_impersonate: boolean;
}

export interface Auth {
    user: User | null;
    permissions: Record<
        string,
        {
            read: boolean;
            create: boolean;
            update: boolean;
            delete: boolean;
        }
    >;
    impersonation?: ImpersonationState;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
    description?: string;
    icon?: LucideIcon | string | null;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    description?: string | null;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: number | string | null;
    children?: NavItem[];
}

export interface PovOptions {
    roles: Array<{
        id: string;
        name: string;
        label: string;
        badge: string;
        description: string;
        allowed_routes: string[] | null;
        can_create_on_behalf?: boolean;
    }>;
    dashboard_types: Array<{
        id: string;
        name: string;
        label: string;
        badge: string;
        description: string;
        show_overview: boolean;
        show_workload: boolean;
        show_master_data: boolean;
    }>;
    filter_templates: Array<{
        id: string;
        name: string;
        label: string;
        badge: string;
        description: string;
        can_change_company_group: boolean;
        can_change_region: boolean;
        can_change_company: boolean;
        can_change_division: boolean;
        can_change_department: boolean;
    }>;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    breadcrumbs?: BreadcrumbItem[];
    povOptions?: PovOptions | null;
    [key: string]: unknown;
}

export interface User {
    id: string;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    position?: string;
    initials?: string;
    role?: string;
    can_create_on_behalf?: boolean;
    bg_color?: string;
    text_color?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
