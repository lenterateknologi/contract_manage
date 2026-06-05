import { SharedApproveModal } from '@/components/contracts/modals/shared/SharedApproveModal';

interface ApproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    userOptions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function ApproveModal({ isOpen, onClose, step, idx, userOptions, showToast }: ApproveModalProps) {
    const mockContract = {
        workflow_step: { step: idx + 1, actions: [step] },
        approvals: [],
    };

    return (
        <SharedApproveModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            actionCode="approve"
            actionAlias="Setuju"
            users={userOptions}
            onUpdate={() => {}}
            onSubmit={async () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        showToast('Simulasi Persetujuan berhasil!', 'success');
                        resolve();
                    }, 850);
                });
            }}
        />
    );
}
