import { ContractMembersTab } from '@/components/contracts/ContractMembersTab';
import { Contract } from '@/types/contracts';

interface MembersTabProps {
    contract: Contract;
    users: any[];
}

export const MembersTab = ({ contract, users }: MembersTabProps) => {
    return <ContractMembersTab contract={contract} users={users} />;
};
