import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { Check, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ContractDetailHeaderProps {
    contract: Contract;
    canEditTitle: boolean;
    currentActiveTabLabel?: string;
    currentActiveSubLabel?: string;
    isAnyDirty: boolean;
    infoSaving: boolean;
    onUpdateTitle: (newTitle: string) => void;
    onResetAllChanges?: () => void;
    onSaveAllChanges?: () => void;
}

export function ContractDetailHeader({
    contract,
    canEditTitle,
    currentActiveTabLabel = 'Dokumen',
    currentActiveSubLabel,
    isAnyDirty,
    infoSaving,
    onUpdateTitle,
    onResetAllChanges,
    onSaveAllChanges,
}: ContractDetailHeaderProps) {
    const [headerTitle, setHeaderTitle] = useState(contract.title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    useEffect(() => {
        setHeaderTitle(contract.title);
    }, [contract.title]);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (headerTitle.trim() && headerTitle !== contract.title) {
            onUpdateTitle(headerTitle);
        } else {
            setHeaderTitle(contract.title);
        }
    };

    const effectiveStatus = (contract.workflow_step?.meta as any)?.target_status || contract.status_info?.code || contract.status;
    const currentStepName = (contract.workflow_step as any)?.name || (contract.workflow_step as any)?.label || contract.workflow_step?.description;

    return (
        <div className="sticky top-0 z-50 flex h-16 min-h-[64px] max-h-[64px] shrink-0 items-center justify-between px-5 bg-background border-b border-border transition-all duration-200 box-border gap-3">
            {/* Left Side: Document Title (Editable) + Section Breadcrumb */}
            <div className="flex items-center gap-2.5 min-w-0 flex-shrink">
                <div className="flex flex-col justify-center min-w-0">
                    {isEditingTitle && canEditTitle ? (
                        <input
                            autoFocus
                            value={headerTitle}
                            onChange={(e) => setHeaderTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTitleBlur();
                            }}
                            className="text-foreground text-[14px] font-bold bg-muted border-b border-primary focus:outline-none min-w-[280px] md:min-w-[450px] px-2 py-0.5 rounded leading-tight"
                            placeholder="Masukkan judul dokumen..."
                        />
                    ) : (
                        <div className="flex items-center gap-2 min-w-0">
                            <h1
                                className={cn(
                                    'text-foreground text-[14px] font-bold tracking-tight truncate max-w-[360px] md:max-w-[550px] leading-tight',
                                    canEditTitle && 'cursor-pointer hover:text-primary transition-colors',
                                )}
                                onClick={() => {
                                    if (canEditTitle) setIsEditingTitle(true);
                                }}
                                title={canEditTitle ? 'Klik untuk mengedit judul' : contract.title}
                            >
                                {contract.title || <span className="italic text-muted-foreground">Tanpa Judul</span>}
                            </h1>
                            {canEditTitle && (
                                <span className="text-[10px] text-muted-foreground/60 font-normal select-none">(edit)</span>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 leading-tight truncate">
                        {contract.workflow_step && (
                            <>
                                <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                    <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                                        Tahap {contract.workflow_step.step}
                                    </span>
                                    {currentStepName && (
                                        <span className="truncate max-w-[200px] sm:max-w-[320px]">
                                            {currentStepName}
                                        </span>
                                    )}
                                </span>
                                <span className="opacity-40">•</span>
                            </>
                        )}
                        <span>{currentActiveTabLabel}</span>
                        {currentActiveSubLabel && (
                            <>
                                <span className="opacity-40">/</span>
                                <span className="text-primary font-semibold">{currentActiveSubLabel}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Status & Save Buttons */}
            <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={effectiveStatus} statusInfo={contract.status_info} />

                {/* Save button in navbar when contract info or forms have changes */}
                {isAnyDirty && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-200">
                        <button
                            type="button"
                            onClick={() => onResetAllChanges?.()}
                            disabled={infoSaving}
                            className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <Button
                            variant="primary"
                            onClick={() => onSaveAllChanges?.()}
                            disabled={infoSaving}
                            className="h-8 px-4 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                        >
                            {infoSaving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>Simpan Perubahan</span>
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
