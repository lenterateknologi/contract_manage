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

    let color = 'bg-black text-white border-black/10 dark:bg-white dark:text-black';
    let icon = 'fa-circle-check';
    let label = `${diffDays} Hari Lagi`;

    if (diffDays < 0) {
        color = 'bg-black/10 text-black border-black/10 dark:bg-white/10 dark:text-white';
        icon = 'fa-circle-exclamation';
        label = `Expired ${Math.abs(diffDays)} Hari`;
    } else if (diffDays <= 30) {
        color = 'bg-black text-white border-black/10 dark:bg-white dark:text-black';
        icon = 'fa-triangle-exclamation';
    } else if (diffDays <= 90) {
        color = 'text-black dark:text-white border border-black/10';
        icon = 'fa-clock';
    }

    return (
        <div className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold', color)}>
            <i className={cn('fa-solid text-[10px]', icon)} />
            {label}
        </div>
    );
}

export const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; dot: string; text: string; label: string }> = {
        draft: { bg: 'bg-slate-100', dot: 'bg-slate-400', text: 'text-slate-600', label: 'Draft' },
        in_review: { bg: 'bg-amber-100', dot: 'bg-amber-500', text: 'text-amber-700', label: 'Review' },
        revision: { bg: 'bg-rose-100', dot: 'bg-rose-500', text: 'text-rose-700', label: 'Revisi' },
        pending: { bg: 'bg-orange-100', dot: 'bg-orange-500', text: 'text-orange-700', label: 'Pending' },
        approved: { bg: 'bg-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Disetujui' },
        active: { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-700', label: 'Aktif' },
        expired: { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-700', label: 'Expired' },
        archived: { bg: 'bg-zinc-100', dot: 'bg-zinc-400', text: 'text-zinc-500', label: 'Arsip' },
        rejected: { bg: 'bg-red-100', dot: 'bg-red-500', text: 'text-red-700', label: 'Ditolak' },
    };

    const s = config[status as keyof typeof config] || config.draft;

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', s.bg, s.text)}>
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

    if (!deadline || status === 'archived' || status === 'approved') return <span className="text-[10px] text-black/40 dark:text-white/40">—</span>;

    const getUrgencyStyles = () => {
        if (urgency === 'danger') {
            return 'bg-rose-500 text-white ring-rose-400/40';
        }
        if (urgency === 'warning') {
            return 'bg-amber-100 text-amber-700 ring-amber-300/40';
        }
        return 'bg-sidebar-accent text-sidebar-foreground/60 ring-sidebar-border/40';
    };

    return (
        <div className={cn('flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ring-1', getUrgencyStyles())}>
            <Clock size={10} className={urgency === 'danger' ? 'animate-pulse' : ''} />
            {timeLeft}
        </div>
    );
};

export const ContractInfoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-2">
            <span className="text-sidebar-foreground text-sm leading-tight font-bold">{c.title}</span>
            {!!c.current_version && (
                <div className="bg-sidebar-primary flex-shrink-0 rounded px-1.5 py-0.5">
                    <span className="text-xs font-bold text-white uppercase">V{c.current_version}</span>
                </div>
            )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sidebar-foreground/40 text-xs font-semibold tracking-wide uppercase">{c.contract_type}</span>
            <span className="bg-sidebar-foreground/20 h-1 w-1 rounded-full" />
            <span className="text-sidebar-foreground/40 text-xs font-semibold tracking-wide uppercase">{c.vendor?.name || 'No Vendor'}</span>
        </div>
    </div>
);

export const DepartmentCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-sidebar-foreground/50 text-xs font-semibold tracking-wide uppercase">{c.initiator?.department_name || 'UMUM'}</span>
);

export const ProgressCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-sidebar-foreground/90 text-xs font-bold tracking-tight">
        {c.progress.done}/{c.progress.total}
    </span>
);

export const CreatedAtCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-sidebar-foreground/40 text-xs font-medium">{c.created_at}</span>
);

export const ContractNoCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-sidebar-primary/70 font-mono text-xs font-bold">{c.contract_no || 'N/A'}</span>
);

export const TitleCell = ({ c }: Readonly<{ c: Contract }>) => (
    <span className="text-sidebar-foreground line-clamp-1 text-xs font-bold">{c.title}</span>
);

export const TypeAndVendorCell = ({ c, types }: Readonly<{ c: Contract; types: ContractType[] }>) => {
    const TYPE_COLORS = [
        'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
        'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
        'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    ];
    const type = types.find((t) => t.id === c.contract_type_id);
    const colorIdx = type ? type.name.charCodeAt(0) % TYPE_COLORS.length : 0;
    const vendorName = c.vendor?.name || '-';

    return (
        <div className="flex flex-col gap-1 py-0.5">
            <span
                className={cn(
                    'inline-block w-fit rounded-full px-2.5 py-0.5 text-xs leading-none font-bold tracking-wide uppercase',
                    TYPE_COLORS[colorIdx],
                )}
            >
                {(type?.name || 'N/A').replace('Perjanjian ', '').replace('Addendum / ', '')}
            </span>
            <span className="text-sidebar-foreground/70 truncate text-xs font-medium">{vendorName}</span>
        </div>
    );
};

export const ContractNoAndTitleCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col gap-0.5 py-0.5">
        <span className="text-sidebar-primary/70 font-mono text-xs leading-none font-bold">{c.contract_no || 'N/A'}</span>
        <span className="text-sidebar-foreground mt-1 line-clamp-1 text-sm leading-tight font-semibold">{c.title}</span>
    </div>
);

export const InitiatorCell = ({ c }: Readonly<{ c: Contract }>) => {
    const role = c.initiator?.role || '';
    const dept = c.initiator?.department_name || '';
    const roleDept = [role, dept].filter(Boolean).join(' ');

    return (
        <div className="flex flex-col gap-0.5 py-0.5">
            <span className="text-sidebar-foreground/60 text-xs leading-none font-semibold">{roleDept || 'Staff UMUM'}</span>
            <span className="text-sidebar-foreground mt-1 truncate text-sm leading-tight font-semibold">{c.initiator?.name || '—'}</span>
        </div>
    );
};

export const StatusAndStepCell = ({ c }: Readonly<{ c: Contract }>) => {
    let stepDesc = c.workflow_step?.description || c.workflow_step?.role || '';
    if (!stepDesc && c.status === 'draft') {
        stepDesc = c.initiator?.role || '';
    }
    return (
        <div className="flex flex-col gap-1 py-0.5">
            <div className="flex items-center">
                <StatusBadge status={c.status} />
            </div>
            {!!stepDesc && <span className="text-sidebar-foreground/60 truncate text-xs leading-tight font-semibold capitalize">{stepDesc}</span>}
        </div>
    );
};

export const AssignedByCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col py-0.5">
        <span className="text-sidebar-foreground truncate text-sm font-semibold">{c.assigned_by?.name || '—'}</span>
    </div>
);

export const AssignedPicCell = ({ c }: Readonly<{ c: Contract }>) => (
    <div className="flex flex-col py-0.5">
        <span className="text-sidebar-foreground truncate text-sm font-semibold">{c.assigned_pic?.name || '—'}</span>
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
                variant="outline"
                size="sm"
                className="h-8 border-black/10 px-3 dark:border-white/10"
                onClick={() => handleBulkApprove(selectedRows)}
            >
                <Check className="mr-1.5 h-3 w-3" /> Approve
            </Button>
        )}
        {canBulkDelete && (
            <Button
                variant="outline"
                size="sm"
                className="h-8 border-rose-500/20 px-3 text-rose-600 hover:bg-rose-600 hover:text-white"
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
                className="border-sidebar-border dark:bg-sidebar-accent/50 hover:bg-sidebar-accent group h-8 w-8 rounded-lg border bg-white p-0 transition-all"
            >
                <MoreVertical size={14} className="text-sidebar-foreground/40 group-hover:text-sidebar-primary" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="border-sidebar-border dark:bg-sidebar-accent/90 w-52 rounded-xl bg-white p-1.5 shadow-2xl backdrop-blur-md"
        >
            <DropdownMenuItem
                onClick={() => openDetail(c)}
                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-slate-600 uppercase"
            >
                <Eye size={14} /> Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setEditOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-slate-600 uppercase"
            >
                <FileEdit size={14} /> Perbarui
            </DropdownMenuItem>
            <div className="my-1 h-px bg-slate-50" />
            <DropdownMenuItem
                onClick={() => {
                    setSelected(c);
                    setDeleteOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg text-[11px] font-bold tracking-tight text-rose-600 uppercase focus:bg-rose-50 focus:text-rose-600"
            >
                <Trash2 size={14} /> Hapus Data
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);
