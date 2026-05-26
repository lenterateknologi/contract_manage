import { Button } from '@/components/ui/base/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import { Check, Clock, Eye, FileEdit, MoreVertical, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ExpiryBadge({ endDate }: Readonly<{ endDate: string | null }>) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = 'bg-text-main text-surface-base border-surface-border';
    let Icon = CheckCircle2;
    let label = `${diffDays} Hari Lagi`;

    if (diffDays < 0) {
        color = 'bg-danger/10 text-danger border-danger/20';
        Icon = AlertCircle;
        label = `Expired ${Math.abs(diffDays)} Hari`;
    } else if (diffDays <= 30) {
        color = 'bg-warning text-white border-warning/20';
        Icon = AlertTriangle;
    } else if (diffDays <= 90) {
        color = 'text-text-main border border-surface-border bg-surface-muted/50';
        Icon = Clock;
    }

    return (
        <div className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider', color)}>
            <Icon size={12} strokeWidth={3} />
            {label}
        </div>
    );
}

export const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; dot: string; text: string; label: string }> = {
        draft: { bg: 'bg-surface-muted', dot: 'bg-text-soft', text: 'text-text-desc', label: 'Draft' },
        in_review: { bg: 'bg-warning/10', dot: 'bg-warning', text: 'text-warning', label: 'Review' },
        revision: { bg: 'bg-danger/10', dot: 'bg-danger', text: 'text-danger', label: 'Revisi' },
        pending: { bg: 'bg-warning/10', dot: 'bg-warning', text: 'text-warning', label: 'Pending' },
        approved: { bg: 'bg-success/10', dot: 'bg-success', text: 'text-success', label: 'Disetujui' },
        active: { bg: 'bg-primary/10', dot: 'bg-primary', text: 'text-primary', label: 'Aktif' },
        expired: { bg: 'bg-danger/10', dot: 'bg-danger', text: 'text-danger', label: 'Expired' },
        archived: { bg: 'bg-surface-muted', dot: 'bg-text-soft', text: 'text-text-soft', label: 'Arsip' },
        rejected: { bg: 'bg-danger/10', dot: 'bg-danger', text: 'text-danger', label: 'Ditolak' },
    };

    const s = config[status as keyof typeof config] || config.draft;

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight', s.bg, s.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label}
        </span>
    );
};

export const SLACountdown = ({ deadline, status }: Readonly<{ deadline: string | null; status: string }>) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal');

    useEffect(() => {
        if (!deadline || status === 'archived' || status === 'approved') {
            setTimeLeft('-');
            return;
        }

        const tick = () => {
            const now = Date.now();
            const target = new Date(deadline).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('OVERDUE');
                setUrgency('danger');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
                setUrgency(days < 1 ? 'warning' : 'normal');
            } else {
                setTimeLeft(`${hours}h ${minutes}m`);
                setUrgency(hours < 4 ? 'danger' : 'warning');
            }
        };

        tick();
        const timer = setInterval(tick, 1000 * 60);
        return () => clearInterval(timer);
    }, [deadline, status]);

    if (!deadline || status === 'archived' || status === 'approved') return <span className="text-[10px] text-text-soft">—</span>;

    const getUrgencyStyles = () => {
        if (urgency === 'danger') {
            return 'bg-danger text-surface-base ring-danger/40';
        }
        if (urgency === 'warning') {
            return 'bg-warning/10 text-warning ring-warning/40';
        }
        return 'bg-surface-muted text-text-desc ring-surface-border';
    };

    return (
        <div className={cn('flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 uppercase tracking-tight', getUrgencyStyles())}>
            <Clock size={10} className={urgency === 'danger' ? 'animate-pulse' : ''} />
            {timeLeft}
        </div>
    );
};

export const ContractInfoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col gap-1 py-0.5">
        <div className="flex items-center gap-2">
            <span className="text-text-main text-[13px] leading-tight font-semibold uppercase tracking-tight">{c.title}</span>
            {!!c.current_version && (
                <div className="bg-primary flex-shrink-0 rounded px-1.5 py-0.5">
                    <span className="text-[9px] font-bold text-primary-foreground uppercase">V{c.current_version}</span>
                </div>
            )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
            <span className="text-text-soft text-[10px] font-medium tracking-wider uppercase">{c.contract_type}</span>
            <span className="bg-surface-border h-1 w-1 rounded-full" />
            <span className="text-text-soft text-[10px] font-medium tracking-wider uppercase">{c.vendor?.name || 'No Vendor'}</span>
        </div>
    </div>
);

export const DepartmentCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-text-desc text-[10px] font-medium tracking-wider uppercase">{c.initiator?.department_name || 'UMUM'}</span>
);

export const ProgressCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-primary text-xs font-semibold tracking-tight bg-primary/5 px-2 py-1 rounded-lg">
        {c.progress.done}/{c.progress.total}
    </span>
);

export const CreatedAtCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-text-soft text-[11px] font-medium uppercase">{c.created_at}</span>
);

export const ContractNoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-primary font-mono text-xs font-medium">{c.contract_no || 'N/A'}</span>
);

export const TitleCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-text-main line-clamp-1 text-xs font-semibold uppercase">{c.title}</span>
);

export const TypeAndVendorCell = ({ c, types }: Readonly<{ c: Contract; types: ContractType[] }>) => {
    const TYPE_COLORS = [
        'bg-role-admin-bg text-role-admin-text border border-role-admin-text/20',
        'bg-role-manager-bg text-role-manager-text border border-role-manager-text/20',
        'bg-role-reviewer-bg text-role-reviewer-text border border-role-reviewer-text/20',
        'bg-role-approver-bg text-role-approver-text border border-role-approver-text/20',
        'bg-primary-muted text-primary border border-primary/20',
    ];
    const type = types.find((t) => t.id === c.contract_type_id);
    const colorIdx = type ? type.name.charCodeAt(0) % TYPE_COLORS.length : 0;
    const vendorName = c.vendor?.name || '-';

    return (
        <div className="flex flex-col gap-1.5 py-0.5">
            <span
                className={cn(
                    'inline-block w-fit rounded-xl px-2.5 py-0.5 text-[10px] leading-none font-bold tracking-wide uppercase',
                    TYPE_COLORS[colorIdx],
                )}
            >
                {(type?.name || 'N/A').replace('Perjanjian ', '').replace('Addendum / ', '')}
            </span>
            <span className="text-text-soft truncate text-[11px] font-medium uppercase">{vendorName}</span>
        </div>
    );
};

export const ContractNoAndTitleCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col gap-0.5 py-0.5">
        <span className="text-primary font-mono text-[10px] leading-none font-semibold">{c.contract_no || 'N/A'}</span>
        <span className="text-text-main mt-1.5 line-clamp-1 text-[13px] leading-tight font-semibold uppercase tracking-tight">{c.title}</span>
    </div>
);

export const InitiatorCell = ({ c }: Readonly<{ c: Contract }>) => {
    const role = c.initiator?.role || '';
    const dept = c.initiator?.department_name || '';
    const roleDept = [role, dept].filter(Boolean).join(' ');

    return (
        <div className="flex flex-col gap-0.5 py-0.5">
            <span className="text-text-soft text-[10px] leading-none font-medium uppercase tracking-wider">{roleDept || 'Staff UMUM'}</span>
            <span className="text-text-main mt-1.5 truncate text-[13px] leading-tight font-semibold uppercase tracking-tight">{c.initiator?.name || '—'}</span>
        </div>
    );
};

export const StatusAndStepCell = ({ c }: Readonly<{ c: Contract }>) => {
    let stepDesc = c.workflow_step?.description || c.workflow_step?.role || '';
    if (!stepDesc && c.status === 'draft') {
        stepDesc = c.initiator?.role || '';
    }
    return (
        <div className="flex flex-col gap-1.5 py-0.5">
            <div className="flex items-center">
                <StatusBadge status={c.status} />
            </div>
            {!!stepDesc && <span className="text-text-desc truncate text-[10px] leading-tight font-medium uppercase tracking-wide">{stepDesc}</span>}
        </div>
    );
};

export const AssignedByCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col py-0.5">
        <span className="text-text-main truncate text-[13px] font-semibold uppercase tracking-tight">{c.assigned_by?.name || '—'}</span>
    </div>
);

export const AssignedPicCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col py-0.5">
        <span className="text-text-main truncate text-[13px] font-semibold uppercase tracking-tight">{c.assigned_pic?.name || '—'}</span>
    </div>
);

export const renderContractNoAndTitle = (c: Contract) => <ContractNoAndTitleCell c={c} />;
export const renderInitiator = (c: Contract) => <InitiatorCell c={c} />;
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
    <div className="flex items-center gap-2">
        {canBulkApprove && (
            <Button
                variant="white"
                size="sm"
                className="h-8 border-surface-border/40 bg-surface-base text-primary font-bold uppercase text-[10px] px-4 shadow-sm"
                onClick={() => handleBulkApprove(selectedRows)}
            >
                <Check className="mr-1.5 h-3 w-3" /> Approve
            </Button>
        )}
        {canBulkDelete && (
            <Button
                variant="white"
                size="sm"
                className="h-8 border-surface-border/40 bg-surface-base text-danger font-bold uppercase text-[10px] px-4 shadow-sm"
                onClick={() => handleBulkDelete(selectedRows)}
            >
                <Trash2 className="mr-1.5 h-3 w-3" /> Hapus
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
                className="border-surface-border bg-surface-base/50 hover:bg-surface-muted group h-8 w-8 rounded-lg border p-0 transition-all shadow-sm"
            >
                <MoreVertical size={14} className="text-text-soft group-hover:text-primary" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="border-surface-border w-52 rounded-2xl bg-surface-base p-1.5 shadow-2xl backdrop-blur-xl"
        >
            <DropdownMenuItem
                onClick={() => openDetail(c)}
                className="flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight text-text-main uppercase"
            >
                <Eye size={14} /> Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setEditOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight text-text-main uppercase"
            >
                <FileEdit size={14} /> Perbarui
            </DropdownMenuItem>
            <div className="my-1 h-px bg-surface-border/40" />
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setDeleteOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl text-[11px] font-semibold tracking-tight text-danger uppercase focus:bg-danger/5 focus:text-danger"
            >
                <Trash2 size={14} /> Hapus Data
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);
