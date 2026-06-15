import AgreementView from '@/pages/contracts/components/tabs/AgreementView';
import { FormSubmissionTab } from '@/pages/contracts/components/tabs/FormSubmissionTab';
import { Contract } from '@/pages/contracts/types';

interface F2TabProps {
    contract: Contract;
    formTemplates: any[];
    vendors: any[];
    meUser: any;
    onUpdate: (c: Contract, silent?: boolean) => void;
}

export const F2Tab = ({ contract, formTemplates, vendors, meUser, onUpdate }: F2TabProps) => {
    if ((contract as any).f2_mode === 'interactive') {
        return (
            <FormSubmissionTab
                docType="f2"
                selected={contract}
                formTemplates={formTemplates}
                onContractUpdated={onUpdate}
                users={vendors}
                meUser={meUser}
            />
        );
    }

    return <AgreementView contract={contract} onUpdate={onUpdate} docType="f2" meId={meUser?.id} />;
};
