import { cn } from '@/lib/utils';
import { DocumentTab } from '@/features/Contracts/components/tabs/DocumentTab';
import { Contract } from '@/features/Contracts/types';
import React from 'react';

interface DocumentsTabProps {
    contract: Contract;
    docSubTab?: 'f1' | 'f2' | 'agreement' | string;
    formTemplates?: any[];
    vendors?: any[];
    meUser?: any;
    onUpdate: (c: Contract, silent?: boolean) => void;
    onFormDirty?: (dirty: boolean) => void;
    onFormSave?: (saveFn: () => Promise<void>) => void;
}

export function DocumentsTab({
    contract,
    docSubTab = 'f1',
    formTemplates = [],
    vendors = [],
    meUser,
    onUpdate,
    onFormDirty,
    onFormSave,
}: DocumentsTabProps) {
    const meta = contract.workflow_step?.meta || {};
    const hasF1 = meta.show_tab_f1 !== false && ((contract as any).f1_mode || 'upload') !== 'none';
    const hasF2 = meta.show_tab_f2 !== false && ((contract as any).f2_mode || 'upload') !== 'none';
    const hasAgreement =
        meta.show_tab_agreement !== false && ((contract as any).contract_mode || 'upload') !== 'none';

    const docSubTabs = [
        { id: 'f1', label: 'F1 (Permohonan)', show: hasF1 },
        { id: 'f2', label: 'F2 (Ringkasan)', show: hasF2 },
        { id: 'agreement', label: 'Perjanjian', show: hasAgreement },
    ].filter((t) => t.show);

    const activeSub = docSubTabs.some((t) => t.id === docSubTab) ? docSubTab : docSubTabs[0]?.id || 'f1';

    return (
        <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {hasF1 && (
                <div
                    className={cn(
                        'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
                        activeSub === 'f1' ? 'flex' : 'hidden',
                    )}
                >
                    <DocumentTab
                        docType="f1"
                        contract={contract}
                        formTemplates={formTemplates}
                        vendors={vendors}
                        meUser={meUser}
                        onUpdate={onUpdate}
                        onFormDirty={onFormDirty}
                        onFormSave={onFormSave}
                    />
                </div>
            )}
            {hasF2 && (
                <div
                    className={cn(
                        'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
                        activeSub === 'f2' ? 'flex' : 'hidden',
                    )}
                >
                    <DocumentTab
                        docType="f2"
                        contract={contract}
                        formTemplates={formTemplates}
                        vendors={vendors}
                        meUser={meUser}
                        onUpdate={onUpdate}
                        onFormDirty={onFormDirty}
                        onFormSave={onFormSave}
                    />
                </div>
            )}
            {hasAgreement && (
                <div
                    className={cn(
                        'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
                        activeSub === 'agreement' ? 'flex' : 'hidden',
                    )}
                >
                    <DocumentTab
                        docType="agreement"
                        contract={contract}
                        formTemplates={formTemplates}
                        vendors={vendors}
                        meUser={meUser}
                        onUpdate={onUpdate}
                    />
                </div>
            )}
        </div>
    );
}

export default DocumentsTab;
