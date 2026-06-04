import ContractAttachments from '@/components/contracts/tabs/ContractAttachments';
import { Contract } from '@/types/contracts';

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
