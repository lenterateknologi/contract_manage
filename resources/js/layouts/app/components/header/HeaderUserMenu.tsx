import { Button } from '@/components/ui/buttons/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/user/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { UserMenuContent } from '@/components/profile/UserMenuContent';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { memo } from 'react';

export const HeaderUserMenu = memo(function HeaderUserMenu() {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

    if (!auth.user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="hover:ring-sidebar-primary/20 relative h-9 w-9 overflow-hidden rounded-full p-0 transition-all hover:ring-2"
                >
                    <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-full text-xs font-bold">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-1 w-56" align="end" forceMount>
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
