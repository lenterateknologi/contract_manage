import { useState, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Briefcase,
    MessageSquare,
    Search,
    Filter,
    Send,
    X,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    UserCheck,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MembersPerDivision } from './MembersPerDivision';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
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
    active_contracts_count: number;
    pending_tasks_count: number;
    initiated_contracts_count: number;
    load_status: 'Ready' | 'Sibuk';
}

interface CategoryTraffic {
    category_name: string;
    incoming_count: number;
    outgoing_count: number;
}

interface DepartmentWorkload {
    department: string;
    in_review: number;
    revision: number;
    locked: number;
    total: number;
}

interface WorkloadTabProps {
    data: {
        userWorkloads?: UserWorkload[];
        categoryTraffic?: CategoryTraffic[];
        departmentWorkload?: DepartmentWorkload[];
        renewalCompletionRate?: number;
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
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'sibuk'>('all');
    // Lock non-admin to their own department id by default
    const [selectedDeptId, setSelectedDeptId] = useState<string>(
        !isAdmin && userDeptId ? String(userDeptId) : 'all'
    );

    const [selectedChatUser, setSelectedChatUser] = useState<UserWorkload | null>(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Record<string, Array<{ sender: 'me' | 'them'; text: string; time: string }>>>({});

    // Filter workloads
    const filteredWorkloads = useMemo(() => {
        return userWorkloads.filter(user => {
            // Filter by division/department
            const matchesDept = selectedDeptId === 'all' || String(user.department_id) === selectedDeptId;

            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.department_name && user.department_name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'ready' && user.load_status === 'Ready') ||
                (statusFilter === 'sibuk' && user.load_status === 'Sibuk');

            return matchesDept && matchesSearch && matchesStatus;
        });
    }, [userWorkloads, selectedDeptId, searchQuery, statusFilter]);

    // Summary calculations
    const totalPendingTasks = useMemo(() => {
        return userWorkloads.reduce((sum, u) => sum + (u.pending_tasks_count || 0), 0);
    }, [userWorkloads]);

    const totalActiveReviews = useMemo(() => {
        return userWorkloads.reduce((sum, u) => sum + (u.active_contracts_count || 0), 0);
    }, [userWorkloads]);

    const busyPicsCount = useMemo(() => {
        return userWorkloads.filter(u => u.load_status === 'Sibuk').length;
    }, [userWorkloads]);

    const handleOpenChat = (user: UserWorkload) => {
        setSelectedChatUser(user);
        if (!chatHistory[user.id]) {
            setChatHistory(prev => ({
                ...prev,
                [user.id]: [
                    {
                        sender: 'them',
                        text: `Halo! Saya PIC/Legal untuk beberapa kontrak Anda. Ada yang bisa saya bantu terkait persetujuan atau revisi kontrak?`,
                        time: '10:30'
                    }
                ]
            }));
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !selectedChatUser) return;

        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const newMessage = { sender: 'me' as const, text: chatMessage, time };

        setChatHistory(prev => ({
            ...prev,
            [selectedChatUser.id]: [...(prev[selectedChatUser.id] || []), newMessage]
        }));
        setChatMessage('');

        // Mock auto reply
        setTimeout(() => {
            const replies = [
                `Baik, pesan Anda telah saya terima. Saya sedang meninjau kontrak aktif dan akan segera memperbarui status alur persetujuannya.`,
                `Tentu, revisi pasal tersebut sedang kami diskusikan dengan divisi terkait. Saya hubungi kembali setelah draf siap.`,
                `Siap! Saya prioritaskan pengerjaan dokumen ini hari ini agar bisa segera disetujui oleh Direktur.`
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const replyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            setChatHistory(prev => ({
                ...prev,
                [selectedChatUser.id]: [
                    ...(prev[selectedChatUser.id] || []),
                    { sender: 'them', text: randomReply, time: replyTime }
                ]
            }));
        }, 1200);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Quick KPI Cards inside Workload Tab */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Laju Penyelesaian Perpanjangan */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Penyelesaian Perpanjangan</span>
                        <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                            <UserCheck size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-black text-foreground">{renewalCompletionRate}%</span>
                    </div>
                    <div className="mt-1 text-[9px] font-semibold text-muted-foreground">
                        Persentase kontrak kadaluarsa yang berhasil diperpanjang.
                    </div>
                </div>

                {/* 2. Total Tugas Pending */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Tugas Persetujuan Pending</span>
                        <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-black text-foreground">{totalPendingTasks}</span>
                        <span className="text-[9px] font-bold text-muted-foreground">Dokumen</span>
                    </div>
                    <div className="mt-1 text-[9px] font-semibold text-muted-foreground">
                        Akumulasi dokumen persetujuan yang menunggu tanda tangan.
                    </div>
                </div>

                {/* 3. Total Kontrak Direview / Direvisi */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Aktif Direview & Revisi</span>
                        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
                            <Layers size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-black text-foreground">{totalActiveReviews}</span>
                        <span className="text-[9px] font-bold text-muted-foreground">Kontrak</span>
                    </div>
                    <div className="mt-1 text-[9px] font-semibold text-muted-foreground">
                        Kontrak yang sedang dalam proses revisi atau peninjauan aktif.
                    </div>
                </div>

                {/* 4. Staff Legal Sibuk */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">PIC Legal / Staff Sibuk</span>
                        <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
                            <Briefcase size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-black text-foreground">{busyPicsCount}</span>
                        <span className="text-[9px] font-bold text-muted-foreground">Orang</span>
                    </div>
                    <div className="mt-1 text-[9px] font-semibold text-muted-foreground">
                        Jumlah PIC dengan beban kerja sibuk (≥ 3 kontrak aktif).
                    </div>
                </div>
            </div>

            {/* Layout Charts & PICs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Columns (5 Cols): Department Workload & Category Traffic */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Department Workload Breakdown */}
                    <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                        <div className="border-b border-border/20 pb-3 mb-4 dark:border-slate-800/40">
                            <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Beban Pengerjaan Per Divisi</h3>
                            <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Distribusi kontrak aktif yang sedang ditangani oleh tiap divisi.</p>
                        </div>

                        <div className="h-[240px] w-full select-none">
                            {isMounted && departmentWorkload.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={departmentWorkload}
                                        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.05)" />
                                        <XAxis dataKey="department" fontSize={8} stroke="rgba(120, 120, 120, 0.6)" tickLine={false} axisLine={false} />
                                        <YAxis fontSize={8} stroke="rgba(120, 120, 120, 0.6)" tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                color: '#f8fafc'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={30}
                                            iconSize={8}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="in_review" stackId="w" name="Review" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={14} />
                                        <Bar dataKey="revision" stackId="w" name="Revisi" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={14} />
                                        <Bar dataKey="locked" stackId="w" name="Terkunci" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={14} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-xs text-muted-foreground flex items-center justify-center h-full">
                                    {departmentWorkload.length === 0 ? 'Belum ada data beban kerja divisi.' : 'Memuat...'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Traffic */}
                    <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                        <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4 dark:border-slate-800/40">
                            <div>
                                <h3 className="text-foreground text-xs font-extrabold tracking-wider uppercase">Trafik Alur Kategori</h3>
                                <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">Kontrak Masuk (Review/Revisi) vs Keluar (Disetujui/Arsip)</p>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-bold">
                                <div className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span className="text-muted-foreground">Masuk</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-muted-foreground">Keluar</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            {categoryTraffic.length === 0 ? (
                                <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                                    Belum ada data trafik kategori kontrak.
                                </div>
                            ) : (
                                categoryTraffic.map((item, idx) => {
                                    const total = item.incoming_count + item.outgoing_count;
                                    const inPct = total > 0 ? (item.incoming_count / total) * 100 : 0;
                                    const outPct = total > 0 ? (item.outgoing_count / total) * 100 : 0;

                                    return (
                                        <div key={idx} className="space-y-1.5 group">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-foreground truncate max-w-[160px]" title={item.category_name}>
                                                    {item.category_name}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0 font-extrabold text-[9px]">
                                                    <span className="text-amber-500 flex items-center gap-0.5">
                                                        <ArrowDownLeft size={10} />
                                                        {item.incoming_count}
                                                    </span>
                                                    <span className="text-muted-foreground/30">|</span>
                                                    <span className="text-emerald-500 flex items-center gap-0.5">
                                                        <ArrowUpRight size={10} />
                                                        {item.outgoing_count}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden flex border border-border/20">
                                                {item.incoming_count > 0 && (
                                                    <div
                                                        style={{ width: `${inPct}%` }}
                                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                                                        title={`Masuk: ${item.incoming_count} (${Math.round(inPct)}%)`}
                                                    />
                                                )}
                                                {item.outgoing_count > 0 && (
                                                    <div
                                                        style={{ width: `${outPct}%` }}
                                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                                        title={`Keluar: ${item.outgoing_count} (${Math.round(outPct)}%)`}
                                                    />
                                                )}
                                                {total === 0 && <div className="h-full w-full bg-muted/20" />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Columns (7 Cols): PIC Capacity & Workload Board */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Board Control & Filters */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-border/40 bg-card/25 backdrop-blur-md p-3 rounded-2xl dark:border-slate-800/60">
                        {/* Search and Dept Select */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={12} />
                                <input
                                    type="text"
                                    placeholder="Cari nama, peran, divisi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-4 py-1.5 text-[11px] bg-muted/40 border border-border/30 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-semibold placeholder:text-muted-foreground/60"
                                />
                            </div>

                            <div className="relative shrink-0">
                                <select
                                    value={selectedDeptId}
                                    onChange={(e) => setSelectedDeptId(e.target.value)}
                                    disabled={!isAdmin}
                                    className="w-full md:w-auto pl-3 pr-8 py-1.5 text-[11px] bg-muted/40 border border-border/30 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-bold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed appearance-none"
                                >
                                    {isAdmin && (
                                        <option value="all" className="bg-card text-foreground font-semibold">Semua Divisi</option>
                                    )}
                                    {departments.map((dept: any) => {
                                        if (!isAdmin && String(dept.id) !== selectedDeptId) {
                                            return null;
                                        }
                                        return (
                                            <option key={dept.id} value={String(dept.id)} className="bg-card text-foreground font-semibold">
                                                {dept.name}
                                            </option>
                                        );
                                    })}
                                </select>
                                <span className="absolute right-2.5 top-2.5 pointer-events-none text-muted-foreground">
                                    <Filter size={10} className="opacity-60" />
                                </span>
                            </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all duration-200 cursor-pointer border",
                                    statusFilter === 'all'
                                        ? "bg-foreground text-background border-foreground shadow-xs"
                                        : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/65 hover:text-foreground"
                                )}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setStatusFilter('ready')}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all duration-200 cursor-pointer border flex items-center gap-1",
                                    statusFilter === 'ready'
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/10 hover:bg-emerald-500/20 dark:text-emerald-400"
                                )}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Ready
                            </button>
                            <button
                                onClick={() => setStatusFilter('sibuk')}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all duration-200 cursor-pointer border flex items-center gap-1",
                                    statusFilter === 'sibuk'
                                        ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                                        : "bg-rose-500/10 text-rose-600 border-rose-500/10 hover:bg-rose-500/20 dark:text-rose-400"
                                )}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Sibuk
                            </button>
                        </div>
                    </div>

                    {/* PIC Workloads Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
                        {filteredWorkloads.length === 0 ? (
                            <div className="col-span-2 text-center py-10 border border-dashed border-border/60 rounded-2xl bg-card/25 text-xs font-semibold text-muted-foreground">
                                Tidak ada staff PIC yang sesuai filter.
                            </div>
                        ) : (
                            filteredWorkloads.map((user) => {
                                const activeCount = user.active_contracts_count;
                                const capacityPct = Math.min((activeCount / 5) * 100, 100);
                                const isBusy = user.load_status === 'Sibuk';

                                const customAvatarStyle = user.bg_color && user.text_color
                                    ? { backgroundColor: user.bg_color, color: user.text_color }
                                    : undefined;

                                return (
                                    <div
                                        key={user.id}
                                        className={cn(
                                            "border bg-card/35 hover:bg-card/50 rounded-2xl p-4 transition-all duration-300 backdrop-blur-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5",
                                            isBusy ? "border-rose-500/30 dark:border-rose-500/15" : "border-border/60 dark:border-slate-800/60"
                                        )}
                                    >
                                        <div className="space-y-3">
                                            {/* Name / Avatar / Role */}
                                            <div className="flex items-start justify-between min-w-0 gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                        style={customAvatarStyle}
                                                        className={cn(
                                                            "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-extrabold border border-black/5 dark:border-white/5 shrink-0",
                                                            !customAvatarStyle && "bg-muted text-muted-foreground"
                                                        )}
                                                    >
                                                        {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-foreground text-[11px] font-bold block truncate leading-snug">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-muted-foreground text-[9px] font-semibold truncate block mt-0.5">
                                                            {user.position || user.role}
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className={cn(
                                                    "text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 border",
                                                    isBusy
                                                        ? "bg-rose-500/10 text-rose-600 border-rose-500/10 dark:text-rose-400"
                                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/10 dark:text-emerald-400"
                                                )}>
                                                    {user.load_status}
                                                </span>
                                            </div>

                                            {/* Department Tag */}
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg w-max max-w-full">
                                                <span className="truncate">{user.department_name || 'Direksi & Staff Umum'}</span>
                                            </div>

                                            {/* Load progress */}
                                            <div className="space-y-1 pt-1">
                                                <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                                                    <span>Kapasitas Kerja</span>
                                                    <span className={cn(isBusy ? "text-rose-500" : "text-emerald-500", "font-extrabold")}>
                                                        {activeCount} / 5 Kontrak
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${capacityPct}%` }}
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            isBusy
                                                                ? "bg-gradient-to-r from-rose-500 to-red-500"
                                                                : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats and Action Footer */}
                                        <div className="flex items-center justify-between border-t border-border/20 pt-2.5 mt-3 gap-2 dark:border-slate-800/30">
                                            <div className="flex flex-col text-[9px] font-medium text-muted-foreground">
                                                <span>Inisiasi: <strong className="text-foreground font-extrabold">{user.initiated_contracts_count || 0}</strong></span>
                                                <span>Tugas Pending: <strong className="text-amber-500 font-extrabold">{user.pending_tasks_count || 0}</strong></span>
                                            </div>

                                            <button
                                                onClick={() => handleOpenChat(user)}
                                                className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/10 transition-all duration-200 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider cursor-pointer"
                                            >
                                                <MessageSquare size={10} />
                                                Diskusi
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Embedded Members Per Division at the bottom */}
            <div className="border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-5 shadow-xs transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/15">
                <MembersPerDivision />
            </div>

            {/* Diskusi Chat Popover */}
            {selectedChatUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-card border border-border/60 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[500px]">
                        <div className="bg-muted/40 border-b border-border/40 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    style={selectedChatUser.bg_color && selectedChatUser.text_color ? { backgroundColor: selectedChatUser.bg_color, color: selectedChatUser.text_color } : undefined}
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-black/5 dark:border-white/5"
                                >
                                    {selectedChatUser.initials ?? selectedChatUser.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-foreground text-[11px] font-extrabold leading-tight">{selectedChatUser.name}</h4>
                                    <span className="text-muted-foreground text-[9px] font-semibold">{selectedChatUser.position || selectedChatUser.role}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedChatUser(null)}
                                className="h-7 w-7 rounded-lg hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[220px] bg-slate-50/20 dark:bg-slate-950/10">
                            {chatHistory[selectedChatUser.id]?.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex flex-col max-w-[80%] rounded-2xl px-3 py-1.5 text-xs leading-normal",
                                        msg.sender === 'me'
                                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                            : "bg-muted text-foreground mr-auto rounded-tl-none"
                                    )}
                                >
                                    <p className="font-semibold">{msg.text}</p>
                                    <span className={cn(
                                        "text-[8px] mt-1 text-right block",
                                        msg.sender === 'me' ? "text-primary-foreground/70" : "text-muted-foreground/70"
                                    )}>
                                        {msg.time}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 bg-card flex gap-2">
                            <input
                                type="text"
                                placeholder={`Kirim pesan ke ${selectedChatUser.name.split(' ')[0]}...`}
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs bg-muted/40 border border-border/20 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-semibold"
                            />
                            <button
                                type="submit"
                                className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                            >
                                <Send size={12} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
