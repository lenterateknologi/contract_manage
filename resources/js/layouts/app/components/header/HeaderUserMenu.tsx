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
                    className="hover:ring-white/50 ring-1 ring-white/25 relative h-9 w-9 overflow-hidden rounded-full p-0 transition-all hover:ring-2 cursor-pointer shadow-xs"
                >
                    <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                        <AvatarFallback className="bg-white text-primary rounded-full text-xs font-bold">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border border-border shadow-2xl rounded-2xl z-[99999]" side="right" align="end" sideOffset={14} forceMount>
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
