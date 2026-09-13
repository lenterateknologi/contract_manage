import ContractMembers from '@/components/members/ContractMembers';
import { Contract } from '@/pages/contracts/types';

interface MembersTabProps {
    contract: Contract;
    users?: any[];
}

export const MembersTab = ({ contract, users = [] }: MembersTabProps) => {
    return <ContractMembers contract={contract} users={users} />;
};

export default MembersTab;
