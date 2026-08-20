import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';
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
                "group relative flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left transition-colors select-none border-b border-border border-l-2",
                isSelected
                    ? "bg-primary text-primary-foreground border-l-primary"
                    : "bg-background hover:bg-muted/60 text-foreground border-l-transparent"
            )}
        >
            <Avatar className={cn("h-8.5 w-8.5 shrink-0 transition-transform group-hover:scale-105 border", isSelected ? "border-primary-foreground/30" : "border-border")}>
                <AvatarImage src={contract.creator?.avatar || ''} alt={creatorName} />
                <AvatarFallback className={cn("text-[10.5px] font-black tracking-tight", isSelected ? "bg-background text-foreground shadow-xs" : avatarColorClass)}>
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex flex-1 flex-col min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={cn(
                        "font-mono text-[10px] font-semibold truncate",
                        isSelected ? "text-primary-foreground/90 font-bold" : "text-muted-foreground"
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
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                            {contract.updated_at_formatted || ''}
                        </span>
                    </div>
                </div>

                <h3 className={cn(
                    "text-xs font-semibold truncate leading-tight tracking-tight",
                    isSelected ? "text-primary-foreground font-bold" : "text-foreground"
                )}>
                    {contract.title}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className={cn(
                        "inline-flex items-center gap-1 font-medium truncate",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                        <Building2 size={11} className="shrink-0" /> {contract.contract_type || 'General'}
                    </span>
                </div>
            </div>
        </div>
    );
}
