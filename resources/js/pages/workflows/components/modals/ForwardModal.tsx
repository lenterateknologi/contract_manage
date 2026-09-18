import { SharedAddhocModal } from '@/pages/contracts/components/modals/shared/SharedAddhocModal';

interface ForwardModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function ForwardModal({ isOpen, onClose, step, idx, showToast }: ForwardModalProps) {
    const mockContract = {
        workflow_step: { step: idx + 1, actions: [step] },
        approvals: [],
    };

    return (
        <SharedAddhocModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            actionCode="add_adhoc"
            actionAlias="Approval Tambahan"
            onUpdate={() => {
                showToast('Simulasi Approval Tambahan berhasil!', 'success');
                onClose();
            }}
            showToast={showToast}
        />
    );
}
