import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { Contract } from '@/pages/contracts/types';
import { Briefcase, ChevronDown, ChevronUp, Clock, Mail, MapPin, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';

export function RequesterInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const user = selected.initiator || selected.creator;

    const picAssignedAt = (selected as any).pic_assigned_at ||
        selected.histories?.find((h: any) => h.action === 'WORKFLOW_ASSIGNED')?.created_at ||
        (selected.histories?.find((h: any) => h.action === 'WORKFLOW_ASSIGNED') as any)?.created_at_formatted ||
        null;

    const submittedAt = (selected as any).submitted_at ||
        (selected as any).submitted_at_formatted ||
        (selected as any).created_at_formatted ||
        (selected as any).created_at ||
        null;

    const content = (
        <div className="flex flex-col gap-4">
            {/* Card 1: Informasi Pengaju & Inisiator */}
            <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            <User size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-xs font-bold text-foreground">
                                Informasi Pengaju & Inisiator
                            </CardTitle>
                        </div>
                    </div>
                    {submittedAt && (
                        <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
                            <Clock size={12} />
                            <span>Diajukan: {submittedAt}</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Header / User Profile Box */}
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <UserAvatarIcon
                                user={user}
                                name={user?.name || 'Inisiator'}
                                size="md"
                                className="h-11 w-11 ring-2 ring-primary/20 shrink-0 text-sm"
                            />
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                                        {user?.name || '-'}
                                    </h3>
                                    <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5 rounded">
                                        Inisiator Pengaju
                                    </Badge>
                                </div>
                                {user?.email && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                        <Mail size={12} className="shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Organisasi Grid Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Departemen</span>
                            <span className="text-xs font-semibold text-foreground break-words truncate">{user?.department_name || '—'}</span>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Divisi</span>
                            <span className="text-xs font-semibold text-foreground break-words truncate">{user?.division_name || '—'}</span>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Perusahaan (PT)</span>
                            <span className="text-xs font-semibold text-foreground break-words truncate">{user?.company_name || '—'}</span>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Company Group</span>
                            <span className="text-xs font-semibold text-foreground break-words truncate">{user?.company_group_name || '—'}</span>
                        </div>
                    </div>

                    {/* Alamat Pihak I */}
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        <div className="flex items-start gap-2.5">
                            <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Alamat Kantor / Pihak I
                                </span>
                                <span className="text-xs text-foreground mt-0.5 leading-relaxed">
                                    {(user as any)?.address || selected.metadata?.meta_p1_alamat || 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Atasan Langsung Pengaju */}
            <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-xs font-bold text-foreground">
                                Informasi Atasan Langsung Pengaju
                            </CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="rounded-lg border border-border/60 bg-card p-3.5">
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atasan Langsung (Direct Supervisor)</span>
                            {user?.manager || user?.reporting_to ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[8.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10">
                                    Supervisor / Manager
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="px-1.5 py-0 text-[8.5px] font-semibold text-muted-foreground border-border/50 bg-muted/40">
                                    Belum Terdaftar
                                </Badge>
                            )}
                        </div>
                        {user?.manager ? (
                            <div className="flex items-center gap-3">
                                <UserAvatarIcon user={user.manager} size="sm" className="h-9 w-9 ring-1 ring-border/50 shrink-0 text-xs" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate leading-tight">{user.manager.name}</span>
                                    <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground mt-0.5 flex-wrap">
                                        {user.manager.email && <span className="truncate">{user.manager.email}</span>}
                                        {user.manager.jobtitle_name && <span>• {user.manager.jobtitle_name}</span>}
                                    </div>
                                    {user.manager.department_name && (
                                        <span className="text-[10px] text-muted-foreground">{user.manager.department_name}</span>
                                    )}
                                </div>
                            </div>
                        ) : user?.reporting_to ? (
                            <div className="flex items-center gap-3">
                                <UserAvatarIcon name={user.reporting_to} size="sm" className="h-9 w-9 ring-1 ring-border/50 shrink-0 text-xs" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate leading-tight">{user.reporting_to}</span>
                                    <span className="text-[10.5px] text-muted-foreground">Direct Supervisor Pengaju</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[11px] text-muted-foreground italic">Data atasan langsung inisiator belum tersedia di master data pegawai.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (isTabView) {
        return (
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3 h-full min-h-0 overflow-y-auto custom-scrollbar">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <Card className="border-border/60 shadow-none">
            <CardHeader className="p-3 bg-primary text-primary-foreground flex flex-row items-center justify-between rounded-t-lg space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-tight text-primary-foreground flex items-center gap-2">
                    <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                </CardTitle>
                <button
                    type="button"
                    onClick={() => setMinimized(!minimized)}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                >
                    {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
            </CardHeader>

            {!minimized && (
                <CardContent className="p-0">
                    {content}
                </CardContent>
            )}
        </Card>
    );
}
