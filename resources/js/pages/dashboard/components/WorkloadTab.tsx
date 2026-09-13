import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { ChipIcon } from '@/components/ui/feedback/ChipIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { Input } from '@/components/ui/inputs/Input';

import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ArrowUpRight,
    BarChart3,
    Briefcase,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    ExternalLink,
    Filter,
    Layers,
    RotateCcw,
    Search,
    User,
    UserCheck,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';

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
    company_group_id?: string | number | null;
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

interface CategoryTraffic {
    category_name: string;
    incoming_count: number;
    outgoing_count: number;
}

interface DepartmentWorkload {
    department: string;
    active_reviews: number;
    pending_approvals: number;
    total: number;
}

interface WorkloadTabProps {
    data: {
        userWorkloads?: UserWorkload[];
        categoryTraffic?: CategoryTraffic[];
        departmentWorkload?: DepartmentWorkload[];
        renewalCompletionRate?: number;
        contractTypeDistribution?: any[];
        [key: string]: any;
    };
    onNavigate?: (view: string, params?: any) => void;
}

export function WorkloadTab({ data, onNavigate }: WorkloadTabProps) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { auth } = usePage<any>().props;
    const loginUserRole = auth?.user?.role;
    const isAdmin = loginUserRole === 'Admin';

    const userWorkloads = data?.userWorkloads || [];
    const dailyTrend = data?.dailyTrend || [];
    const contractTypesLevel0 = data?.contractTypeDistribution || [];

    const userGroupId = auth?.user?.company_group_id;
    const userLocationId = auth?.user?.location_id;
    const userDivisionId = auth?.user?.division_id;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'sibuk'>('all');
    const [sortBy, setSortBy] = useState<'pending' | 'active' | 'completed' | 'total' | 'name'>('total');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogParent, setDialogParent] = useState<any>(null);
    const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
    const [datePreset, setDatePreset] = useState<'7d' | '14d' | 'this_month' | 'last_month' | 'custom'>('7d');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Scoped workloads based on role permissions
    const scopedWorkloads = useMemo(() => {
        return userWorkloads.filter((user) => {
            if (!isAdmin && userDivisionId && user.division_id !== userDivisionId) {
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

    const handleSort = (column: 'pending' | 'active' | 'completed' | 'total' | 'name') => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortOrder(column === 'name' ? 'asc' : 'desc');
        }
    };

    // Filtered & Sorted workloads based on search, status filter, and sorting
    const filteredWorkloads = useMemo(() => {
        const filtered = scopedWorkloads.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                user.role.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (user.division_name && user.division_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
                (user.department_name && user.department_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
                (user.location_name && user.location_name.toLowerCase().includes(debouncedSearch.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'ready' && user.load_status === 'Ready') ||
                (statusFilter === 'sibuk' && user.load_status === 'Sibuk');

            return matchesSearch && matchesStatus;
        });

        return filtered.sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            if (sortBy === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            if (sortBy === 'pending') {
                valA = a.stats_this_month?.pending ?? a.pending_tasks_count ?? 0;
                valB = b.stats_this_month?.pending ?? b.pending_tasks_count ?? 0;
            } else if (sortBy === 'active') {
                valA = a.stats_this_month?.active ?? a.active_contracts_count ?? 0;
                valB = b.stats_this_month?.active ?? b.active_contracts_count ?? 0;
            } else if (sortBy === 'completed') {
                valA = a.stats_this_month?.completed ?? 0;
                valB = b.stats_this_month?.completed ?? 0;
            } else if (sortBy === 'total') {
                valA = (a.stats_this_month?.active ?? a.active_contracts_count ?? 0) + (a.stats_this_month?.pending ?? a.pending_tasks_count ?? 0);
                valB = (b.stats_this_month?.active ?? b.active_contracts_count ?? 0) + (b.stats_this_month?.pending ?? b.pending_tasks_count ?? 0);
            }

            if (valA === valB) {
                return a.name.localeCompare(b.name);
            }

            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
    }, [scopedWorkloads, debouncedSearch, statusFilter, sortBy, sortOrder]);

    // KPI Metrics calculation
    const totalPics = scopedWorkloads.length;
    const readyPicsCount = scopedWorkloads.filter((u) => u.load_status === 'Ready').length;
    const busyPicsCount = scopedWorkloads.filter((u) => u.load_status === 'Sibuk').length;

    const totalPendingTasks = useMemo(() => {
        return scopedWorkloads.reduce((sum, u) => sum + (u.stats_this_month?.pending || 0), 0);
    }, [scopedWorkloads]);

    const totalCompletedTasks = useMemo(() => {
        return scopedWorkloads.reduce((sum, u) => sum + (u.stats_this_month?.completed || 0), 0);
    }, [scopedWorkloads]);

    const totalActiveTasks = useMemo(() => {
        return scopedWorkloads.reduce((sum, u) => sum + (u.stats_this_month?.active || 0), 0);
    }, [scopedWorkloads]);

    const totalAllTasks = totalPendingTasks + totalActiveTasks + totalCompletedTasks;
    const completionRate = totalAllTasks > 0 ? Math.round((totalCompletedTasks / totalAllTasks) * 100) : 100;

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

    // Sub-type Tree utilities
    const getDescendantIds = (node: any): string[] => {
        let ids = [node.id];
        if (node.children && node.children.length > 0) {
            node.children.forEach((child: any) => {
                ids = ids.concat(getDescendantIds(child));
            });
        }
        return ids;
    };

    const findNodeInTree = (nodes: any[], targetId: string): any => {
        for (const n of nodes) {
            if (n.id === targetId) return n;
            if (n.children && n.children.length > 0) {
                const found = findNodeInTree(n.children, targetId);
                if (found) return found;
            }
        }
        return null;
    };

    const activeParent = useMemo(() => {
        if (!selectedParentId) return null;
        return findNodeInTree(contractTypesLevel0, selectedParentId);
    }, [contractTypesLevel0, selectedParentId]);

    const activeChartCategories = useMemo(() => {
        if (activeParent) {
            return activeParent.children && activeParent.children.length > 0
                ? activeParent.children
                : [activeParent];
        }
        return contractTypesLevel0;
    }, [activeParent, contractTypesLevel0]);

    const chartLinesList = useMemo(() => {
        return activeChartCategories.map((cat: any) => ({
            id: cat.id,
            label: cat.label,
            descendantIds: getDescendantIds(cat),
        }));
    }, [activeChartCategories]);

    const filteredDailyTrend = useMemo(() => {
        if (!dailyTrend || dailyTrend.length === 0) return [];

        if (datePreset === '7d') {
            return dailyTrend.slice(-7);
        }
        if (datePreset === '14d') {
            return dailyTrend.slice(-14);
        }
        if (datePreset === 'this_month') {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const thisMonthKey = `${year}-${month}`;
            return dailyTrend.filter((item: any) => item.month_key === thisMonthKey || (item.raw_date && item.raw_date.startsWith(thisMonthKey)));
        }
        if (datePreset === 'last_month') {
            const now = new Date();
            now.setMonth(now.getMonth() - 1);
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const lastMonthKey = `${year}-${month}`;
            return dailyTrend.filter((item: any) => item.month_key === lastMonthKey || (item.raw_date && item.raw_date.startsWith(lastMonthKey)));
        }
        if (datePreset === 'custom') {
            if (!startDate && !endDate) return dailyTrend;
            return dailyTrend.filter((item: any) => {
                const rawDate = item.raw_date || item.date_key || item.date;
                if (!rawDate) return true;
                if (startDate && endDate) {
                    return rawDate >= startDate && rawDate <= endDate;
                }
                if (startDate) {
                    return rawDate >= startDate;
                }
                if (endDate) {
                    return rawDate <= endDate;
                }
                return true;
            });
        }
        return dailyTrend;
    }, [dailyTrend, datePreset, startDate, endDate]);

    const handleResetDateFilter = () => {
        setDatePreset('7d');
        setStartDate('');
        setEndDate('');
    };

    const aggregatedDailyTrend = useMemo(() => {
        return filteredDailyTrend.map((day: any) => {
            const point: any = {
                date: day.date,
                full_date: day.full_date,
            };
            chartLinesList.forEach((line: any) => {
                let sum = 0;
                line.descendantIds.forEach((id: any) => {
                    sum += day['type_' + id] || 0;
                });
                point[line.label] = sum;
            });
            return point;
        });
    }, [filteredDailyTrend, chartLinesList]);

    const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
            {/* Top Team Capacity KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* KPI 1: Total PIC */}
                <div
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                        'group flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-all shadow-none',
                        statusFilter === 'all'
                            ? 'border-primary bg-surface-base ring-1 ring-primary'
                            : 'border-surface-border bg-surface-base hover:bg-surface-muted',
                    )}
                >
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
                            Total Anggota PIC
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-text-main">{totalPics}</span>
                            <span className="text-[10px] font-medium text-text-soft">Personil</span>
                        </div>
                        <span className="text-[9.5px] text-text-soft">
                            {readyPicsCount} Ready • {busyPicsCount} Sibuk
                        </span>
                    </div>
                    <ChipIcon icon={Users} color="bg-primary text-primary-foreground" size="md" />
                </div>

                {/* KPI 2: PIC Sibuk */}
                <div
                    onClick={() => setStatusFilter(statusFilter === 'sibuk' ? 'all' : 'sibuk')}
                    className={cn(
                        'group flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-all shadow-none',
                        statusFilter === 'sibuk'
                            ? 'border-rose-600 bg-surface-base ring-1 ring-rose-600'
                            : 'border-surface-border bg-surface-base hover:bg-surface-muted',
                    )}
                >
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
                            PIC Sibuk / Overload
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-rose-600">{busyPicsCount}</span>
                            <span className="text-[10px] font-medium text-text-soft">Personil</span>
                        </div>
                        <span className="text-[9.5px] text-text-soft">
                            {statusFilter === 'sibuk' ? 'Klik untuk reset filter' : 'Klik untuk filter PIC sibuk'}
                        </span>
                    </div>
                    <ChipIcon icon={AlertTriangle} color="bg-rose-600 text-white" size="md" />
                </div>

                {/* KPI 3: Total Beban Pending */}
                <div
                    onClick={() => handleNavigate('pending')}
                    className="group flex cursor-pointer items-center justify-between rounded-lg border border-surface-border bg-surface-base p-3.5 transition-all hover:border-amber-500 hover:bg-surface-muted shadow-none"
                >
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
                            Tugas Menunggu Tim
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-amber-600">{totalPendingTasks}</span>
                            <span className="text-[10px] font-medium text-text-soft">Pengajuan</span>
                        </div>
                        <span className="text-[9.5px] font-semibold text-amber-600 flex items-center gap-1">
                            Buka Antrean Approval <ChevronRight size={11} />
                        </span>
                    </div>
                    <ChipIcon icon={Clock} color="bg-amber-600 text-white" size="md" />
                </div>

                {/* KPI 4: Rasio Penyelesaian */}
                <div
                    onClick={() => handleNavigate('contracts')}
                    className="group flex cursor-pointer items-center justify-between rounded-lg border border-surface-border bg-surface-base p-3.5 transition-all hover:border-emerald-600 hover:bg-surface-muted shadow-none"
                >
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
                            Penyelesaian Tim
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tracking-tight text-emerald-600">{completionRate}%</span>
                            <span className="text-[10px] font-medium text-text-soft">({totalCompletedTasks} Selesai)</span>
                        </div>
                        <span className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-1">
                            Lihat Semua Pengajuan <ChevronRight size={11} />
                        </span>
                    </div>
                    <ChipIcon icon={CheckCircle2} color="bg-emerald-600 text-white" size="md" />
                </div>
            </div>

            {/* Selected PIC Action Spotlight Card (Solid Clean Enterprise Style) */}
            {selectedUser && (
                <div className="rounded-lg border border-surface-border bg-surface-base p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-none animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                        <div
                            style={{
                                backgroundColor: selectedUser.bg_color || '#2563eb',
                                color: selectedUser.text_color || '#ffffff',
                            }}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-none tracking-wider"
                        >
                            {selectedUser.initials ?? selectedUser.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-text-main">{selectedUser.name}</h3>
                                <span
                                    className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                                        selectedUser.load_status === 'Sibuk'
                                            ? 'bg-rose-600 text-white'
                                             : 'bg-emerald-600 text-white',
                                    )}
                                >
                                    {selectedUser.load_status}
                                </span>
                            </div>
                            <p className="text-[10.5px] text-text-soft mt-0.5">
                                {selectedUser.position || selectedUser.role} • {selectedUser.division_name || selectedUser.department_name || 'Divisi -'}
                                {selectedUser.location_name ? ` • ${selectedUser.location_name}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                        <div className="flex items-center gap-3 bg-surface-muted px-3 py-1.5 rounded-md border border-surface-border text-xs">
                            <div>
                                <span className="text-[9px] font-bold uppercase text-text-soft block">Pending</span>
                                <span className="font-bold text-amber-600">{selectedUser.stats_this_month?.pending || 0}</span>
                            </div>
                            <div className="h-4 w-px bg-surface-border" />
                            <div>
                                <span className="text-[9px] font-bold uppercase text-text-soft block">Aktif</span>
                                <span className="font-bold text-primary">{selectedUser.stats_this_month?.active || 0}</span>
                            </div>
                            <div className="h-4 w-px bg-surface-border" />
                            <div>
                                <span className="text-[9px] font-bold uppercase text-text-soft block">Selesai</span>
                                <span className="font-bold text-emerald-600">{selectedUser.stats_this_month?.completed || 0}</span>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 h-8"
                            onClick={() => handleNavigate('contracts', { search: selectedUser.name })}
                        >
                            <span>Lihat Pengajuan PIC</span>
                            <ExternalLink size={12} />
                        </Button>

                        <button
                            type="button"
                            onClick={() => setSelectedUserId(null)}
                            className="h-8 w-8 flex items-center justify-center rounded-md border border-surface-border bg-surface-base text-text-soft hover:text-text-main transition-colors"
                            title="Tutup Sorotan PIC"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Workload Matrix: 2-Cols Chart & PIC List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Column 1-2: Charts & Hierarchy Tree */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Donut Chart: Distribusi Beban Pengajuan */}
                    <Card className="border border-surface-border bg-surface-base shadow-none">
                        <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0 border-b border-surface-border/60">
                            <div className="space-y-0.5">
                                <CardTitle className="text-xs font-bold text-text-main">
                                    {selectedUser ? `Distribusi Status Beban — ${selectedUser.name}` : 'Distribusi Beban Kerja per PIC'}
                                </CardTitle>
                                <p className="text-[9.5px] text-text-soft">
                                    {selectedUser
                                        ? `Rincian pembagian status pengajuan yang ditangani oleh ${selectedUser.name}`
                                        : 'Proporsi pembagian beban pengajuan aktif & pending antar anggota PIC'}
                                </p>
                            </div>
                            {selectedUserId && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedUserId(null)}
                                    className="text-[9px] font-bold text-primary hover:underline uppercase"
                                >
                                    Lihat Semua PIC
                                </button>
                            )}
                        </CardHeader>
                        <CardContent className="p-3.5">
                            {(() => {
                                const pieData = selectedUser
                                    ? [
                                          { name: 'Pending (Tunggu Tindakan)', value: selectedUser.stats_this_month?.pending || 0, color: '#d97706' },
                                          { name: 'Pengajuan Aktif', value: selectedUser.stats_this_month?.active || 0, color: '#2563eb' },
                                          { name: 'Pengajuan Selesai', value: selectedUser.stats_this_month?.completed || 0, color: '#059669' },
                                      ].filter((d) => d.value > 0)
                                    : filteredWorkloads
                                          .map((u) => ({
                                              id: u.id,
                                              name: u.name,
                                              role: u.role,
                                              position: u.position,
                                              division_name: u.division_name,
                                              load_status: u.load_status,
                                              pending: u.stats_this_month?.pending || 0,
                                              active: u.stats_this_month?.active || 0,
                                              completed: u.stats_this_month?.completed || 0,
                                              value: (u.stats_this_month?.active || 0) + (u.stats_this_month?.pending || 0),
                                              bg_color: u.bg_color,
                                              text_color: u.text_color,
                                              initials: u.initials,
                                          }))
                                          .filter((d) => d.value > 0);

                                const hasData = pieData.length > 0;
                                const displayData = hasData ? pieData : [{ name: 'Belum Ada Data', value: 1, color: 'rgba(156, 163, 175, 0.25)' }];
                                const totalWorkloadCount = hasData ? pieData.reduce((acc, curr) => acc + (curr.value || 0), 0) : 0;

                                // Sorted PICs for leader breakdown
                                const topPics = !selectedUser
                                    ? [...(pieData as any[])].sort((a, b) => b.value - a.value).slice(0, 3)
                                    : [];

                                return (
                                    <div className="flex flex-col sm:flex-row items-center gap-5">
                                        {/* Donut Chart Visual */}
                                        <div className="relative h-[180px] w-full sm:w-[190px] shrink-0 flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={displayData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={48}
                                                        outerRadius={72}
                                                        paddingAngle={hasData ? 2 : 0}
                                                        dataKey="value"
                                                    >
                                                        {displayData.map((entry: any, index: number) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    entry.color ||
                                                                    [
                                                                        '#2563eb',
                                                                        '#059669',
                                                                        '#d97706',
                                                                        '#7c3aed',
                                                                        '#db2777',
                                                                        '#0891b2',
                                                                        '#ea580c',
                                                                        '#0d9488',
                                                                    ][index % 8]
                                                                }
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        content={({ active, payload }: any) => {
                                                            if (active && payload && payload.length) {
                                                                const p = payload[0];
                                                                const percent = totalWorkloadCount > 0 ? Math.round((p.value / totalWorkloadCount) * 100) : 0;
                                                                return (
                                                                    <div className="rounded-lg border border-surface-border bg-surface-base p-2 shadow-none text-xs space-y-0.5">
                                                                        <p className="font-bold text-text-main">{p.name}</p>
                                                                        <p className="text-primary font-semibold">
                                                                            {hasData ? `${p.value} Pengajuan (${percent}%)` : '0 Pengajuan'}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>

                                            {/* Centered Total Count Overlay */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-base font-black leading-none text-text-main">
                                                    {totalWorkloadCount}
                                                </span>
                                                <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-text-soft mt-0.5">
                                                    {selectedUser ? 'Total Item' : 'Pengajuan Aktif'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Details & Breakdown Pane */}
                                        <div className="flex-1 w-full min-w-0 border-t sm:border-t-0 sm:border-l border-surface-border/60 sm:pl-4 pt-3 sm:pt-0 flex flex-col justify-center gap-2.5">
                                            {selectedUser ? (
                                                /* Breakdown Mode for Selected PIC */
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between pb-1 border-b border-surface-border/40">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
                                                            Rincian Beban ({selectedUser.name})
                                                        </span>
                                                        <span className="text-[9.5px] font-semibold text-text-main">
                                                            Rasio Selesai: {totalWorkloadCount > 0 ? Math.round(((selectedUser.stats_this_month?.completed || 0) / (totalWorkloadCount + (selectedUser.stats_this_month?.completed || 0) || 1)) * 100) : 100}%
                                                        </span>
                                                    </div>

                                                    {/* Progress Item: Pending */}
                                                    <div
                                                        onClick={() => {
                                                            if ((selectedUser.stats_this_month?.pending || 0) > 0) {
                                                                handleNavigate('pending', { search: selectedUser.name });
                                                            }
                                                        }}
                                                        className={cn(
                                                            'group space-y-1 p-1 -mx-1 rounded-md transition-colors',
                                                            (selectedUser.stats_this_month?.pending || 0) > 0 ? 'cursor-pointer hover:bg-surface-muted' : 'opacity-60 cursor-default',
                                                        )}
                                                        title={(selectedUser.stats_this_month?.pending || 0) > 0 ? `Klik untuk buka antrean persetujuan yang menunggu tindakan ${selectedUser.name}` : `Tidak ada tindakan pending`}
                                                    >
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="flex items-center gap-1.5 font-medium text-text-main group-hover:text-amber-600 transition-colors">
                                                                <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                                                                Pending (Tunggu Tindakan)
                                                                {(selectedUser.stats_this_month?.pending || 0) > 0 && <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />}
                                                            </span>
                                                            <span className="font-bold text-amber-600">
                                                                {selectedUser.stats_this_month?.pending || 0} Pengajuan
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full rounded-full bg-surface-muted/40 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-amber-600 transition-all duration-500"
                                                                style={{
                                                                    width: `${totalWorkloadCount > 0 ? Math.min(100, Math.round(((selectedUser.stats_this_month?.pending || 0) / totalWorkloadCount) * 100)) : 0}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Progress Item: Active */}
                                                    <div
                                                        onClick={() => {
                                                            if ((selectedUser.stats_this_month?.active || 0) > 0) {
                                                                handleNavigate('contracts', { pic_ids: [selectedUser.id], parent_tab: 'in_progress' });
                                                            }
                                                        }}
                                                        className={cn(
                                                            'group space-y-1 p-1 -mx-1 rounded-md transition-colors',
                                                            (selectedUser.stats_this_month?.active || 0) > 0 ? 'cursor-pointer hover:bg-surface-muted' : 'opacity-60 cursor-default',
                                                        )}
                                                        title={(selectedUser.stats_this_month?.active || 0) > 0 ? `Klik untuk buka daftar pengajuan berjalan yang ditangani PIC ${selectedUser.name}` : `Tidak ada pengajuan aktif sebagai PIC`}
                                                    >
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="flex items-center gap-1.5 font-medium text-text-main group-hover:text-primary transition-colors">
                                                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                                                Pengajuan Aktif / Berjalan
                                                                {(selectedUser.stats_this_month?.active || 0) > 0 && <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />}
                                                            </span>
                                                            <span className="font-bold text-primary">
                                                                {selectedUser.stats_this_month?.active || 0} Pengajuan
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full rounded-full bg-surface-muted/40 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-primary transition-all duration-500"
                                                                style={{
                                                                    width: `${totalWorkloadCount > 0 ? Math.min(100, Math.round(((selectedUser.stats_this_month?.active || 0) / totalWorkloadCount) * 100)) : 0}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Progress Item: Completed */}
                                                    <div
                                                        onClick={() => {
                                                            if ((selectedUser.stats_this_month?.completed || 0) > 0) {
                                                                handleNavigate('contracts', { search: selectedUser.name });
                                                            }
                                                        }}
                                                        className={cn(
                                                            'group space-y-1 p-1 -mx-1 rounded-md transition-colors',
                                                            (selectedUser.stats_this_month?.completed || 0) > 0 ? 'cursor-pointer hover:bg-surface-muted' : 'opacity-60 cursor-default',
                                                        )}
                                                        title={(selectedUser.stats_this_month?.completed || 0) > 0 ? `Klik untuk buka daftar pengajuan selesai yang ditangani ${selectedUser.name}` : `Tidak ada pengajuan selesai`}
                                                    >
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="flex items-center gap-1.5 font-medium text-text-main group-hover:text-emerald-600 transition-colors">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                                                                Pengajuan Selesai Bulan Ini
                                                                {(selectedUser.stats_this_month?.completed || 0) > 0 && <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />}
                                                            </span>
                                                            <span className="font-bold text-emerald-600">
                                                                {selectedUser.stats_this_month?.completed || 0} Pengajuan
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full rounded-full bg-surface-muted/40 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                                                                style={{
                                                                    width: `${totalWorkloadCount > 0 ? Math.min(100, Math.round(((selectedUser.stats_this_month?.completed || 0) / totalWorkloadCount) * 100)) : 0}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Team Mode: Top PICs Breakdown */
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between pb-1 border-b border-surface-border/40">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-soft">
                                                            PIC Beban Tertinggi
                                                        </span>
                                                        <span className="text-[9px] font-medium text-text-soft">
                                                            Rata-rata: {(totalWorkloadCount / (filteredWorkloads.length || 1)).toFixed(1)} pengajuan / PIC
                                                        </span>
                                                    </div>

                                                    {topPics.length === 0 ? (
                                                        <div className="py-4 text-center text-[10px] text-text-soft">
                                                            Belum ada data beban aktif
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {topPics.map((pic: any, idx: number) => {
                                                                const sharePct = totalWorkloadCount > 0 ? Math.round((pic.value / totalWorkloadCount) * 100) : 0;
                                                                const hash = (pic.name || pic.id || '').split('').reduce((acc: number, char: string) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
                                                                const hue = Math.abs(hash) % 360;
                                                                const fullColorStyle = pic.bg_color && pic.text_color
                                                                    ? { backgroundColor: pic.bg_color, color: pic.text_color }
                                                                    : { backgroundColor: `hsl(${hue}, 70%, 42%)`, color: '#ffffff' };

                                                                return (
                                                                    <div
                                                                        key={pic.id || idx}
                                                                        onClick={() => setSelectedUserId(pic.id)}
                                                                        className="group flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-surface-muted/40 cursor-pointer transition-colors border border-transparent hover:border-surface-border/60"
                                                                        title={`Klik untuk menyorot ${pic.name}`}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                            <div
                                                                                style={fullColorStyle}
                                                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold tracking-wider"
                                                                            >
                                                                                {pic.initials ?? pic.name.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="text-[10px] font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                                                                                        {pic.name}
                                                                                    </span>
                                                                                    <span
                                                                                        className={cn(
                                                                                            'text-[7px] font-bold px-1 rounded uppercase tracking-wider shrink-0',
                                                                                            pic.load_status === 'Sibuk'
                                                                                                ? 'bg-rose-600 text-white'
                                                                                                : 'bg-emerald-600 text-white',
                                                                                        )}
                                                                                    >
                                                                                        {pic.load_status}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="h-1 w-full rounded-full bg-surface-muted/50 mt-1 overflow-hidden">
                                                                                    <div
                                                                                        className="h-full rounded-full bg-primary"
                                                                                        style={{ width: `${sharePct}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                            <span className="text-[10px] font-bold text-text-main block">
                                                                                {pic.value} <span className="text-[8px] font-normal text-text-soft">({sharePct}%)</span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {/* Daily Trend Stepped Line Chart & Sub-type Selector Split */}
                    <Card className="border border-surface-border bg-surface-base shadow-none">
                        <CardHeader className="p-3.5 pb-2 flex flex-row flex-wrap items-center justify-between gap-2 border-b border-surface-border space-y-0">
                            <div>
                                <CardTitle className="text-xs font-bold text-text-main">
                                    Tren Pembuatan Pengajuan Harian {activeParent ? `(${activeParent.label})` : ''}
                                </CardTitle>
                                <p className="text-[9.5px] text-text-soft">
                                    {activeParent
                                        ? `Perkembangan volume sub-kategori di bawah ${activeParent.label}`
                                        : 'Perkembangan volume pembuatan pengajuan baru per kategori utama'}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {activeParent && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedParentId(null)}
                                        className="mr-1.5 text-[9px] font-bold uppercase tracking-wider text-primary hover:underline"
                                    >
                                        Tampilkan Semua Kategori
                                    </button>
                                )}

                                {/* Filter Presets & Custom Date Selector */}
                                <div className="flex items-center rounded-lg border border-surface-border bg-surface-muted/30 p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setDatePreset('7d')}
                                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition-all ${
                                            datePreset === '7d'
                                                ? 'bg-primary text-primary-foreground shadow-none'
                                                : 'text-text-soft hover:text-text-main'
                                        }`}
                                    >
                                        7 Hari
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDatePreset('14d')}
                                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition-all ${
                                            datePreset === '14d'
                                                ? 'bg-primary text-primary-foreground shadow-none'
                                                : 'text-text-soft hover:text-text-main'
                                        }`}
                                    >
                                        14 Hari
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDatePreset('this_month')}
                                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition-all ${
                                            datePreset === 'this_month'
                                                ? 'bg-primary text-primary-foreground shadow-none'
                                                : 'text-text-soft hover:text-text-main'
                                        }`}
                                    >
                                        Bulan Ini
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDatePreset('last_month')}
                                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition-all ${
                                            datePreset === 'last_month'
                                                ? 'bg-primary text-primary-foreground shadow-none'
                                                : 'text-text-soft hover:text-text-main'
                                        }`}
                                    >
                                        Bulan Lalu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDatePreset('custom')}
                                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition-all ${
                                            datePreset === 'custom'
                                                ? 'bg-primary text-primary-foreground shadow-none'
                                                : 'text-text-soft hover:text-text-main'
                                        }`}
                                    >
                                        <Calendar size={10} /> Kustom
                                    </button>
                                </div>

                                {/* Custom Date Range Inputs */}
                                {datePreset === 'custom' && (
                                    <div className="animate-in fade-in slide-in-from-right-2 flex items-center gap-1 duration-200">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-6.5 rounded-md border border-surface-border bg-surface-base px-1.5 text-[9px] font-bold text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        />
                                        <span className="text-[9px] font-bold text-text-soft">s/d</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-6.5 rounded-md border border-surface-border bg-surface-base px-1.5 text-[9px] font-bold text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        />
                                        {(startDate || endDate) && (
                                            <button
                                                type="button"
                                                onClick={handleResetDateFilter}
                                                className="flex h-6.5 w-6.5 items-center justify-center rounded-md border border-surface-border bg-surface-base text-text-soft hover:text-rose-500 transition-colors"
                                                title="Reset Filter Tanggal"
                                            >
                                                <RotateCcw size={11} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        {/* Split: Sub-tipe Tree & Line Chart */}
                        <div className="flex flex-col md:flex-row gap-3 items-stretch p-3.5 pt-0">
                            {/* Sub-tipe Tree Panel */}
                            <div className="w-full md:w-64 min-w-[180px] max-w-[450px] overflow-auto border-r border-surface-border/40 pr-3.5 pl-1 space-y-2.5 max-h-[430px] shrink-0">
                                <div className="flex items-center justify-between pt-1">
                                    <h4 className="text-[9.5px] font-bold uppercase tracking-wider text-text-soft">
                                        Hierarki Sub-Tipe
                                    </h4>
                                    {selectedParentId && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedParentId(null)}
                                            className="text-[8.5px] font-bold text-primary hover:underline uppercase"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1.5 pr-1">
                                    {(() => {
                                        const topLevelParent = contractTypesLevel0.find((p: any) => {
                                            if (p.id === selectedParentId) return true;
                                            const sub = findNodeInTree(p.children || [], selectedParentId || '');
                                            return !!sub;
                                        });

                                        const treeNodes = topLevelParent
                                            ? topLevelParent.children || []
                                            : contractTypesLevel0;

                                        if (!treeNodes || treeNodes.length === 0) {
                                            return <div className="text-[9px] text-text-soft py-4 text-center">Tidak ada sub-tipe</div>;
                                        }

                                        return treeNodes.map((node: any, idx: number) => {
                                            const color = CHART_COLORS[idx % CHART_COLORS.length];
                                            const isSelected = selectedParentId === node.id;
                                            const hasChildren = node.children && node.children.length > 0;
                                            const isExpanded = expandedChildId === node.id;

                                            return (
                                                <div key={node.id || idx} className="space-y-1">
                                                    <div
                                                        className={cn(
                                                            'flex items-center justify-between gap-1.5 p-2 rounded-lg border text-left cursor-pointer transition-all select-none',
                                                            isSelected
                                                                ? 'border-primary bg-surface-muted font-bold shadow-none'
                                                                : 'border-surface-border bg-surface-base hover:bg-surface-muted',
                                                        )}
                                                        onClick={() => {
                                                            setSelectedParentId(isSelected ? (activeParent ? activeParent.id : null) : node.id);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            {hasChildren && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedChildId(isExpanded ? null : node.id);
                                                                    }}
                                                                    className="p-0.5 text-text-soft hover:text-text-main transition-transform shrink-0"
                                                                    title="Expand/Collapse Sub-tipe"
                                                                >
                                                                    <ChevronDown
                                                                        size={11}
                                                                        className={cn('transition-transform duration-200', isExpanded ? '' : '-rotate-90')}
                                                                    />
                                                                </button>
                                                            )}
                                                            <div
                                                                className="w-4 h-4 rounded-full shrink-0 shadow-none flex items-center justify-center text-white"
                                                                style={{ backgroundColor: color }}
                                                            >
                                                                <Layers size={9} strokeWidth={2.5} />
                                                            </div>
                                                            <span className="text-[10px] font-semibold text-text-main leading-tight truncate" title={node.label}>
                                                                {node.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className="text-[9px] font-bold text-text-soft">
                                                                {node.count || 0}
                                                            </span>
                                                            {hasChildren && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDialogParent(node);
                                                                        setIsDialogOpen(true);
                                                                    }}
                                                                    className="flex h-5 w-5 items-center justify-center text-primary hover:text-primary-foreground bg-surface-muted hover:bg-primary rounded-md transition-all shadow-none"
                                                                    title="Lihat Detail Sub-tipe"
                                                                >
                                                                    <Layers size={10} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Nested Level 3 Children Tree Nodes */}
                                                    {isExpanded && hasChildren && (
                                                        <div className="pl-3.5 space-y-1 border-l border-surface-border ml-2.5 animate-in slide-in-from-top-1 duration-150">
                                                            {node.children.map((subChild: any, sIdx: number) => {
                                                                const childColor = CHART_COLORS[(idx + sIdx + 1) % CHART_COLORS.length];
                                                                return (
                                                                    <div
                                                                        key={subChild.id || sIdx}
                                                                        className="flex items-center justify-between gap-1.5 p-1.5 rounded-md border border-surface-border bg-surface-muted text-left select-none text-[9px]"
                                                                    >
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <div
                                                                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-none flex items-center justify-center text-white"
                                                                                style={{ backgroundColor: childColor }}
                                                                            >
                                                                                <Layers size={8} strokeWidth={2.5} />
                                                                            </div>
                                                                            <span className="text-text-main font-medium truncate" title={subChild.label}>
                                                                                {subChild.label}
                                                                            </span>
                                                                        </div>
                                                                        <span className="font-bold text-text-soft shrink-0">
                                                                            {subChild.count || 0}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Line Chart Panel */}
                            <div className="flex-1 min-w-0 h-[430px] p-2">
                                {aggregatedDailyTrend.length === 0 ? (
                                    <div className="text-center py-12 text-xs text-muted-foreground uppercase animate-in fade-in duration-300">Tidak ada data tren harian</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={aggregatedDailyTrend} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#888888"
                                                fontSize={9.5}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={9.5}
                                                tickLine={false}
                                                axisLine={false}
                                                allowDecimals={false}
                                            />
                                            <RechartsTooltip
                                                content={({ active, payload }: any) => {
                                                    if (active && payload && payload.length) {
                                                        const item = payload[0].payload;
                                                        const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
                                                        return (
                                                            <div className="rounded-lg border border-surface-border bg-surface-base p-2 shadow-none text-xs space-y-1 min-w-[140px]">
                                                                <p className="font-bold text-text-main">{item.full_date}</p>
                                                                <div className="space-y-0.5 border-t border-surface-border pt-1">
                                                                    {payload.map((p: any, idx: number) => {
                                                                        if (p.value === 0) return null;
                                                                        return (
                                                                            <div key={idx} className="flex justify-between items-center gap-3">
                                                                                <span className="text-text-soft flex items-center gap-1 text-[10px]">
                                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                                                    {p.name}
                                                                                </span>
                                                                                <span className="font-bold text-text-main text-[10px]">{p.value} Pengajuan</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    <div className="border-t border-surface-border pt-1 mt-0.5 flex justify-between font-bold text-text-main text-[10.5px]">
                                                                        <span>Total</span>
                                                                        <span>{total} Pengajuan</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            {chartLinesList.map((line: any, idx: number) => {
                                                const strokeColor = CHART_COLORS[idx % CHART_COLORS.length];
                                                return (
                                                    <Line
                                                        key={line.label}
                                                        type="linear"
                                                        dataKey={line.label}
                                                        name={line.label}
                                                        stroke={strokeColor}
                                                        strokeWidth={2}
                                                        dot={(props: any) => {
                                                            const { cx, cy, index, dataKey } = props;
                                                            const isLast = index === aggregatedDailyTrend.length - 1;
                                                            if (isLast) {
                                                                return (
                                                                    <g key={`last-dot-${dataKey}-${index}`}>
                                                                        <circle cx={cx} cy={cy} r={7} fill={strokeColor} stroke="#fff" strokeWidth={1.5} />
                                                                        <circle cx={cx} cy={cy} r={2} fill="#fff" />
                                                                    </g>
                                                                );
                                                            }
                                                            return <circle key={`dot-${dataKey}-${index}`} cx={cx} cy={cy} r={2} fill="#fff" stroke={strokeColor} strokeWidth={1} />;
                                                        }}
                                                        activeDot={{ r: 3.5 }}
                                                    />
                                                );
                                            })}
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Column 3: PIC Workload Table with 1-Click Filters */}
                <div className="space-y-4">
                    <Card className="w-full border border-surface-border bg-surface-base shadow-none flex flex-col overflow-hidden max-h-[820px]">
                        <CardHeader className="p-3.5 pb-2 flex flex-col space-y-2 border-b border-surface-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-xs font-bold text-text-main">
                                        Beban Kerja PIC
                                    </CardTitle>
                                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] font-bold text-primary">
                                        {filteredWorkloads.length} PIC
                                    </span>
                                </div>
                                {(searchQuery || statusFilter !== 'all' || selectedUserId) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setStatusFilter('all');
                                            setSelectedUserId(null);
                                        }}
                                        className="text-[9px] font-bold text-rose-500 hover:underline uppercase transition-all"
                                    >
                                        Reset Filter
                                    </button>
                                )}
                            </div>

                            {/* 1-Click Status Quick Filter Pills */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className={cn(
                                        'px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all',
                                        statusFilter === 'all'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-surface-muted text-text-soft hover:text-text-main',
                                    )}
                                >
                                    Semua ({totalPics})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('ready')}
                                    className={cn(
                                        'px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all',
                                        statusFilter === 'ready'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-surface-muted text-text-soft hover:text-emerald-600',
                                    )}
                                >
                                    Ready ({readyPicsCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('sibuk')}
                                    className={cn(
                                        'px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all',
                                        statusFilter === 'sibuk'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-surface-muted text-text-soft hover:text-rose-600',
                                    )}
                                >
                                    Sibuk ({busyPicsCount})
                                </button>
                            </div>

                            {/* Quick Search */}
                            <div className="relative pt-0.5">
                                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, role, divisi PIC..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-7 w-full rounded-md border border-surface-border bg-surface-base pl-7 pr-3 text-[10px] text-text-main placeholder:text-text-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
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
                        </CardHeader>

                        <CardContent className="p-0 overflow-y-auto flex-1">
                            <table className="w-full table-fixed border-collapse text-left text-xs">
                                <colgroup>
                                    <col className="w-[49%]" />
                                    <col className="w-[17%]" />
                                    <col className="w-[17%]" />
                                    <col className="w-[17%]" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-surface-border bg-surface-muted text-[8.5px] font-bold uppercase tracking-wider text-text-soft sticky top-0 bg-surface-base z-10 select-none">
                                        <th
                                            onClick={() => handleSort('name')}
                                            className="px-2.5 py-2 cursor-pointer hover:bg-surface-muted/80 transition-colors"
                                            title="Klik untuk urutkan berdasarkan Nama PIC"
                                        >
                                            <div className="flex items-center gap-1">
                                                <span>PIC / Pengguna</span>
                                                {sortBy === 'name' ? (
                                                    sortOrder === 'asc' ? <ArrowUp size={10} className="text-primary" /> : <ArrowDown size={10} className="text-primary" />
                                                ) : (
                                                    <ArrowUpDown size={9} className="opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('pending')}
                                            className="px-1 py-2 text-center cursor-pointer hover:bg-surface-muted/80 transition-colors"
                                            title="Tugas persetujuan yang menunggu tindakan user ini (Klik untuk urutkan)"
                                        >
                                            <div className="flex items-center justify-center gap-0.5 text-amber-600">
                                                <span>Tindakan</span>
                                                {sortBy === 'pending' ? (
                                                    sortOrder === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                                                ) : (
                                                    <ArrowUpDown size={8} className="opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('active')}
                                            className="px-1 py-2 text-center cursor-pointer hover:bg-surface-muted/80 transition-colors"
                                            title="Pengajuan berjalan / sedang diproses yang ditangani PIC ini (Klik untuk urutkan)"
                                        >
                                            <div className="flex items-center justify-center gap-0.5 text-primary">
                                                <span>Proses</span>
                                                {sortBy === 'active' ? (
                                                    sortOrder === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                                                ) : (
                                                    <ArrowUpDown size={8} className="opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('completed')}
                                            className="px-1 py-2 text-center cursor-pointer hover:bg-surface-muted/80 transition-colors"
                                            title="Pengajuan / approval yang telah selesai (Klik untuk urutkan)"
                                        >
                                            <div className="flex items-center justify-center gap-0.5 text-emerald-600">
                                                <span>Selesai</span>
                                                {sortBy === 'completed' ? (
                                                    sortOrder === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                                                ) : (
                                                    <ArrowUpDown size={8} className="opacity-40" />
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {filteredWorkloads.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-2.5 py-10 text-center text-text-soft font-medium uppercase text-xs">
                                                PIC tidak ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredWorkloads.map((user) => {
                                            const isBusy = user.load_status === 'Sibuk';
                                            const isSelected = selectedUserId === user.id;

                                            const pendingCount = user.stats_this_month?.pending ?? user.pending_tasks_count ?? 0;
                                            const activeCount = user.stats_this_month?.active ?? user.active_contracts_count ?? 0;
                                            const completedCount = user.stats_this_month?.completed ?? 0;

                                            const hash = (user.name || user.id || '').split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
                                            const hue = Math.abs(hash) % 360;
                                            const fullColorStyle = user.bg_color && user.text_color
                                                ? { backgroundColor: user.bg_color, color: user.text_color }
                                                : { backgroundColor: `hsl(${hue}, 70%, 42%)`, color: '#ffffff' };

                                            return (
                                                <tr
                                                    key={user.id}
                                                    onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                                                    className={cn(
                                                        'cursor-pointer transition-colors',
                                                        isSelected ? 'bg-surface-muted font-bold' : 'hover:bg-surface-muted',
                                                    )}
                                                    title="Klik untuk menyorot dan melihat detail distribusi PIC ini"
                                                >
                                                    <td className="px-2.5 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                style={fullColorStyle}
                                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold shadow-none tracking-wider"
                                                            >
                                                                {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-text-main font-semibold leading-snug text-[10px] truncate" title={user.name}>
                                                                        {user.name}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            'inline-flex items-center px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider shrink-0',
                                                                            isBusy
                                                                                ? 'bg-rose-600 text-white'
                                                                                : 'bg-emerald-600 text-white',
                                                                        )}
                                                                    >
                                                                        {user.load_status || 'Ready'}
                                                                    </span>
                                                                </div>
                                                                <span
                                                                    className="text-text-soft block text-[7.5px] font-bold uppercase tracking-wider truncate"
                                                                    title={`${user.position || user.role} • ${user.division_name || user.department_name || 'Divisi -'}${user.location_name ? ` • ${user.location_name}` : ''}`}
                                                                >
                                                                    {user.position || user.role} • {user.division_name || user.department_name || 'Divisi -'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Perlu Tindakan (Pending Approval) */}
                                                    <td
                                                        onClick={(e) => {
                                                            if (pendingCount > 0) {
                                                                e.stopPropagation();
                                                                handleNavigate('pending', { search: user.name });
                                                            }
                                                        }}
                                                        className={cn(
                                                            'px-1 py-2.5 text-center whitespace-nowrap text-[10px] font-bold transition-all',
                                                            pendingCount > 0 && 'hover:bg-amber-500/10 cursor-pointer',
                                                        )}
                                                        title={pendingCount > 0 ? `Klik untuk buka ${pendingCount} antrean persetujuan ${user.name}` : `Perlu Tindakan: 0 pengajuan`}
                                                    >
                                                        <span
                                                            className={cn(
                                                                pendingCount > 0 ? 'text-amber-600 font-extrabold underline-offset-2 hover:underline' : 'text-text-soft/60 font-medium',
                                                            )}
                                                        >
                                                            {pendingCount}
                                                        </span>
                                                    </td>
                                                    {/* Sedang Berjalan (PIC Active Contracts) */}
                                                    <td
                                                        onClick={(e) => {
                                                            if (activeCount > 0) {
                                                                e.stopPropagation();
                                                                handleNavigate('contracts', { pic_ids: [user.id], parent_tab: 'in_progress' });
                                                            }
                                                        }}
                                                        className={cn(
                                                            'px-1 py-2.5 text-center whitespace-nowrap text-[10px] font-bold transition-all',
                                                            activeCount > 0 && 'hover:bg-primary/10 cursor-pointer',
                                                        )}
                                                        title={activeCount > 0 ? `Klik untuk buka ${activeCount} pengajuan berjalan ${user.name}` : `Sedang Diproses (PIC): 0 pengajuan`}
                                                    >
                                                        <span
                                                            className={cn(
                                                                activeCount > 0 ? 'text-primary font-extrabold underline-offset-2 hover:underline' : 'text-text-soft/60 font-medium',
                                                            )}
                                                        >
                                                            {activeCount}
                                                        </span>
                                                    </td>
                                                    {/* Selesai (Completed) */}
                                                    <td
                                                        onClick={(e) => {
                                                            if (completedCount > 0) {
                                                                e.stopPropagation();
                                                                handleNavigate('contracts', { search: user.name });
                                                            }
                                                        }}
                                                        className={cn(
                                                            'px-1 py-2.5 text-center whitespace-nowrap text-[10px] font-bold transition-all',
                                                            completedCount > 0 && 'hover:bg-emerald-500/10 cursor-pointer',
                                                        )}
                                                        title={completedCount > 0 ? `Klik untuk buka ${completedCount} pengajuan selesai ${user.name}` : `Selesai: 0 pengajuan`}
                                                    >
                                                        <span
                                                            className={cn(
                                                                completedCount > 0 ? 'text-emerald-600 font-extrabold underline-offset-2 hover:underline' : 'text-text-soft/60 font-medium',
                                                            )}
                                                        >
                                                            {completedCount}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Subcategories Dialog */}
            {isDialogOpen && dialogParent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-surface-base border border-surface-border rounded-lg shadow-none w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start border-b border-surface-border pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-text-main">Sub-kategori {dialogParent.label}</h4>
                                <p className="text-[10px] text-text-soft">Rincian pengajuan (klik sub-kategori untuk melihat level ke-3 & filter grafik)</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setExpandedChildId(null);
                                }}
                                className="text-text-soft hover:text-text-main text-xs font-bold"
                            >
                                Tutup
                            </button>
                        </div>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {dialogParent.children && dialogParent.children.length > 0 ? (
                                dialogParent.children.map((child: any, idx: number) => {
                                    const hasSubChildren = child.children && child.children.length > 0;
                                    const isExpanded = expandedChildId === child.id;

                                    return (
                                        <div key={child.id || idx} className="border border-surface-border rounded-lg overflow-hidden bg-surface-muted/10">
                                            <div
                                                onClick={() => {
                                                    if (hasSubChildren) {
                                                        setExpandedChildId(isExpanded ? null : child.id);
                                                        setSelectedParentId(isExpanded ? dialogParent.id : child.id);
                                                    } else {
                                                        setSelectedParentId(child.id);
                                                    }
                                                }}
                                                className="flex justify-between items-center p-2.5 bg-surface-muted/30 transition-all select-none cursor-pointer hover:bg-surface-muted/50"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {hasSubChildren && (
                                                        <ChevronDown
                                                            size={12}
                                                            className={cn('text-text-soft transition-transform duration-200', isExpanded ? '' : '-rotate-90')}
                                                        />
                                                    )}
                                                    <span className="text-xs font-semibold text-text-main">{child.label}</span>
                                                </div>
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                                                    {child.count || 0} Pengajuan
                                                </span>
                                            </div>

                                            {/* Level 2 Sub-children */}
                                            {isExpanded && hasSubChildren && (
                                                <div className="bg-surface-base border-t border-surface-border p-2 space-y-1.5 pl-6 animate-in slide-in-from-top-1 duration-150">
                                                    {child.children.map((subChild: any, sIdx: number) => (
                                                        <div key={subChild.id || sIdx} className="flex justify-between items-center text-[10.5px] p-1.5 hover:bg-surface-muted/20 rounded">
                                                            <span className="text-text-soft">{subChild.label}</span>
                                                            <span className="font-semibold text-text-main">{subChild.count || 0} Pengajuan</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 text-xs text-text-soft uppercase">Tidak ada sub-kategori</div>
                            )}
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setExpandedChildId(null);
                                }}
                                className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

