import { cn } from '@/lib/utils';
import { Building2, User } from 'lucide-react';
import { Contract } from '@/pages/contracts/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/user/Avatar';
import { getAvatarColor } from '@/lib/avatarColor';

interface ContractListItemProps {
    contract: Contract;
    isSelected: boolean;
    onClick: () => void;
}

export function ContractListItem({ contract, isSelected, onClick }: ContractListItemProps) {
    const creatorName = contract.creator?.name || 'System';
    const initials = creatorName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const avatarColorClass = getAvatarColor(creatorName);

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 select-none border",
                isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-slate-200"
            )}
        >
            <Avatar className={cn("h-9 w-9 shrink-0 border transition-transform group-hover:scale-105", isSelected ? "border-white/40" : "border-slate-200 dark:border-zinc-700")}>
                <AvatarImage src={contract.creator?.avatar || ''} alt={creatorName} />
                <AvatarFallback className={cn("text-[10.5px] font-black tracking-tight", isSelected ? "bg-white text-slate-950 shadow-xs" : avatarColorClass)}>
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex flex-1 flex-col min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={cn(
                        "font-mono text-[9.5px] font-semibold truncate",
                        isSelected ? "text-primary-foreground/80 font-bold" : "text-slate-400 dark:text-slate-500"
                    )}>
                        #{contract.form_no || contract.contract_no || 'NO-REQ'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {contract.unread_count !== undefined && contract.unread_count > 0 ? (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] font-bold text-white shadow-xs animate-pulse">
                                {contract.unread_count}
                            </span>
                        ) : null}
                        <span className={cn(
                            "text-[9px] font-medium tabular-nums",
                            isSelected ? "text-primary-foreground/80" : "text-slate-400 dark:text-slate-500"
                        )}>
                            {contract.updated_at_formatted || ''}
                        </span>
                    </div>
                </div>

                <h3 className={cn(
                    "text-xs font-semibold truncate leading-tight tracking-tight",
                    isSelected ? "text-primary-foreground" : "text-slate-900 dark:text-slate-100"
                )}>
                    {contract.title}
                </h3>

                <div className="flex items-center gap-2 mt-1.5 text-[9.5px]">
                    <span className={cn(
                        "inline-flex items-center gap-1 font-medium truncate",
                        isSelected ? "text-primary-foreground/80" : "text-slate-500 dark:text-slate-400"
                    )}>
                        <Building2 size={10} className="shrink-0" /> {contract.contract_type || 'General'}
                    </span>
                </div>
            </div>
        </div>
    );
}
