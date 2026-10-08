import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { Contract } from '@/features/Contracts/types';
import { Briefcase, ChevronDown, ChevronUp, Clock, Mail, Phone, ShieldCheck, UserCheck } from 'lucide-react';
import { useState } from 'react';

export function PicInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const pic = selected.assigned_pic as any;
    const assignedBy = selected.assigned_by as any;
    const picManager = pic?.manager;

    const picAssignedAt =
        (selected as any).pic_assigned_at ||
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
                    <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                        <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0 border-b p-4 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                                    <UserCheck size={16} />
                                </div>
                                <div>
                                    <CardTitle className="text-foreground text-xs font-bold">Profil Petugas yang Ditugaskan (PIC)</CardTitle>
                                </div>
                            </div>
                            {picAssignedAt && (
                                <div className="flex items-center gap-1.5 rounded-md border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 font-mono text-[10.5px] font-medium text-sky-700 dark:text-sky-300">
                                    <Clock size={12} />
                                    <span>Ditugaskan: {picAssignedAt}</span>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                            {/* Profile Box */}
                            <div className="border-border/50 flex items-center justify-between gap-3 border-b pb-3">
                                <div className="flex items-center gap-3">
                                    <UserAvatarIcon
                                        user={pic}
                                        name={pic?.name || 'Petugas PIC'}
                                        size="md"
                                        className="ring-primary/20 h-11 w-11 shrink-0 text-sm ring-2"
                                    />
                                    <div className="flex min-w-0 flex-col">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-foreground truncate text-sm leading-tight font-bold">{pic?.name || '-'}</h3>
                                            <Badge
                                                variant="outline"
                                                className="rounded border-sky-500/30 bg-sky-500/10 px-1.5 py-0 text-[9px] font-bold tracking-wider text-sky-600 uppercase dark:text-sky-400"
                                            >
                                                Petugas PIC
                                            </Badge>
                                            {pic?.nik && (
                                                <span className="text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 font-mono text-[10px]">
                                                    NIK: {pic.nik}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
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
                            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                                <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                                    <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Departemen</span>
                                    <span className="text-foreground truncate text-xs font-semibold break-words">{pic?.department_name || '—'}</span>
                                </div>
                                <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                                    <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Divisi</span>
                                    <span className="text-foreground truncate text-xs font-semibold break-words">{pic?.division_name || '—'}</span>
                                </div>
                                <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                                    <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Perusahaan (PT)</span>
                                    <span className="text-foreground truncate text-xs font-semibold break-words">{pic?.company_name || '—'}</span>
                                </div>
                                <div className="border-border/50 bg-muted/30 flex flex-col justify-between space-y-1 rounded-lg border p-2.5">
                                    <span className="text-muted-foreground text-[9.5px] font-bold tracking-wider uppercase">Company Group</span>
                                    <span className="text-foreground truncate text-xs font-semibold break-words">
                                        {pic?.company_group_name || '—'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Atasan Langsung PIC & Otorisasi Penugasan */}
                    <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                        <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0 border-b p-4 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <CardTitle className="text-foreground text-xs font-bold">
                                        Informasi Atasan Langsung PIC & Otorisasi Penugasan
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {/* Atasan Langsung PIC */}
                                <div className="border-border/60 bg-card rounded-lg border p-3.5">
                                    <div className="mb-2.5 flex items-center justify-between gap-2">
                                        <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                                            Atasan Langsung PIC
                                        </span>
                                        {picManager || pic?.reporting_to ? (
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
                                                Tidak Terdaftar
                                            </Badge>
                                        )}
                                    </div>
                                    {picManager ? (
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatarIcon
                                                user={picManager}
                                                size="sm"
                                                className="ring-border/50 h-8 w-8 shrink-0 text-[10px] ring-1"
                                            />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-foreground truncate text-xs leading-tight font-bold">{picManager.name}</span>
                                                <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[10px]">
                                                    {picManager.email && <span className="truncate">{picManager.email}</span>}
                                                    {picManager.jobtitle_name && <span>• {picManager.jobtitle_name}</span>}
                                                </div>
                                                {picManager.department_name && (
                                                    <span className="text-muted-foreground text-[9.5px]">{picManager.department_name}</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : pic?.reporting_to ? (
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatarIcon
                                                name={pic.reporting_to}
                                                size="sm"
                                                className="ring-border/50 h-8 w-8 shrink-0 text-[10px] ring-1"
                                            />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-foreground truncate text-xs leading-tight font-bold">{pic.reporting_to}</span>
                                                <span className="text-muted-foreground text-[10px]">Direct Supervisor</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-[11px] italic">
                                            Data atasan langsung PIC belum tersedia di master employee.
                                        </p>
                                    )}
                                </div>

                                {/* Ditugaskan Oleh (Manager/Otoritas Pengajuan) */}
                                <div className="border-border/60 bg-card rounded-lg border p-3.5">
                                    <div className="mb-2.5 flex items-center justify-between gap-2">
                                        <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                                            Ditugaskan Oleh (Manager)
                                        </span>
                                        {assignedBy ? (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[8.5px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400"
                                            >
                                                Pemberi Tugas
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="text-muted-foreground border-border/50 bg-muted/40 px-1.5 py-0 text-[8.5px] font-semibold"
                                            >
                                                Otomatis / Sistem
                                            </Badge>
                                        )}
                                    </div>
                                    {assignedBy ? (
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatarIcon
                                                user={assignedBy}
                                                size="sm"
                                                className="ring-border/50 h-8 w-8 shrink-0 text-[10px] ring-1"
                                            />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-foreground truncate text-xs leading-tight font-bold">{assignedBy.name}</span>
                                                {assignedBy.email && (
                                                    <span className="text-muted-foreground truncate text-[10px]">{assignedBy.email}</span>
                                                )}
                                                {assignedBy.department_name && (
                                                    <span className="text-muted-foreground text-[9.5px]">{assignedBy.department_name}</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-[11px] italic">Penugasan otomatis sesuai konfigurasi workflow.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-none">
                    <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center gap-2.5 space-y-0 border-b p-4 pb-3">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                            <UserCheck size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-foreground text-xs font-bold">Profil Petugas yang Ditugaskan (PIC)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <UserCheck className="text-muted-foreground/40 mb-3 h-12 w-12" />
                        <h4 className="text-foreground text-sm font-semibold">Belum Ada Petugas (PIC) Ditugaskan</h4>
                        <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                            PIC belum ditetapkan untuk pengajuan ini. Penugasan PIC dilakukan oleh Manager / Otorisator pada tahap alur persetujuan
                            terkait.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    if (isTabView) {
        return (
            <div className="custom-scrollbar flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:p-4">
                <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4">
                    <div className="text-primary-foreground flex items-center gap-2 text-xs font-semibold tracking-tight uppercase">
                        <UserCheck size={15} className="text-primary-foreground/90" /> Informasi PIC
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
                    <UserCheck size={15} className="text-primary-foreground/90" /> Informasi PIC
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
