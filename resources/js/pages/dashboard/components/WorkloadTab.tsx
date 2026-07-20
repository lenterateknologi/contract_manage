import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { Input } from '@/components/ui/inputs/Input';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Briefcase, Calendar, Clock, Filter, Layers, UserCheck, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

    const { auth, departments = [] } = usePage<any>().props;
    const userDeptId = auth?.user?.department_id;
    const loginUserRole = auth?.user?.role;
    const isAdmin = loginUserRole === 'Admin';

    const userWorkloads = data?.userWorkloads || [];
    const categoryTraffic = data?.categoryTraffic || [];
    const departmentWorkload = data?.departmentWorkload || [];
    const monthlyTrend = data?.monthlyTrend || [];
    const dailyTrend = data?.dailyTrend || [];
    const renewalCompletionRate = data?.renewalCompletionRate ?? 0;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'sibuk'>('all');
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogParent, setDialogParent] = useState<any>(null);
    const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
    const [selectedDeptId, setSelectedDeptId] = useState<string>(!isAdmin && userDeptId ? String(userDeptId) : 'all');


    const filteredWorkloads = useMemo(() => {
        return userWorkloads.filter((user) => {
            const matchesDept = selectedDeptId === 'all' || String(user.department_id) === selectedDeptId;
            const matchesSearch =
                user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                user.role.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (user.department_name && user.department_name.toLowerCase().includes(debouncedSearch.toLowerCase()));
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'ready' && user.load_status === 'Ready') ||
                (statusFilter === 'sibuk' && user.load_status === 'Sibuk');
            return matchesDept && matchesSearch && matchesStatus;
        });
    }, [userWorkloads, selectedDeptId, debouncedSearch, statusFilter]);

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

    const activeParent = useMemo(() => {
        if (!selectedParentId) return null;
        return contractTypesLevel0.find((p: any) => p.id === selectedParentId);
    }, [contractTypesLevel0, selectedParentId]);

    const activeChartCategories = useMemo(() => {
        if (activeParent) {
            return activeParent.children || [];
        }
        return contractTypesLevel0;
    }, [activeParent, contractTypesLevel0]);

    const chartLinesList = useMemo(() => {
        const list = activeChartCategories.map((cat: any) => ({
            id: cat.id,
            label: cat.label,
            descendantIds: getDescendantIds(cat)
        }));
        if (!selectedParentId) {
            list.push({
                id: 'null',
                label: 'Lainnya',
                descendantIds: ['null']
            });
        }
        return list;
    }, [activeChartCategories, selectedParentId]);

    const aggregatedDailyTrend = useMemo(() => {
        return dailyTrend.map((day: any) => {
            const point: any = {
                date: day.date,
                full_date: day.full_date,
            };
            chartLinesList.forEach((line) => {
                let sum = 0;
                line.descendantIds.forEach((id) => {
                    sum += (day['type_' + id] || 0);
                });
                point[line.label] = sum;
            });
            return point;
        });
    }, [dailyTrend, chartLinesList]);

    const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1-2: Kategori Kontrak (Contract Types) - Takes 2 of 3 columns */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Kategori Kontrak (Klik untuk Detail & Filter Grafik)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[650px] pr-1">
                        {contractTypesLevel0.length > 0 ? (
                            contractTypesLevel0.map((type: any, index: number) => {
                                const icons = [Layers, Briefcase, Calendar, Clock, UserCheck];
                                const colors = ['text-primary', 'text-warning', 'text-cyan-500', 'text-success', 'text-purple-500'];
                                const Icon = icons[index % icons.length];
                                const colorClass = colors[index % colors.length];

                                return (
                                    <div 
                                        key={type.id || index}
                                        onClick={() => {
                                            if (type.children && type.children.length > 0) {
                                                setDialogParent(type);
                                                setIsDialogOpen(true);
                                                setSelectedParentId(type.id);
                                            }
                                        }}
                                        className="cursor-pointer transition-transform hover:scale-[1.01]"
                                        title={type.children && type.children.length > 0 ? "Klik untuk melihat sub-kategori" : undefined}
                                    >
                                        <MetricItem 
                                            label={type.label} 
                                            value={type.count || 0} 
                                            icon={Icon} 
                                            color={colorClass} 
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-xs text-muted-foreground">Tidak ada data tipe kontrak</div>
                        )}
                    </div>

                    {/* Daily Trend Stepped Line Chart */}
                    <div className="bg-white dark:bg-zinc-900/50 border border-surface-border/60 rounded-xl p-5 space-y-4 shadow-sm mt-6">
                        <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-text-main">
                                    Tren Pembuatan Kontrak Harian {activeParent ? `(${activeParent.label})` : ''}
                                </h3>
                                <p className="text-[10px] text-text-soft">
                                    {activeParent 
                                        ? `Perkembangan volume sub-kategori di bawah ${activeParent.label}` 
                                        : 'Perkembangan volume pembuatan kontrak baru per kategori utama pada bulan ini'}
                                </p>
                            </div>
                            {activeParent && (
                                <button
                                    onClick={() => setSelectedParentId(null)}
                                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                                >
                                    Tampilkan Semua Kategori
                                </button>
                            )}
                        </div>
                        <div className="h-[280px] w-full pt-2">
                            {aggregatedDailyTrend.length === 0 ? (
                                <div className="text-center py-16 text-xs text-muted-foreground uppercase animate-in fade-in duration-300">Tidak ada data tren harian</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={aggregatedDailyTrend} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#888888" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false} 
                                        />
                                        <YAxis 
                                            stroke="#888888" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip
                                            content={({ active, payload, label }: any) => {
                                                if (active && payload && payload.length) {
                                                    const item = payload[0].payload;
                                                    const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
                                                    return (
                                                        <div className="rounded-xl border border-surface-border bg-white dark:bg-zinc-950 p-2.5 shadow-md text-xs space-y-1.5 min-w-[150px]">
                                                            <p className="font-bold text-text-main">{item.full_date}</p>
                                                            <div className="space-y-1 border-t border-surface-border/40 pt-1.5">
                                                                {payload.map((p: any, idx: number) => {
                                                                    if (p.value === 0) return null;
                                                                    return (
                                                                        <div key={idx} className="flex justify-between items-center gap-4">
                                                                            <span className="text-text-soft flex items-center gap-1.5">
                                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                                {p.name}
                                                                            </span>
                                                                            <span className="font-bold text-text-main">{p.value} Kontrak</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {/* Total contracts in day */}
                                                                <div className="border-t border-surface-border/40 pt-1 mt-1 flex justify-between font-bold text-text-main">
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
                                        <Legend 
                                            verticalAlign="top" 
                                            height={36} 
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => <span className="text-[9px] text-text-soft font-bold uppercase tracking-wider">{value}</span>}
                                        />
                                        {chartLinesList.map((line: any, idx: number) => (
                                            <Line 
                                                key={line.label}
                                                type="linear" 
                                                dataKey={line.label} 
                                                name={line.label}
                                                stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                                                strokeWidth={2}
                                                dot={{ r: 2, stroke: CHART_COLORS[idx % CHART_COLORS.length], strokeWidth: 1, fill: '#fff' }}
                                                activeDot={{ r: 4 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Column 3: Tabel PIC dengan Search */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Beban Kerja PIC</h3>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-8 shrink-0 gap-1.5 px-2 text-[10px] font-semibold">
                                    <Filter size={12} />
                                    Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-60 p-3 dark:bg-slate-900 dark:border-slate-800">
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase text-text-soft">Divisi</label>
                                        <select
                                            value={selectedDeptId}
                                            onChange={(e) => setSelectedDeptId(e.target.value)}
                                            disabled={!isAdmin}
                                            className="bg-background border-input focus:ring-primary h-8 w-full cursor-pointer appearance-none rounded-lg border px-3 text-[10px] outline-none"
                                        >
                                            {isAdmin && <option value="all">Semua Divisi</option>}
                                            {departments.map((dept: any) =>
                                                !isAdmin && String(dept.id) !== selectedDeptId ? null : (
                                                    <option key={dept.id} value={String(dept.id)}>
                                                        {dept.name}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase text-text-soft">Status Beban</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="bg-background border-input focus:ring-primary h-8 w-full cursor-pointer appearance-none rounded-lg border px-3 text-[10px] outline-none"
                                        >
                                            <option value="all">Semua Status</option>
                                            <option value="ready">Ready</option>
                                            <option value="sibuk">Sibuk</option>
                                        </select>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="relative">
                        <SearchInput
                            placeholder="Cari nama, peran, divisi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background h-9 w-full"
                        />
                    </div>
                    
                    <div className="w-full border border-surface-border/60 rounded-xl bg-white dark:bg-zinc-900/50 shadow-xs max-h-[580px] overflow-y-auto">
                        <table className="w-full table-fixed border-collapse text-left text-xs">
                            <colgroup>
                                <col className="w-[50%]" />
                                <col className="w-[25%]" />
                                <col className="w-[25%]" />
                            </colgroup>
                            <thead>
                                <tr className="border-b border-surface-border/60 bg-surface-muted/50 text-[9px] font-bold uppercase tracking-wider text-text-soft sticky top-0 bg-white dark:bg-zinc-900 z-10">
                                    <th className="px-2.5 py-2">PIC / Pengguna</th>
                                    <th className="px-1.5 py-2 text-center">Status</th>
                                    <th className="px-1.5 py-2 text-center">Beban (T/P/S)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border/40">
                                {filteredWorkloads.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-2.5 py-10 text-center text-text-desc font-medium uppercase opacity-60">
                                            PIC tidak ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWorkloads.map((user) => {
                                        const isBusy = user.load_status === 'Sibuk';
                                        const customAvatarStyle = user.bg_color && user.text_color ? { backgroundColor: user.bg_color, color: user.text_color } : undefined;
                                        return (
                                            <tr key={user.id} className="hover:bg-surface-muted/30 transition-colors">
                                                <td className="px-2.5 py-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            style={customAvatarStyle}
                                                            className={cn(
                                                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/5 text-[8.5px] font-bold dark:border-white/5',
                                                                !customAvatarStyle && 'bg-surface-muted text-text-desc',
                                                            )}
                                                        >
                                                            {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-text-main block font-semibold leading-tight text-[10px] truncate" title={user.name}>{user.name}</span>
                                                            <span className="text-text-soft block text-[7.5px] font-bold uppercase tracking-wider truncate" title={`${user.position || user.role} • ${user.department_name || 'Umum'}`}>
                                                                {user.position || user.role} • {user.department_name || 'Umum'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center">
                                                    <span className={cn(
                                                        'inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider',
                                                        isBusy 
                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' 
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                    )}>
                                                        {user.load_status || 'Ready'}
                                                    </span>
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center whitespace-nowrap text-[9.5px] font-semibold">
                                                    <span className="text-warning" title="Tunggu Approval">{user.stats_this_month?.pending || 0}</span>
                                                    <span className="text-text-soft/60 mx-0.5">/</span>
                                                    <span className="text-primary" title="Proses Kontrak">{user.stats_this_month?.active || 0}</span>
                                                    <span className="text-text-soft/60 mx-0.5">/</span>
                                                    <span className="text-success" title="Kontrak Selesai">{user.stats_this_month?.completed || 0}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
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
