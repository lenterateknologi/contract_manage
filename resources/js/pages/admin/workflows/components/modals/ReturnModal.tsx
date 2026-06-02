import { SharedRejectModal } from '@/components/contracts/modals/shared/SharedRejectModal';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: any;
    idx: number;
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function ReturnModal({ isOpen, onClose, step, idx, showToast }: ReturnModalProps) {
    return (
        <SharedRejectModal
            open={isOpen}
            onClose={onClose}
            actionAlias="Kembalikan (Return)"
            onSubmit={async () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        showToast('Simulasi Pengembalian (Return) berhasil!', 'danger');
                        resolve();
                    }, 850);
                });
            }}
        />
    );
}
