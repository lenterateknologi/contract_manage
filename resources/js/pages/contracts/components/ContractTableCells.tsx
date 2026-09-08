import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { cn, formatDate, formatDateAndTimeParts, getContractTypeBadgeConfig, getExpiryBadgeConfig, getSlaCountdownConfig } from '@/lib/utils';
import { UserAvatar, UserAvatarIcon, UserAvatarWithName, UserAvatarWithRole } from '@/components/profile/UserAvatar';
import { Contract, ContractType } from '@/pages/contracts/types';
import { AppIcon, Icons } from '@/components/ui';

const {
    AlertCircle,
    AlertTriangle,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    FileEdit,
    MoreVertical,
    Trash2,
} = Icons;
import { useEffect, useState } from 'react';

export function ExpiryBadge({ endDate, className }: Readonly<{ endDate: string | null; className?: string }>) {
    const config = getExpiryBadgeConfig(endDate);
    if (!config) return null;

    const { countdownLabel, color, icon: Icon } = config;

    return (
        <div className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold border shadow-2xs whitespace-nowrap', color, className)}>
            <Icon size={11} strokeWidth={2.5} className="shrink-0" />
            <span>{countdownLabel}</span>
        </div>
    );
}

export const SLACountdown = ({ deadline, status }: Readonly<{ deadline: string | null; status: string }>) => {
    const [config, setConfig] = useState(() => getSlaCountdownConfig(deadline, status));

    useEffect(() => {
        const tick = () => {
            setConfig(getSlaCountdownConfig(deadline, status));
        };

        tick();
        const timer = setInterval(tick, 1000 * 60);
        return () => clearInterval(timer);
    }, [deadline, status]);

    if (!deadline || config.timeLeft === '-') return <span className="text-text-soft text-[10px]">—</span>;

    const getUrgencyStyles = () => {
        if (config.urgency === 'danger') {
            return 'bg-danger text-surface-base ring-danger/40';
        }
        if (config.urgency === 'warning') {
            return 'bg-warning/10 text-warning ring-warning/40';
        }
        return 'bg-surface-muted text-text-desc ring-surface-border';
    };

    return (
        <div
            className={cn(
                'flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1',
                getUrgencyStyles(),
            )}
        >
            <Clock size={10} className={urgency === 'danger' ? 'animate-pulse' : ''} />
            {timeLeft}
        </div>
    );
};

export const ContractInfoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col gap-1 py-1 max-w-[360px]">
        <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-text-main font-semibold text-[12.5px] leading-snug line-clamp-1" title={c.title}>
                {c.title}
            </span>
            {!!c.current_version && c.current_version > 0 && (
                <span className="shrink-0 inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-bold font-mono bg-primary/10 text-primary border border-primary/20 leading-tight">
                    v{c.current_version}
                </span>
            )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-desc flex-wrap">
            {c.contract_type && (
                <span className="font-semibold uppercase bg-surface-muted/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-surface-border/60 leading-none">
                    {c.contract_type}
                </span>
            )}
            {c.form_no && (
                <span className="font-mono text-text-soft leading-none">
                    {c.form_no}
                </span>
            )}
            {c.vendor?.name && (
                <>
                    <span className="text-text-soft/40">•</span>
                    <span className="text-text-soft truncate max-w-[140px] leading-none">{c.vendor.name}</span>
                </>
            )}
        </div>
    </div>
);

export const DepartmentCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-text-desc text-[10px] font-medium">{c.initiator?.department_name || 'UMUM'}</span>
);

export const ProgressCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-primary bg-primary/5 rounded-lg px-2 py-1 text-xs font-semibold tracking-tight">
        {c.progress.done}/{c.progress.total}
    </span>
);

export const CreatedAtCell = ({ c }: Readonly<{ c: Contract }>) => {
    const raw = (c as any).created_at_raw || c.created_at;
    if (!raw) {
        return <span className="text-zinc-400 text-[11px] font-normal">—</span>;
    }

    const { dateStr, timeStr } = formatDateAndTimeParts(raw, c.created_at);

    return (
        <div className="flex flex-col py-0.5 min-w-[95px] text-left">
            <div className="text-zinc-900 dark:text-zinc-100 text-[12px] font-semibold leading-tight">
                {dateStr}
            </div>
            {!!timeStr && (
                <div className="text-zinc-800 dark:text-zinc-200 text-[11px] font-medium leading-tight mt-0.5">
                    {timeStr}
                </div>
            )}
        </div>
    );
};

export const ContractNoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-primary font-mono text-xs font-medium">{c.form_no || 'N/A'}</span>
);

export const TitleCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-text-main line-clamp-1 text-xs font-semibold">{c.title}</span>
);

export const ContractNoAndTitleCell = ({ c, types }: Readonly<{ c: Contract; types: ContractType[] }>) => {
    const type = types?.find((t) => t.id === c.contract_type_id);
    const typeName = type?.name || c.contract_type || '';
    const cleanTypeName = typeName ? typeName.replace('Perjanjian ', '').replace('Addendum / ', '') : '';
    const typeBadge = cleanTypeName ? getContractTypeBadgeConfig(cleanTypeName) : null;

    return (
        <div className="flex flex-col gap-1 py-1 max-w-[360px]">
            {/* Top row: Title + Version Chip */}
            <div className="flex items-center gap-1.5 min-w-0">
                <span
                    className="text-text-main group-hover:text-primary font-semibold text-[12.5px] leading-snug line-clamp-1 transition-colors"
                    title={c.title}
                >
                    {c.title}
                </span>
                {!!c.current_version && c.current_version > 0 && (
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-bold font-mono bg-primary/10 text-primary border border-primary/20 leading-tight">
                        v{c.current_version}
                    </span>
                )}
            </div>

            {/* Bottom row: Type Pill + Form / Contract Code */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {!!typeBadge && (
                    <span
                        className={cn(
                            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide uppercase border leading-none',
                            typeBadge.bgClass,
                            typeBadge.textClass,
                            typeBadge.borderClass,
                        )}
                    >
                        {cleanTypeName}
                    </span>
                )}
                <span className="font-mono text-[10px] font-medium text-text-desc bg-surface-muted/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-surface-border/60 leading-none">
                    {c.form_no || 'N/A'}
                </span>
                {c.contract_no && c.contract_no !== c.form_no && (
                    <span className="font-mono text-[9.5px] text-text-soft truncate max-w-[150px] leading-none" title={`No. Kontrak: ${c.contract_no}`}>
                        {c.contract_no}
                    </span>
                )}
            </div>
        </div>
    );
};

export const VendorCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col py-0.5">
        <span className="text-text-normal truncate text-[12px] font-medium">{c.vendor?.name || '—'}</span>
    </div>
);

export const TypeAndVendorCell = ({ c, types }: Readonly<{ c: Contract; types: ContractType[] }>) => (
    <VendorCell c={c} />
);

export const InitiatorCell = ({ c }: Readonly<{ c: Contract }>) => {
    if (!c.initiator?.name) {
        return <span className="text-text-soft text-[11px] font-normal">—</span>;
    }

    return (
        <UserAvatarWithRole
            user={c.initiator}
            name={c.initiator.name}
            role={c.initiator.role || ''}
            department={c.initiator.department_name || 'UMUM'}
            size="sm"
            nameClassName="text-[11px] font-normal text-text-main"
            roleClassName="text-[9.5px] text-text-desc"
        />
    );
};

export const StatusAndStepCell = ({ c }: Readonly<{ c: Contract }>) => {
    let stepDesc = c.workflow_step?.description || c.workflow_step?.role || '';
    if (!stepDesc && c.status === 'draft') {
        stepDesc = c.initiator?.role || '';
    }

    return (
        <div className="flex items-center py-0.5" title={stepDesc ? `Tahapan / Step: ${stepDesc}` : undefined}>
            <StatusBadge status={c.status} statusInfo={(c as any).status_info} />
        </div>
    );
};

export const AssignedByCell = ({ c }: Readonly<{ c: Contract }>) => {
    if (!c.assigned_by?.name) {
        return <span className="text-text-soft text-[11px] font-normal">—</span>;
    }

    return (
        <UserAvatarWithRole
            user={c.assigned_by}
            name={c.assigned_by.name}
            role={c.assigned_by.role || ''}
            department={c.assigned_by.department_name || ''}
            size="sm"
            nameClassName="text-[11px] font-normal text-text-main"
            roleClassName="text-[9.5px] text-text-desc"
        />
    );
};

export const AssignedPicCell = ({ c }: Readonly<{ c: Contract }>) => {
    if (!c.assigned_pic?.name) {
        return <span className="text-text-soft text-[11px] font-normal">—</span>;
    }

    return (
        <UserAvatarWithRole
            user={c.assigned_pic}
            name={c.assigned_pic.name}
            role={c.assigned_pic.role || ''}
            department={c.assigned_pic.department_name || ''}
            size="sm"
            nameClassName="text-[11px] font-normal text-text-main"
            roleClassName="text-[9.5px] text-text-desc"
        />
    );
};

export const ContractPeriodCell = ({ c, isExpiryView }: Readonly<{ c: Contract; isExpiryView?: boolean }>) => {
    const startDate = c.contract_date ? formatDate(c.contract_date, { day: 'numeric', month: 'short', year: 'numeric' }) : null;
    const endDate = c.end_date ? formatDate(c.end_date, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

    if (!startDate && !endDate) {
        return <span className="text-text-soft text-[11px] font-normal">—</span>;
    }

    const showExpiry = Boolean(isExpiryView || (typeof window !== 'undefined' && window.location.pathname.includes('/contracts/expiry')));

    return (
        <div className="flex flex-col gap-1 py-0.5 min-w-[145px]">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-[11px] leading-tight font-medium text-text-normal">
                    <span className="text-text-desc text-[10px] uppercase font-semibold">Mulai:</span>
                    <span>{startDate || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] leading-tight font-medium text-text-normal">
                    <span className="text-text-desc text-[10px] uppercase font-semibold">S/d:</span>
                    <span className={cn(c.end_date ? 'font-semibold text-text-main' : '')}>{endDate || '—'}</span>
                </div>
            </div>
            {showExpiry && c.end_date && (
                <div className="mt-0.5">
                    <ExpiryBadge endDate={c.end_date} />
                </div>
            )}
        </div>
    );
};

export const renderContractNoAndTitle = (c: Contract) => <ContractNoAndTitleCell c={c} />;
export const renderVendor = (c: Contract) => <VendorCell c={c} />;
export const renderInitiator = (c: Contract) => <InitiatorCell c={c} />;
export const renderContractPeriod = (c: Contract, isExpiryView?: boolean) => <ContractPeriodCell c={c} isExpiryView={isExpiryView} />;
export const renderStatusAndStep = (c: Contract) => <StatusAndStepCell c={c} />;
export const renderCreatedAt = (c: Contract) => <CreatedAtCell c={c} />;
export const renderAssignedBy = (c: Contract) => <AssignedByCell c={c} />;
export const renderAssignedPic = (c: Contract) => <AssignedPicCell c={c} />;

export const BulkActions = ({
    selectedRows,
    canBulkApprove,
    handleBulkApprove,
    canBulkDelete,
    handleBulkDelete,
}: Readonly<{
    selectedRows: Contract[];
    canBulkApprove: boolean;
    handleBulkApprove: (rows: Contract[]) => void;
    canBulkDelete: boolean;
    handleBulkDelete: (rows: Contract[]) => void;
}>) => (
    /* ponytail: dark charcoal action buttons */
    <div className="flex items-center gap-2">
        {canBulkApprove && (
            <Button
                variant="white"
                size="sm"
                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 h-8 px-4 text-[10px] font-semibold uppercase shadow-sm"
                onClick={() => handleBulkApprove(selectedRows)}
            >
                <Check className="mr-1.5 h-3 w-3 text-emerald-400" /> Approve
            </Button>
        )}
        {canBulkDelete && (
            <Button
                variant="white"
                size="sm"
                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-rose-400 h-8 px-4 text-[10px] font-semibold uppercase shadow-sm"
                onClick={() => handleBulkDelete(selectedRows)}
            >
                <Trash2 className="mr-1.5 h-3 w-3 text-rose-400" /> Hapus
            </Button>
        )}
    </div>
);

export const RowActions = ({
    c,
    openDetail,
    setSelected,
    setEditOpen,
    setDeleteOpen,
}: Readonly<{
    c: Contract;
    openDetail: (c: Contract) => void;
    setSelected: (c: Contract) => void;
    setEditOpen: (open: boolean) => void;
    setDeleteOpen: (open: boolean) => void;
}>) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                className="border-surface-border bg-surface-base/50 hover:bg-surface-muted group h-8 w-8 rounded-lg border p-0 shadow-sm transition-all"
            >
                <MoreVertical size={14} className="text-text-soft group-hover:text-primary" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-surface-border bg-surface-base w-52 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl">
            <DropdownMenuItem
                onClick={() => openDetail(c)}
                className="text-text-main flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight uppercase"
            >
                <Eye size={14} /> Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setEditOpen(true);
                }}
                className="text-text-main flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight uppercase"
            >
                <FileEdit size={14} /> Perbarui
            </DropdownMenuItem>
            <div className="bg-surface-border/40 my-1 h-px" />
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setDeleteOpen(true);
                }}
                className="text-danger focus:bg-danger/5 focus:text-danger flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight uppercase"
            >
                <Trash2 size={14} /> Hapus Data
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);
