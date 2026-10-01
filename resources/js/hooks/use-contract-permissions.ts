import { useMemo } from 'react';
import { Contract, TERMINAL_STATUSES, CLOSED_STATUSES } from '@/pages/contracts/types';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export interface ContractPermissionResult {
    canEdit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canSign: boolean;
    isCreator: boolean;
    isApprover: boolean;
    isSigner: boolean;
    isTerminal: boolean;
    isClosed: boolean;
    activeSignerApproval: any | null;
}

export function useContractPermissions(
    contract: Contract | null | undefined,
    docType: 'f1' | 'f2' | 'contract' | 'agreement' = 'f1',
    customMeId?: string,
): ContractPermissionResult {
    const pageProps = usePage<SharedData>().props;
    const authUser = pageProps.auth?.user;
    const meId = customMeId || authUser?.id;

    return useMemo(() => {
        if (!contract) {
            return {
                canEdit: false,
                canApprove: false,
                canReject: false,
                canSign: false,
                isCreator: false,
                isApprover: false,
                isSigner: false,
                isTerminal: true,
                isClosed: true,
                activeSignerApproval: null,
            };
        }

        const isCreator = Boolean(meId && contract.created_by === meId);
        const isApprover = Boolean((contract as any).can_approve);
        const isTerminal = (TERMINAL_STATUSES as readonly string[]).includes(contract.status);
        const isClosed = (CLOSED_STATUSES as readonly string[]).includes(contract.status);

        const activeSignerApproval = (contract.approvals || []).find(
            (a: any) =>
                a.status === 'pending' &&
                a.user_id === meId &&
                (a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === 'Penandatangan'),
        ) || null;

        const isSigner = Boolean(activeSignerApproval);

        // Calculate edit permissions based on docType and workflow metadata flags
        let canEdit = false;
        if (!isTerminal && (isApprover || (docType === 'agreement' && (isCreator || isSigner)))) {
            const stepMeta = (contract.workflow_step as any)?.meta;
            const flagMap: Record<string, boolean | undefined> = {
                f1: contract.allow?.f1_edit ?? contract.allow_f1_edit ?? stepMeta?.allow_f1_edit,
                f2: contract.allow?.f2_edit ?? contract.allow_f2_edit ?? stepMeta?.allow_f2_edit,
                contract: contract.allow?.agreement_edit ?? contract.allow_agreement_edit ?? stepMeta?.allow_agreement_edit,
                agreement: contract.allow?.agreement_edit ?? contract.allow_agreement_edit ?? stepMeta?.allow_agreement_edit,
            };

            const flag = flagMap[docType] ?? contract.allow?.info_edit ?? contract.allow_info_edit ?? stepMeta?.allow_info_edit;
            canEdit = flag !== false;
        }

        return {
            canEdit,
            canApprove: isApprover && !isClosed,
            canReject: isApprover && !isClosed,
            canSign: isSigner && !isClosed,
            isCreator,
            isApprover,
            isSigner,
            isTerminal,
            isClosed,
            activeSignerApproval,
        };
    }, [contract, docType, meId]);
}
