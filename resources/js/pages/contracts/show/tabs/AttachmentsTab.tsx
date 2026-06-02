import ContractAttachments from '@/components/contracts/ContractAttachments';
import { Contract } from '@/types/contracts';

interface AttachmentsTabProps {
    contract: Contract;
    onUpdate: (c: Contract, silent?: boolean) => void;
    showToast: (msg: string, type: any) => void;
    meUser?: any;
}

export const AttachmentsTab = ({ contract, onUpdate, showToast, meUser }: AttachmentsTabProps) => {
    return <ContractAttachments contract={contract} onUpdated={onUpdate} showToast={showToast} meId={meUser?.id} />;
};
