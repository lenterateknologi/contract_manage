import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Badge } from '@/components/ui/feedback/Badge';
import { Card, CardContent } from '@/components/ui/cards/Card';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Contract, UserProfile } from '@/pages/contracts/types';
import { AppIcon, Icons } from '@/components/ui';

const {
    Building2,
    Mail,
    ShieldCheck,
    Users,
    Search,
    User,
} = Icons;
import React, { useMemo, useState } from 'react';

interface ContractMembersTabProps {
    contract: Contract;
    users?: any[];
}

export const ContractMembersTab: React.FC<ContractMembersTabProps> = ({ contract, users = [] }) => {
    const [search, setSearch] = useState('');

    // Unique list of members
    const membersList = useMemo(() => {
        const map = new Map<string, { user: UserProfile; roles: string[] }>();

        const addMember = (user: UserProfile | null | undefined, role: string) => {
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
        contract.approvals?.forEach((a) => {
            if (a.approver) {
                const isCurrentStep = contract.workflow_step?.step === a.sequence;
                const hasActed = a.status !== 'pending';

                if (hasActed || isCurrentStep) {
                    addMember(a.approver, `Penyetuju (Tahap ${a.sequence})`);
                }
            }
        });

        // 4. Assigned PIC (Ditugaskan)
        if (contract.assigned_pic) {
            addMember(contract.assigned_pic, 'PIC (Petugas Ditugaskan)');
        }

        // 5. Assigned By (Manager - Disetujui Oleh)
        if (contract.assigned_by) {
            addMember(contract.assigned_by, 'Manager (Pemberi Tugas)');
        }

        return Array.from(map.values());
    }, [contract]);

    const filteredMembers = useMemo(() => {
        if (!search.trim()) return membersList;
        const q = search.toLowerCase();
        return membersList.filter(({ user, roles }) => {
            return (
                user.name?.toLowerCase().includes(q) ||
                user.email?.toLowerCase().includes(q) ||
                user.department_name?.toLowerCase().includes(q) ||
                user.role?.toLowerCase().includes(q) ||
                roles.some((r) => r.toLowerCase().includes(q))
            );
        });
    }, [membersList, search]);

    return (
        <div className="animate-in fade-in flex flex-1 flex-col overflow-hidden duration-300 p-3 lg:p-4 gap-3">
            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Users size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">
                            Anggota Tim & Personil Terlibat
                        </h4>
                        <span className="rounded bg-white/20 border border-white/30 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {membersList.length} Personil
                        </span>
                    </div>
                </div>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-border/80 shadow-xs">
                {/* Search / Filter Bar */}
                <div className="p-3 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3">
                    <div className="w-full sm:w-72">
                        <SearchInput
                            placeholder="CARI NAMA, EMAIL, ROLE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 text-[10px] uppercase"
                        />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide shrink-0 hidden sm:inline-block">
                        Menampilkan {filteredMembers.length} dari {membersList.length} personil
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 space-y-2">
                    {filteredMembers.map(({ user, roles }) => (
                        <div
                            key={user.id}
                            className="flex flex-col p-2.5 gap-2 group hover:bg-muted/40 transition-all rounded-lg border border-border/40 hover:border-border bg-card/40"
                        >
                            {/* Top: Avatar, Name, Email, Department */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <UserAvatarIcon
                                    user={user}
                                    size="sm"
                                    className="h-8 w-8 ring-1 ring-border/80 shrink-0 text-[11px] shadow-2xs"
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-bold text-foreground leading-tight truncate">
                                        {user.name}
                                    </span>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] text-muted-foreground min-w-0">
                                        {user.email && (
                                            <div className="flex items-center gap-1 min-w-0 truncate max-w-[200px] sm:max-w-[260px]" title={user.email}>
                                                <Mail size={11} className="text-primary/60 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        )}
                                        {user.department_name && (
                                            <div className="flex items-center gap-1 min-w-0 truncate max-w-[180px] sm:max-w-[240px]" title={user.department_name}>
                                                <Building2 size={11} className="text-primary/60 shrink-0" />
                                                <span className="truncate">{user.department_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom: Role Badges / Chips (Below Name) */}
                            <div className="flex flex-wrap items-center gap-1.5 pl-10.5 pt-0.5">
                                {user.role && (
                                    <Badge variant="outline" className="px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground border-border bg-muted/60 rounded shrink-0">
                                        {user.role}
                                    </Badge>
                                )}
                                {roles.map((role) => (
                                    <Badge
                                        key={role}
                                        variant="outline"
                                        className="border-primary/20 bg-primary/5 text-primary text-[8.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"
                                    >
                                        <ShieldCheck size={10} className="shrink-0 text-primary" />
                                        <span>{role}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredMembers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Search className="h-7 w-7 text-muted-foreground/40 mb-2" />
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Tidak ada personil ditemukan
                            </h4>
                            <p className="text-[10.5px] text-muted-foreground mt-0.5">
                                Coba kata kunci pencarian yang lain.
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-muted-foreground text-[10px] leading-relaxed font-medium">
                    Catatan: Daftar ini mencakup personil yang memiliki peran, interaksi langsung, atau otoritas formal pada alur kerja dokumen ini.
                </div>
            </Card>
        </div>
    );
};

