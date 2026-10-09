import { CLOSED_STATUSES, Contract, TERMINAL_STATUSES } from '@/features/Contracts/types';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export interface ContractPermissionResult {
    canEdit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canSign: boolean;
    isCreator: boolean;
    isApprover: boolean;
    isSigner: boolean;
    isAssignedPic: boolean;
    isAdmin: boolean;
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
                isAssignedPic: false,
                isAdmin: false,
                isTerminal: true,
                isClosed: true,
                activeSignerApproval: null,
            };
        }

        const isCreator = Boolean(meId && (contract.created_by === meId || contract.initiated_by_id === meId));
        const isApprover = Boolean((contract as any).can_approve || (contract as any).is_current_actor);
        const isAssignedPic = Boolean(
            meId &&
                (contract.assigned_pic_id === meId ||
                    contract.assigned_pic?.id === meId ||
                    (contract as any).metadata?.assigned_pic_id === meId),
        );
        const isAdmin = Boolean(authUser?.is_admin || authUser?.role === 'Admin' || authUser?.role === 'Super Admin');
        const isTerminal = (TERMINAL_STATUSES as readonly string[]).includes(contract.status);
        const isClosed = (CLOSED_STATUSES as readonly string[]).includes(contract.status);

        const activeSignerApproval =
            (contract.approvals || []).find(
                (a: any) =>
                    a.status === 'pending' && a.user_id === meId && (a.role === 'Pihak 1' || a.role === 'Pihak 2' || a.role === 'Penandatangan'),
            ) || null;

        const isSigner = Boolean(activeSignerApproval);
        const isParticipant = isApprover || isCreator || isAssignedPic || isSigner || isAdmin;

        // Calculate edit permissions based on docType and workflow metadata flags
        let canEdit = false;
        if (!isClosed && !isTerminal) {
            const stepMeta = (contract.workflow_step as any)?.meta;
            const flagMap: Record<string, boolean | undefined> = {
                f1: contract.allow?.f1_edit ?? contract.allow_f1_edit ?? stepMeta?.allow_f1_edit,
                f2: contract.allow?.f2_edit ?? contract.allow_f2_edit ?? stepMeta?.allow_f2_edit,
                contract: contract.allow?.agreement_edit ?? contract.allow_agreement_edit ?? stepMeta?.allow_agreement_edit,
                agreement: contract.allow?.agreement_edit ?? contract.allow_agreement_edit ?? stepMeta?.allow_agreement_edit,
            };

            const flag = flagMap[docType] ?? contract.allow?.info_edit ?? contract.allow_info_edit ?? stepMeta?.allow_info_edit;
            canEdit = (flag === true || flag !== false) && isParticipant;
        }

        return {
            canEdit,
            canApprove: isApprover && !isClosed,
            canReject: isApprover && !isClosed,
            canSign: isSigner && !isClosed,
            isCreator,
            isApprover,
            isSigner,
            isAssignedPic,
            isAdmin,
            isTerminal,
            isClosed,
            activeSignerApproval,
        };
    }, [contract, docType, meId, authUser]);
}
