import AgreementView from '@/components/contracts/AgreementView';
import { FormSubmissionTab } from '@/components/contracts/FormSubmissionTab';
import { Contract } from '@/types/contracts';

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

    return <AgreementView contract={contract} onUpdate={onUpdate} />;
};
