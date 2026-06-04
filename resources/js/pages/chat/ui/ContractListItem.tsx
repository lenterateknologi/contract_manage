import { cn } from '@/lib/utils';
import { Building2, User } from 'lucide-react';
import { Contract } from '@/types/contracts';

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
                    <span className="text-[10px] font-black tracking-widest text-text-soft uppercase">
                        #{contract.contract_no || 'NO-REQ'}
                    </span>
                    <span className="text-[9px] font-bold text-text-soft/60 tabular-nums">
                        {contract.updated_at_formatted || ''}
                    </span>
                </div>
                <h3 className={cn(
                    "text-xs font-bold uppercase tracking-tight line-clamp-1",
                    isSelected ? "text-primary" : "text-text-main"
                )}>
                    {contract.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-text-soft uppercase italic">
                        <Building2 size={10} /> {contract.contract_type || 'General'}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-text-soft uppercase italic">
                        <User size={10} /> {contract.creator?.name || 'System'}
                    </div>
                </div>
            </div>
        </button>
    );
}
