import { Button } from '@/components/ui/buttons/Button';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import {
    Building2,
    ExternalLink,
    Search,
    UserCheck,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface UserWorkload {
    id: string;
    name: string;
    email: string;
    initials?: string;
    role: string;
    position?: string;
    bg_color?: string;
    text_color?: string;
    department_name?: string;
    department_id?: string | null;
    division_name?: string;
    division_id?: string | null;
    location_name?: string;
    location_id?: string | null;
    company_id?: string | number | null;
    company_name?: string;
    company_group_id?: string | number | null;
    company_group_name?: string;
    org_group_name?: string;
    region_id?: string | number | null;
    active_contracts_count: number;
    pending_tasks_count: number;
    initiated_contracts_count: number;
    load_status: 'Ready' | 'Sibuk';
    stats_this_month?: {
        pending: number;
        active: number;
        completed: number;
    };
}

interface WorkloadTabProps {
    data: {
        userWorkloads?: UserWorkload[];
        [key: string]: any;
    };
    onNavigate?: (view: string, params?: any) => void;
}

export function WorkloadTab({ data, onNavigate }: WorkloadTabProps) {
    const { auth } = usePage<any>().props;
    const loginUserRole = auth?.user?.role;
    const isAdmin = loginUserRole === 'Admin' || loginUserRole === 'Super Admin';

    const userWorkloads = data?.userWorkloads || [];

    const userGroupId = auth?.user?.company_group_id;
    const userLocationId = auth?.user?.location_id;
    const userDivisionId = auth?.user?.division_id;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [sortBy, setSortBy] = useState<'load' | 'name'>('load');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Scoped workloads based on permissions
    const scopedWorkloads = useMemo(() => {
        return userWorkloads.filter((user) => {
            if (!isAdmin && userDivisionId && user.division_id && user.division_id !== userDivisionId) {
                return false;
            }
            if (!isAdmin && userLocationId && user.location_id && user.location_id !== userLocationId) {
                return false;
            }
            if (!isAdmin && userGroupId && user.company_group_id && user.company_group_id !== userGroupId) {
                return false;
            }
            return true;
        });
    }, [userWorkloads, isAdmin, userDivisionId, userLocationId, userGroupId]);

    const handleSort = (column: 'load' | 'name') => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortOrder(column === 'name' ? 'asc' : 'desc');
        }
    };

    // Filtered & Sorted workloads
    const filteredWorkloads = useMemo(() => {
        const filtered = scopedWorkloads.filter((user) => {
            const userGroupName = user.company_group_name || user.org_group_name || user.company_name || '';

            return (
                user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                user.role.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (user.division_name && user.division_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
                (user.department_name && user.department_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
                (user.location_name && user.location_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
                userGroupName.toLowerCase().includes(debouncedSearch.toLowerCase())
            );
        });

        return filtered.sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            if (sortBy === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            if (sortBy === 'load') {
                valA = (a.stats_this_month?.active ?? a.active_contracts_count ?? 0) + (a.stats_this_month?.pending ?? a.pending_tasks_count ?? 0);
                valB = (b.stats_this_month?.active ?? b.active_contracts_count ?? 0) + (b.stats_this_month?.pending ?? b.pending_tasks_count ?? 0);
            }

            if (valA === valB) {
                return a.name.localeCompare(b.name);
            }

            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
    }, [scopedWorkloads, debouncedSearch, sortBy, sortOrder]);

    const selectedUser = useMemo(() => {
        if (!selectedUserId) return null;
        return scopedWorkloads.find((u) => u.id === selectedUserId) || null;
    }, [scopedWorkloads, selectedUserId]);

    const handleNavigate = (view: string, params?: any) => {
        if (onNavigate) {
            onNavigate(view, params);
        } else {
            router.get(`/contracts${view === 'pending' ? '/pending' : ''}`, params);
        }
    };

    return (
        <div className="animate-in fade-in duration-200 space-y-4">
            {/* Selected PIC Spotlight Banner (Clean & Subtle) */}
            {selectedUser && (
                <div className="rounded-lg border border-surface-border bg-surface-base p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-main font-semibold text-xs border border-surface-border">
                            {selectedUser.initials ?? selectedUser.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-text-main">{selectedUser.name}</h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-muted text-text-soft">
                                    <span
                                        className={cn(
                                            'h-1.5 w-1.5 rounded-full',
                                            selectedUser.load_status === 'Sibuk' ? 'bg-amber-500' : 'bg-emerald-500',
                                        )}
                                    />
                                    {selectedUser.load_status}
                                </span>
                            </div>
                            <p className="text-[11px] text-text-soft mt-0.5">
                                {selectedUser.position || selectedUser.role} • {selectedUser.division_name || selectedUser.department_name || 'Divisi -'}
                                {(selectedUser.company_group_name || selectedUser.org_group_name) ? ` • ${selectedUser.company_group_name || selectedUser.org_group_name}` : ''}
                                {selectedUser.location_name ? ` • ${selectedUser.location_name}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                        <div className="flex items-center gap-3 bg-surface-muted/50 px-3 py-1.5 rounded-md border border-surface-border text-xs">
                            <div>
                                <span className="text-[9.5px] uppercase font-medium text-text-soft block">Di Proses</span>
                                <span className="font-semibold text-text-main">
                                    {(selectedUser.stats_this_month?.active ?? selectedUser.active_contracts_count ?? 0) +
                                        (selectedUser.stats_this_month?.pending ?? selectedUser.pending_tasks_count ?? 0)}
                                </span>
                            </div>
                            <div className="h-4 w-px bg-surface-border" />
                            <div>
                                <span className="text-[9.5px] uppercase font-medium text-text-soft block">Arsip</span>
                                <span className="font-semibold text-text-main">{selectedUser.stats_this_month?.completed || 0}</span>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-medium flex items-center gap-1.5 h-8 border-surface-border"
                            onClick={() => handleNavigate('contracts', { search: selectedUser.name })}
                        >
                            <span>Lihat Kontrak</span>
                            <ExternalLink size={12} className="text-text-soft" />
                        </Button>

                        <button
                            type="button"
                            onClick={() => setSelectedUserId(null)}
                            className="h-8 w-8 flex items-center justify-center rounded-md border border-surface-border bg-surface-base text-text-soft hover:text-text-main transition-colors"
                            title="Tutup Sorotan"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header: Title + Search & Sort (No Top Tabs) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-text-soft" />
                    <span className="text-sm font-semibold text-text-main">Beban Kerja PIC</span>
                    <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[10.5px] font-medium bg-surface-muted text-text-soft">
                        {filteredWorkloads.length} Personil
                    </span>
                </div>

                {/* Search Input & Sort Options */}
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari PIC, divisi, grup..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 w-full rounded-md border border-surface-border bg-surface-base pl-7 pr-3 text-[11px] text-text-main placeholder:text-text-soft focus:outline-none focus:border-text-soft/60 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-soft hover:text-text-main text-[10px]"
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleSort('load')}
                            className={cn(
                                'h-8 px-2.5 rounded-md border text-[11px] font-medium transition-all cursor-pointer',
                                sortBy === 'load'
                                    ? 'border-surface-border bg-surface-muted text-text-main'
                                    : 'border-surface-border bg-surface-base text-text-soft hover:text-text-main',
                            )}
                            title="Urutkan beban"
                        >
                            Beban {sortBy === 'load' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSort('name')}
                            className={cn(
                                'h-8 px-2.5 rounded-md border text-[11px] font-medium transition-all cursor-pointer',
                                sortBy === 'name'
                                    ? 'border-surface-border bg-surface-muted text-text-main'
                                    : 'border-surface-border bg-surface-base text-text-soft hover:text-text-main',
                            )}
                            title="Urutkan nama"
                        >
                            Nama {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                    </div>
                </div>
            </div>

            {/* PIC Cards Grid */}
            {filteredWorkloads.length === 0 ? (
                <div className="py-16 text-center text-text-soft font-medium text-xs rounded-lg border border-dashed border-surface-border">
                    PIC tidak ditemukan
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredWorkloads.map((user) => {
                        const isBusy = user.load_status === 'Sibuk';
                        const isSelected = selectedUserId === user.id;

                        const pendingCount = user.stats_this_month?.pending ?? user.pending_tasks_count ?? 0;
                        const activeCount = user.stats_this_month?.active ?? user.active_contracts_count ?? 0;
                        const inProgressCount = pendingCount + activeCount;
                        const completedCount = user.stats_this_month?.completed ?? 0;

                        const userGroupName = user.company_group_name || user.org_group_name || user.company_name;

                        return (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                                className={cn(
                                    'p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-2.5',
                                    isSelected
                                        ? 'border-text-main bg-surface-muted/30 shadow-2xs'
                                        : 'border-surface-border bg-surface-base hover:border-text-soft/40 hover:bg-surface-muted/20',
                                )}
                            >
                                {/* Header Card PIC */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-main font-semibold text-[11px] border border-surface-border">
                                            {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-semibold text-text-main truncate" title={user.name}>
                                                {user.name}
                                            </h4>
                                            <p className="text-[10px] text-text-soft truncate" title={`${user.position || user.role} • ${user.division_name || user.department_name || 'Divisi -'}`}>
                                                {user.position || user.role} • {user.division_name || user.department_name || 'Divisi -'}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-surface-muted text-text-soft shrink-0">
                                        <span
                                            className={cn(
                                                'h-1.5 w-1.5 rounded-full',
                                                isBusy ? 'bg-amber-500' : 'bg-emerald-500',
                                            )}
                                        />
                                        {user.load_status || 'Ready'}
                                    </span>
                                </div>

                                {/* Group Organization Tag */}
                                {userGroupName && (
                                    <div className="flex items-center gap-1 text-[9.5px] text-text-soft bg-surface-muted/50 px-2 py-0.5 rounded border border-surface-border/50 w-fit">
                                        <Building2 size={10} className="shrink-0 text-text-soft" />
                                        <span className="truncate max-w-[180px]">{userGroupName}</span>
                                    </div>
                                )}

                                {/* Workload 2 Counters Grid: Di Proses & Arsip */}
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-border text-center">
                                    {/* Di Proses */}
                                    <div
                                        onClick={(e) => {
                                            if (inProgressCount > 0) {
                                                e.stopPropagation();
                                                handleNavigate('contracts', { pic_ids: [user.id], parent_tab: 'in_progress' });
                                            }
                                        }}
                                        className={cn(
                                            'p-1.5 rounded border border-surface-border/60 bg-surface-muted/40 transition-all',
                                            inProgressCount > 0 && 'hover:bg-surface-muted cursor-pointer',
                                        )}
                                        title={`Sedang Diproses: ${inProgressCount}`}
                                    >
                                        <span className="text-[8.5px] uppercase font-medium text-text-soft block">Di Proses</span>
                                        <span className="text-xs font-semibold text-text-main">{inProgressCount}</span>
                                    </div>

                                    {/* Arsip */}
                                    <div
                                        onClick={(e) => {
                                            if (completedCount > 0) {
                                                e.stopPropagation();
                                                handleNavigate('contracts', { search: user.name });
                                            }
                                        }}
                                        className={cn(
                                            'p-1.5 rounded border border-surface-border/60 bg-surface-muted/40 transition-all',
                                            completedCount > 0 && 'hover:bg-surface-muted cursor-pointer',
                                        )}
                                        title={`Selesai & Arsip: ${completedCount}`}
                                    >
                                        <span className="text-[8.5px] uppercase font-medium text-text-soft block">Arsip</span>
                                        <span className="text-xs font-semibold text-text-main">{completedCount}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
