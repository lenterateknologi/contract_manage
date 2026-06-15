import { SharedSignerModal } from '@/pages/contracts/components/modals/shared/SharedSignerModal';

interface SignerModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    userOptions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function SignerModal({ isOpen, onClose, step, idx, userOptions, showToast }: SignerModalProps) {
    const mockContract = {
        workflow_step: { step: idx + 1, actions: [step] },
        approvals: [{ role: 'Staff Legal (Setup)', status: 'pending' }],
    };

    return (
        <SharedSignerModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            onUpdate={() => {}}
            showToast={showToast}
            actionCode="sign"
            actionAlias="Upload Tanda Tangan"
            users={userOptions}
        />
    );
}
