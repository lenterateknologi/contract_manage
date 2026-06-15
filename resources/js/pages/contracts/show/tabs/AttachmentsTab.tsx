import ContractAttachments from '@/pages/contracts/components/tabs/ContractAttachments';
import { Contract } from '@/pages/contracts/types';

interface AttachmentsTabProps {
    contract: Contract;
    canUpdate?: boolean;
    onUpdate: (c: Contract, silent?: boolean) => void;
    showToast: (msg: string, type: any) => void;
    meUser?: any;
}

export const AttachmentsTab = ({ contract, canUpdate, onUpdate, showToast, meUser }: AttachmentsTabProps) => {
    return <ContractAttachments contract={contract} canUpdate={canUpdate} onUpdated={onUpdate} showToast={showToast} meId={meUser?.id} />;
};
