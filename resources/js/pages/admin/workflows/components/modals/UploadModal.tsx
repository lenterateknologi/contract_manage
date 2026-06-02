import { SharedApproveModal } from '@/components/contracts/modals/shared/SharedApproveModal';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function UploadModal({ isOpen, onClose, step, showToast }: UploadModalProps) {
    const mockContract = {
        workflow_step: { step: 1, actions: [step] },
        approvals: []
    };

    return (
        <SharedApproveModal
            open={isOpen}
            onClose={onClose}
            contract={mockContract}
            actionCode="upload"
            actionAlias="Upload Dokumen"
            onSubmit={async () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        showToast('Simulasi Upload Dokumen berhasil!', 'success');
                        resolve();
                    }, 850);
                });
            }}
        />
    );
}
