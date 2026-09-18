import ApprovalSteps from '@/pages/contracts/components/parts/ApprovalSteps';
import { Contract } from '@/pages/contracts/types';

interface TimelineTabProps {
    contract: Contract;
    meId?: string;
    onApprove: (note: string, file?: File) => Promise<void>;
    showToast: (msg: string, type: any) => void;
}

export const TimelineTab = ({ contract, meId, onApprove }: TimelineTabProps) => {


    return (
        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
            <ApprovalSteps
                contract={contract}
                approvals={contract.approvals}
                creator={contract.creator}
                submittedAt={contract.submitted_at ?? undefined}
                meId={meId}
                onApprove={onApprove}
            />
        </div>
    );
};
