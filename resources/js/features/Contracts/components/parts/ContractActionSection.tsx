import { getActionConfig } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { TooltipProvider } from '@/components/ui/feedback/Tooltip';
import { cn } from '@/lib/utils';
import { ActionPreviewTooltip, getActionTransitionPreview } from '@/features/Contracts/components/parts/ActionPreviewTooltip';
import { Contract } from '@/features/Contracts/types';
import { resolveContractRequirements } from '@/features/Contracts/utils/requirements';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    GitBranch,
    Loader2,
    Lock,
    Sparkles,
    Unlock,
    Upload,
    UserCheck,
    UserPlus,
} from 'lucide-react';

interface ContractActionSectionProps {
    contract: Contract;
    canApprove: boolean;
    availableCustomActions: any[];
    applicableStepActions: any[];
    isStepActionLocked: boolean;
    isSubStepReviewer: boolean;
    isSigner: boolean;
    stepDownloaded: boolean | null | string;
    signingUploading: boolean;
    showSpecialActions: boolean;
    masterContractStatuses?: any[];
    onToggleSpecialActions: () => void;
    onActionClick: (action: any, actionCode?: string, isCustomAction?: boolean) => void;
    onSigningAction: (action: 'download' | 'upload', file?: File) => void;
}

export function ContractActionSection({
    contract,
    canApprove,
    availableCustomActions,
    applicableStepActions,
    isSubStepReviewer,
    isSigner,
    stepDownloaded,
    signingUploading,
    showSpecialActions,
    masterContractStatuses,
    onToggleSpecialActions,
    onActionClick,
    onSigningAction,
}: ContractActionSectionProps) {
    const hasStepActions = applicableStepActions.length > 0 && canApprove;
    const hasCustomActions = availableCustomActions.length > 0;

    if (!hasStepActions && !hasCustomActions) {
        return null;
    }

    if (contract.workflow_step?.meta?.show_action_panel === false && !hasCustomActions) {
        return null;
    }

    const hasPic = !!(
        contract.assigned_pic_id ||
        contract.metadata?.assigned_pic_id ||
        (contract as any)?.assigned_pic ||
        (contract as any)?.assignedPic
    );

    const isAdhocAction = (a: any) => a.action_code === 'add_adhoc';

    const canToggleAccess = availableCustomActions.some((a) => a.action_code === 'toggle_access');
    const canAssignPic = availableCustomActions.some((a) => a.action_code === 'assign');
    const canAdhoc = availableCustomActions.some(isAdhocAction);
    const branchActions = availableCustomActions.filter(
        (a) => !isAdhocAction(a) && (a.action_code === 'branch' || a.execution_type === 'cross_workflow'),
    );
    const canBranch = branchActions.length > 0;

    const picAction = availableCustomActions.find((a) => a.action_code === 'assign');
    const adhocAction = availableCustomActions.find(isAdhocAction);
    const toggleAction = availableCustomActions.find((a) => a.action_code === 'toggle_access');

    const standardActionCodes = ['toggle_access', 'assign', 'add_adhoc', 'branch'];
    const otherCustomActions = availableCustomActions.filter(
        (a) => !isAdhocAction(a) && !standardActionCodes.includes(a.action_code) && a.execution_type !== 'cross_workflow',
    );

    const picActionConfig = picAction
        ? getActionConfig(
              { ...picAction, target_status: picAction.target_status },
              picAction.alias,
              false,
              false,
              picAction.target_status,
              picAction.target_status_info,
              masterContractStatuses,
          )
        : null;

    const adhocActionConfig = adhocAction
        ? getActionConfig(
              { ...adhocAction, target_status: adhocAction.target_status },
              adhocAction.alias,
              false,
              false,
              adhocAction.target_status,
              adhocAction.target_status_info,
              masterContractStatuses,
          )
        : null;

    return (
        <TooltipProvider delayDuration={100}>
            <div className="bg-card text-card-foreground border-border/80 space-y-3.5 rounded-xl border p-4 shadow-xs">
                <div className="border-border/50 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary rounded-lg p-1.5">
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <h3 className="text-foreground text-xs font-bold">Aksi & Persetujuan</h3>
                        </div>
                    </div>
                    {((contract.workflow_step as any)?.name || contract.workflow_step?.description) && (
                        <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                            {(contract.workflow_step as any)?.name || contract.workflow_step?.description}
                        </span>
                    )}
                </div>

                {/* CUSTOM / SPECIAL ACTIONS */}
                <div className="flex flex-col gap-2">
                    {/* BUTTON KHUSUS: BUKA / KUNCI SEMUA AKSI TAMBAHAN */}
                    {canToggleAccess && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onToggleSpecialActions}
                            className="h-9 w-full cursor-pointer justify-between bg-slate-700 font-bold text-white shadow-md transition-all hover:bg-slate-800"
                        >
                            <div className="flex items-center gap-2">
                                {showSpecialActions ? <Unlock size={15} className="text-amber-300" /> : <Lock size={15} className="text-slate-300" />}
                                <span>{showSpecialActions ? 'Sembunyikan Opsi Tambahan' : toggleAction?.alias || 'Buka Semua Opsi Tambahan'}</span>
                            </div>
                            {showSpecialActions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </Button>
                    )}

                    {/* BUTTON TENTUKAN / GANTI PIC */}
                    {canAssignPic &&
                        (() => {
                            const picReqStatus = resolveContractRequirements(contract, picAction || { action_code: 'assign' });
                            const isPicBlocked = !picReqStatus.allFilled;
                            const missingPicItems = isPicBlocked ? picReqStatus.items.filter((i) => !i.isFilled) : [];

                            return (
                                <ActionPreviewTooltip
                                    preview={getActionTransitionPreview(picAction || { action_code: 'assign' }, contract)}
                                    missingRequirements={missingPicItems}
                                >
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        style={picActionConfig?.buttonStyle}
                                        onClick={() => onActionClick(picAction || { action_code: 'assign' }, 'assign', true)}
                                        disabled={isPicBlocked}
                                        className={cn(
                                            'h-9.5 w-full justify-between px-3 font-bold text-white shadow-md transition-all hover:shadow-lg',
                                            isPicBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                            picActionConfig?.buttonClass || 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <UserCheck size={16} className="shrink-0" />
                                            <span className="truncate text-xs">
                                                {hasPic
                                                    ? picAction?.alias
                                                        ? `Ubah ${picAction.alias}`
                                                        : 'Ubah / Ganti PIC'
                                                    : picAction?.alias || 'Tentukan PIC Kontrak'}
                                            </span>
                                        </div>
                                        <span
                                            className={cn(
                                                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                                hasPic
                                                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
                                                    : 'border-amber-300/40 bg-amber-400/20 text-amber-100',
                                            )}
                                        >
                                            {hasPic
                                                ? contract.assigned_pic?.name || (contract as any).assignedPic?.name || 'Sudah Ada PIC'
                                                : 'Belum Ada PIC'}
                                        </span>
                                    </Button>
                                </ActionPreviewTooltip>
                            );
                        })()}

                    {/* BUTTON TAMBAH APPROVAL TAMBAHAN / AD-HOC */}
                    {canAdhoc &&
                        (() => {
                            const adhocReqStatus = resolveContractRequirements(contract, adhocAction || { action_code: 'add_adhoc' });
                            const isAdhocBlocked = !adhocReqStatus.allFilled;
                            const missingAdhocItems = isAdhocBlocked ? adhocReqStatus.items.filter((i) => !i.isFilled) : [];

                            return (
                                <ActionPreviewTooltip
                                    preview={getActionTransitionPreview(adhocAction || { action_code: 'add_adhoc' }, contract)}
                                    missingRequirements={missingAdhocItems}
                                >
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        style={adhocActionConfig?.buttonStyle}
                                        onClick={() => onActionClick(adhocAction || { action_code: 'add_adhoc' }, 'add_adhoc', true)}
                                        disabled={isAdhocBlocked}
                                        className={cn(
                                            'h-9.5 w-full justify-center gap-2 px-3 font-bold text-white shadow-md transition-all hover:shadow-lg',
                                            isAdhocBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                            adhocActionConfig?.buttonClass || 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
                                        )}
                                    >
                                        <UserPlus size={16} />
                                        <span className="text-xs">{adhocAction?.alias || 'Tambah Persetujuan Ad-Hoc'}</span>
                                    </Button>
                                </ActionPreviewTooltip>
                            );
                        })()}

                    {/* BUTTON PINDAH WORKFLOW (SUB-WORKFLOW BRANCHING) */}
                    {canBranch &&
                        branchActions.map((branchAction) => {
                            const branchConfig = getActionConfig(
                                { ...branchAction, target_status: branchAction.target_status },
                                branchAction.alias,
                                false,
                                false,
                                branchAction.target_status,
                                branchAction.target_status_info,
                                masterContractStatuses,
                            );
                            const branchReqStatus = resolveContractRequirements(contract, branchAction || { action_code: 'branch' });
                            const isBranchBlocked = !branchReqStatus.allFilled;
                            const missingBranchItems = isBranchBlocked ? branchReqStatus.items.filter((i) => !i.isFilled) : [];

                            return (
                                <ActionPreviewTooltip
                                    key={branchAction.id || branchAction.alias || branchAction.name}
                                    preview={getActionTransitionPreview(branchAction || { action_code: 'branch' }, contract)}
                                    missingRequirements={missingBranchItems}
                                >
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        style={branchConfig?.buttonStyle}
                                        onClick={() => onActionClick(branchAction, 'branch')}
                                        disabled={isBranchBlocked}
                                        className={cn(
                                            'h-9.5 w-full justify-center gap-2 px-3 font-bold text-white shadow-md transition-all hover:shadow-lg',
                                            isBranchBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                            branchConfig?.buttonClass || 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800',
                                        )}
                                    >
                                        <GitBranch size={16} />
                                        <span className="text-xs">{branchAction?.alias || branchAction?.name || 'Pindah Workflow'}</span>
                                    </Button>
                                </ActionPreviewTooltip>
                            );
                        })}

                    {/* BUTTON CUSTOM ACTIONS LAINNYA */}
                    {otherCustomActions.map((otherAction) => {
                        const preview = getActionTransitionPreview(otherAction, contract);
                        const otherConfig = getActionConfig(
                            { ...otherAction, target_status: otherAction.target_status },
                            otherAction.alias,
                            false,
                            false,
                            otherAction.target_status,
                            otherAction.target_status_info,
                            masterContractStatuses,
                        );
                        const IconComponent = otherConfig?.icon || Sparkles;
                        const otherReqStatus = resolveContractRequirements(contract, otherAction);
                        const isOtherBlocked = !otherReqStatus.allFilled;
                        const missingOtherItems = isOtherBlocked ? otherReqStatus.items.filter((i) => !i.isFilled) : [];

                        return (
                            <ActionPreviewTooltip
                                key={otherAction.id || otherAction.alias || otherAction.name}
                                preview={preview}
                                missingRequirements={missingOtherItems}
                            >
                                <Button
                                    variant="primary"
                                    size="sm"
                                    style={otherConfig?.buttonStyle}
                                    onClick={() => onActionClick(otherAction, otherAction.action_code, true)}
                                    disabled={isOtherBlocked}
                                    className={cn(
                                        'h-9.5 w-full justify-center gap-2 px-3 font-bold text-white shadow-md transition-all hover:shadow-lg',
                                        isOtherBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                        otherConfig?.buttonClass || 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
                                    )}
                                >
                                    <IconComponent size={16} />
                                    <span className="text-xs">{otherAction?.alias || otherAction?.name}</span>
                                </Button>
                            </ActionPreviewTooltip>
                        );
                    })}
                </div>

                {/* MAIN STEP ACTIONS */}
                {canApprove && (
                    <div className="border-border/40 mt-1 flex flex-col gap-2 border-t pt-1">
                        {applicableStepActions.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {applicableStepActions.map((action: any) => {
                                    const actionConfig = getActionConfig(
                                        {
                                            ...action,
                                            target_status: action.target_status || (contract?.workflow_step?.meta as any)?.target_status,
                                            isStep1: contract?.workflow_step?.step === 1,
                                        },
                                        null,
                                        false,
                                        false,
                                        action.target_status || (contract?.workflow_step?.meta as any)?.target_status,
                                        action.target_status_info,
                                        masterContractStatuses,
                                    );
                                    const Icon = actionConfig.icon;
                                    const customColorClass = actionConfig.buttonClass;
                                    const preview = getActionTransitionPreview(action, contract);
                                    const isAssignPicAction =
                                        action.action_code === 'assign' ||
                                        action.action_code === 'assign_pic' ||
                                        (action.action_code === 'approve' && contract.requires_pic_assignment);
                                    const hasPicAssigned = !!(contract.assigned_pic_id || contract.assigned_pic || (contract as any).assignedPic);

                                    // Requirements validation: block actions when requirements not met, allow reject / rollback actions
                                    const isRejectAction = action.action_code === 'reject' || action.action_code === 'rollback';
                                    const reqStatus = !isRejectAction ? resolveContractRequirements(contract, action) : null;
                                    const isActionBlocked = !!(!isRejectAction && reqStatus && !reqStatus.allFilled);
                                    const missingItems = isActionBlocked ? reqStatus.items.filter((i) => !i.isFilled) : [];

                                    return (
                                        <ActionPreviewTooltip key={action.id} preview={preview} missingRequirements={missingItems}>
                                            <Button
                                                style={actionConfig.buttonStyle}
                                                onClick={() => onActionClick(action, action.action_code, false)}
                                                disabled={isActionBlocked}
                                                className={cn(
                                                    'h-9.5 w-full gap-2 font-bold text-white shadow-md transition-all',
                                                    isActionBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                                    isAssignPicAction ? 'justify-between px-3' : 'justify-center',
                                                    customColorClass,
                                                )}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <Icon size={16} className="shrink-0" />
                                                    <span className="truncate">
                                                        {action.alias || actionConfig.label || action.action_code || 'Setujui'}
                                                    </span>
                                                </div>
                                                {isAssignPicAction && (
                                                    <span
                                                        className={cn(
                                                            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                                            hasPicAssigned
                                                                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
                                                                : 'border-amber-300/40 bg-amber-400/20 text-amber-100',
                                                        )}
                                                    >
                                                        {hasPicAssigned
                                                            ? contract.assigned_pic?.name || (contract as any).assignedPic?.name || 'Sudah Ada PIC'
                                                            : 'Belum Ada PIC'}
                                                    </span>
                                                )}
                                            </Button>
                                        </ActionPreviewTooltip>
                                    );
                                })}
                            </div>
                        ) : isSubStepReviewer ? (
                            <div className="flex flex-col gap-2">
                                {(() => {
                                    const revApproveCfg = getActionConfig(
                                        { action_code: 'approve' },
                                        null,
                                        false,
                                        false,
                                        'approved',
                                        null,
                                        masterContractStatuses,
                                    );
                                    const revRejectCfg = getActionConfig(
                                        { action_code: 'reject' },
                                        null,
                                        false,
                                        false,
                                        'rejected',
                                        null,
                                        masterContractStatuses,
                                    );
                                    const revReqStatus = resolveContractRequirements(contract, { action_code: 'approve' });
                                    const isRevBlocked = !revReqStatus.allFilled;
                                    const missingRevItems = isRevBlocked ? revReqStatus.items.filter((i) => !i.isFilled) : [];

                                    return (
                                        <>
                                            <ActionPreviewTooltip
                                                preview={getActionTransitionPreview(null, contract, { isSubStep: true, actionCode: 'approve' })}
                                                missingRequirements={missingRevItems}
                                            >
                                                <Button
                                                    style={revApproveCfg.buttonStyle}
                                                    onClick={() => onActionClick(null, 'approve')}
                                                    disabled={isRevBlocked}
                                                    className={cn(
                                                        'h-9.5 w-full gap-2 font-bold text-white shadow-md transition-all',
                                                        isRevBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                                        revApproveCfg.buttonClass,
                                                    )}
                                                >
                                                    <CheckCircle2 size={16} className="shrink-0" />
                                                    <span>Setujui Penelaahan</span>
                                                </Button>
                                            </ActionPreviewTooltip>

                                            <ActionPreviewTooltip
                                                preview={getActionTransitionPreview(null, contract, { isSubStep: true, actionCode: 'reject' })}
                                            >
                                                <Button
                                                    style={revRejectCfg.buttonStyle}
                                                    onClick={() => onActionClick(null, 'reject')}
                                                    className={cn(
                                                        'h-9.5 w-full cursor-pointer gap-2 font-bold text-white shadow-md transition-all',
                                                        revRejectCfg.buttonClass,
                                                    )}
                                                >
                                                    <AlertCircle size={16} className="shrink-0" />
                                                    <span>Tolak / Kembalikan Catatan</span>
                                                </Button>
                                            </ActionPreviewTooltip>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : isSigner ? (
                            <div className="flex flex-col gap-2">
                                {(() => {
                                    const signCfg = getActionConfig(
                                        { action_code: 'approve' },
                                        null,
                                        false,
                                        false,
                                        'signed',
                                        null,
                                        masterContractStatuses,
                                    );
                                    return (
                                        <>
                                            <Button
                                                variant="primary"
                                                style={signCfg.buttonStyle}
                                                onClick={() => onSigningAction('download')}
                                                className={cn(
                                                    'h-9 w-full gap-2 text-xs font-bold text-white uppercase shadow-md transition-all hover:shadow-lg',
                                                    signCfg.buttonClass,
                                                )}
                                            >
                                                <Download size={16} /> Download Draft
                                            </Button>

                                            <div>
                                                <input
                                                    type="file"
                                                    id="sidebar-upload-draft"
                                                    className="hidden"
                                                    accept=".docx,.DOCX,.doc,.DOC,.pdf,.PDF"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) onSigningAction('upload', f);
                                                    }}
                                                    disabled={!stepDownloaded || signingUploading}
                                                />
                                                <ActionPreviewTooltip preview={getActionTransitionPreview(null, contract, { isSigner: true })}>
                                                    <Button
                                                        variant="primary"
                                                        style={signCfg.buttonStyle}
                                                        onClick={() => document.getElementById('sidebar-upload-draft')?.click()}
                                                        disabled={!stepDownloaded || signingUploading}
                                                        className={cn(
                                                            'h-9 w-full gap-2 text-xs font-bold text-white uppercase shadow-md transition-all hover:shadow-lg',
                                                            signCfg.buttonClass,
                                                        )}
                                                    >
                                                        {signingUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                        Upload TTD
                                                    </Button>
                                                </ActionPreviewTooltip>
                                            </div>
                                        </>
                                    );
                                })()}

                                {!stepDownloaded && (
                                    <div className="mt-1 flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-rose-900">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-600" />
                                        <p className="text-[10px] leading-relaxed font-semibold">
                                            Anda wajib mengunduh draft terlebih dahulu sebelum mengunggah hasil TTD.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {(() => {
                                    const mainApproveCfg = getActionConfig(
                                        {
                                            action_code: 'approve',
                                            target_status: (contract?.workflow_step?.meta as any)?.target_status,
                                            isStep1: contract.workflow_step?.step === 1,
                                        },
                                        null,
                                        false,
                                        false,
                                        (contract?.workflow_step?.meta as any)?.target_status,
                                        null,
                                        masterContractStatuses,
                                    );
                                    const mainRejectCfg = getActionConfig(
                                        { action_code: 'reject' },
                                        null,
                                        false,
                                        false,
                                        'rejected',
                                        null,
                                        masterContractStatuses,
                                    );
                                    const mainReqStatus = resolveContractRequirements(contract, { action_code: 'approve' });
                                    const isMainBlocked = !mainReqStatus.allFilled;
                                    const missingMainItems = isMainBlocked ? mainReqStatus.items.filter((i) => !i.isFilled) : [];

                                    return (
                                        <>
                                            <ActionPreviewTooltip
                                                preview={getActionTransitionPreview({ action_code: 'approve' }, contract)}
                                                missingRequirements={missingMainItems}
                                            >
                                                <Button
                                                    style={mainApproveCfg.buttonStyle}
                                                    onClick={() => onActionClick(null, 'approve')}
                                                    disabled={isMainBlocked}
                                                    className={cn(
                                                        'h-9.5 w-full gap-2 font-bold text-white shadow-md transition-all hover:shadow-lg',
                                                        isMainBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                                        mainApproveCfg.buttonClass,
                                                    )}
                                                >
                                                    <CheckCircle2 size={16} />
                                                    <span>
                                                        {contract.workflow_step?.step === 1
                                                            ? 'Kirim Persetujuan'
                                                            : contract.requires_pic_assignment
                                                              ? 'Tugaskan PIC'
                                                              : 'Setujui Kontrak'}
                                                    </span>
                                                </Button>
                                            </ActionPreviewTooltip>
                                            <ActionPreviewTooltip preview={getActionTransitionPreview({ action_code: 'reject' }, contract)}>
                                                <Button
                                                    style={mainRejectCfg.buttonStyle}
                                                    onClick={() => onActionClick(null, 'reject')}
                                                    className={cn(
                                                        'h-9.5 w-full cursor-pointer gap-2 font-bold text-white shadow-md transition-all hover:shadow-lg',
                                                        mainRejectCfg.buttonClass,
                                                    )}
                                                >
                                                    <AlertCircle size={16} />
                                                    <span>Tolak Kontrak</span>
                                                </Button>
                                            </ActionPreviewTooltip>
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
