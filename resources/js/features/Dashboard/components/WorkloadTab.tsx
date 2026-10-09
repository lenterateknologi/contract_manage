import { Button } from '@/components/ui/buttons/Button';
import { Skeleton } from '@/components/ui/feedback/Skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ExternalLink,
    Search,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export interface UserWorkload {
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

export interface WorkloadTabProps {
    data: {
        userWorkloads?: UserWorkload[];
        [key: string]: any;
    };
    onNavigate?: (view: string, params?: any) => void;
}

const PER_PAGE_OPTIONS = [12, 24, 48, 96];

const WorkloadCard = React.memo(function WorkloadCard({
    user,
    isSelected,
    onSelect,
    onNavigate,
}: {
    user: UserWorkload;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onNavigate: (view: string, params?: any) => void;
}) {
    const isBusy = user.load_status === 'Sibuk';
    const pendingCount = user.stats_this_month?.pending ?? user.pending_tasks_count ?? 0;
    const activeCount = user.stats_this_month?.active ?? user.active_contracts_count ?? 0;
    const inProgressCount = pendingCount + activeCount;
    const completedCount = user.stats_this_month?.completed ?? 0;
    const userGroupName = user.company_group_name || user.org_group_name || user.company_name;

    return (
        <div
            onClick={() => onSelect(user.id)}
            className={cn(
                'flex cursor-pointer flex-col justify-between gap-2.5 rounded-lg border p-3 transition-all duration-150',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-surface-border bg-surface-base hover:border-text-soft/40 hover:bg-surface-muted/20',
            )}
        >
            {/* Header Card PIC */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="bg-surface-muted text-text-main border-surface-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold select-none">
                        {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-text-main truncate text-xs font-semibold" title={user.name}>
                            {user.name}
                        </h4>
                        <p
                            className="text-text-soft truncate text-[10px]"
                            title={`${user.position || user.role} • ${user.division_name || user.department_name || 'Divisi -'}`}
                        >
                            {user.position || user.role} • {user.division_name || user.department_name || 'Divisi -'}
                        </p>
                    </div>
                </div>

                <span className="bg-surface-muted text-text-soft inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium">
                    <span className={cn('h-1.5 w-1.5 rounded-full', isBusy ? 'bg-amber-500' : 'bg-emerald-500')} />
                    {user.load_status || 'Ready'}
                </span>
            </div>

            {/* Group Organization Tag */}
            {userGroupName && (
                <div className="text-text-soft bg-surface-muted/50 border-surface-border/50 flex w-fit items-center gap-1 rounded border px-2 py-0.5 text-[9.5px]">
                    <Building2 size={10} className="text-text-soft shrink-0" />
                    <span className="max-w-[180px] truncate">{userGroupName}</span>
                </div>
            )}

            {/* Workload 2 Counters Grid: Di Proses & Arsip */}
            <div className="border-surface-border grid grid-cols-2 gap-2 border-t pt-1.5 text-center">
                {/* Di Proses */}
                <div
                    onClick={(e) => {
                        if (inProgressCount > 0) {
                            e.stopPropagation();
                            onNavigate('contracts', { pic_ids: [user.id], parent_tab: 'in_progress' });
                        }
                    }}
                    className={cn(
                        'border-surface-border/60 bg-surface-muted/40 rounded border p-1.5 transition-all',
                        inProgressCount > 0 && 'hover:bg-primary/10 hover:border-primary/40 cursor-pointer',
                    )}
                    title={`Sedang Diproses: ${inProgressCount}`}
                >
                    <span className="text-text-soft block text-[8.5px] font-medium uppercase">Di Proses</span>
                    <span className="text-text-main text-xs font-semibold">{inProgressCount}</span>
                </div>

                {/* Arsip */}
                <div
                    onClick={(e) => {
                        if (completedCount > 0) {
                            e.stopPropagation();
                            onNavigate('contracts', { search: user.name });
                        }
                    }}
                    className={cn(
                        'border-surface-border/60 bg-surface-muted/40 rounded border p-1.5 transition-all',
                        completedCount > 0 && 'hover:bg-primary/10 hover:border-primary/40 cursor-pointer',
                    )}
                    title={`Selesai & Arsip: ${completedCount}`}
                >
                    <span className="text-text-soft block text-[8.5px] font-medium uppercase">Arsip</span>
                    <span className="text-text-main text-xs font-semibold">{completedCount}</span>
                </div>
            </div>
        </div>
    );
});

function WorkloadSkeletonGrid({ count = 12 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="border-surface-border bg-surface-base space-y-3 rounded-lg border p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-3.5 w-28" />
                                <Skeleton className="h-2.5 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-12 rounded" />
                    </div>
                    <Skeleton className="h-4 w-32 rounded" />
                    <div className="border-surface-border grid grid-cols-2 gap-2 border-t pt-2">
                        <Skeleton className="h-9 rounded" />
                        <Skeleton className="h-9 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function WorkloadTab({ data, onNavigate }: WorkloadTabProps) {
    const userWorkloads = data?.userWorkloads;
    const isLoading = !userWorkloads;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 250);
    const [sortBy, setSortBy] = useState<'load' | 'name'>('load');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(12);

    const scopedWorkloads = useMemo(() => {
        return userWorkloads || [];
    }, [userWorkloads]);

    const handleSort = (column: 'load' | 'name') => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortOrder(column === 'name' ? 'asc' : 'desc');
        }
        setCurrentPage(1);
    };

    // Filtered & Sorted workloads
    const filteredWorkloads = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        const filtered = scopedWorkloads.filter((user) => {
            if (!query) return true;
            const userGroupName = user.company_group_name || user.org_group_name || user.company_name || '';
            return (
                user.name.toLowerCase().includes(query) ||
                user.role.toLowerCase().includes(query) ||
                (user.division_name && user.division_name.toLowerCase().includes(query)) ||
                (user.department_name && user.department_name.toLowerCase().includes(query)) ||
                (user.location_name && user.location_name.toLowerCase().includes(query)) ||
                userGroupName.toLowerCase().includes(query)
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

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    // Pagination calculations
    const totalItems = filteredWorkloads.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const fromIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * perPage;
    const toIndex = Math.min(fromIndex + perPage, totalItems);

    const paginatedWorkloads = useMemo(() => {
        return filteredWorkloads.slice(fromIndex, toIndex);
    }, [filteredWorkloads, fromIndex, toIndex]);

    const selectedUser = useMemo(() => {
        if (!selectedUserId) return null;
        return scopedWorkloads.find((u) => u.id === selectedUserId) || null;
    }, [scopedWorkloads, selectedUserId]);

    const handleNavigate = useCallback((view: string, params?: any) => {
        if (onNavigate) {
            onNavigate(view, params);
        } else {
            router.get(`/contracts${view === 'pending' ? '/pending' : ''}`, params);
        }
    }, [onNavigate]);

    const handleSelectUser = useCallback((id: string) => {
        setSelectedUserId((prev) => (prev === id ? null : id));
    }, []);

    // Pagination page numbers generator
    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        let start = Math.max(1, validCurrentPage - 2);
        const end = Math.min(totalPages, start + 4);

        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }, [validCurrentPage, totalPages]);

    return (
        <div className="animate-in fade-in space-y-4 duration-200">
            {/* Selected PIC Spotlight Banner */}
            {selectedUser && (
                <div className="border-surface-border bg-surface-base animate-in fade-in slide-in-from-top-2 flex flex-col items-start justify-between gap-3 rounded-lg border p-3.5 shadow-2xs duration-200 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-surface-muted text-text-main border-surface-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold select-none">
                            {selectedUser.initials ?? selectedUser.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-text-main text-sm font-semibold">{selectedUser.name}</h3>
                                <span className="bg-surface-muted text-text-soft inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium">
                                    <span
                                        className={cn(
                                            'h-1.5 w-1.5 rounded-full',
                                            selectedUser.load_status === 'Sibuk' ? 'bg-amber-500' : 'bg-emerald-500',
                                        )}
                                    />
                                    {selectedUser.load_status}
                                </span>
                            </div>
                            <p className="text-text-soft mt-0.5 text-[11px]">
                                {selectedUser.position || selectedUser.role} •{' '}
                                {selectedUser.division_name || selectedUser.department_name || 'Divisi -'}
                                {selectedUser.company_group_name || selectedUser.org_group_name
                                    ? ` • ${selectedUser.company_group_name || selectedUser.org_group_name}`
                                    : ''}
                                {selectedUser.location_name ? ` • ${selectedUser.location_name}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
                        <div className="bg-surface-muted/50 border-surface-border flex items-center gap-3 rounded-md border px-3 py-1.5 text-xs">
                            <div>
                                <span className="text-text-soft block text-[9.5px] font-medium uppercase">Di Proses</span>
                                <span className="text-text-main font-semibold">
                                    {(selectedUser.stats_this_month?.active ?? selectedUser.active_contracts_count ?? 0) +
                                        (selectedUser.stats_this_month?.pending ?? selectedUser.pending_tasks_count ?? 0)}
                                </span>
                            </div>
                            <div className="bg-surface-border h-4 w-px" />
                            <div>
                                <span className="text-text-soft block text-[9.5px] font-medium uppercase">Arsip</span>
                                <span className="text-text-main font-semibold">{selectedUser.stats_this_month?.completed || 0}</span>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            className="border-surface-border flex h-8 items-center gap-1.5 text-xs font-medium"
                            onClick={() => handleNavigate('contracts', { search: selectedUser.name })}
                        >
                            <span>Lihat Kontrak</span>
                            <ExternalLink size={12} className="text-text-soft" />
                        </Button>

                        <button
                            type="button"
                            onClick={() => setSelectedUserId(null)}
                            className="border-surface-border bg-surface-base text-text-soft hover:text-text-main flex h-8 w-8 items-center justify-center rounded-md border transition-colors cursor-pointer"
                            title="Tutup Sorotan"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header: Title + Search & Sort */}
            <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-text-soft" />
                    <span className="text-text-main text-sm font-semibold">Beban Kerja PIC</span>
                    <span className="bg-surface-muted text-text-soft inline-flex items-center justify-center rounded px-2 py-0.5 text-[10.5px] font-medium">
                        {totalItems} Personil
                    </span>
                </div>

                {/* Search Input & Sort Options */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search size={13} className="text-text-soft pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari PIC, divisi, grup..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-surface-border bg-surface-base text-text-main placeholder:text-text-soft focus:border-primary h-8 w-full rounded-md border pr-7 pl-7 text-[11px] transition-all focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-text-soft hover:text-text-main absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-0.5"
                                title="Hapus Pencarian"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => handleSort('load')}
                            className={cn(
                                'h-8 cursor-pointer rounded-md border px-2.5 text-[11px] font-medium transition-all select-none',
                                sortBy === 'load'
                                    ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-2xs'
                                    : 'border-surface-border bg-surface-base text-text-soft hover:text-text-main hover:bg-surface-muted/50',
                            )}
                            title="Urutkan berdasarkan beban kerja"
                        >
                            Beban {sortBy === 'load' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSort('name')}
                            className={cn(
                                'h-8 cursor-pointer rounded-md border px-2.5 text-[11px] font-medium transition-all select-none',
                                sortBy === 'name'
                                    ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-2xs'
                                    : 'border-surface-border bg-surface-base text-text-soft hover:text-text-main hover:bg-surface-muted/50',
                            )}
                            title="Urutkan berdasarkan nama"
                        >
                            Nama {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content: Loading Skeleton / Empty State / Grid of Cards */}
            {isLoading ? (
                <WorkloadSkeletonGrid count={perPage} />
            ) : totalItems === 0 ? (
                <div className="border-surface-border bg-surface-base flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                    <UserCheck size={28} className="text-text-soft/40 mb-2" />
                    <p className="text-text-main text-xs font-semibold uppercase">PIC Tidak Ditemukan</p>
                    <p className="text-text-soft mt-0.5 text-[11px]">
                        {searchQuery ? 'Tidak ada personil yang sesuai dengan kata kunci pencarian.' : 'Belum ada data beban kerja untuk filter saat ini.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {paginatedWorkloads.map((user) => (
                            <WorkloadCard
                                key={user.id}
                                user={user}
                                isSelected={selectedUserId === user.id}
                                onSelect={handleSelectUser}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </div>

                    {/* Pagination & Per-Page Controls */}
                    <div className="border-surface-border bg-surface-base/80 flex flex-col items-center justify-between gap-3 rounded-lg border px-4 py-3 sm:flex-row">
                        {/* Information & Per Page Selector */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-text-soft">
                            <span>
                                Menampilkan <strong className="text-text-main font-semibold">{fromIndex + 1}</strong> -{' '}
                                <strong className="text-text-main font-semibold">{toIndex}</strong> dari{' '}
                                <strong className="text-text-main font-semibold">{totalItems}</strong> personil
                            </span>
                            <span className="text-surface-border">|</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px]">Per Halaman:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="border-surface-border bg-surface-base text-text-main focus:border-primary h-7 rounded border px-2 text-xs font-semibold focus:outline-none"
                                >
                                    {PER_PAGE_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Pagination Navigation */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1 select-none">
                                {/* First Page */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={validCurrentPage === 1}
                                    title="Halaman Pertama"
                                    className="border-surface-border bg-surface-base text-text-soft hover:bg-surface-muted/50 hover:text-text-main flex h-7 w-7 items-center justify-center rounded border transition-colors disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronsLeft size={13} />
                                </button>

                                {/* Prev Page */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={validCurrentPage === 1}
                                    title="Halaman Sebelumnya"
                                    className="border-surface-border bg-surface-base text-text-soft hover:bg-surface-muted/50 hover:text-text-main flex h-7 w-7 items-center justify-center rounded border transition-colors disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronLeft size={13} />
                                </button>

                                {/* Numbered Pages */}
                                {pageNumbers.map((page) => {
                                    const isCurrent = page === validCurrentPage;
                                    return (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                'flex h-7 min-w-7 items-center justify-center rounded px-2 text-xs font-semibold transition-all cursor-pointer',
                                                isCurrent
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                                                    : 'border-surface-border bg-surface-base text-text-soft hover:bg-surface-muted/50 hover:text-text-main border',
                                            )}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                {/* Next Page */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={validCurrentPage === totalPages}
                                    title="Halaman Selanjutnya"
                                    className="border-surface-border bg-surface-base text-text-soft hover:bg-surface-muted/50 hover:text-text-main flex h-7 w-7 items-center justify-center rounded border transition-colors disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronRight size={13} />
                                </button>

                                {/* Last Page */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={validCurrentPage === totalPages}
                                    title="Halaman Terakhir"
                                    className="border-surface-border bg-surface-base text-text-soft hover:bg-surface-muted/50 hover:text-text-main flex h-7 w-7 items-center justify-center rounded border transition-colors disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronsRight size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkloadTab;
