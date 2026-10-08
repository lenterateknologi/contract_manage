import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { Contract } from '@/pages/contracts/types';
import { ChevronDown, ChevronUp, Clock, Mail, MapPin, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';

export function RequesterInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const user = selected.initiator || selected.creator;

    const picAssignedAt =
        (selected as any).pic_assigned_at ||
        selected.histories?.find((h: any) => h.action === 'WORKFLOW_ASSIGNED')?.created_at ||
        (selected.histories?.find((h: any) => h.action === 'WORKFLOW_ASSIGNED') as any)?.created_at_formatted ||
        null;

    const submittedAt =
        (selected as any).submitted_at ||
        (selected as any).submitted_at_formatted ||
        (selected as any).created_at_formatted ||
        (selected as any).created_at ||
        null;

    const content = (
        <div className="flex flex-col gap-4">
            {/* Card 1: Informasi Pengaju & Inisiator */}
            <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0 border-b p-4 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                            <User size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-foreground text-xs font-bold">Informasi Pengaju & Inisiator</CardTitle>
                        </div>
                    </div>
                    {submittedAt && (
                        <div className="text-primary bg-primary/10 border-primary/20 flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10.5px] font-medium">
                            <Clock size={12} />
                            <span>Diajukan: {submittedAt}</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                    {/* Header / User Profile Box */}
                    <div className="border-border/50 flex items-center justify-between gap-3 border-b pb-3">
                        <div className="flex items-center gap-3">
                            <UserAvatarIcon
                                user={user}
                                name={user?.name || 'Inisiator'}
                                size="md"
                                className="ring-primary/20 h-11 w-11 shrink-0 text-sm ring-2"
                            />
                            <div className="flex min-w-0 flex-col">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-foreground truncate text-sm leading-tight font-bold">{user?.name || '-'}</h3>
                                    <Badge
                                        variant="outline"
                                        className="text-primary border-primary/30 bg-primary/5 rounded px-1.5 py-0 text-[9px] font-bold tracking-wider uppercase"
                                    >
                                        Inisiator Pengaju
                                    </Badge>
                                </div>
                                {user?.email && (
                                    <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                                        <Mail size={12} className="shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Organisasi Grid Cards */}
                    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                        <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                            <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Departemen</span>
                            <span className="text-foreground truncate text-xs font-semibold break-words">{user?.department_name || '—'}</span>
                        </div>
                        <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                            <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Divisi</span>
                            <span className="text-foreground truncate text-xs font-semibold break-words">{user?.division_name || '—'}</span>
                        </div>
                        <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                            <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Perusahaan (PT)</span>
                            <span className="text-foreground truncate text-xs font-semibold break-words">{user?.company_name || '—'}</span>
                        </div>
                        <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                            <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Company Group</span>
                            <span className="text-foreground truncate text-xs font-semibold break-words">{user?.company_group_name || '—'}</span>
                        </div>
                    </div>

                    {/* Alamat Pihak I */}
                    <div className="border-border/50 bg-muted/20 rounded-lg border p-3">
                        <div className="flex items-start gap-2.5">
                            <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                            <div className="flex min-w-0 flex-col">
                                <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Alamat Kantor / Pihak I</span>
                                <span className="text-foreground mt-0.5 text-xs leading-relaxed">
                                    {(user as any)?.address ||
                                        selected.metadata?.meta_p1_alamat ||
                                        'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Atasan Langsung Pengaju */}
            <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0 border-b p-4 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-foreground text-xs font-bold">Informasi Atasan Langsung Pengaju</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="border-border/60 bg-card rounded-lg border p-3.5">
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                                Atasan Langsung (Direct Supervisor)
                            </span>
                            {user?.manager || user?.reporting_to ? (
                                <Badge
                                    variant="outline"
                                    className="border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0 text-[8.5px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400"
                                >
                                    Supervisor / Manager
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="text-muted-foreground border-border/50 bg-muted/40 px-1.5 py-0 text-[8.5px] font-semibold"
                                >
                                    Belum Terdaftar
                                </Badge>
                            )}
                        </div>
                        {user?.manager ? (
                            <div className="flex items-center gap-3">
                                <UserAvatarIcon user={user.manager} size="sm" className="ring-border/50 h-9 w-9 shrink-0 text-xs ring-1" />
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-foreground truncate text-xs leading-tight font-bold">{user.manager.name}</span>
                                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px]">
                                        {user.manager.email && <span className="truncate">{user.manager.email}</span>}
                                        {user.manager.jobtitle_name && <span>• {user.manager.jobtitle_name}</span>}
                                    </div>
                                    {user.manager.department_name && (
                                        <span className="text-muted-foreground text-[10px]">{user.manager.department_name}</span>
                                    )}
                                </div>
                            </div>
                        ) : user?.reporting_to ? (
                            <div className="flex items-center gap-3">
                                <UserAvatarIcon name={user.reporting_to} size="sm" className="ring-border/50 h-9 w-9 shrink-0 text-xs ring-1" />
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-foreground truncate text-xs leading-tight font-bold">{user.reporting_to}</span>
                                    <span className="text-muted-foreground text-[10.5px]">Direct Supervisor Pengaju</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-[11px] italic">
                                Data atasan langsung inisiator belum tersedia di master data pegawai.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (isTabView) {
        return (
            <div className="custom-scrollbar flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:p-4">
                <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4">
                    <div className="text-primary-foreground flex items-center gap-2 text-xs font-semibold tracking-tight uppercase">
                        <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                    </div>
                </div>
                <div className="min-h-0 flex-1">{content}</div>
            </div>
        );
    }

    return (
        <Card className="border-border/60 shadow-none">
            <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0 rounded-t-lg p-3">
                <CardTitle className="text-primary-foreground flex items-center gap-2 text-xs font-semibold tracking-tight uppercase">
                    <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                </CardTitle>
                <button
                    type="button"
                    onClick={() => setMinimized(!minimized)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95"
                >
                    {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
            </CardHeader>

            {!minimized && <CardContent className="p-0">{content}</CardContent>}
        </Card>
    );
}
