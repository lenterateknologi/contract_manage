import AgreementView from '@/components/contracts/tabs/AgreementView';
import { FormSubmissionTab } from '@/components/contracts/tabs/FormSubmissionTab';
import { Contract } from '@/types/contracts';

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
