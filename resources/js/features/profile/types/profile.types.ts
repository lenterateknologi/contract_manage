import { UserProfile as BaseUserProfile } from '@/features/Contracts/types';

export interface RecentContract {
    id: string;
    form_no: string;
    contract_no: string;
    title: string;
    type: string;
    status: string;
    progress: {
        done: number;
        total: number;
        pct: number;
    };
    time_ago: string;
    status_info?: any;
}

export interface UserProfile extends BaseUserProfile {
    username?: string;
    phone?: string;
    position?: string;
    company?: string;
    location?: string;
    group?: string;
    region?: string;
    bio?: string;
    created_at?: string;
    is_admin?: boolean;
    division_id?: string;
    department_id?: string;
    stats?: {
        total_created: number;
        pending_approvals: number;
        assigned_active: number;
    };
}

export interface ProfilePageProps {
    department?: string;
    recentContracts?: RecentContract[];
    user?: UserProfile;
}

export type ProfileTabId = 'general' | 'security' | 'activity' | 'appearance';

export interface ProfileFormData {
    name: string;
    email: string;
    username: string;
    phone: string;
    position: string;
    company: string;
    location: string;
    group: string;
    region: string;
    bio: string;
}

export interface PasswordFormData {
    current_password: '';
    password: '';
    password_confirmation: '';
}
