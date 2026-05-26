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

    const membersList = Array.from(members.values());

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 p-8 duration-500">
            <div className="mb-8 flex flex-col gap-1.5">
                <h3 className="text-text-main text-lg font-black uppercase tracking-tight">Daftar Member Kontrak</h3>
                <p className="text-text-desc text-xs font-semibold">Seluruh personil yang terlibat dalam siklus hidup kontrak ini</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {membersList.map(({ user, roles }) => (
                    <div
                        key={user.id}
                        className="group bg-surface-base border-surface-border relative flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar user={user} size="lg" className="ring-surface-muted ring-4" />
                                    <div className="bg-text-main text-surface-base absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full shadow-lg">
                                        <User size={10} />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-text-main mb-1 text-sm font-bold leading-none">{user.name}</span>
                                    <span className="text-text-soft text-[10px] font-bold uppercase">{user.role}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-surface-border flex flex-col gap-2 border-t pt-4">
                            <div className="text-text-desc flex items-center gap-2 text-[11px] font-semibold">
                                <Mail size={12} className="opacity-40" />
                                {user.email}
                            </div>
                            {user.department_name && (
                                <div className="text-text-desc flex items-center gap-2 text-[11px] font-semibold">
                                    <Building2 size={12} className="opacity-40" />
                                    {user.department_name}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                            {roles.map((role) => (
                                <span
                                    key={role}
                                    className="border-surface-border bg-surface-muted text-text-soft rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                >
                                    {role}
                                </span>
                            ))}
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="bg-success h-2 w-2 animate-pulse rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
