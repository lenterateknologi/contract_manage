import { ContractMembersTab } from '@/pages/contracts/components/tabs/ContractMembersTab';
import { Contract } from '@/pages/contracts/types';

interface MembersTabProps {
    contract: Contract;
    users: any[];
}

export const MembersTab = ({ contract, users }: MembersTabProps) => {
    return <ContractMembersTab contract={contract} users={users} />;
};
