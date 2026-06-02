import { SharedApproveModal } from '@/components/contracts/modals/shared/SharedApproveModal';

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
        approvals: [{ role: 'Staff Legal (Setup)', status: 'pending' }]
    };

    return (
        <SharedApproveModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            actionCode="sign"
            actionAlias="Tanda Tangan"
            users={userOptions}
            onSubmit={async () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        showToast('Simulasi Pemilihan Pihak Penandatangan berhasil!', 'success');
                        resolve();
                    }, 850);
                });
            }}
        />
    );
}
