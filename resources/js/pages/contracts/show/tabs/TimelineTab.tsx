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
        <div className="flex flex-col gap-4 overflow-y-auto p-5">
            <div className="flex justify-end gap-2 px-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportTimelinePdf}
                    className="h-8 gap-2 rounded-xl text-[10px] font-bold  uppercase transition-all active:scale-95 border-black/10 text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                    <FileDown size={14} />
                    Export PDF
                </Button>
            </div>
            <div className="mb-10 flex flex-col gap-8">
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
