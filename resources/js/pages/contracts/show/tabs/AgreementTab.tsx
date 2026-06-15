import AgreementView from '@/pages/contracts/components/tabs/AgreementView';
import { FormSubmissionTab } from '@/pages/contracts/components/tabs/FormSubmissionTab';
import { Contract } from '@/pages/contracts/types';

interface AgreementTabProps {
    contract: Contract;
    formTemplates: any[];
    vendors: any[];
    meUser: any;
    onUpdate: (c: Contract, silent?: boolean) => void;
}

export const AgreementTab = ({ contract, formTemplates, vendors, meUser, onUpdate }: AgreementTabProps) => {
    if ((contract as any).contract_mode === 'interactive') {
        return (
            <FormSubmissionTab
                docType="contract"
                selected={contract}
                formTemplates={formTemplates}
                onContractUpdated={onUpdate}
                users={vendors}
                meUser={meUser}
            />
        );
    }

    return <AgreementView contract={contract} onUpdate={onUpdate} meId={meUser?.id} />;
};
