import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { Input } from '@/components/ui/inputs/Input';

import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Briefcase, Calendar, ChevronDown, Clock, Filter, Layers, RotateCcw, Search, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { MetricItem } from './MetricItem';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

function MiniPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
    const PIE_COLORS = ['rgba(255,255,255,1)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.25)'];
    return (
        <div className="h-[48px] w-[48px] shrink-0 select-none">
            <PieChart width={48} height={48}>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={8}
                    outerRadius={20}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                </Pie>
                <RechartsTooltip
                    content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded border border-black/5 bg-white p-1 text-[8px] font-bold text-slate-800 shadow-md">
                                    <p className="uppercase">{payload[0].name}</p>
                                    <p className="text-primary">{payload[0].value}</p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
            </PieChart>
        </div>
    );
}

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
}

export function WorkloadTab({ data }: WorkloadTabProps) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { auth, companyGroups = [], locations = [], divisions = [] } = usePage<any>().props;
    const loginUserRole = auth?.user?.role;
    const isAdmin = loginUserRole === 'Admin';

    const userWorkloads = data?.userWorkloads || [];
    const categoryTraffic = data?.categoryTraffic || [];
    const departmentWorkload = data?.departmentWorkload || [];
    const monthlyTrend = data?.monthlyTrend || [];
    const dailyTrend = data?.dailyTrend || [];
    const renewalCompletionRate = data?.renewalCompletionRate ?? 0;

    const userGroupId = auth?.user?.company_group_id;
    const userLocationId = auth?.user?.location_id;
    const userDivisionId = auth?.user?.division_id;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'sibuk'>('all');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogParent, setDialogParent] = useState<any>(null);
    const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
    const [datePreset, setDatePreset] = useState<'7d' | '14d' | 'this_month' | 'last_month' | 'custom'>('7d');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const statusOptions = useMemo(() => [
        { value: 'all', label: 'Semua Status' },
        { value: 'ready', label: 'Ready' },
        { value: 'sibuk', label: 'Sibuk' },
    ], []);

    const filteredWorkloads = useMemo(() => {
        return userWorkloads.filter((user) => {
            // Otomatis hardcode filter: jika non-admin dan user memiliki division_id, batasi ke division yang sama
            if (!isAdmin && userDivisionId && user.division_id !== userDivisionId) {
                return false;
            }
            if (!isAdmin && userLocationId && user.location_id && user.location_id !== userLocationId) {
                return false;
            }
            if (!isAdmin && userGroupId && user.company_group_id && user.company_group_id !== userGroupId) {
                return false;
            }

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
    }, [userWorkloads, isAdmin, userDivisionId, userLocationId, userGroupId, debouncedSearch, statusFilter]);

    const selectedUser = useMemo(() => {
        if (!selectedUserId) return null;
        return userWorkloads.find((u) => u.id === selectedUserId) || null;
    }, [userWorkloads, selectedUserId]);

    const totalPendingThisMonth = useMemo(() => {
        return userWorkloads.reduce((sum, u) => sum + (u.stats_this_month?.pending || 0), 0);
    }, [userWorkloads]);

    const totalActiveThisMonth = useMemo(() => {
        return userWorkloads.reduce((sum, u) => sum + (u.stats_this_month?.active || 0), 0);
    }, [userWorkloads]);

    const totalCompletedThisMonth = useMemo(() => {
        return userWorkloads.reduce((sum, u) => sum + (u.stats_this_month?.completed || 0), 0);
    }, [userWorkloads]);

    const totalInProcessThisMonth = useMemo(() => {
        return totalPendingThisMonth + totalActiveThisMonth;
    }, [totalPendingThisMonth, totalActiveThisMonth]);

    const contractTypesLevel0 = data?.contractTypeDistribution || [];

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
            descendantIds: getDescendantIds(cat)
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
                    sum += (day['type_' + id] || 0);
                });
                point[line.label] = sum;
            });
            return point;
        });
    }, [filteredDailyTrend, chartLinesList]);

    const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1-2: Donut Chart PIC & Kategori Kontrak (Contract Types) - Takes 2 of 3 columns */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Donut Chart: Distribusi Kontrak Aktif per PIC */}
                    <Card className="border border-surface-border/60 bg-white dark:bg-zinc-900/50 shadow-xs">
                        <CardHeader className="p-3.5 pb-0 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                                <CardTitle className="text-xs font-bold text-text-main">
                                    {selectedUser ? `Distribusi Status Kontrak — ${selectedUser.name}` : 'Distribusi Kontrak Aktif per PIC'}
                                </CardTitle>
                                <p className="text-[9.5px] text-text-soft">
                                    {selectedUser 
                                        ? `Rincian status kontrak yang ditangani oleh ${selectedUser.name}` 
                                        : 'Proporsi pembagian beban kontrak aktif & pending antar anggota PIC'}
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
                        <CardContent className="p-3.5 pt-2">
                            <div className="h-[180px] w-full flex items-center justify-center">
                                {(() => {
                                    const pieData = selectedUser
                                        ? [
                                              { name: 'Pending (Tunggu Approval)', value: selectedUser.stats_this_month?.pending || 0, color: '#f59e0b' },
                                              { name: 'Kontrak Selesai', value: selectedUser.stats_this_month?.completed || 0, color: '#10b981' },
                                          ].filter((d) => d.value > 0)
                                        : filteredWorkloads
                                              .map((u) => ({
                                                  name: u.name,
                                                  value: (u.stats_this_month?.active || 0) + (u.stats_this_month?.pending || 0),
                                              }))
                                              .filter((d) => d.value > 0);

                                    const hasData = pieData.length > 0;
                                    const displayData = hasData ? pieData : [{ name: 'Belum Ada Data', value: 1, color: 'rgba(156, 163, 175, 0.25)' }];

                                    return (
                                        <div className="relative h-full w-full flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={displayData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={75}
                                                        paddingAngle={hasData ? 2 : 0}
                                                        dataKey="value"
                                                    >
                                                        {displayData.map((entry: any, index: number) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    entry.color ||
                                                                    [
                                                                        '#3b82f6',
                                                                        '#10b981',
                                                                        '#f59e0b',
                                                                        '#8b5cf6',
                                                                        '#ec4899',
                                                                        '#06b6d4',
                                                                        '#f97316',
                                                                        '#14b8a6',
                                                                    ][index % 8]
                                                                }
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        content={({ active, payload }: any) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="rounded-xl border border-surface-border bg-white dark:bg-zinc-950 p-2 shadow-md text-xs">
                                                                        <p className="font-bold text-text-main">{payload[0].name}</p>
                                                                        <p className="text-primary font-semibold">
                                                                            {hasData ? `${payload[0].value} Kontrak` : '0 Kontrak'}
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
                                                <span className="text-[14px] font-black leading-none text-text-main">
                                                    {hasData ? pieData.reduce((acc, curr) => acc + (curr.value || 0), 0) : 0}
                                                </span>
                                                <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-text-soft mt-0.5">
                                                    Total Kontrak
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </CardContent>
                    </Card>



                    {/* Daily Trend Stepped Line Chart & Sub-type Selector Split 20 / 80 */}
                    <Card className="bg-white dark:bg-zinc-900/50 border border-surface-border/60 shadow-xs mt-4">
                        <CardHeader className="p-3.5 pb-2 flex flex-row flex-wrap items-center justify-between gap-2 border-b border-surface-border/60 space-y-0">
                            <div>
                                <CardTitle className="text-xs font-bold text-text-main">
                                    Tren Pembuatan Kontrak Harian {activeParent ? `(${activeParent.label})` : ''}
                                </CardTitle>
                                <p className="text-[9.5px] text-text-soft">
                                    {activeParent 
                                        ? `Perkembangan volume sub-kategori di bawah ${activeParent.label}` 
                                        : 'Perkembangan volume pembuatan kontrak baru per kategori utama'}
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
                                                ? 'bg-primary text-primary-foreground shadow-xs'
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
                                                ? 'bg-primary text-primary-foreground shadow-xs'
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
                                                ? 'bg-primary text-primary-foreground shadow-xs'
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
                                                ? 'bg-primary text-primary-foreground shadow-xs'
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
                                                ? 'bg-primary text-primary-foreground shadow-xs'
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

                        {/* Resizable Split: Sub-tipe Tree & Line Chart */}
                        <div className="flex flex-col md:flex-row gap-3 items-stretch p-3.5 pt-0">
                            {/* Resizable Sub-tipe Tree Panel */}
                            <div className="w-full md:w-64 min-w-[180px] max-w-[450px] resize-x overflow-auto border-r border-surface-border/40 pr-3.5 pl-1 space-y-2.5 max-h-[430px] shrink-0">
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
                                        // Find top-level parent if selectedParentId is a child node
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
                                                            "flex items-center justify-between gap-1.5 p-2 rounded-lg border text-left cursor-pointer transition-all select-none",
                                                            isSelected 
                                                                ? "border-primary bg-primary/10 font-bold shadow-xs" 
                                                                : "border-surface-border/40 hover:bg-surface-muted/30"
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
                                                                        className={cn("transition-transform duration-200", isExpanded ? "" : "-rotate-90")} 
                                                                    />
                                                                </button>
                                                            )}
                                                            <div 
                                                                className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white" 
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
                                                                    className="flex h-5 w-5 items-center justify-center text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary rounded-md transition-all shadow-2xs"
                                                                    title="Lihat Detail Sub-tipe"
                                                                >
                                                                    <Layers size={10} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Nested Level 3 Children Tree Nodes (Colored & Non-clickable) */}
                                                    {isExpanded && hasChildren && (
                                                        <div className="pl-3.5 space-y-1 border-l border-surface-border/40 ml-2.5 animate-in slide-in-from-top-1 duration-150">
                                                            {node.children.map((subChild: any, sIdx: number) => {
                                                                const childColor = CHART_COLORS[(idx + sIdx + 1) % CHART_COLORS.length];
                                                                return (
                                                                    <div
                                                                        key={subChild.id || sIdx}
                                                                        className="flex items-center justify-between gap-1.5 p-1.5 rounded-md border border-surface-border/20 bg-surface-muted/10 text-left select-none text-[9px]"
                                                                    >
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <div 
                                                                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white" 
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
                                                            <div className="rounded-xl border border-surface-border bg-white dark:bg-zinc-950 p-2 shadow-md text-xs space-y-1 min-w-[140px]">
                                                                <p className="font-bold text-text-main">{item.full_date}</p>
                                                                <div className="space-y-0.5 border-t border-surface-border/40 pt-1">
                                                                    {payload.map((p: any, idx: number) => {
                                                                        if (p.value === 0) return null;
                                                                        return (
                                                                            <div key={idx} className="flex justify-between items-center gap-3">
                                                                                <span className="text-text-soft flex items-center gap-1 text-[10px]">
                                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                                                    {p.name}
                                                                                </span>
                                                                                <span className="font-bold text-text-main text-[10px]">{p.value} Kontrak</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    <div className="border-t border-surface-border/40 pt-1 mt-0.5 flex justify-between font-bold text-text-main text-[10.5px]">
                                                                        <span>Total</span>
                                                                        <span>{total} Kontrak</span>
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

                {/* Column 3: Tabel PIC dengan Search & Status Filter */}
                <div className="space-y-4">
                    {/* Full List PIC / Pengguna */}
                    <Card className="w-full border border-surface-border/60 bg-white dark:bg-zinc-900/50 shadow-xs flex flex-col overflow-hidden max-h-[820px]">
                        <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0 border-b border-surface-border/60">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-xs font-bold text-text-main">
                                        Beban Kerja PIC
                                    </CardTitle>
                                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] font-bold text-primary">
                                        {filteredWorkloads.length} PIC
                                    </span>
                                </div>
                                <p className="text-[9.5px] text-text-soft">
                                    Daftar PIC aktif divisi beserta status beban kerja
                                </p>
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
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto flex-1">
                            <table className="w-full table-fixed border-collapse text-left text-xs">
                                <colgroup>
                                    <col className="w-[70%]" />
                                    <col className="w-[30%]" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-surface-border/40 bg-surface-muted/50 text-[9px] font-bold uppercase tracking-wider text-text-soft sticky top-0 bg-white dark:bg-zinc-900 z-10">
                                        <th className="px-3 py-2.5">
                                            PIC / Pengguna ({filteredWorkloads.length})
                                        </th>
                                        <th className="px-2 py-2.5 text-center" title="Format: [Pending] / [Selesai]">Pending / Selesai</th>
                                    </tr>
                                    <tr className="sticky top-[33px] z-10 bg-white dark:bg-zinc-900 border-b border-surface-border/60">
                                        <td colSpan={2} className="px-2.5 py-1.5">
                                            <div className="relative">
                                                <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari PIC..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="h-7 w-full rounded-md border border-surface-border/60 bg-surface-muted/30 pl-7 pr-3 text-[10px] text-text-main placeholder:text-text-soft focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border/40">
                                    {filteredWorkloads.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-2.5 py-10 text-center text-text-desc font-medium uppercase opacity-60">
                                                PIC tidak ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredWorkloads.map((user) => {
                                            const isBusy = user.load_status === 'Sibuk';
                                            const isSelected = selectedUserId === user.id;

                                            // Generate vibrant full-color HSL from user name or ID if no custom color provided
                                            const hash = (user.name || user.id || '').split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
                                            const hue = Math.abs(hash) % 360;
                                            const fullColorStyle = user.bg_color && user.text_color 
                                                ? { backgroundColor: user.bg_color, color: user.text_color } 
                                                : { backgroundColor: `hsl(${hue}, 75%, 45%)`, color: '#ffffff' };

                                            return (
                                                <tr 
                                                    key={user.id} 
                                                    onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                                                    className={cn(
                                                        "cursor-pointer transition-colors",
                                                        isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-surface-muted/30"
                                                    )}
                                                    title="Klik untuk melihat Pie Chart distribusi status pengguna ini"
                                                >
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div
                                                                style={fullColorStyle}
                                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9.5px] font-extrabold shadow-xs tracking-wider"
                                                            >
                                                                {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-text-main font-semibold leading-snug text-[10.5px] whitespace-normal break-words" title={user.name}>
                                                                        {user.name}
                                                                    </span>
                                                                    <span className={cn(
                                                                        'inline-flex items-center px-1.5 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider shrink-0',
                                                                        isBusy 
                                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' 
                                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                    )}>
                                                                        {user.load_status || 'Ready'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-text-soft block text-[8px] font-bold uppercase tracking-wider whitespace-normal break-words" title={`${user.position || user.role} • ${user.division_name || user.department_name || 'Divisi -'}${user.location_name ? ` • ${user.location_name}` : ''}`}>
                                                                    {user.position || user.role} • {user.division_name || user.department_name || 'Divisi -'}{user.location_name ? ` • ${user.location_name}` : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2.5 text-center whitespace-nowrap text-[10px] font-semibold">
                                                        <span className="text-warning font-bold" title="Pending / Tunggu Approval">{user.stats_this_month?.pending || 0}</span>
                                                        <span className="text-text-soft/60 mx-1 font-normal">/</span>
                                                        <span className="text-success font-bold" title="Kontrak Selesai">{user.stats_this_month?.completed || 0}</span>
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
                    <div className="bg-white dark:bg-zinc-950 border border-surface-border rounded-xl shadow-xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start border-b border-surface-border/40 pb-2">
                            <div>
                                <h4 className="text-sm font-bold text-text-main">Sub-kategori {dialogParent.label}</h4>
                                <p className="text-[10px] text-text-soft">Rincian kontrak (klik sub-kategori untuk melihat level ke-3 & filter grafik)</p>
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
                                        <div key={child.id || idx} className="border border-surface-border/30 rounded-lg overflow-hidden bg-surface-muted/10">
                                            <div 
                                                onClick={() => {
                                                    if (hasSubChildren) {
                                                        setExpandedChildId(isExpanded ? null : child.id);
                                                        setSelectedParentId(isExpanded ? dialogParent.id : child.id); 
                                                    } else {
                                                        setSelectedParentId(child.id);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex justify-between items-center p-2.5 bg-surface-muted/30 transition-all select-none",
                                                    "cursor-pointer hover:bg-surface-muted/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {hasSubChildren && (
                                                        <ChevronDown 
                                                            size={12} 
                                                            className={cn("text-text-soft transition-transform duration-200", isExpanded ? "" : "-rotate-90")} 
                                                        />
                                                    )}
                                                    <span className="text-xs font-semibold text-text-main">{child.label}</span>
                                                </div>
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                                                    {child.count || 0} Kontrak
                                                </span>
                                            </div>
                                            
                                            {/* Level 2 Sub-children (Level 3 depth) */}
                                            {isExpanded && hasSubChildren && (
                                                <div className="bg-white dark:bg-zinc-950 border-t border-surface-border/20 p-2 space-y-1.5 pl-6 animate-in slide-in-from-top-1 duration-150">
                                                    {child.children.map((subChild: any, sIdx: number) => (
                                                        <div key={subChild.id || sIdx} className="flex justify-between items-center text-[10.5px] p-1.5 hover:bg-surface-muted/20 rounded">
                                                            <span className="text-text-soft">{subChild.label}</span>
                                                            <span className="font-semibold text-text-main">{subChild.count || 0} Kontrak</span>
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
                                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-xs"
                            >
                                Oke
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
