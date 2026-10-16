import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Card } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Building2, Mail, Search, ShieldCheck, Users } from 'lucide-react';
import { useContractMembers } from '../../hooks/useContractMembers';
import { ContractMembersProps } from '../../types';

import React, { useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function ContractMembers({ contract }: ContractMembersProps) {
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;
    const currentUserId = currentUser?.id;

    const [memberFilterTab, setMemberFilterTab] = useState<'all' | 'team'>('all');
    const { search, setSearch, activeMembersList } = useContractMembers(contract);

    const userOrgGroup = (currentUser as any)?.idorg_group
        || (currentUser as any)?.department?.idorg_group
        || (currentUser as any)?.organization_group_id
        || (currentUser as any)?.org_group_name;

    const tabFilteredMembers = useMemo(() => {
        if (memberFilterTab === 'all') {
            return activeMembersList;
        }

        return activeMembersList.filter((m) => {
            const memberUser = m.user;
            if (!memberUser) return false;

            if (userOrgGroup) {
                const memberOrgGroup = memberUser.idorg_group
                    || memberUser.department?.idorg_group
                    || memberUser.organization_group_id
                    || memberUser.org_group_name;

                if (memberOrgGroup && String(memberOrgGroup).toLowerCase() === String(userOrgGroup).toLowerCase()) {
                    return true;
                }
            }

            const isVendor = m.roles?.some((r: string) => r.toLowerCase().includes('vendor') || r.toLowerCase().includes('pihak kedua'));
            if (isVendor) return false;

            if (memberUser.id === currentUserId) return true;

            return false;
        });
    }, [activeMembersList, memberFilterTab, userOrgGroup, currentUserId]);

    const filteredMembers = useMemo(() => {
        if (!search.trim()) return tabFilteredMembers;
        const q = search.toLowerCase();
        return tabFilteredMembers.filter(({ user, roles }) => {
            return (
                user.name?.toLowerCase().includes(q) ||
                user.email?.toLowerCase().includes(q) ||
                user.department_name?.toLowerCase().includes(q) ||
                user.role?.toLowerCase().includes(q) ||
                roles.some((r) => r.toLowerCase().includes(q))
            );
        });
    }, [tabFilteredMembers, search]);

    return (
        <div className="animate-in fade-in flex flex-1 flex-col gap-3 overflow-hidden p-3 duration-300 lg:p-4">
            {/* Compact Primary Header */}
            <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Users size={15} className="text-primary-foreground/90" />
                        <h4 className="text-primary-foreground text-xs font-semibold tracking-tight uppercase">Anggota Tim & Personil Terlibat</h4>
                        <span className="rounded border border-white/30 bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {filteredMembers.length} Personil
                        </span>
                    </div>
                </div>

                {/* Filter Tabs: All vs Team Internal */}
                <div className="flex items-center rounded-lg bg-black/20 p-0.5 text-[11px] font-medium">
                    <button
                        type="button"
                        onClick={() => setMemberFilterTab('all')}
                        className={`rounded-md px-2.5 py-1 transition-all ${
                            memberFilterTab === 'all'
                                ? 'bg-white text-primary font-bold shadow-xs'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Semua Terlibat ({activeMembersList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setMemberFilterTab('team')}
                        className={`rounded-md px-2.5 py-1 transition-all ${
                            memberFilterTab === 'team'
                                ? 'bg-white text-primary font-bold shadow-xs'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Tim Internal
                    </button>
                </div>
            </div>

            <Card className="border-border/80 flex min-h-0 flex-1 flex-col overflow-hidden shadow-xs">
                {/* Search / Filter Bar */}
                <div className="border-border/60 bg-muted/20 flex items-center justify-between gap-3 border-b p-3">
                    <div className="w-full sm:w-72">
                        <SearchInput
                            placeholder="CARI NAMA, EMAIL, ROLE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 text-[10px] uppercase"
                        />
                    </div>
                    <span className="text-muted-foreground hidden shrink-0 text-[10px] font-semibold tracking-wide uppercase sm:inline-block">
                        Menampilkan {filteredMembers.length} personil
                    </span>
                </div>

                <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-2.5 sm:p-3">
                    {filteredMembers.map(({ user, roles }) => (
                        <div
                            key={user.id}
                            className="group hover:bg-muted/40 border-border/40 hover:border-border bg-card/40 flex flex-col gap-2 rounded-lg border p-2.5 transition-all"
                        >
                            {/* Top: Avatar, Name, Email, Department */}
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                <UserAvatarIcon user={user} size="sm" className="ring-border/80 h-8 w-8 shrink-0 text-[11px] shadow-2xs ring-1" />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-foreground truncate text-xs leading-tight font-bold">{user.name}</span>
                                    <div className="text-muted-foreground mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px]">
                                        {user.email && (
                                            <div
                                                className="flex max-w-[200px] min-w-0 items-center gap-1 truncate sm:max-w-[260px]"
                                                title={user.email}
                                            >
                                                <Mail size={11} className="text-primary/60 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        )}
                                        {user.department_name && (
                                            <div
                                                className="flex max-w-[180px] min-w-0 items-center gap-1 truncate sm:max-w-[240px]"
                                                title={user.department_name}
                                            >
                                                <Building2 size={11} className="text-primary/60 shrink-0" />
                                                <span className="truncate">{user.department_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom: Role Badges / Chips (Below Name) */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pl-10.5">
                                {user.role && (
                                    <Badge
                                        variant="outline"
                                        className="text-muted-foreground border-border bg-muted/60 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-semibold tracking-wider uppercase"
                                    >
                                        {user.role}
                                    </Badge>
                                )}
                                {roles.map((role) => (
                                    <Badge
                                        key={role}
                                        variant="outline"
                                        className="border-primary/20 bg-primary/5 text-primary flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-semibold tracking-wider uppercase"
                                    >
                                        <ShieldCheck size={10} className="text-primary shrink-0" />
                                        <span>{role}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredMembers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Search className="text-muted-foreground/40 mb-2 h-7 w-7" />
                            <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">Tidak ada personil ditemukan</h4>
                            <p className="text-muted-foreground mt-0.5 text-[10.5px]">Coba kata kunci pencarian yang lain.</p>
                        </div>
                    )}
                </div>

                <div className="border-border/60 bg-muted/20 text-muted-foreground border-t px-4 py-2.5 text-[10px] leading-relaxed font-medium">
                    Catatan: Daftar ini mencakup personil yang memiliki peran, interaksi langsung, atau otoritas formal pada alur kerja dokumen ini.
                </div>
            </Card>
        </div>
    );
}

export { ContractMembers };
