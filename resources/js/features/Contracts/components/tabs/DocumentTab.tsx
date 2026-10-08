import AgreementView from '@/features/Contracts/components/tabs/AgreementView';
import { FormSubmissionTab } from '@/features/Contracts/components/tabs/FormSubmissionTab';
import { Contract } from '@/features/Contracts/types';

interface DocumentTabProps {
    docType: 'f1' | 'f2' | 'agreement' | 'contract';
    contract: Contract;
    formTemplates?: any[];
    vendors?: any[];
    meUser?: any;
    onUpdate: (c: Contract, silent?: boolean) => void;
    onFormDirty?: (dirty: boolean) => void;
    onFormSave?: (saveFn: () => Promise<void>) => void;
}

export const DocumentTab = ({
    docType,
    contract,
    formTemplates = [],
    vendors = [],
    meUser,
    onUpdate,
    onFormDirty,
    onFormSave,
}: DocumentTabProps) => {
    const rawContract = contract as any;
    const isInteractive =
        rawContract?.[`${docType}_mode`] === 'interactive' ||
        rawContract?.modes?.[docType] === 'interactive' ||
        ((docType === 'agreement' || docType === 'contract') && (rawContract?.contract_mode === 'interactive' || rawContract?.agreement_mode === 'interactive' || rawContract?.modes?.contract === 'interactive'));

    if (isInteractive) {
        return (
            <FormSubmissionTab
                docType={docType === 'agreement' ? 'contract' : docType}
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

    return <AgreementView contract={contract} onUpdate={onUpdate} docType={docType} meId={meUser?.id} />;
};

export default DocumentTab;
