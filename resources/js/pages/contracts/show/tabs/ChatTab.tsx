import ContractChat from '@/components/contracts/tabs/ContractChat';
import { Contract } from '@/types/contracts';

interface ChatTabProps {
    contract: Contract;
    meId: string;
    users: any[];
    onUpdate: (c: Contract, silent?: boolean) => void;
}

export const ChatTab = ({ contract, meId, users, onUpdate }: ChatTabProps) => {
    return <ContractChat contract={contract} meId={meId} users={users} onNewMessage={onUpdate} />;
};
