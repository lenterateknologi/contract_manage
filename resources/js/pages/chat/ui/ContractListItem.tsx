import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { Contract } from '@/pages/contracts/types';
import { UserAvatarIcon } from '@/components/profile/UserAvatar';

interface ContractListItemProps {
    contract: Contract;
    isSelected: boolean;
    onClick: () => void;
}

export function ContractListItem({ contract, isSelected, onClick }: ContractListItemProps) {
    const creatorName = contract.creator?.name || 'System';

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 select-none',
                isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'bg-background hover:bg-muted/60 text-foreground',
            )}
        >
            <UserAvatarIcon
                user={contract.creator}
                name={creatorName}
                size="md"
                className={cn(
                    'h-8.5 w-8.5 shrink-0 transition-transform group-hover:scale-105 border',
                    isSelected ? 'border-primary-foreground/30 ring-1 ring-primary-foreground/20' : 'border-border',
                )}
            />

            <div className="flex flex-1 flex-col min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                        className={cn(
                            'font-mono text-[10px] font-semibold truncate',
                            isSelected ? 'text-primary-foreground/90 font-bold' : 'text-muted-foreground',
                        )}
                    >
                        {contract.form_no || contract.contract_no || 'DRAFT'}
                    </span>
                    <span
                        className={cn(
                            'text-[10px] shrink-0 font-medium',
                            isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground/80',
                        )}
                    >
                        {contract.created_at ? contract.created_at.split(' ')[0] : ''}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                    <h4
                        className={cn(
                            'text-xs leading-snug line-clamp-1 truncate font-semibold',
                            isSelected ? 'text-primary-foreground' : 'text-foreground group-hover:text-primary transition-colors',
                        )}
                    >
                        {contract.title}
                    </h4>
                </div>

                <div className="flex items-center justify-between text-[11px] mt-0.5">
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 truncate max-w-[140px] font-medium text-[10.5px]',
                            isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground',
                        )}
                    >
                        <Building2 size={11} className="shrink-0 opacity-70" />
                        <span className="truncate">{contract.vendor?.name || 'Internal'}</span>
                    </span>

                    <span
                        className={cn(
                            'text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider',
                            isSelected
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {contract.status}
                    </span>
                </div>
            </div>
        </div>
    );
}
