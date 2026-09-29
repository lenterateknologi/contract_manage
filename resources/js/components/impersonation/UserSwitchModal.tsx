import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Badge } from '@/components/ui/feedback/Badge';
import { Icons } from '@/components/ui/icons';
import { Input } from '@/components/ui/inputs/Input';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const { Search, UserCheck, Building2, Briefcase, Loader2, ShieldAlert, ArrowRightLeft, Check, CornerDownLeft, Sparkles } = Icons;

export interface ImpersonationUser {
    id: string;
    name: string;
    nik?: string;
    email: string;
    role: string;
    job_title?: string;
    company?: string;
    department?: string;
    initials: string;
}

interface UserSwitchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserSwitchModal({ open, onOpenChange }: UserSwitchModalProps) {
    const { auth } = usePage<SharedData>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<ImpersonationUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [switchingId, setSwitchingId] = useState<string | null>(null);
    const [leaving, setLeaving] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isImpersonating = auth?.impersonation?.is_impersonating;
    const currentUserId = auth?.user?.id;

    const fetchUsers = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const url = new URL(route('impersonate.search'), window.location.origin);
            if (query.trim()) {
                url.searchParams.set('q', query.trim());
            }
            const res = await fetch(url.toString(), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error('Failed to search users for impersonation', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchUsers(searchQuery);
        }
    }, [open, fetchUsers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            fetchUsers(val);
        }, 300);
    };

    const handleSwitchUser = (user: ImpersonationUser) => {
        if (switchingId || leaving) return;
        setSwitchingId(user.id);

        router.post(
            route('impersonate.switch', { userId: user.id }),
            {},
            {
                onFinish: () => {
                    setSwitchingId(null);
                    onOpenChange(false);
                },
            },
        );
    };

    const handleLeaveImpersonation = () => {
        if (leaving || switchingId) return;
        setLeaving(true);

        router.post(
            route('impersonate.leave'),
            {},
            {
                onFinish: () => {
                    setLeaving(false);
                    onOpenChange(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-border/80 max-w-2xl gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl">
                {/* Header with decorative background */}
                <div className="from-primary/10 via-primary/5 border-border/60 border-b bg-gradient-to-r to-transparent p-6 pb-4">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
                                <ArrowRightLeft className="size-4" />
                            </div>
                            <DialogTitle className="text-foreground flex items-center gap-2 text-lg font-bold">
                                Ganti Akun Login (Switch User)
                                <Badge variant="secondary" className="bg-primary/15 text-primary border-0 text-[10px] font-semibold">
                                    Super Admin
                                </Badge>
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-muted-foreground text-xs">
                            Pilih akun pengguna mana pun dari database untuk langsung login dan mencoba sistem dari akun riil mereka.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Active Impersonation Notice if active */}
                    {isImpersonating && (
                        <div className="mt-3.5 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/15 p-2.5 text-amber-900 dark:text-amber-200">
                            <div className="flex items-center gap-2 text-xs">
                                <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <span className="font-semibold">Sedang login sebagai: </span>
                                    <span className="underline">{auth.user?.name}</span> ({auth.user?.role})
                                    {auth.impersonation?.impersonator && (
                                        <span className="block text-[11px] opacity-80">Admin Asli: {auth.impersonation.impersonator.name}</span>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLeaveImpersonation}
                                disabled={leaving}
                                className="h-7 cursor-pointer border-0 bg-amber-500 text-xs font-medium text-white hover:bg-amber-600 hover:text-white"
                            >
                                {leaving ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <CornerDownLeft className="mr-1 size-3.5" />}
                                Kembali ke Admin
                            </Button>
                        </div>
                    )}

                    {/* Search Input Box */}
                    <div className="relative mt-3.5">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Cari nama, NIK, role, jabatan, perusahaan, atau departemen..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            autoFocus
                            className="bg-background/80 border-border/80 focus:bg-background h-10 rounded-xl pr-9 pl-9 text-sm"
                        />
                        {loading && <Loader2 className="text-primary absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />}
                    </div>
                </div>

                {/* Users List Container */}
                <div className="custom-scrollbar bg-muted/20 max-h-[380px] space-y-1.5 overflow-y-auto p-3">
                    {users.length === 0 && !loading && (
                        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                            <UserCheck className="mb-2 size-8 opacity-30" />
                            <p className="text-xs font-semibold">Tidak ada pengguna yang cocok</p>
                            <p className="mt-0.5 text-[11px]">Coba kata kunci pencarian nama atau NIK lainnya</p>
                        </div>
                    )}

                    {users.map((user) => {
                        const isCurrent = user.id === currentUserId;
                        const isSwitchingThis = switchingId === user.id;

                        return (
                            <div
                                key={user.id}
                                onClick={() => !isCurrent && handleSwitchUser(user)}
                                className={cn(
                                    'group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all',
                                    isCurrent
                                        ? 'bg-primary/5 border-primary/30 cursor-default'
                                        : 'bg-card hover:bg-accent/70 hover:border-primary/40 border-border/50 shadow-2xs',
                                )}
                            >
                                <div className="mr-3 flex min-w-0 flex-1 items-center gap-3">
                                    {/* Initials Avatar */}
                                    <UserAvatarIcon
                                        user={user}
                                        size="md"
                                        className={cn(
                                            'size-9 shrink-0 rounded-xl text-xs font-bold transition-transform group-hover:scale-105',
                                            isCurrent && 'ring-primary shadow-sm ring-2',
                                        )}
                                    />

                                    {/* User Details */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-foreground group-hover:text-primary truncate text-xs font-bold transition-colors">
                                                {user.name}
                                            </span>
                                            {user.nik && (
                                                <span className="py-0.2 bg-muted/80 text-muted-foreground rounded px-1.5 font-mono text-[10px]">
                                                    {user.nik}
                                                </span>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className="bg-primary/10 text-primary border-primary/20 px-1.5 py-0 text-[10px] font-semibold"
                                            >
                                                {user.role}
                                            </Badge>
                                        </div>

                                        <div className="text-muted-foreground mt-0.5 flex items-center gap-3 truncate text-[11px]">
                                            {user.job_title && (
                                                <span className="flex items-center gap-1 truncate">
                                                    <Briefcase className="size-3 shrink-0 opacity-70" />
                                                    <span className="truncate">{user.job_title}</span>
                                                </span>
                                            )}
                                            {user.company && (
                                                <span className="flex items-center gap-1 truncate">
                                                    <Building2 className="size-3 shrink-0 opacity-70" />
                                                    <span className="truncate">{user.company}</span>
                                                </span>
                                            )}
                                            {user.department && (
                                                <span className="hidden truncate text-[10.5px] opacity-75 sm:inline">• {user.department}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="shrink-0">
                                    {isCurrent ? (
                                        <div className="text-primary bg-primary/10 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold">
                                            <Check className="size-3.5" />
                                            <span>Akun Aktif</span>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={isSwitchingThis || Boolean(switchingId)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSwitchUser(user);
                                            }}
                                            className="group-hover:bg-primary group-hover:text-primary-foreground h-8 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-all"
                                        >
                                            {isSwitchingThis ? (
                                                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                            ) : (
                                                <Sparkles className="mr-1.5 size-3.5 opacity-70 group-hover:opacity-100" />
                                            )}
                                            Masuk
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="bg-muted/40 border-border/50 text-muted-foreground flex items-center justify-between border-t p-3 text-[11px]">
                    <span>💡 Menampilkan hasil pencarian instan (maks. 25 user).</span>
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-7 cursor-pointer text-xs font-medium">
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
