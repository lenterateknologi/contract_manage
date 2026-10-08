import { Contract } from '@/features/Contracts/types';
import React, { lazy, Suspense } from 'react';

const ContractReferences = lazy(() => import('./ContractReferences'));
const ContractPurchaseOrders = lazy(() => import('./ContractPurchaseOrders'));

interface ReferencesTabProps {
    contract: Contract;
    refSubTab?: 'reference' | 'purchase_orders' | string;
    canUpdate?: boolean;
    onUpdate?: (data: any, silent?: boolean) => void;
    processing?: boolean;
    meId?: string;
    vendors?: any[];
}

export function ReferencesTab({
    contract,
    refSubTab = 'reference',
    canUpdate = true,
    onUpdate = () => {},
    processing = false,
    meId,
    vendors = [],
}: ReferencesTabProps) {
    return (
        <Suspense
            fallback={
                <div className="flex h-48 w-full items-center justify-center">
                    <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
            }
        >
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                {refSubTab === 'purchase_orders' ? (
                    <ContractPurchaseOrders
                        contract={contract}
                        canUpdate={canUpdate}
                        onUpdate={onUpdate}
                        processing={processing}
                        meId={meId}
                        vendors={vendors}
                    />
                ) : (
                    <ContractReferences
                        contract={contract}
                        canUpdate={canUpdate}
                        onUpdate={onUpdate}
                        processing={processing}
                        meId={meId}
                    />
                )}
            </div>
        </Suspense>
    );
}

export default ReferencesTab;
