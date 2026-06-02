import ContractAttachments from '@/components/contracts/ContractAttachments';
import { Contract } from '@/types/contracts';

interface AttachmentsTabProps {
    contract: Contract;
    onUpdate: (c: Contract, silent?: boolean) => void;
    showToast: (msg: string, type: any) => void;
}

export const AttachmentsTab = ({ contract, onUpdate, showToast }: AttachmentsTabProps) => {
    return <ContractAttachments contract={contract} onUpdated={onUpdate} showToast={showToast} />;
};
