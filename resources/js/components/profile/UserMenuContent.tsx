import { useState } from 'react';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/selection/DropdownMenu';
import { UserInfo } from '@/components/profile/UserInfo';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type SharedData, type User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, ArrowRightLeft, CornerDownLeft } from 'lucide-react';
import { UserSwitchModal } from '@/components/impersonation/UserSwitchModal';

interface UserMenuContentProps {
    user: User | null;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { auth } = usePage<SharedData>().props;
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

    if (!user) {
        return null;
    }

    const isImpersonating = auth?.impersonation?.is_impersonating;
    const canImpersonate = auth?.impersonation?.can_impersonate || auth?.user?.role === 'Super Admin';

    const handleLeave = () => {
        cleanup();
        router.post(route('impersonate.leave'));
    };

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

            {/* Impersonation Actions */}
            {(canImpersonate || isImpersonating) && (
                <>
                    <DropdownMenuSeparator />
                    {isImpersonating && (
                        <DropdownMenuItem
                            onClick={handleLeave}
                            className="text-amber-600 dark:text-amber-400 font-semibold cursor-pointer flex items-center"
                        >
                            <CornerDownLeft className="mr-2 h-4 w-4" />
                            Kembali ke Akun Admin
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        onClick={() => {
                            cleanup();
                            setIsSwitchModalOpen(true);
                        }}
                        className="cursor-pointer flex items-center"
                    >
                        <ArrowRightLeft className="mr-2 h-4 w-4 text-primary" />
                        Ganti User Login (Switch User)
                    </DropdownMenuItem>
                </>
            )}

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

            <UserSwitchModal
                open={isSwitchModalOpen}
                onOpenChange={setIsSwitchModalOpen}
            />
        </>
    );
}
