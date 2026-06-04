import ContractAuditTrail from '@/components/contracts/tabs/ContractAuditTrail';
import { Contract } from '@/types/contracts';

interface AuditTrailTabProps {
    contract: Contract;
}

export const AuditTrailTab = ({ contract }: AuditTrailTabProps) => {
    return <ContractAuditTrail contract={contract} />;
};
