import AgreementView from '@/components/contracts/tabs/AgreementView';
import { FormSubmissionTab } from '@/components/contracts/tabs/FormSubmissionTab';
import { Contract } from '@/types/contracts';

interface F1TabProps {
    contract: Contract;
    formTemplates: any[];
    vendors: any[];
    meUser: any;
    onUpdate: (c: Contract, silent?: boolean) => void;
}

export const F1Tab = ({ contract, formTemplates, vendors, meUser, onUpdate }: F1TabProps) => {
    if ((contract as any).f1_mode === 'interactive') {
        return (
            <FormSubmissionTab
                docType="f1"
                selected={contract}
                formTemplates={formTemplates}
                onContractUpdated={onUpdate}
                users={vendors}
                meUser={meUser}
            />
        );
    }

    return <AgreementView contract={contract} onUpdate={onUpdate} docType="f1" meId={meUser?.id} />;
};
