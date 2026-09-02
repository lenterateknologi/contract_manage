import ApprovalSteps from '@/pages/contracts/components/parts/ApprovalSteps';
import { Button } from '@/components/ui/buttons/Button';
import { Contract } from '@/pages/contracts/types';
import { FileDown } from 'lucide-react';

interface TimelineTabProps {
    contract: Contract;
    meId: string;
    onApprove: (note: string, file?: File) => Promise<void>;
    showToast: (msg: string, type: any) => void;
}

export const TimelineTab = ({ contract, meId, onApprove, showToast }: TimelineTabProps) => {

    const handleExportTimelinePdf = () => {
        window.open(`/api/contracts/${contract.id}/approval/pdf`, '_blank');
    };

    return (
        <div >
            <div className="flex flex-col gap-4">
                <ApprovalSteps
                    contract={contract}
                    approvals={contract.approvals}
                    creator={contract.creator}
                    submittedAt={contract.submitted_at ?? undefined}
                    meId={meId}
                    onApprove={onApprove}
                />
            </div>
        </div>
    );
};
