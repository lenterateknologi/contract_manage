import { useEffect, useMemo, useState } from 'react';
import { membersService } from '../services/membersService';
import { ContractMemberEntry } from '../types';

export function useContractMembers(contract: any) {
    const [search, setSearch] = useState('');
    const [members, setMembers] = useState<ContractMemberEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Compute fallback members from the contract object
    const computedFallbackMembers = useMemo<ContractMemberEntry[]>(() => {
        if (!contract) return [];
        const map = new Map<string, ContractMemberEntry>();

        const addMember = (user: any, role: string) => {
            if (!user) return;
            if (!map.has(user.id)) {
                map.set(user.id, { user, roles: [] });
            }
            const m = map.get(user.id)!;
            if (!m.roles.includes(role)) {
                m.roles.push(role);
            }
        };

        // 1. Creator
        addMember(contract.creator, 'Pembuat Dokumen');

        // 2. Initiator
        addMember(contract.initiator, 'Inisiator Pengaju');

        // 3. Approvers (from timeline)
        contract.approvals?.forEach((a: any) => {
            if (a.approver) {
                const isCurrentStep = contract.workflow_step?.step === a.sequence;
                const hasActed = a.status !== 'pending';

                if (hasActed || isCurrentStep) {
                    addMember(a.approver, `Penyetuju (Tahap ${a.sequence})`);
                }
            }
        });

        // 4. Assigned PIC
        if (contract.assigned_pic) {
            addMember(contract.assigned_pic, 'PIC (Petugas Ditugaskan)');
        }

        // 5. Assigned By (Manager)
        if (contract.assigned_by) {
            addMember(contract.assigned_by, 'Manager (Pemberi Tugas)');
        }

        return Array.from(map.values());
    }, [contract]);

    // Fetch members from ContractMemberController API with fallback
    useEffect(() => {
        if (!contract?.id) return;
        setLoading(true);
        membersService
            .getContractMembers(contract.id)
            .then((res: any) => {
                const data = res?.data || res;
                if (Array.isArray(data) && data.length > 0) {
                    setMembers(data);
                } else {
                    setMembers(computedFallbackMembers);
                }
            })
            .catch(() => {
                setMembers(computedFallbackMembers);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [contract?.id, computedFallbackMembers]);

    const activeMembersList = members.length > 0 ? members : computedFallbackMembers;

    const filteredMembers = useMemo(() => {
        if (!search.trim()) return activeMembersList;
        const q = search.toLowerCase();
        return activeMembersList.filter(({ user, roles }) => {
            return (
                user.name?.toLowerCase().includes(q) ||
                user.email?.toLowerCase().includes(q) ||
                user.department_name?.toLowerCase().includes(q) ||
                user.role?.toLowerCase().includes(q) ||
                roles.some((r) => r.toLowerCase().includes(q))
            );
        });
    }, [activeMembersList, search]);

    return {
        search,
        setSearch,
        members,
        loading,
        activeMembersList,
        filteredMembers,
    };
}
