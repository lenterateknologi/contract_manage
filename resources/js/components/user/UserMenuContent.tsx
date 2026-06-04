import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/overlays/DropdownMenu';
import { UserInfo } from '@/components/user/UserInfo';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

interface UserMenuContentProps {
    user: User | null;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    if (!user) {
        return null;
    }

    return (
        <>
            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link
                    href={route('profile.edit')}
                    className="hover:bg-sidebar-accent group flex w-full items-center gap-2 rounded-t-lg px-3 py-2.5 text-left text-sm transition-colors"
                    onClick={cleanup}
                >
                    <UserInfo user={user} showEmail={true} />
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="focus:bg-primary focus:text-primary-foreground">
                <Link
                    className="flex w-full items-center hover:text-white"
                    method="post"
                    href={route('logout')}
                    as="button"
                    replace
                    onClick={cleanup}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
