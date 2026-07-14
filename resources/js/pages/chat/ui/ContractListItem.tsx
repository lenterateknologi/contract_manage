import { cn } from '@/lib/utils';
import { Building2, User } from 'lucide-react';
import { Contract } from '@/pages/contracts/types';

interface ContractListItemProps {
    contract: Contract;
    isSelected: boolean;
    onClick: () => void;
}

export function ContractListItem({ contract, isSelected, onClick }: ContractListItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full p-4 text-left transition-all hover:bg-surface-muted border-b border-surface-border/50",
                isSelected ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
            )}
        >
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-normal text-text-main">
                    #{contract.form_no || 'NO-REQ'}
                </span>
                    <div className="flex items-center gap-1.5">
                        {contract.unread_count !== undefined && contract.unread_count > 0 ? (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-medium text-white shadow-sm">
                                {contract.unread_count}
                            </span>
                        ) : null}
                        <span className="text-[9px] text-text-main tabular-nums">
                            {contract.updated_at_formatted || ''}
                        </span>
                    </div>
                </div>
                <h3 className={cn(
                    "text-xs font-normal line-clamp-1",
                    isSelected ? "text-primary" : "text-text-main"
                )}>
                    {contract.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[9px] text-text-main">
                        <Building2 size={10} /> {contract.contract_type || 'General'}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-text-main">
                        <User size={10} /> {contract.creator?.name || 'System'}
                    </div>
                </div>
            </div>
        </button>
    );
}
