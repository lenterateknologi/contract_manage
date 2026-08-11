import AgreementView from '@/pages/contracts/components/tabs/AgreementView';
import { FormSubmissionTab } from '@/pages/contracts/components/tabs/FormSubmissionTab';
import { Contract } from '@/pages/contracts/types';

interface F1TabProps {
    contract: Contract;
    formTemplates: any[];
    vendors: any[];
    meUser: any;
    onUpdate: (c: Contract, silent?: boolean) => void;
    onFormDirty?: (dirty: boolean) => void;
    onFormSave?: (saveFn: () => Promise<void>) => void;
}

export const F1Tab = ({ contract, formTemplates, vendors, meUser, onUpdate, onFormDirty, onFormSave }: F1TabProps) => {
    if ((contract as any).f1_mode === 'interactive') {
        return (
            <FormSubmissionTab
                docType="f1"
                selected={contract}
                formTemplates={formTemplates}
                onContractUpdated={onUpdate}
                users={vendors}
                meUser={meUser}
                onFormDirty={onFormDirty}
                onFormSave={onFormSave}
            />
        );
    }

    return <AgreementView contract={contract} onUpdate={onUpdate} docType="f1" meId={meUser?.id} />;
};
