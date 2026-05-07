import { Avatar } from '@/components/contracts/ui';
import { Contract, UserProfile } from '@/types/contracts';
import { Building2, Mail, User } from 'lucide-react';
import React from 'react';

interface ContractMembersTabProps {
    contract: Contract;
    users?: any[];
}

export const ContractMembersTab: React.FC<ContractMembersTabProps> = ({ contract, users = [] }) => {
    // Unique list of members
    const members = new Map<string, { user: UserProfile; roles: string[] }>();

    const addMember = (user: UserProfile | null | undefined, role: string) => {
        if (!user) return;
        if (!members.has(user.id)) {
            members.set(user.id, { user, roles: [] });
        }
        const m = members.get(user.id)!;
        if (!m.roles.includes(role)) {
            m.roles.push(role);
        }
    };

    // 1. Creator
    addMember(contract.creator, 'Pembuat Kontrak');

    // 2. Initiator
    addMember(contract.initiator, 'Inisiator');

    // 3. Approvers (from timeline)
    contract.approvals?.forEach((a) => {
        if (a.approver) {
            // Only show if:
            // 1. They have actually acted (approved/rejected)
            // 2. OR it's the current active step (so we know who to wait for)
            const isCurrentStep = contract.workflow_step?.step === a.sequence;
            const hasActed = a.status !== 'pending';

            if (hasActed || isCurrentStep) {
                addMember(a.approver, `Penyetuju (SEQ ${a.sequence})`);
            }
        }
    });

    // 4. Assigned PIC (Ditugaskan)
    if (contract.assigned_pic) {
        addMember(contract.assigned_pic, 'PIC (Ditugaskan)');
    }

    // 5. Assigned By (Manager - Disetujui Oleh)
    if (contract.assigned_by) {
        addMember(contract.assigned_by, 'Manager (Pemberi Tugas)');
    }

    // 6. Custom Management Approvers (from metadata)
    const customManagementIds = contract.metadata?.custom_management_users || [];
    if (Array.isArray(customManagementIds)) {
        customManagementIds.forEach((id: string) => {
            const foundUser = users.find((u) => u.id === id);
            if (foundUser) {
                addMember(foundUser, 'Approver Manajemen (Dipilih)');
            }
        });
    }


    const membersList = Array.from(members.values());

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 p-8 duration-500">
            <div className="mb-8 flex flex-col gap-1.5">
                <h3 className="text-lg font-bold tracking-tight text-black uppercase dark:text-white">Daftar Member Kontrak</h3>
                <p className="text-xs font-medium text-black/40 dark:text-white/40">Seluruh personil yang terlibat dalam siklus hidup kontrak ini</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {membersList.map(({ user, roles }) => (
                    <div
                        key={user.id}
                        className="group relative flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:border-white/5 dark:bg-white/5 dark:hover:shadow-white/5"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar user={user} size="lg" className="ring-4 ring-black/5 dark:ring-white/5" />
                                    <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-lg dark:bg-white dark:text-black">
                                        <User size={10} />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="mb-1 text-sm leading-none font-bold text-black dark:text-white">{user.name}</span>
                                    <span className="text-[10px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-black/5 pt-4 dark:border-white/5">
                            <div className="flex items-center gap-2 text-[11px] font-medium text-black/60 dark:text-white/60">
                                <Mail size={12} className="opacity-40" />
                                {user.email}
                            </div>
                            {user.department_name && (
                                <div className="flex items-center gap-2 text-[11px] font-medium text-black/60 dark:text-white/60">
                                    <Building2 size={12} className="opacity-40" />
                                    {user.department_name}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                            {roles.map((role) => (
                                <span
                                    key={role}
                                    className="rounded-md border border-black/5 bg-black/5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-black/50 uppercase dark:border-white/5 dark:bg-white/5 dark:text-white/50"
                                >
                                    {role}
                                </span>
                            ))}
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
