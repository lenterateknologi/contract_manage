import { AdvancedInfoCard } from '@/features/Contracts/components/parts/AdvancedInfoCard';
import { PicInfoCard } from '@/features/Contracts/components/parts/PicInfoCard';
import { RequesterInfoCard } from '@/features/Contracts/components/parts/RequesterInfoCard';
import { VendorInfoCard } from '@/features/Contracts/components/parts/VendorInfoCard';
import { Contract } from '@/features/Contracts/types';
import React from 'react';

interface PartiesTabProps {
    contract: Contract;
    partySubTab?: 'requester' | 'second_party' | 'pic' | 'timeline' | string;
}

export function PartiesTab({
    contract,
    partySubTab = 'requester',
}: PartiesTabProps) {
    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {(() => {
                switch (partySubTab) {
                    case 'requester':
                        return <RequesterInfoCard selected={contract} isTabView={true} />;
                    case 'second_party':
                        return <VendorInfoCard selected={contract} isTabView={true} />;
                    case 'pic':
                        return <PicInfoCard selected={contract} isTabView={true} />;
                    case 'timeline':
                        return <AdvancedInfoCard selected={contract} isTabView={true} />;
                    default:
                        return <RequesterInfoCard selected={contract} isTabView={true} />;
                }
            })()}
        </div>
    );
}

export default PartiesTab;
