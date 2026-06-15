import ContractAuditTrail from '@/pages/contracts/components/tabs/ContractAuditTrail';
import { Contract } from '@/pages/contracts/types';

interface AuditTrailTabProps {
    contract: Contract;
}

export const AuditTrailTab = ({ contract }: AuditTrailTabProps) => {
    return <ContractAuditTrail contract={contract} />;
};
