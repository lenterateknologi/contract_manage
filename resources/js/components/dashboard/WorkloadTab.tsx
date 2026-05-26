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
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
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
            <div className="grid grid-cols-3 gap-4 md:grid-cols-4 select-none">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-wider text-text-desc">Penyelesaian Renewal</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success border border-success/10">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-text-main">{renewalCompletionRate}%</div>
                        <p className="text-[9px] font-semibold text-text-desc uppercase mt-1">Laju Penyelesaian</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-wider text-text-desc">Tugas Pending</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning border border-warning/10">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-text-main">{totalPendingTasks}</div>
                        <p className="text-[9px] font-semibold text-text-desc uppercase mt-1">Dokumen Menunggu</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-wider text-text-desc">Direview & Revisi</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                            <Layers className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-text-main">{totalActiveReviews}</div>
                        <p className="text-[9px] font-semibold text-text-desc uppercase mt-1">Proses Aktif</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-wider text-text-desc">PIC Legal Sibuk</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger border border-danger/10">
                            <Briefcase className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-text-main">{busyPicsCount}</div>
                        <p className="text-[9px] font-semibold text-text-desc uppercase mt-1">Beban Tinggi</p>
                    </CardContent>
                </Card>
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
                                className="h-9 w-full md:w-auto pl-3 pr-8 text-xs bg-background border border-input rounded-lg font-bold cursor-pointer disabled:opacity-75 appearance-none focus:ring-1 focus:ring-primary outline-none"
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

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant={statusFilter === 'all' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                            className="h-8 px-3 font-bold"
                        >
                            Semua
                        </Button>
                        <Button
                            variant={statusFilter === 'ready' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('ready')}
                            className={cn("h-8 px-3 font-bold gap-1.5", statusFilter === 'ready' ? "bg-success hover:bg-success/90 border-none" : "text-success border-success/20 hover:bg-success/10")}
                        >
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusFilter === 'ready' ? "bg-white" : "bg-success")} />
                            Ready
                        </Button>
                        <Button
                            variant={statusFilter === 'sibuk' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('sibuk')}
                            className={cn("h-8 px-3 font-bold gap-1.5", statusFilter === 'sibuk' ? "bg-danger hover:bg-danger/90 border-none" : "text-danger border-danger/20 hover:bg-danger/10")}
                        >
                            <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", statusFilter === 'sibuk' ? "bg-white" : "bg-danger")} />
                            Sibuk
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
                    {filteredWorkloads.length === 0 ? (
                        <Card className="col-span-2 border-dashed flex flex-col items-center justify-center py-10 opacity-60">
                            <Briefcase className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-wider text-text-desc">PIC tidak ditemukan</p>
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
                                                    <div style={customAvatarStyle} className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-black/5 dark:border-white/5 shrink-0", !customAvatarStyle && "bg-surface-muted text-text-desc")}>
                                                        {user.initials ?? user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-bold block truncate leading-tight text-text-main">{user.name}</span>
                                                        <span className="text-text-desc text-[9px] font-semibold truncate block mt-0.5">{user.position || user.role}</span>
                                                    </div>
                                                </div>
                                                <Badge variant={isBusy ? "destructive" : "secondary"} className={cn("text-[8px] font-bold uppercase px-2 shrink-0 h-4", !isBusy && "bg-success/10 text-success border-success/10 hover:bg-success/10")}>
                                                    {user.load_status}
                                                </Badge>
                                            </div>
                                            <div className="text-[9px] font-bold text-text-desc bg-surface-muted/50 px-2 py-1 rounded-lg w-max max-w-full truncate">
                                                {user.department_name || 'Direksi & Staff Umum'}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[9px] font-bold text-text-desc">
                                                    <span>Kapasitas Kerja</span>
                                                    <span className={cn(isBusy ? "text-danger" : "text-success")}>{activeCount} / 5 Kontrak</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-surface-muted/40 rounded-full overflow-hidden border border-surface-border/5">
                                                    <div style={{ width: `${capacityPct}%` }} className={cn("h-full transition-all duration-500", isBusy ? "bg-danger" : "bg-success")} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-surface-border/10 pt-3 mt-3">
                                            <div className="flex flex-col text-[9px] font-semibold text-text-desc">
                                                <span>Inisiasi: <strong className="text-text-main">{user.initiated_contracts_count || 0}</strong></span>
                                                <span>Pending: <strong className="text-warning">{user.pending_tasks_count || 0}</strong></span>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => handleOpenChat(user)} className="h-7 px-2 text-[9px] font-bold gap-1">
                                                <MessageSquare size={10} /> DISKUSI
                                            </Button>
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
                                <div style={selectedChatUser.bg_color && selectedChatUser.text_color ? { backgroundColor: selectedChatUser.bg_color, color: selectedChatUser.text_color } : undefined} className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-black/5 dark:border-white/5">
                                    {selectedChatUser.initials ?? selectedChatUser.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="text-xs font-bold leading-none">{selectedChatUser.name}</CardTitle>
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
