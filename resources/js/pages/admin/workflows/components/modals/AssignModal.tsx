import { SharedApproveModal } from '@/components/contracts/modals/shared/SharedApproveModal';

interface AssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    assigneeOptions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function AssignModal({ isOpen, onClose, assigneeOptions, showToast }: AssignModalProps) {
    const mockContract = {
        workflow_step: { step: 1, actions: [] },
        approvals: [],
        requires_pic_assignment: true
    };

    return (
        <SharedApproveModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            isAssign={true}
            actionAlias="Tugaskan PIC"
            users={assigneeOptions}
            onSubmit={async () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        showToast('Simulasi Penugasan PIC berhasil!', 'success');
                        resolve();
                    }, 850);
                });
            }}
        />
    );
}
