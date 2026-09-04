import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { ShieldAlert, CornerDownLeft, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { UserSwitchModal } from './UserSwitchModal';

export function ImpersonationBanner() {
    const { auth } = usePage<SharedData>().props;
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);

    if (!auth?.impersonation?.is_impersonating) {
        return null;
    }

    const handleLeave = () => {
        if (leaving) return;
        setLeaving(true);
        router.post(
            route('impersonate.leave'),
            {},
            {
                onFinish: () => setLeaving(false),
            }
        );
    };

    const impersonatorName = auth.impersonation.impersonator?.name || 'Super Admin';

    return (
        <>
            <div className="sticky top-0 z-[999] w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white px-4 py-2 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs border-b border-amber-400/40">
                <div className="flex items-center gap-2.5">
                    <div className="size-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldAlert className="size-3.5 text-white" />
                    </div>
                    <div className="leading-tight">
                        <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                            <span>Mode Impersonasi Login:</span>
                            <span className="bg-white/25 px-1.5 py-0.5 rounded font-bold underline">
                                {auth.user?.name}
                            </span>
                            <span className="text-[11px] bg-black/20 px-1.5 py-0.5 rounded">
                                Role: {auth.user?.role}
                            </span>
                        </div>
                        <div className="text-[10.5px] opacity-90 hidden sm:block">
                            Akun asli: <span className="font-medium">{impersonatorName}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsSwitchModalOpen(true)}
                        className="h-7 px-2.5 text-xs text-white bg-black/20 hover:bg-black/30 hover:text-white border-0 font-medium rounded-lg cursor-pointer transition-all"
                    >
                        <Users className="size-3.5 mr-1" />
                        Ganti User Lain
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleLeave}
                        disabled={leaving}
                        className="h-7 px-3 text-xs bg-white text-amber-900 hover:bg-white/90 hover:text-amber-950 font-bold border-0 shadow-xs rounded-lg cursor-pointer transition-all"
                    >
                        {leaving ? (
                            <Loader2 className="size-3.5 animate-spin mr-1 text-amber-900" />
                        ) : (
                            <CornerDownLeft className="size-3.5 mr-1 text-amber-900" />
                        )}
                        Kembali ke Akun Admin
                    </Button>
                </div>
            </div>

            <UserSwitchModal
                open={isSwitchModalOpen}
                onOpenChange={setIsSwitchModalOpen}
            />
        </>
    );
}
