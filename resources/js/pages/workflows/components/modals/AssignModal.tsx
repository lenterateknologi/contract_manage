import { SharedAssignModal } from '@/pages/contracts/components/modals/shared/SharedAssignModal';

interface AssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    assigneeOptions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
    action?: any;
    step?: any;
    idx?: number;
    actionAlias?: string;
}

export function AssignModal({ isOpen, onClose, assigneeOptions, showToast, action, step, idx, actionAlias }: AssignModalProps) {
    const mockContract = {
        workflow_step: {
            step: (idx !== undefined ? idx + 1 : 1),
            actions: action ? [action] : (step?.actions || []),
            description: step?.description || step?.label,
        },
        workflow_step_id: step?.id,
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
            actionCode="assign"
            actionAlias={actionAlias || action?.alias || action?.name || 'Tugaskan PIC'}
            users={assigneeOptions}
        />
    );
}
