import { ContractReferenceCard } from '@/components/contracts/ContractReferenceCard';
import { Contract } from '@/types/contracts';

interface ReferencesTabProps {
    contract: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => void;
    processing: boolean;
}

export const ReferencesTab = ({ contract, canUpdate, onUpdate, processing }: ReferencesTabProps) => {
    return (
        <ContractReferenceCard
            selected={contract}
            canUpdate={canUpdate}
            onUpdate={onUpdate}
            processing={processing}
        />
    );
};
