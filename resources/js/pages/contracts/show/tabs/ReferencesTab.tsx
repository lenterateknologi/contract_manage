import ContractPurchaseOrders from '@/components/references/ContractPurchaseOrders';
import ContractReferences from '@/components/references/ContractReferences';
import { Contract } from '@/pages/contracts/types';

interface ReferencesTabProps {
    contract: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
    meId?: string;
    subTab?: 'parent' | 'purchase_orders';
    vendors?: any[];
}

export const ReferencesTab = ({ contract, canUpdate, onUpdate, processing, meId, subTab = 'parent', vendors = [] }: ReferencesTabProps) => {
    if (subTab === 'purchase_orders') {
        return <ContractPurchaseOrders contract={contract} canUpdate={canUpdate} onUpdate={onUpdate} processing={processing} meId={meId} vendors={vendors} />;
    }

    return <ContractReferences contract={contract} canUpdate={canUpdate} onUpdate={onUpdate} processing={processing} meId={meId} />;
};

export default ReferencesTab;
