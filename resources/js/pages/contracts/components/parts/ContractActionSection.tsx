import { Button } from '@/components/ui/buttons/Button';
import { TooltipProvider } from '@/components/ui/feedback/Tooltip';
import { getActionConfig } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ActionPreviewTooltip, getActionTransitionPreview } from '@/pages/contracts/components/parts/ActionPreviewTooltip';
import { Contract } from '@/pages/contracts/types';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    GitBranch,
    Loader2,
    Lock,
    PenTool,
    Unlock,
    Upload,
    UserCheck,
    UserPlus,
} from 'lucide-react';
import React from 'react';

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
    onActionClick: (action: any, actionCode?: string) => void;
    onSigningAction: (action: 'download' | 'upload', file?: File) => void;
}

export function ContractActionSection({
    contract,
    canApprove,
    availableCustomActions,
    applicableStepActions,
    isStepActionLocked,
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
    if (availableCustomActions.length === 0 && (!canApprove || contract.workflow_step?.meta?.show_action_panel === false)) {
        return null;
    }

    const hasPic = !!(
        contract.assigned_pic_id ||
        contract.metadata?.assigned_pic_id ||
        (contract as any)?.assigned_pic ||
        (contract as any)?.assignedPic
    );

    const hasSigners = (contract.approvals || []).some(
        (a: any) => a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === 'Penandatangan',
    );

    const canToggleAccess = availableCustomActions.some((a) => a.action_code === 'toggle_access');
    const canAssignPic = availableCustomActions.some((a) => a.action_code === 'assign' || a.action_code === 'assign_pic');
    const canSignature = availableCustomActions.some((a) => a.action_code === 'signature' || a.action_code === 'sign');
    const canAdhoc = availableCustomActions.some((a) => a.action_code === 'forward' || a.action_code === 'add_adhoc');
    const branchActions = availableCustomActions.filter((a) => a.action_code === 'branch');
    const canBranch = branchActions.length > 0;

    const picAction = availableCustomActions.find((a) => a.action_code === 'assign' || a.action_code === 'assign_pic');
    const sigAction = availableCustomActions.find((a) => a.action_code === 'signature' || a.action_code === 'sign');
    const adhocAction = availableCustomActions.find((a) => a.action_code === 'forward' || a.action_code === 'add_adhoc');
    const toggleAction = availableCustomActions.find((a) => a.action_code === 'toggle_access');

    const standardActionCodes = ['toggle_access', 'assign', 'assign_pic', 'signature', 'sign', 'forward', 'add_adhoc', 'branch'];
    const otherCustomActions = availableCustomActions.filter((a) => !standardActionCodes.includes(a.action_code));

    const picActionConfig = picAction ? getActionConfig(
        { ...picAction, target_status: picAction.target_status },
        picAction.alias,
        false,
        false,
        picAction.target_status,
        picAction.target_status_info,
        masterContractStatuses,
    ) : null;

    const sigActionConfig = sigAction ? getActionConfig(
        { ...sigAction, target_status: sigAction.target_status },
        sigAction.alias,
        false,
        false,
        sigAction.target_status,
        sigAction.target_status_info,
        masterContractStatuses,
    ) : null;

    const adhocActionConfig = adhocAction ? getActionConfig(
        { ...adhocAction, target_status: adhocAction.target_status },
        adhocAction.alias,
        false,
        false,
        adhocAction.target_status,
        adhocAction.target_status_info,
        masterContractStatuses,
    ) : null;

    return (
        <TooltipProvider delayDuration={100}>
            <div className="bg-card text-card-foreground border-border/80 shadow-xs rounded-xl border p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-foreground">Aksi & Persetujuan</h3>
                        </div>
                    </div>
                    {((contract.workflow_step as any)?.name || contract.workflow_step?.description) && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
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
                            className="w-full justify-between font-bold bg-slate-700 hover:bg-slate-800 text-white cursor-pointer shadow-md transition-all h-9"
                        >
                            <div className="flex items-center gap-2">
                                {showSpecialActions ? (
                                    <Unlock size={15} className="text-amber-300" />
                                ) : (
                                    <Lock size={15} className="text-slate-300" />
                                )}
                                <span>
                                    {showSpecialActions
                                        ? 'Sembunyikan Opsi Tambahan'
                                        : (toggleAction?.alias || 'Buka Semua Opsi Tambahan')}
                                </span>
                            </div>
                            {showSpecialActions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </Button>
                    )}

                    {/* BUTTON TENTUKAN / GANTI PIC */}
                    {canAssignPic && (
                        <ActionPreviewTooltip preview={getActionTransitionPreview(picAction || { action_code: 'assign' }, contract)}>
                            <Button
                                variant="primary"
                                size="sm"
                                style={picActionConfig?.buttonStyle}
                                onClick={() => onActionClick(picAction || { action_code: 'assign' }, 'assign')}
                                className={cn(
                                    'w-full justify-between cursor-pointer font-bold shadow-md hover:shadow-lg transition-all h-9.5 px-3 text-white',
                                    picActionConfig?.buttonClass || 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
                                )}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <UserCheck size={16} className="shrink-0" />
                                    <span className="text-xs truncate">{hasPic ? (picAction?.alias ? `Ubah ${picAction.alias}` : 'Ubah / Ganti PIC') : (picAction?.alias || 'Tentukan PIC Kontrak')}</span>
                                </div>
                                <span className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border',
                                    hasPic
                                        ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40'
                                        : 'bg-amber-400/20 text-amber-100 border-amber-300/40',
                                )}>
                                    {hasPic
                                        ? (contract.assigned_pic?.name || (contract as any).assignedPic?.name || 'Sudah Ada PIC')
                                        : 'Belum Ada PIC'}
                                </span>
                            </Button>
                        </ActionPreviewTooltip>
                    )}

                    {/* BUTTON TENTUKAN TANDA TANGAN */}
                    {canSignature && (
                        <ActionPreviewTooltip preview={getActionTransitionPreview(sigAction || { action_code: 'signature' }, contract)}>
                            <Button
                                variant="primary"
                                size="sm"
                                style={sigActionConfig?.buttonStyle}
                                onClick={() => onActionClick(sigAction || { action_code: 'signature' }, 'signature')}
                                className={cn(
                                    'w-full justify-center cursor-pointer font-bold shadow-md hover:shadow-lg transition-all h-9.5 px-3 gap-2 text-white',
                                    sigActionConfig?.buttonClass || 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
                                )}
                            >
                                <PenTool size={16} />
                                <span className="text-xs">{hasSigners ? (sigAction?.alias ? `Ubah ${sigAction.alias}` : 'Ubah Penandatangan') : (sigAction?.alias || 'Tentukan Penandatangan')}</span>
                            </Button>
                        </ActionPreviewTooltip>
                    )}

                    {/* BUTTON TAMBAH APPROVAL TAMBAHAN / AD-HOC */}
                    {canAdhoc && (
                        <ActionPreviewTooltip preview={getActionTransitionPreview(adhocAction || { action_code: 'forward' }, contract)}>
                            <Button
                                variant="primary"
                                size="sm"
                                style={adhocActionConfig?.buttonStyle}
                                onClick={() => onActionClick(adhocAction || { action_code: 'forward' }, 'forward')}
                                className={cn(
                                    'w-full justify-center cursor-pointer font-bold shadow-md hover:shadow-lg transition-all h-9.5 px-3 gap-2 text-white',
                                    adhocActionConfig?.buttonClass || 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
                                )}
                            >
                                <UserPlus size={16} />
                                <span className="text-xs">{adhocAction?.alias || 'Tambah Persetujuan Ad-Hoc'}</span>
                            </Button>
                        </ActionPreviewTooltip>
                    )}

                    {/* BUTTON PINDAH WORKFLOW (SUB-WORKFLOW BRANCHING) */}
                    {canBranch && branchActions.map((branchAction) => {
                        const branchConfig = getActionConfig(
                            { ...branchAction, target_status: branchAction.target_status },
                            branchAction.alias,
                            false,
                            false,
                            branchAction.target_status,
                            branchAction.target_status_info,
                            masterContractStatuses,
                        );
                        return (
                            <ActionPreviewTooltip key={branchAction.id || branchAction.alias || branchAction.name} preview={getActionTransitionPreview(branchAction || { action_code: 'branch' }, contract)}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    style={branchConfig?.buttonStyle}
                                    onClick={() => onActionClick(branchAction, 'branch')}
                                    className={cn(
                                        'w-full justify-center cursor-pointer font-bold shadow-md hover:shadow-lg transition-all h-9.5 px-3 gap-2 text-white',
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
                        return (
                            <ActionPreviewTooltip key={otherAction.id || otherAction.alias || otherAction.name} preview={preview}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    style={otherConfig?.buttonStyle}
                                    onClick={() => onActionClick(otherAction, otherAction.action_code)}
                                    className={cn(
                                        'w-full justify-center cursor-pointer font-bold shadow-md hover:shadow-lg transition-all h-9.5 px-3 gap-2 text-white',
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
                {canApprove && contract.workflow_step?.meta?.show_action_panel !== false && (
                    <div className="flex flex-col gap-2 pt-1 border-t border-border/40 mt-1">
                        {isStepActionLocked && !isSubStepReviewer ? (
                            <div className="flex flex-col items-center justify-center p-3 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
                                <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                    Aksi Utama Terkunci
                                </span>
                                <p className="text-[10px] text-amber-600/90 dark:text-amber-400/90 leading-tight">
                                    Harap selesaikan aksi khusus yang dipersyaratkan di atas terlebih dahulu untuk membuka tombol persetujuan ini.
                                </p>
                            </div>
                        ) : (
                            <>
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
                                            const isAssignPicAction = action.action_code === 'assign' || action.action_code === 'assign_pic' || (action.action_code === 'approve' && contract.requires_pic_assignment);
                                            const hasPicAssigned = !!(contract.assigned_pic_id || contract.assigned_pic || (contract as any).assignedPic);

                                            return (
                                                <ActionPreviewTooltip key={action.id} preview={preview}>
                                                    <Button
                                                        style={actionConfig.buttonStyle}
                                                        onClick={() => onActionClick(action, action.action_code)}
                                                        className={cn(
                                                            'w-full h-9.5 font-bold shadow-md cursor-pointer gap-2 transition-all text-white',
                                                            isAssignPicAction ? 'justify-between px-3' : 'justify-center',
                                                            customColorClass,
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            <Icon size={16} className="shrink-0" />
                                                            <span className="truncate">
                                                                {action.alias ||
                                                                    (action.action_code === 'approve'
                                                                        ? contract.workflow_step?.step === 1
                                                                            ? 'Kirim Persetujuan'
                                                                            : contract.requires_pic_assignment
                                                                                ? 'Tugaskan PIC'
                                                                                : 'Setujui Kontrak'
                                                                        : action.action_code === 'forward'
                                                                            ? 'Approval Tambahan'
                                                                            : action.action_code === 'branch'
                                                                                ? 'Pindah Workflow'
                                                                                : action.action_code === 'reject'
                                                                                    ? 'Tolak Kontrak'
                                                                                    : ['signature', 'sign'].includes(action.action_code?.toLowerCase())
                                                                                        ? 'Upload Tanda Tangan'
                                                                                        : action.action_code)}
                                                            </span>
                                                        </div>
                                                        {isAssignPicAction && (
                                                            <span className={cn(
                                                                'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border',
                                                                hasPicAssigned
                                                                    ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40'
                                                                    : 'bg-amber-400/20 text-amber-100 border-amber-300/40',
                                                            )}>
                                                                {hasPicAssigned
                                                                    ? (contract.assigned_pic?.name || (contract as any).assignedPic?.name || 'Sudah Ada PIC')
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
                                            const revApproveCfg = getActionConfig({ action_code: 'approve' }, null, false, false, 'approved', null, masterContractStatuses);
                                            const revRejectCfg = getActionConfig({ action_code: 'reject' }, null, false, false, 'rejected', null, masterContractStatuses);
                                            return (
                                                <>
                                                    <ActionPreviewTooltip preview={getActionTransitionPreview(null, contract, { isSubStep: true, actionCode: 'approve' })}>
                                                        <Button
                                                            style={revApproveCfg.buttonStyle}
                                                            onClick={() => onActionClick(null, 'approve')}
                                                            className={cn('w-full h-9.5 font-bold shadow-md cursor-pointer gap-2 transition-all text-white', revApproveCfg.buttonClass)}
                                                        >
                                                            <CheckCircle2 size={16} className="shrink-0" />
                                                            <span>Setujui Penelaahan</span>
                                                        </Button>
                                                    </ActionPreviewTooltip>

                                                    <ActionPreviewTooltip preview={getActionTransitionPreview(null, contract, { isSubStep: true, actionCode: 'reject' })}>
                                                        <Button
                                                            style={revRejectCfg.buttonStyle}
                                                            onClick={() => onActionClick(null, 'reject')}
                                                            className={cn('w-full h-9.5 font-bold shadow-md cursor-pointer gap-2 transition-all text-white', revRejectCfg.buttonClass)}
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
                                            const signCfg = getActionConfig({ action_code: 'signature' }, null, false, false, 'signed', null, masterContractStatuses);
                                            return (
                                                <>
                                                    <Button
                                                        variant="primary"
                                                        style={signCfg.buttonStyle}
                                                        onClick={() => onSigningAction('download')}
                                                        className={cn('w-full gap-2 text-xs text-white font-bold uppercase shadow-md hover:shadow-lg transition-all h-9', signCfg.buttonClass)}
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
                                                                className={cn('w-full gap-2 text-xs font-bold text-white uppercase shadow-md hover:shadow-lg transition-all h-9', signCfg.buttonClass)}
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

                                            return (
                                                <>
                                                    <ActionPreviewTooltip preview={getActionTransitionPreview({ action_code: 'approve' }, contract)}>
                                                        <Button
                                                            style={mainApproveCfg.buttonStyle}
                                                            onClick={() => onActionClick(null, 'approve')}
                                                            className={cn(
                                                                'w-full h-9.5 font-bold shadow-md hover:shadow-lg cursor-pointer gap-2 transition-all text-white',
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
                                                                'w-full h-9.5 font-bold shadow-md hover:shadow-lg cursor-pointer gap-2 transition-all text-white',
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
                            </>
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
