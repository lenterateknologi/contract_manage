import { SharedRejectModal } from '@/components/contracts/modals/shared/SharedRejectModal';

interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function RejectModal({ isOpen, onClose, step, idx, showToast }: RejectModalProps) {
    return (
        <SharedRejectModal
            open={isOpen}
            onClose={onClose}
            actionAlias="Tolak"
            onSubmit={async () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        showToast('Simulasi Penolakan berhasil!', 'danger');
                        resolve();
                    }, 850);
                });
            }}
        />
    );
}
