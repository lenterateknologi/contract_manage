import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { Contract } from '@/pages/contracts/types';
import { Briefcase, Building2, Calendar, ChevronDown, ChevronUp, Clock, Mail, Phone, ShieldCheck, User, UserCheck } from 'lucide-react';
import { useState } from 'react';

export function PicInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const pic = selected.assigned_pic as any;
    const assignedBy = selected.assigned_by as any;
    const picManager = pic?.manager;

    const picAssignedAt = (selected as any).pic_assigned_at ||
        selected.histories?.find((h: any) => h.action === 'WORKFLOW_ASSIGNED')?.created_at ||
        (selected.histories?.find((h: any) => h.action === 'WORKFLOW_ASSIGNED') as any)?.created_at_formatted ||
        (selected as any).assigned_at_formatted ||
        (selected as any).assigned_at ||
        null;

    const content = (
        <div className="flex flex-col gap-4">
            {pic ? (
                <>
                    {/* Card 1: Profil Petugas yang Ditugaskan (PIC) */}
                    <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                        <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                    <UserCheck size={16} />
                                </div>
                                <div>
                                    <CardTitle className="text-xs font-bold text-foreground">
                                        Profil Petugas yang Ditugaskan (PIC)
                                    </CardTitle>
                                </div>
                            </div>
                            {picAssignedAt && (
                                <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-medium text-sky-700 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-md">
                                    <Clock size={12} />
                                    <span>Ditugaskan: {picAssignedAt}</span>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {/* Profile Box */}
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <UserAvatarIcon
                                        user={pic}
                                        name={pic?.name || 'Petugas PIC'}
                                        size="md"
                                        className="h-11 w-11 ring-2 ring-primary/20 shrink-0 text-sm"
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                                                {pic?.name || '-'}
                                            </h3>
                                            <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10 rounded">
                                                Petugas PIC
                                            </Badge>
                                            {pic?.nik && (
                                                <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                                    NIK: {pic.nik}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                            {pic?.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail size={12} className="shrink-0" />
                                                    <span className="truncate">{pic.email}</span>
                                                </div>
                                            )}
                                            {(pic?.phone_number || pic?.mobile_no) && (
                                                <div className="flex items-center gap-1">
                                                    <Phone size={12} className="shrink-0" />
                                                    <span>{pic.phone_number || pic.mobile_no}</span>
                                                </div>
                                            )}
                                            {pic?.jobtitle_name && (
                                                <div className="flex items-center gap-1">
                                                    <Briefcase size={12} className="shrink-0" />
                                                    <span>{pic.jobtitle_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Organisasi Grid Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                                <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Departemen</span>
                                    <span className="text-xs font-semibold text-foreground break-words truncate">{pic?.department_name || '—'}</span>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Divisi</span>
                                    <span className="text-xs font-semibold text-foreground break-words truncate">{pic?.division_name || '—'}</span>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Perusahaan (PT)</span>
                                    <span className="text-xs font-semibold text-foreground break-words truncate">{pic?.company_name || '—'}</span>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 flex flex-col justify-between space-y-1">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">Company Group</span>
                                    <span className="text-xs font-semibold text-foreground break-words truncate">{pic?.company_group_name || '—'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Atasan Langsung PIC & Otorisasi Penugasan */}
                    <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                        <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <CardTitle className="text-xs font-bold text-foreground">
                                        Informasi Atasan Langsung PIC & Otorisasi Penugasan
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Atasan Langsung PIC */}
                                <div className="rounded-lg border border-border/60 bg-card p-3.5">
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atasan Langsung PIC</span>
                                        {picManager || pic?.reporting_to ? (
                                            <Badge variant="outline" className="px-1.5 py-0 text-[8.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10">
                                                Supervisor / Manager
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="px-1.5 py-0 text-[8.5px] font-semibold text-muted-foreground border-border/50 bg-muted/40">
                                                Tidak Terdaftar
                                            </Badge>
                                        )}
                                    </div>
                                    {picManager ? (
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatarIcon user={picManager} size="sm" className="h-8 w-8 ring-1 ring-border/50 shrink-0 text-[10px]" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate leading-tight">{picManager.name}</span>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                                    {picManager.email && <span className="truncate">{picManager.email}</span>}
                                                    {picManager.jobtitle_name && <span>• {picManager.jobtitle_name}</span>}
                                                </div>
                                                {picManager.department_name && (
                                                    <span className="text-[9.5px] text-muted-foreground">{picManager.department_name}</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : pic?.reporting_to ? (
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatarIcon name={pic.reporting_to} size="sm" className="h-8 w-8 ring-1 ring-border/50 shrink-0 text-[10px]" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate leading-tight">{pic.reporting_to}</span>
                                                <span className="text-[10px] text-muted-foreground">Direct Supervisor</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground italic">Data atasan langsung PIC belum tersedia di master employee.</p>
                                    )}
                                </div>

                                {/* Ditugaskan Oleh (Manager/Otoritas Pengajuan) */}
                                <div className="rounded-lg border border-border/60 bg-card p-3.5">
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ditugaskan Oleh (Manager)</span>
                                        {assignedBy ? (
                                            <Badge variant="outline" className="px-1.5 py-0 text-[8.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                                                Pemberi Tugas
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="px-1.5 py-0 text-[8.5px] font-semibold text-muted-foreground border-border/50 bg-muted/40">
                                                Otomatis / Sistem
                                            </Badge>
                                        )}
                                    </div>
                                    {assignedBy ? (
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatarIcon user={assignedBy} size="sm" className="h-8 w-8 ring-1 ring-border/50 shrink-0 text-[10px]" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate leading-tight">{assignedBy.name}</span>
                                                {assignedBy.email && (
                                                    <span className="text-[10px] text-muted-foreground truncate">{assignedBy.email}</span>
                                                )}
                                                {assignedBy.department_name && (
                                                    <span className="text-[9.5px] text-muted-foreground">{assignedBy.department_name}</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground italic">Penugasan otomatis sesuai konfigurasi workflow.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card className="rounded-xl border border-border/60 bg-card shadow-none overflow-hidden">
                    <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center gap-2.5 space-y-0">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            <UserCheck size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-xs font-bold text-foreground">
                                Profil Petugas yang Ditugaskan (PIC)
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <UserCheck className="h-12 w-12 text-muted-foreground/40 mb-3" />
                        <h4 className="text-sm font-semibold text-foreground">Belum Ada Petugas (PIC) Ditugaskan</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            PIC belum ditetapkan untuk pengajuan ini. Penugasan PIC dilakukan oleh Manager / Otorisator pada tahap alur persetujuan terkait.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    if (isTabView) {
        return (
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3 h-full min-h-0 overflow-y-auto custom-scrollbar">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <UserCheck size={15} className="text-primary-foreground/90" /> Informasi PIC
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
                    <UserCheck size={15} className="text-primary-foreground/90" /> Informasi PIC
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
