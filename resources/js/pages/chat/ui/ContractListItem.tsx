import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { Building2, ExternalLink } from 'lucide-react';

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
                isSelected ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'bg-background hover:bg-muted/60 text-foreground',
            )}
        >
            <UserAvatarIcon
                user={contract.creator}
                name={creatorName}
                size="md"
                className={cn(
                    'h-8.5 w-8.5 shrink-0 border transition-transform group-hover:scale-105',
                    isSelected ? 'border-primary-foreground/30 ring-primary-foreground/20 ring-1' : 'border-border',
                )}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="mb-0.5 flex items-center justify-between gap-1">
                    <span
                        className={cn(
                            'truncate font-mono text-[10px] font-semibold',
                            isSelected ? 'text-primary-foreground/90 font-bold' : 'text-muted-foreground',
                        )}
                    >
                        {contract.form_no || contract.contract_no || 'DRAFT'}
                    </span>
                    <span className={cn('shrink-0 text-[10px] font-medium', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground/80')}>
                        {contract.created_at ? contract.created_at.split(' ')[0] : ''}
                    </span>
                </div>

                <div className="mb-1 flex min-w-0 items-center gap-1.5">
                    <h4
                        className={cn(
                            'line-clamp-1 truncate text-xs leading-snug font-semibold',
                            isSelected ? 'text-primary-foreground' : 'text-foreground group-hover:text-primary transition-colors',
                        )}
                    >
                        {contract.title}
                    </h4>
                </div>

                <div className="mt-0.5 flex items-center justify-between text-[11px]">
                    {contract.vendor?.name ? (
                        <span
                            className={cn(
                                'inline-flex max-w-[120px] items-center gap-1 truncate text-[10.5px] font-medium',
                                isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground',
                            )}
                        >
                            <Building2 size={11} className="shrink-0 opacity-70" />
                            <span className="truncate">{contract.vendor.name}</span>
                        </span>
                    ) : contract.contract_type && contract.contract_type !== '—' ? (
                        <span
                            className={cn(
                                'max-w-[130px] truncate text-[10.5px] font-medium',
                                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                            )}
                        >
                            {contract.contract_type}
                        </span>
                    ) : null}

                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                        <span
                            className={cn(
                                'py-0.2 rounded px-1.5 text-[10px] font-semibold tracking-wider uppercase',
                                isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {contract.status}
                        </span>

                        <a
                            href={`/contracts/${contract.id}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold shadow-2xs transition-all',
                                isSelected ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-primary/10 hover:bg-primary/20 text-primary',
                            )}
                            title="Buka Pengajuan Kontrak di Tab Baru"
                        >
                            <span className="hidden sm:inline">Buka</span>
                            <ExternalLink size={9} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
