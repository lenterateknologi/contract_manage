import { Avatar } from '@/pages/contracts/components/ui/ui';
import { Contract, UserProfile } from '@/pages/contracts/types';
import { Building2, Mail, ShieldCheck } from 'lucide-react';
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
        <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-1 flex-col p-6 duration-500">
            <div className="mb-6 flex flex-col gap-1 px-1">
                <h3 className="text-text-main text-base font-semibold tracking-tight uppercase">Personil Terlibat</h3>
                <p className="text-text-desc text-[10px] font-medium uppercase">
                    Daftar pemangku kepentingan dalam siklus hidup kontrak
                </p>
            </div>

            {/* ponytail: flat minimal list layout, uniform text styles without bold/gray */}
            <div className="flex flex-col divide-y divide-surface-border/40">
                {membersList.map(({ user, roles }) => (
                    <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 first:pt-0 last:pb-0 gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar user={user} size="sm" className="ring-surface-border/20 ring-1" />
                            <div className="flex flex-col">
                                <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="text-text-main text-sm leading-tight">{user.name}</span>
                                    <span className="text-text-main text-[9px] uppercase">{user.role}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-text-main text-[11px]">
                                    <div className="flex items-center gap-1">
                                        <Mail size={12} className="text-primary/40" />
                                        <span>{user.email}</span>
                                    </div>
                                    {user.department_name && (
                                        <div className="flex items-center gap-1">
                                            <Building2 size={12} className="text-primary/40" />
                                            <span>{user.department_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 sm:justify-end">
                            {roles.map((role) => (
                                <div
                                    key={role}
                                    className="border-primary/20 bg-primary/[0.03] text-primary inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] uppercase"
                                >
                                    <ShieldCheck size={10} />
                                    <span>{role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-surface-border/60 bg-surface-muted/20 text-text-soft mt-6 rounded-xl border p-4 text-[10px] leading-relaxed font-medium uppercase">
                Note: Daftar ini hanya mencakup personil yang memiliki interaksi langsung atau otoritas formal terhadap dokumen ini.
            </div>
        </div>
    );
};

