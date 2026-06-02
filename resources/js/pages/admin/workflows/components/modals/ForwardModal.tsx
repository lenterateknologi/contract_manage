import { SharedAddhocModal } from '@/components/contracts/modals/shared/SharedAddhocModal';

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
        approvals: []
    };

    return (
        <SharedAddhocModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            actionCode="forward"
            actionAlias="Forward/Add-hoc"
            onUpdate={() => {
                showToast('Simulasi Teruskan (Forward) / Add-hoc berhasil!', 'success');
                onClose();
            }}
            showToast={showToast}
        />
    );
}
