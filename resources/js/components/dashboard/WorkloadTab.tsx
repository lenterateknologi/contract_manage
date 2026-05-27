import { useState, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Briefcase,
    MessageSquare,
    Search,
    Filter,
    Send,
    X,
    Clock,
    UserCheck,
    Layers,
    ArrowDownLeft,
    ArrowUpRight,
    Activity,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { MetricItem } from './MetricItem';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/Card';
import { Button } from '@/components/ui/base/Button';
import { Badge } from '@/components/ui/base/Badge';
import { Input } from '@/components/ui/base/Input';

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
    const [selectedDeptId, setSelectedDeptId] = useState<string>(
        !isAdmin && userDeptId ? String(userDeptId) : 'all'
    );

    const [selectedChatUser, setSelectedChatUser] = useState<UserWorkload | null>(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Record<string, Array<{ sender: 'me' | 'them'; text: string; time: string }>>>({});

    const filteredWorkloads = useMemo(() => {
        return userWorkloads.filter(user => {
            const matchesDept = selectedDeptId === 'all' || String(user.department_id) === selectedDeptId;
            const matchesSearch = user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                user.role.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (user.department_name && user.department_name.toLowerCase().includes(debouncedSearch.toLowerCase()));
            const matchesStatus = statusFilter === 'all' ||
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                <MetricItem
                    label="Total Kontrak Diproses"
                    value={totalInProcessThisMonth}
                    icon={Layers}
                    color="text-primary"
                />
                <MetricItem
                    label="Kontrak Pending"
                    value={totalPendingThisMonth}
                    icon={Clock}
                    color="text-warning"
                />
                <MetricItem
                    label="Kontrak Dikerjakan"
                    value={totalActiveThisMonth}
                    icon={Briefcase}
                    color="text-indigo-500"
                />
                <MetricItem
                    label="Total Kontrak Selesai"
                    value={totalCompletedThisMonth}
                    icon={UserCheck}
                    color="text-success"
                />
            </div>

            <div className="lg:col-span-1 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-border/40 bg-card/40 p-3 rounded-xl">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
                        <div className="relative flex-1">
                            <SearchInput
                                placeholder="Cari nama, peran, divisi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 bg-background"
                            />
                        </div>
                        <div className="relative shrink-0">
                            <select
                                value={selectedDeptId}
                                onChange={(e) => setSelectedDeptId(e.target.value)}
                                disabled={!isAdmin}
                                className="h-9 w-full md:w-auto pl-3 pr-8 text-xs bg-background border border-input rounded-lg font-medium cursor-pointer disabled:opacity-75 appearance-none focus:ring-1 focus:ring-primary outline-none"
                            >
                                {isAdmin && <option value="all">Semua Divisi</option>}
                                {departments.map((dept: any) => (
                                    (!isAdmin && String(dept.id) !== selectedDeptId) ? null :
                                        <option key={dept.id} value={String(dept.id)}>{dept.name}</option>
                                ))}
                            </select>
                            <Filter size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[580px] overflow-y-auto pr-1">
                    {filteredWorkloads.length === 0 ? (
                        <Card className="col-span-full border-dashed flex flex-col items-center justify-center py-10 opacity-60">
                            <Briefcase className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs font-medium uppercase tracking-wider text-text-desc">PIC tidak ditemukan</p>
                        </Card>
                    ) : (
                        filteredWorkloads.map((user) => {
                            const activeCount = user.active_contracts_count;
                            const capacityPct = Math.min((activeCount / 5) * 100, 100);
                            const isBusy = user.load_status === 'Sibuk';
                            const customAvatarStyle = user.bg_color && user.text_color ? { backgroundColor: user.bg_color, color: user.text_color } : undefined;
                            return (
                                <Card key={user.id} className={cn("group transition-all hover:shadow-md", isBusy && "border-danger/20 dark:border-danger/40")}>
                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div style={customAvatarStyle} className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-medium border border-black/5 dark:border-white/5 shrink-0", !customAvatarStyle && "bg-surface-muted text-text-desc")}>
                                                        {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-medium block truncate leading-tight text-text-main">{user.name}</span>
                                                        <span className="text-text-desc text-[9px] font-semibold truncate block mt-0.5">{user.position || user.role}</span>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => handleOpenChat(user)} className="h-7 px-3 text-[9px] font-semibold gap-1.5 shadow-sm border-surface-border/60">
                                                    <MessageSquare size={10} /> DISKUSI
                                                </Button>
                                            </div>
                                            <div className="text-[9px] font-medium text-text-desc bg-surface-muted/50 px-2 py-1 rounded-lg w-max max-w-full truncate">
                                                {user.department_name || 'Direksi & Staff Umum'}
                                            </div>

                                            <div className="bg-surface-muted/30 border border-surface-border/40 rounded-xl p-3">
                                                <div className="flex items-center gap-1.5 mb-3 border-b border-surface-border/40 pb-2">
                                                    <Calendar size={10} className="text-primary opacity-60" />
                                                    <span className="text-[9px] font-semibold uppercase tracking-widest text-text-desc">Aktivitas Bulan Ini</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-surface-border/40">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-semibold text-text-soft uppercase tracking-wider">Menunggu</span>
                                                        <span className="text-sm font-semibold text-warning">{user.stats_this_month?.pending || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-semibold text-text-soft uppercase tracking-wider leading-tight">Dikerjakan</span>
                                                        <span className="text-sm font-semibold text-primary">{user.stats_this_month?.active || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-semibold text-text-soft uppercase tracking-wider">Selesai</span>
                                                        <span className="text-sm font-semibold text-success">{user.stats_this_month?.completed || 0}</span>
                                                    </div>
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

            {selectedChatUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[500px]">
                        <CardHeader className="bg-muted/30 p-4 border-b flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-3">
                                <div style={selectedChatUser.bg_color && selectedChatUser.text_color ? { backgroundColor: selectedChatUser.bg_color, color: selectedChatUser.text_color } : undefined} className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-medium border border-black/5 dark:border-white/5">
                                    {selectedChatUser.initials ?? selectedChatUser.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="text-xs font-medium leading-none">{selectedChatUser.name}</CardTitle>
                                    <p className="text-[9px] font-medium text-muted-foreground mt-1">{selectedChatUser.position || selectedChatUser.role}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedChatUser(null)} className="h-8 w-8">
                                <X size={14} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[220px] bg-muted/5">
                            {chatHistory[selectedChatUser.id]?.map((msg, i) => (
                                <div key={i} className={cn("flex flex-col max-w-[80%] rounded-xl px-3 py-2 text-xs", msg.sender === 'me' ? "bg-primary text-primary-foreground ml-auto rounded-tr-none shadow-sm" : "bg-white dark:bg-muted text-foreground mr-auto rounded-tl-none border border-border/10")}>
                                    <p className="font-medium">{msg.text}</p>
                                    <span className={cn("text-[8px] mt-1 text-right block opacity-70")}>{msg.time}</span>
                                </div>
                            ))}
                        </CardContent>
                        <form onSubmit={handleSendMessage} className="p-3 border-t bg-card flex gap-2">
                            <Input placeholder={`Kirim pesan...`} value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className="h-9 text-xs" />
                            <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                                <Send size={14} />
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
