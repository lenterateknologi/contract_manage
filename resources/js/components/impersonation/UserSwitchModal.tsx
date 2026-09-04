import React, { useState, useEffect, useCallback, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialogs/Dialog';
import { Input } from '@/components/ui/inputs/Input';
import { Badge } from '@/components/ui/feedback/Badge';
import { Button } from '@/components/ui/buttons/Button';
import { type SharedData } from '@/types';
import {
    Search,
    UserCheck,
    Building2,
    Briefcase,
    Loader2,
    ShieldAlert,
    ArrowRightLeft,
    Check,
    CornerDownLeft,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
            }
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
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl shadow-2xl border border-border/80 gap-0">
                {/* Header with decorative background */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/60">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
                                <ArrowRightLeft className="size-4" />
                            </div>
                            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                Ganti Akun Login (Switch User)
                                <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/15 text-primary border-0">
                                    Super Admin
                                </Badge>
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Pilih akun pengguna mana pun dari database untuk langsung login dan mencoba sistem dari akun riil mereka.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Active Impersonation Notice if active */}
                    {isImpersonating && (
                        <div className="mt-3.5 flex items-center justify-between p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                            <div className="flex items-center gap-2 text-xs">
                                <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <div>
                                    <span className="font-semibold">Sedang login sebagai: </span>
                                    <span className="underline">{auth.user?.name}</span> ({auth.user?.role})
                                    {auth.impersonation?.impersonator && (
                                        <span className="text-[11px] block opacity-80">
                                            Admin Asli: {auth.impersonation.impersonator.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLeaveImpersonation}
                                disabled={leaving}
                                className="h-7 text-xs bg-amber-500 text-white hover:bg-amber-600 hover:text-white border-0 font-medium cursor-pointer"
                            >
                                {leaving ? (
                                    <Loader2 className="size-3.5 animate-spin mr-1" />
                                ) : (
                                    <CornerDownLeft className="size-3.5 mr-1" />
                                )}
                                Kembali ke Admin
                            </Button>
                        </div>
                    )}

                    {/* Search Input Box */}
                    <div className="relative mt-3.5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Cari nama, NIK, role, jabatan, perusahaan, atau departemen..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            autoFocus
                            className="pl-9 pr-9 h-10 bg-background/80 border-border/80 focus:bg-background rounded-xl text-sm"
                        />
                        {loading && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />
                        )}
                    </div>
                </div>

                {/* Users List Container */}
                <div className="max-h-[380px] overflow-y-auto p-3 space-y-1.5 custom-scrollbar bg-muted/20">
                    {users.length === 0 && !loading && (
                        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <UserCheck className="size-8 opacity-30 mb-2" />
                            <p className="text-xs font-semibold">Tidak ada pengguna yang cocok</p>
                            <p className="text-[11px] mt-0.5">Coba kata kunci pencarian nama atau NIK lainnya</p>
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
                                    'group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer',
                                    isCurrent
                                        ? 'bg-primary/5 border-primary/30 cursor-default'
                                        : 'bg-card hover:bg-accent/70 hover:border-primary/40 border-border/50 shadow-2xs'
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                                    {/* Initials Avatar */}
                                    <div className={cn(
                                        'size-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105',
                                        isCurrent
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                                    )}>
                                        {user.initials || user.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* User Details */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                                {user.name}
                                            </span>
                                            {user.nik && (
                                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground">
                                                    {user.nik}
                                                </span>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] py-0 px-1.5 font-semibold bg-primary/10 text-primary border-primary/20"
                                            >
                                                {user.role}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 truncate">
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
                                                <span className="text-[10.5px] opacity-75 truncate hidden sm:inline">
                                                    • {user.department}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="shrink-0">
                                    {isCurrent ? (
                                        <div className="flex items-center gap-1 text-xs text-primary font-bold px-2 py-1 bg-primary/10 rounded-lg">
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
                                            className="h-8 px-3 text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all cursor-pointer rounded-lg"
                                        >
                                            {isSwitchingThis ? (
                                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                            ) : (
                                                <Sparkles className="size-3.5 mr-1.5 opacity-70 group-hover:opacity-100" />
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
                <div className="p-3 bg-muted/40 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>💡 Menampilkan hasil pencarian instan (maks. 25 user).</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-7 text-xs font-medium cursor-pointer"
                    >
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
