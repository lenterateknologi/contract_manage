import { UserMenuContent } from '@/components/profile/UserMenuContent';
import { Button } from '@/components/ui/buttons/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/user/Avatar';
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
                    className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full p-0 shadow-xs ring-1 ring-white/25 transition-all hover:ring-2 hover:ring-white/50"
                >
                    <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                        <AvatarFallback className="text-primary rounded-full bg-white text-xs font-bold">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="border-border z-[99999] w-56 rounded-2xl border shadow-2xl"
                side="right"
                align="end"
                sideOffset={14}
                forceMount
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
