import { Avatar } from '@/components/contracts/ui/ui';
import { Contract, UserProfile } from '@/types/contracts';
import { Building2, Mail, ShieldCheck, User } from 'lucide-react';
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
                <h3 className="text-text-main text-base font-semibold tracking-tight uppercase italic">Personil Terlibat</h3>
                <p className="text-text-desc text-[10px] font-medium  uppercase">
                    Daftar pemangku kepentingan dalam siklus hidup kontrak
                </p>
            </div>

            <div className="border-surface-border bg-surface-base/40 overflow-hidden rounded-2xl border shadow-sm backdrop-blur-sm">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-surface-border/60 bg-surface-muted/40 border-b select-none">
                            <th className="text-text-desc px-4 py-3 text-[11px] font-semibold  uppercase">Identitas Personil</th>
                            <th className="text-text-desc px-4 py-3 text-[11px] font-semibold  uppercase">Kontak & Departemen</th>
                            <th className="text-text-desc px-4 py-3 text-right text-[11px] font-semibold  uppercase">
                                Peran dalam Kontrak
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-surface-border/30 divide-y">
                        {membersList.map(({ user, roles }) => (
                            <tr key={user.id} className="group hover:bg-surface-muted/30 transition-colors">
                                <td className="px-4 py-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar user={user} size="sm" className="ring-surface-border/40 ring-2" />
                                            <div className="bg-primary absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full shadow-sm">
                                                <User size={8} className="text-primary-foreground" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-text-main text-sm leading-none font-semibold tracking-tight">{user.name}</span>
                                            <span className="text-text-soft mt-1 text-[10px] font-medium  uppercase">{user.role}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-text-desc flex items-center gap-2 text-[11px] font-medium">
                                            <Mail size={12} className="text-primary/40" />
                                            {user.email}
                                        </div>
                                        {user.department_name && (
                                            <div className="text-text-desc flex items-center gap-2 text-[11px] font-medium">
                                                <Building2 size={12} className="text-primary/40" />
                                                {user.department_name}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right align-middle">
                                    <div className="flex flex-wrap justify-end gap-1.5">
                                        {roles.map((role) => (
                                            <div
                                                key={role}
                                                className="border-primary/20 bg-primary/[0.03] text-primary inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[9px] font-semibold  uppercase"
                                            >
                                                <ShieldCheck size={10} />
                                                {role}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-surface-border/60 bg-surface-muted/20 text-text-soft mt-6 rounded-xl border p-4 text-[10px] leading-relaxed font-medium uppercase">
                Note: Daftar ini hanya mencakup personil yang memiliki interaksi langsung atau otoritas formal terhadap dokumen ini.
            </div>
        </div>
    );
};
