import ContractReferences from '@/components/references/ContractReferences';
import { Contract } from '@/pages/contracts/types';

interface ReferencesTabProps {
    contract: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
    meId?: string;
}

export const ReferencesTab = ({ contract, canUpdate, onUpdate, processing, meId }: ReferencesTabProps) => {
    return <ContractReferences contract={contract} canUpdate={canUpdate} onUpdate={onUpdate} processing={processing} meId={meId} />;
};

export default ReferencesTab;
