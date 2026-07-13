import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { Input } from '@/components/ui/inputs/Input';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Briefcase, Calendar, Clock, Filter, Layers, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MetricItem } from './MetricItem';

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
    const renewalCompletionRate = data?.renewalCompletionRate ?? 0;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'sibuk'>('all');
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


    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
            {/* KPI Cards: Contract Types */}
            <div className="grid grid-cols-1 gap-4 select-none md:grid-cols-2 lg:grid-cols-4">
                {contractTypesLevel0.length > 0 ? (
                    contractTypesLevel0.map((type: any, index: number) => {
                        const icons = [Layers, Briefcase, Calendar, Clock, UserCheck];
                        const colors = ['text-primary', 'text-warning', 'text-cyan-500', 'text-success', 'text-purple-500'];
                        const Icon = icons[index % icons.length];
                        const colorClass = colors[index % colors.length];

                        return (
                            <MetricItem 
                                key={type.id || index} 
                                label={type.label} 
                                value={type.count || 0} 
                                icon={Icon} 
                                color={colorClass} 
                            >
                                {type.children && type.children.length > 0 && (
                                    <div className="custom-scrollbar flex flex-col gap-1.5 w-full pr-2 max-h-[50px] overflow-y-auto">
                                        {type.children.map((child: any, cIndex: number) => (
                                            <div key={child.id || cIndex} className="flex justify-between items-center text-[10px] pr-1">
                                                <span className="text-text-desc truncate max-w-[120px]">{child.label}</span>
                                                <span className="font-bold text-text-main">{child.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </MetricItem>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center text-xs text-muted-foreground">Tidak ada data tipe kontrak</div>
                )}
            </div>

            <div className="space-y-3 lg:col-span-1">
                <div className="flex flex-col items-stretch justify-between gap-2.5 p-1 sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-col items-stretch gap-2 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <SearchInput
                                placeholder="Cari nama, peran, divisi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-background h-8.5"
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-8.5 shrink-0 gap-2 px-3 text-[11px] font-semibold">
                                    <Filter size={14} />
                                    Filter PIC
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 p-4 dark:bg-slate-900 dark:border-slate-800">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold">Divisi</label>
                                        <div className="relative">
                                            <select
                                                value={selectedDeptId}
                                                onChange={(e) => setSelectedDeptId(e.target.value)}
                                                disabled={!isAdmin}
                                                className="bg-background border-input focus:ring-primary h-8.5 w-full cursor-pointer appearance-none rounded-lg border px-3 text-[11px] outline-none focus:ring-1 disabled:opacity-75"
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
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold">Status Beban</label>
                                        <div className="relative">
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                                className="bg-background border-input focus:ring-primary h-8.5 w-full cursor-pointer appearance-none rounded-lg border px-3 text-[11px] outline-none focus:ring-1"
                                            >
                                                <option value="all">Semua Status</option>
                                                <option value="ready">Ready (Siap Menerima)</option>
                                                <option value="sibuk">Sibuk (Beban Penuh)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="grid max-h-[580px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredWorkloads.length === 0 ? (
                        <Card className="col-span-full flex flex-col items-center justify-center border-dashed py-10 opacity-60 !bg-surface-base/40 border-surface-border/60">
                            <Briefcase className="mb-2 h-7 w-7 opacity-20" />
                            <p className="text-text-desc text-[10px] font-medium uppercase">PIC tidak ditemukan</p>
                        </Card>
                    ) : (
                        filteredWorkloads.map((user) => {
                            const isBusy = user.load_status === 'Sibuk';
                            const customAvatarStyle =
                                user.bg_color && user.text_color ? { backgroundColor: user.bg_color, color: user.text_color } : undefined;
                            return (
                                <Card
                                    key={user.id}
                                    className={cn('group transition-all hover:shadow-xs select-none !bg-surface-base/60 dark:!bg-surface-base/40 border-surface-border/60 hover:!bg-surface-base/80', isBusy && 'border-danger/20 dark:border-danger/40')}
                                >
                                    <CardContent className="p-3 space-y-2.5 flex flex-col justify-between h-full">
                                        <div className="flex items-center justify-between gap-2.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <div
                                                    style={customAvatarStyle}
                                                    className={cn(
                                                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/5 text-[9px] font-bold dark:border-white/5',
                                                        !customAvatarStyle && 'bg-surface-muted text-text-desc',
                                                    )}
                                                >
                                                    {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-text-main block truncate text-[11px] leading-tight font-semibold">
                                                        {user.name}
                                                    </span>
                                                    <span className="text-text-soft block truncate text-[8px] font-bold uppercase tracking-wider mt-0.5">
                                                        {user.position || user.role} {user.department_name ? `• ${user.department_name}` : ''}
                                                    </span>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="flex items-center justify-between gap-2 border-t border-surface-border/40 pt-2 text-[9px] font-semibold text-text-soft uppercase">
                                            <span className="text-text-desc truncate max-w-[40%] bg-surface-muted/60 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                                {user.department_name || 'Umum'}
                                            </span>
                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-text-soft text-[8px] font-medium">TUNGGU:</span>
                                                    <span className="text-warning font-bold">{user.stats_this_month?.pending || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-text-soft text-[8px] font-medium">PROSES:</span>
                                                    <span className="text-primary font-bold">{user.stats_this_month?.active || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-text-soft text-[8px] font-medium">SELESAI:</span>
                                                    <span className="text-success font-bold">{user.stats_this_month?.completed || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

        </div>
    );
}
