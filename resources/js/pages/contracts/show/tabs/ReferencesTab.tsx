import { ContractReferenceCard } from '@/components/contracts/tabs/ContractReferenceCard';
import { Contract } from '@/types/contracts';

interface ReferencesTabProps {
    contract: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
    meId?: string;
}

export const ReferencesTab = ({ contract, canUpdate, onUpdate, processing, meId }: ReferencesTabProps) => {
    return <ContractReferenceCard selected={contract} canUpdate={canUpdate} onUpdate={onUpdate} processing={processing} meId={meId} />;
};
