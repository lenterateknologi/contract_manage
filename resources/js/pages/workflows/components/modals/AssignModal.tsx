import { SharedAssignModal } from '@/pages/contracts/components/modals/shared/SharedAssignModal';

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
        requires_pic_assignment: true,
    };

    return (
        <SharedAssignModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            onUpdate={() => {}}
            showToast={showToast}
            actionAlias="Tugaskan PIC"
            users={assigneeOptions}
        />
    );
}
