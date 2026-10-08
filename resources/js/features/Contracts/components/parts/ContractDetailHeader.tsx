import { Button } from '@/components/ui/buttons/Button';
import { StatusBadge } from '@/components/ui/feedback/StatusBadge';
import { cn } from '@/lib/utils';
import { HeaderTaskList } from '@/features/Contracts/components/parts/HeaderTaskList';
import { Contract } from '@/features/Contracts/types';
import { Check, GitFork, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ContractDetailHeaderProps {
    contract: Contract;
    canEditTitle: boolean;
    currentActiveTabLabel?: string;
    currentActiveSubLabel?: string;
    isAnyDirty: boolean;
    infoSaving: boolean;
    isAdmin?: boolean;
    onUpdateTitle: (newTitle: string) => void;
    onResetAllChanges?: () => void;
    onSaveAllChanges?: () => void;
    onNavigateTab?: (tab: string, subTab?: string) => void;
    onOpenAdminWorkflowModal?: () => void;
}

export function ContractDetailHeader({
    contract,
    canEditTitle,
    currentActiveTabLabel = 'Dokumen',
    currentActiveSubLabel,
    isAnyDirty,
    infoSaving,
    isAdmin = false,
    onUpdateTitle,
    onResetAllChanges,
    onSaveAllChanges,
    onNavigateTab,
    onOpenAdminWorkflowModal,
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
        <div className="bg-background border-border sticky top-0 z-50 box-border flex h-16 max-h-[64px] min-h-[64px] shrink-0 items-center justify-between gap-3 border-b px-5 transition-all duration-200">
            {/* Left Side: Document Title (Editable) + Section Breadcrumb */}
            <div className="flex min-w-0 flex-shrink items-center gap-2.5">
                <div className="flex min-w-0 flex-col justify-center">
                    {isEditingTitle && canEditTitle ? (
                        <input
                            autoFocus
                            value={headerTitle}
                            onChange={(e) => setHeaderTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTitleBlur();
                            }}
                            className="text-foreground bg-muted border-primary min-w-[280px] rounded border-b px-2 py-0.5 text-[14px] leading-tight font-bold focus:outline-none md:min-w-[450px]"
                            placeholder="Masukkan judul dokumen..."
                        />
                    ) : (
                        <div className="flex min-w-0 items-center gap-2">
                            <h1
                                className={cn(
                                    'text-foreground max-w-[360px] truncate text-[14px] leading-tight font-bold tracking-tight md:max-w-[550px]',
                                    canEditTitle && 'hover:text-primary cursor-pointer transition-colors',
                                )}
                                onClick={() => {
                                    if (canEditTitle) setIsEditingTitle(true);
                                }}
                                title={canEditTitle ? 'Klik untuk mengedit judul' : contract.title}
                            >
                                {contract.title || <span className="text-muted-foreground italic">Tanpa Judul</span>}
                            </h1>
                            {canEditTitle && <span className="text-muted-foreground/60 text-[10px] font-normal select-none">(edit)</span>}
                        </div>
                    )}
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-[11px] leading-tight">
                        {contract.workflow_step && (
                            <>
                                <span className="text-foreground/80 flex items-center gap-1 font-semibold">
                                    <span className="py-0.2 bg-primary/10 text-primary rounded px-1.5 text-[10px] font-bold">
                                        Tahap {contract.workflow_step.step}
                                    </span>
                                    {currentStepName && <span className="max-w-[200px] truncate sm:max-w-[320px]">{currentStepName}</span>}
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
            <div className="flex shrink-0 items-center gap-3">
                <HeaderTaskList contract={contract} onNavigateTab={onNavigateTab} />

                <StatusBadge status={effectiveStatus} statusInfo={contract.status_info} />

                {isAdmin && onOpenAdminWorkflowModal && (
                    <button
                        type="button"
                        onClick={onOpenAdminWorkflowModal}
                        className="flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
                        title="Admin Override: Ubah alur kerja atau tahapan kontrak ini"
                    >
                        <GitFork size={13} className="shrink-0" />
                        <span className="hidden sm:inline">Ubah Alur</span>
                    </button>
                )}

                {/* Save button in navbar when contract info or forms have changes */}
                {isAnyDirty && (
                    <div className="animate-in fade-in slide-in-from-right-3 flex items-center gap-2 duration-200">
                        <button
                            type="button"
                            onClick={() => onResetAllChanges?.()}
                            disabled={infoSaving}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <Button
                            variant="primary"
                            onClick={() => onSaveAllChanges?.()}
                            disabled={infoSaving}
                            className="flex h-8 items-center gap-1.5 px-4 text-xs font-bold shadow-xs transition-all"
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
