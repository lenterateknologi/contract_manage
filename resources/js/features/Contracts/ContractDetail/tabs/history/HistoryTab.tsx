import { ApprovalSteps } from '@/features/Contracts/components/parts/ApprovalSteps';
import { ContractAuditTrail } from '@/features/Contracts/components/tabs/ContractAuditTrail';
import { RelatedWorkflowsTab } from '@/features/Contracts/components/tabs/RelatedWorkflowsTab';
import { Contract } from '@/features/Contracts/types';
import React from 'react';

interface HistoryTabProps {
    contract: Contract;
    historySubTab?: string;
    meId?: string;
    onApprove?: (note?: string, file?: File) => void;
    showToast?: (type: string, message: string) => void;
    onOpenAdminWorkflowModal?: () => void;
}

export function HistoryTab({
    contract,
    historySubTab = 'timeline',
    meId,
    onApprove,
    showToast,
    onOpenAdminWorkflowModal,
}: HistoryTabProps) {
    const activeSub = ['timeline', 'related_workflows', 'audit'].includes(historySubTab)
        ? historySubTab
        : 'timeline';

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {activeSub === 'timeline' && (
                <ApprovalSteps
                    contract={contract}
                    approvals={Array.isArray(contract.approvals) ? contract.approvals : []}
                    creator={contract.creator}
                    submittedAt={contract.submitted_at ?? undefined}
                    meId={meId}
                    onApprove={onApprove ? (note, file) => onApprove(note, file) : undefined}
                    onOpenAdminWorkflowModal={onOpenAdminWorkflowModal}
                />
            )}
            {activeSub === 'related_workflows' && (
                <RelatedWorkflowsTab contract={contract} meId={meId} showToast={showToast} />
            )}
            {activeSub === 'audit' && <ContractAuditTrail contract={contract} />}
        </div>
    );
}

export default HistoryTab;
