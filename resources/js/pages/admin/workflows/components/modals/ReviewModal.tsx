import { SharedApproveModal } from '@/components/contracts/modals/shared/SharedApproveModal';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function ReviewModal({ isOpen, onClose, step, idx, showToast }: ReviewModalProps) {
    const mockContract = {
        workflow_step: { step: idx + 1, actions: [step] },
        approvals: []
    };

    return (
        <SharedApproveModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            actionCode="review"
            actionAlias="Selesaikan Review"
            onSubmit={async () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        showToast('Simulasi Review & Markup selesai!', 'success');
                        resolve();
                    }, 850);
                });
            }}
        />
    );
}
