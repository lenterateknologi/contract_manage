import ContractChat from '@/pages/contracts/components/tabs/ContractChat';
import { Contract } from '@/pages/contracts/types';

interface ChatTabProps {
    contract: Contract;
    meId: string;
    users: any[];
    onUpdate: (c: Contract, silent?: boolean) => void;
}

export const ChatTab = ({ contract, meId, users, onUpdate }: ChatTabProps) => {
    return <ContractChat contract={contract} meId={meId} users={users} onNewMessage={onUpdate} />;
};
