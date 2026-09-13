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
        <div className="flex flex-col gap-6 p-6">
            {/* Header / User Profile Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div className="flex items-center gap-4">
                    <UserAvatarIcon
                        user={user}
                        name={user?.name || 'Inisiator'}
                        size="lg"
                        className="h-14 w-14 ring-2 ring-primary/20 shadow-sm shrink-0 text-base"
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground leading-tight truncate">
                                {user?.name || '-'}
                            </h3>
                            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5 rounded-md">
                                Inisiator Pengaju
                            </Badge>
                        </div>
                        {user?.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Mail size={13} className="shrink-0" />
                                <span className="truncate">{user.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timing Info Pills */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-center">
                    <div className="flex flex-col sm:items-end bg-muted/40 px-3 py-1.5 rounded-lg border border-border/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Clock size={11} className="text-primary" /> Waktu Diajukan
                        </span>
                        <span className="text-xs font-semibold text-foreground mt-0.5">
                            {submittedAt || '—'}
                        </span>
                    </div>

                    {picAssignedAt && (
                        <div className="flex flex-col sm:items-end bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1">
                                <Clock size={11} className="text-sky-600 dark:text-sky-400" /> Diterima PIC
                            </span>
                            <span className="text-xs font-semibold text-sky-900 dark:text-sky-100 mt-0.5">
                                {picAssignedAt}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Organisasi Grid Cards */}
            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-primary" />
                    <span>Informasi Unit Organisasi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Departemen</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.department_name || '—'}</span>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Divisi</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.division_name || '—'}</span>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Perusahaan (PT)</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.company_name || '—'}</span>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Company Group</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.company_group_name || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Alamat Pihak I */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Alamat Kantor / Pihak I
                        </span>
                        <span className="text-xs text-foreground mt-1 leading-relaxed">
                            {(user as any)?.address || selected.metadata?.meta_p1_alamat || 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Penugasan & Approval Manager */}
            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-primary" />
                    <span>Status Otorisasi & Penugasan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disetujui Oleh (Manager)</span>
                            {selected.assigned_by ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                                    Disetujui
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-semibold text-muted-foreground border-border bg-muted/40">
                                    Belum Disetujui
                                </Badge>
                            )}
                        </div>
                        {selected.assigned_by ? (
                            <div className="flex items-center gap-3">
                                <UserAvatarIcon user={selected.assigned_by} size="sm" className="h-8 w-8 ring-1 ring-border shrink-0 text-xs" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate">{selected.assigned_by.name}</span>
                                    {selected.assigned_by.email && (
                                        <span className="text-[10px] text-muted-foreground truncate">{selected.assigned_by.email}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Menunggu persetujuan dari atasan / manager terkait.</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Petugas Ditugaskan (PIC)</span>
                            {selected.assigned_pic ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10">
                                    Ditugaskan
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-semibold text-muted-foreground border-border bg-muted/40">
                                    Belum Ada PIC
                                </Badge>
                            )}
                        </div>
                        {selected.assigned_pic ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <UserAvatarIcon user={selected.assigned_pic} size="sm" className="h-8 w-8 ring-1 ring-border shrink-0 text-xs" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-foreground truncate">{selected.assigned_pic.name}</span>
                                        {selected.assigned_pic.email && (
                                            <span className="text-[10px] text-muted-foreground truncate">{selected.assigned_pic.email}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/50 bg-muted/20 px-2.5 py-1.5 rounded-md">
                                    <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                                        <Clock size={12} className="text-sky-500" /> Waktu Diterima PIC:
                                    </span>
                                    <span className="font-bold text-foreground text-[11px]">
                                        {picAssignedAt || '—'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">PIC belum ditugaskan untuk dokumen ini.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isTabView) {
        return (
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                    </div>
                </div>
                <Card className="flex-1 overflow-y-auto custom-scrollbar border-border/80">
                    {content}
                </Card>
            </div>
        );
    }

    return (
        <Card className="border-border/80 shadow-xs">
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
